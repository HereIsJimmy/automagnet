const BASE_URL = import.meta.env.QCLI_BASE_URL;
const TORRENT_SELECTOR = import.meta.env.QCLI_TORRENT_SELECTOR;

interface TorrentRowData {
  title: string;
  magnet: string;
  size: string;
  date: string;
  seeders: string;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getTitle(cTitle: Element | undefined): string {
  return (cTitle?.children[cTitle.children.length - 1] as HTMLElement)?.innerHTML;
}
function getMagnet(cLinks: Element | undefined): string {
  return (cLinks?.children[1] as HTMLAnchorElement).href;
}

// The site reports dates in UTC; convert to the executing machine's local time
// (DST-aware, since the offset comes from the runtime's timezone rules).
function parseDate(rawDate: string): string {
  const [datePart = '', timePart = ''] = rawDate.split(' ');
  const [year = 0, month = 1, day = 1] = datePart.split('-').map(Number);
  const [hour = 0, minute = 0] = timePart.split(':').map(Number);

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function extractData(row: HTMLTableRowElement): TorrentRowData {
  const [, cTitle, cLinks, cSize, cDate, cSeeders] = Array.from(row.children);

  return {
    title: getTitle(cTitle),
    magnet: getMagnet(cLinks),
    size: cSize!.innerHTML,
    date: parseDate(cDate!.innerHTML),
    seeders: cSeeders!.innerHTML,
  };
}

type ScanResult = {
  stop: boolean;
  rows: HTMLTableRowElement[];
};
function scanDoc(html: string, lastDownload: string): ScanResult {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const toScan = doc.querySelectorAll<HTMLTableRowElement>(TORRENT_SELECTOR);

  let stop = false;
  const rows = [];
  for (const row of toScan) {
    const { date } = extractData(row);
    if (date <= lastDownload) {
      stop = true;
      break;
    }
    rows.push(row);
  }

  return { stop, rows };
}

const CACHE_TTL_MS = 15 * 60 * 1000;

interface ScanCache {
  lastDownload: string;
  timestamp: number;
  rows: HTMLTableRowElement[];
}

let scanCache: ScanCache | null = null;

function getCachedRows(lastDownload: string): HTMLTableRowElement[] | null {
  if (!scanCache) return null;
  if (scanCache.lastDownload !== lastDownload) return null;
  if (Date.now() - scanCache.timestamp >= CACHE_TTL_MS) return null;
  return scanCache.rows;
}

export function openMagnet(magnet: string) {
  const link = document.createElement('a');
  link.href = magnet;
  document.body.append(link);
  link.click();
  link.remove();
}

export enum ResultStatus {
  Filtered = 'filtered',
  Whitelisted = 'whitelisted',
  Pending = 'pending',
}

export interface Result {
  data: TorrentRowData;
  status: ResultStatus;
  uploader?: string;
  whitelist?: string | undefined;
  opened: boolean;
}

function processRows(
  rows: HTMLTableRowElement[],
  uploaders: string[],
  whitelist: string[],
): Result[] {
  const results: Result[] = [];
  for (const row of rows) {
    const data = extractData(row);
    const { title } = data;
    console.log('Current', title);
    const uploader = uploaders.find((uploader) =>
      title.toLowerCase().includes(`[${uploader.toLowerCase()}]`),
    );
    if (!uploader) {
      results.push({
        data,
        status: ResultStatus.Filtered,
        opened: false,
      });
      continue;
    }

    console.log('allowed');
    const whitelisted = whitelist.find((str) => title.includes(str));
    results.push({
      data,
      uploader,
      status: whitelisted ? ResultStatus.Whitelisted : ResultStatus.Pending,
      whitelist: whitelisted,
      opened: false,
    });
  }
  return results;
}

export class ScanFetchError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ScanFetchError';
  }
}

async function fetchAndScan(lastDownload: string): Promise<HTMLTableRowElement[]> {
  let page = 1;
  let scanning = true;
  let reachedEnd = false;
  const rowsToProcess: HTMLTableRowElement[] = [];
  while (scanning) {
    try {
      const url = new URL(BASE_URL);
      url.searchParams.set('p', String(page));
      const html = await window.netAPI.fetchText(url.toString());
      const { stop, rows } = scanDoc(html, lastDownload);
      rowsToProcess.push(...rows);

      if (stop) {
        scanning = false;
        reachedEnd = true;
        break;
      }

      await wait(2000);
      page++;
    } catch (err) {
      throw new ScanFetchError(
        `Failed to fetch or parse page ${page}: ${err instanceof Error ? err.message : String(err)}`,
        { cause: err },
      );
    }
  }

  // Only cache a scan that actually reached its natural stopping point -
  // caching a partial result from a network failure would silently serve
  // incomplete data for the rest of the TTL.
  if (reachedEnd) {
    scanCache = { lastDownload, timestamp: Date.now(), rows: rowsToProcess };
  }
  return rowsToProcess;
}
// const CHAPTER_REGEX = /(?:-\s*)(?:S\d+E)?(\d+)/i;
// const chapFn = (it: Result) => CHAPTER_REGEX.exec(it.data.title)?.[0] as string;
function openWhitelistedMagnets(rows: Result[], uploaders: string[]) {
  const whitelisted = rows.filter((it) => !!it.whitelist);
  const sorted = whitelisted.sort((a, b) => {
    const aTitle = a.data.title;
    const bTitle = b.data.title;
    const aUploader = uploaders.findIndex((u) => aTitle.includes(`[${u}]`));
    const bUploader = uploaders.findIndex((u) => bTitle.includes(`[${u}]`));
    return aUploader - bUploader;
  });

  const grouped = Object.groupBy(sorted, (it) => it.whitelist!);
  const toOpen = Object.entries(grouped).flatMap(([, its]) => {
    const dateGrouped = Object.groupBy(its!, (it) => it.data.date.split(' ')[0]!);
    return Object.values(dateGrouped).flatMap((dateEps) => dateEps![0]!);
  });

  // Tag each result this pass actually opens, so consumers can filter on
  // `opened` instead of re-deriving the same dedup/priority logic themselves.
  for (const row of toOpen) {
    console.log('whitelisted, clicking magnet', row.data.title, row.data.date);
    row.opened = true;
    openMagnet(row.data.magnet);
  }
}

export async function startScanning(
  uploaders: string[],
  whitelist: string[],
  lastDownload: string,
): Promise<Result[]> {
  if (!window.netAPI) {
    throw new Error(
      'Scanning requires the desktop app: window.netAPI is only available inside Electron. ' +
        'Run "npm run dev:electron" instead of the plain browser dev server.',
    );
  }

  if (!BASE_URL || !TORRENT_SELECTOR) {
    throw new Error(
      'Missing QCLI_BASE_URL / QCLI_TORRENT_SELECTOR: copy .env.example to .env and fill in real values.',
    );
  }

  // If cached & valid Rows use them, else fetch and scan new ones
  const rows = getCachedRows(lastDownload) || (await fetchAndScan(lastDownload));
  const processed = processRows(rows, uploaders, whitelist);
  openWhitelistedMagnets(processed, uploaders);

  return processed;
}
