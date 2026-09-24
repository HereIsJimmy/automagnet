# Quasar App (automagnet)

App that scans a webpage for Magnet links. Filters via "uploaders", which have the form of [UPLOADER] in the title.
For now it works mainly with the web I use for the magnet links, which is a server-side-rendered-web (the cat one). If you don't use the cat web, you'll have to change atleast the 'scanDoc' function of scanner.ts
If you use the cat web, leave the QCLI_TORRENT_SELECTOR variable as is, and set the QCLI_BASE_URL as the web url. I use '?f=0&c=1_2&q=1080' at the end to filter some magnets straight away.
Just npm run build to build the App. It won't work as an SPA, atleast currently.

## Install the dependencies

```bash
pnpm install
# or: yarn/npm/bun install
```

### Start the app in development mode (HMR, error reporting, etc.)

```bash
quasar dev
```

### Format & Lint the files

```bash
pnpm run lint
# or: yarn/npm/bun run lint
```

...or just check formatting & linting:

```bash
pnpm run lint:check
# or: yarn/npm/bun run lint:check
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-file).
