# Deploy

Static site on Netlify, deployed by two GitHub Actions workflows. Nothing is rebuilt downstream of CI.

```
push / PR ──▶ CI (ci.yml): Lint & test ──▶ Build (GitVersion) ──▶ artifacts: dist, deploy-info
                                                                        │ workflow_run (success, not a PR)
main push  ──▶ CD (cd.yml): Prepare ──▶ Deploy (draft preview) ──▶ Prune old deploys
vX.Y.Z tag ──▶ CD (cd.yml): Prepare ──▶ Deploy (production)    ──▶ Prune old deploys
```

## Versioning (`GitVersion.yml`)

Mode `ContinuousDelivery`.

| Branch | Regex | Label | Increment |
|--------|-------|-------|-----------|
| `main` | `^main$` | `beta` | Minor |
| `feature/*` | `^feature/?` | `alpha` | Minor |
| `fix/*`, `hotfix/*` | `^(?:hot)?fix/?` | `alpha` | Patch |
| pull requests | `pull-request` entry | `alpha` | Minor |

Feature and fix branches branch from `main`. A `vX.Y.Z` tag fixes the release version. The CI build runs
`npm version <fullSemVer> --no-git-tag-version`, so `package.json` is stamped in the build only (the repo keeps `0.0.0`).

## CI (`.github/workflows/ci.yml`)

Triggers: push to `main`, push of tags `v[0-9]+.[0-9]+.[0-9]+`, pull requests to `main`. A newer run on the same
ref cancels the older one. Permissions: `contents: read`. Actions are pinned by commit SHA.

| Job | Steps |
|-----|-------|
| `lint` ("Lint & test") | `npm ci`, `npm run lint`, `npm test` (Node 22) |
| `build` (needs `lint`) | Full-history checkout, GitVersion, `npm ci`, stamp version, `npm run build` (`tsc -b && vite build`), write `deploy-info.env`, upload artifacts |

`deploy-info.env` carries `deploy_type` and `version`: `production` for a tag, `preview` for `refs/heads/main`,
`none` otherwise (PR runs build but never deploy). Artifacts: `dist` (the built site) and `deploy-info`,
retention 7 days.

## CD (`.github/workflows/cd.yml`)

Triggered by `workflow_run` of **CI** with `completed`. Runs only when CI concluded `success` and the triggering
event was not a pull request.

| Job | What it does |
|-----|--------------|
| `prepare` | Downloads `deploy-info` from the CI run and exposes `deploy_type` and `version` |
| `deploy` | Skipped when `deploy_type` is `none`. Downloads that run's `dist`, deploys with `nwtgck/actions-netlify`: `production-deploy` is true only for `production`; otherwise a draft (preview) deploy. GitHub environment `production` or `preview`, 5-minute timeout, PR and commit comments disabled |
| `cleanup` | After every successful deploy: prunes old Netlify deploys (below) |

| Event | Result |
|-------|--------|
| Push to `main` | Preview (draft) deploy |
| Push of `vX.Y.Z` tag | Production deploy |
| Pull request | CI only |

### Prune policy

`cleanup` lists the site's latest 100 deploys and deletes a deploy only if it is **both** older than
`MAX_AGE_DAYS` = 7 **and** beyond the newest `KEEP_STABLE` = 3 production deploys (or the newest `KEEP_PREVIEW` = 2
draft deploys). So every deploy younger than 7 days is kept, and each group keeps at least its minimum at any age.
Only deploys in state `ready` are considered. A failed delete is a warning, not a failure.

### Secrets

Repository secrets: `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` (used by `deploy` and `cleanup`). `GITHUB_TOKEN` is
used to download the CI artifacts (`actions: read`). A Netlify MCP server is configured in `.mcp.json` for
MCP-compatible tooling.

## Security headers (`public/_headers`)

Lives in `public/` so it is copied into `dist/`: the CD workflow deploys the prebuilt `dist/` (no repo checkout),
so a root `netlify.toml` would never be read.

| Directive | Value | Why |
|-----------|-------|-----|
| `default-src` | `'self'` | Baseline |
| `script-src` | `'self'` | No inline scripts, no third-party scripts |
| `style-src` | `'self' 'unsafe-inline'` | react-select (emotion) injects `<style>` elements at runtime; a nonce is not possible with static `_headers`. React `style={{...}}` props are set through the CSSOM and are not blocked by CSP. **To verify on a Netlify preview deploy** (open items in `TODO.md`) |
| `img-src` | `'self' data: blob:` | Logo data URLs, inlined flag SVGs, rendered QR images |
| `font-src` | `'self' data:` | Bundled fonts |
| `connect-src` | `'self' data: blob:` | No third-party requests possible |
| `worker-src` | `'self' blob:` | Service worker |
| `manifest-src`, `base-uri`, `form-action` | `'self'` | |
| `object-src` | `'none'` | |
| `frame-ancestors` | `'none'` | Not embeddable |

Other headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy` denying camera, microphone, geolocation, payment, usb and `interest-cohort`,
`Strict-Transport-Security: max-age=31536000; includeSubDomains`.

Caching: `/assets/*` is `public, max-age=31536000, immutable` (content-hashed names); `/index.html`, `/sw.js`,
`/registerSW.js` and `/manifest.webmanifest` are `no-cache` so a new release is always discovered.

## PWA caching (`vite.config.ts`)

| Layer | Content | Strategy |
|-------|---------|----------|
| Precache | `**/*.{js,css,html,svg,png,webmanifest,woff2}` (app shell, small lazy chunks such as react-select and the batch dialog) | Installed with the service worker; `cleanupOutdatedCaches`; `navigateFallback: '/index.html'` |
| Excluded from precache | PDF chunks `jspdf.es.min`, `html2canvas`, `index.es`, `purify.es` (~780 kB, used only by people who export a PDF) | `globIgnores` |
| Runtime cache `pdf-chunks` | The same four chunks | `CacheFirst`, 200 responses only, max 8 entries: cached at first use |

Consequence: PDF export works offline only after a PDF was exported once while online. Everything else
(including batch and PNG/SVG export) works offline after the first visit.

Updates: `registerType: 'prompt'`, see [privacy.md](privacy.md#why-the-pwa-asks-before-updating).

## Release checklist

1. PR into `main` (squash), CI green.
2. Merge: CD publishes a preview deploy; check it.
3. Tag `vX.Y.Z` on `main` and push the tag: CI builds, CD publishes to production.
