# Automagnet

App that scans a webpage for Magnet links. Filters via "uploaders", which have the form of [UPLOADER] in the title.
For now it works mainly with the web I use for the magnet links (the cat one), which is a server-side-rendered-web. If you don't use the cat web, you'll have to change atleast the 'scanDoc' function of scanner.ts
If you use the cat web, leave the QCLI_TORRENT_SELECTOR variable as is, and set the QCLI_BASE_URL as the web url. I use '?f=0&c=1_2&q=1080' at the end to filter some magnets straight away.
Just **npm i && npm run build** to build the App. It won't work as an SPA, atleast currently.

1. Add **Uploaders** in the Uploaders section
2. Use the **Whitelist** in the sidebar to whitelist text (text-select a string and then click either the check or the magnet button). You can just click the magnet button if you don't want to whitelist it yet.
3. Magnets with the whitelisted text will be automatically **opened when scanning** (which also happens on startup)


### Config
- QCLI_TORRENT_SELECTOR: DOM-querySelects each table row with a magnet link.
- QCLI_BASE_URL: Url of the web to scrap

## Install the dependencies

```bash
pnpm install
# or: yarn/npm/bun install
```

### Run the app in development

```bash
npm run dev
```

### Build the app for production

```bash
npm run build
```
