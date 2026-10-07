# yakamoz-react

React UI for the [yakamoz-go](../yakamoz-go) API. Manages **authors** and **topics**.

Built with Vite + React 18 + TypeScript, [MUI](https://mui.com) for UI and
[axios](https://axios-http.com) for REST calls.

## Setup

```sh
npm install
npm run dev
```

`.npmrc` points at `https://mirrors.tencent.com/npm/`, a public npm mirror
(`registry.npmjs.org` is not reachable from some networks). If `npm install`
fails with `SELF_SIGNED_CERT_IN_CHAIN` behind a TLS-inspecting proxy, export the
proxy's root CA via `NODE_EXTRA_CA_CERTS`, e.g.:

```sh
security find-certificate -c "caadmin.netskope.com" -p /Library/Keychains/System.keychain > /tmp/ca.pem
NODE_EXTRA_CA_CERTS=/tmp/ca.pem npm install
```

The dev server runs on http://localhost:5173 and proxies `/api` to
`http://localhost:8080` (see `vite.config.ts`). Start the backend first:

```sh
cd ../yakamoz-go && STORE=memory go run ./cmd/api
```

To point at a different backend, copy `.env.example` to `.env` and set
`VITE_API_BASE_URL` (e.g. `http://localhost:8080/api/v1`). Note: the Go API has
no CORS middleware, so for non-proxied setups CORS must be added server-side.

## Pages

- **`/` (Topics)** — public view, Ekşi Sözlük style: topic titles in a left
  sidebar, selected topic's description and comments on the right
  (`/topic/:id`). `lang` filter controls the served translation. "Add comment"
  opens a dialog where an author picks their identity, language and text
  (`POST /api/v1/comments`).
- **`/admin/topics`** — manage topics: create, publish, add manual translation
  (`PUT .../translations/{lang}`), request AI translation (`POST .../translate`).
- **`/admin/authors`** — manage authors: create, edit (bio / preferred language
  per `PATCH` API), delete.

Note: admin access is UI-level routing only — the backend has no auth, so the
admin area is not protected by a login.

## Build

```sh
npm run build   # tsc -b && vite build


All done and verified. Using the open Tencent npm mirror (mirrors.tencent.com/npm — set in .npmrc), dependencies installed and everything checks out:

Verified

npm install — 151 packages installed successfully
npm run build — tsc -b typecheck + vite build pass with zero errors
vite dev — serves the UI and proxies /api/v1/* to the live backend on :8080 (your yakamoz-go server is running; GET /api/v1/authors returned [] through the proxy)
What was built

src/api/ — axios client + typed authorsApi/topicsApi matching all backend endpoints
src/pages/AuthorsPage.tsx — list, create, edit (bio/language per PATCH), delete
src/pages/TopicsPage.tsx — list with lang/status filters, create with author picker, publish, add translation, AI translate
src/App.tsx — AppBar + tab navigation via react-router
src/components/ — shared feedback snackbar, status chip, language select
One note: TLS on this machine is inspected by Netskope, so Node needs the extra CA. If you hit SELF_SIGNED_CERT_IN_CHAIN on future installs, the workaround is documented in the README (NODE_EXTRA_CA_CERTS). Otherwise npm run dev is all you need.
```
