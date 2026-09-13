const BASE_URL = '[URL]';
const LAST_DOWNLOAD = '2026-09-12 20:00';

interface TorrentRowData {
  title: string;
  magnet: string;
  size: string;
  date: string;
  seeders: string;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function extractData(row: HTMLTableRowElement): TorrentRowData {
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
  const rows = doc.querySelectorAll<HTMLTableRowElement>('body table tbody tr');

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

export async function startScanning(): Promise<void> {
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

  for (const row of rowsToProcess) {
    const { title, date, magnet } = extractData(row);
    if (!/\[ASW\]/i.test(title)) continue;

    console.log(date, title);
    openMagnet(magnet);
    await wait(5000);
  }
}
