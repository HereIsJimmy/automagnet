const BASE_URL = '[URL]';
const LAST_DOWNLOAD = '2026-09-12 20:00';
const TORRENT_SELECTOR = 'body table tbody tr';

interface TorrentRowData {
  title: string;
  magnet: string;
  size: string;
  date: string;
  seeders: string;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractData(row: HTMLTableRowElement): TorrentRowData {
  const [, cTitle, cLinks, cSize, cDate, cSeeders] = Array.from(row.children);

  return {
    title: (cTitle?.children[0] as HTMLElement).innerHTML,
    magnet: (cLinks?.children[1] as HTMLAnchorElement).href,
    size: cSize!.innerHTML,
    date: cDate!.innerHTML,
    seeders: cSeeders!.innerHTML,
  };
}

function scanDoc(html: string, rowsToProcess: HTMLTableRowElement[]): boolean {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const rows = doc.querySelectorAll<HTMLTableRowElement>(TORRENT_SELECTOR);

  for (const row of rows) {
    const { date } = extractData(row);
    if (date <= LAST_DOWNLOAD) {
      return false;
    }
    rowsToProcess.push(row);
  }

  return true;
}

function openMagnet(magnet: string) {
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
  row: HTMLTableRowElement;
  status: ResultStatus;
}

async function processRows(
  rows: HTMLTableRowElement[],
  uploaders: string[],
  whitelist: string[],
): Promise<Result[]> {
  const results: Result[] = [];
  for (const row of rows) {
    const { title, date, magnet } = extractData(row);
    const allowed = uploaders.some((uploader) =>
      new RegExp(`\\[${escapeRegExp(uploader)}\\]`, 'i').test(title),
    );
    if (!allowed) {
      results.push({
        row,
        status: ResultStatus.Filtered,
      });
      continue;
    }

    const whitelisted = whitelist.some((str) => title.includes(str));
    if (whitelisted) {
      openMagnet(magnet);
      await wait(5000);
    }

    console.log(date, title);
    results.push({ row, status: whitelisted ? ResultStatus.Whitelisted : ResultStatus.Pending });
  }
  return results;
}

export async function startScanning(uploaders: string[], whitelist: string[]): Promise<Result[]> {
  const rowsToProcess: HTMLTableRowElement[] = [];

  let page = 1;
  let scanning = true;

  while (scanning) {
    try {
      const html = await window.netAPI.fetchText(`${BASE_URL}&p=${page}`);

      const mustContinue = scanDoc(html, rowsToProcess);
      if (!mustContinue) break;

      await wait(2000);
      page++;
    } catch (err) {
      console.error(err);
      scanning = false;
    }
  }

  return processRows(rowsToProcess, uploaders, whitelist);
}
