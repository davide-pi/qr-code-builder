# TODO — refresh del progetto (aggiornato 2026-10-15)

Branch di lavoro: `feature/project-refresh` (worktree `C:\__Workspaces\github\qr-code-builder-wt\base`), staccato da `main` dopo #21. **Committato in locale, non pushato.**
Anteprima locale: `npm run build && npm run preview -- --port 4173` nel worktree `base`.

## Stato

Tutto mergiato in `feature/project-refresh`: lint pulito, **122 test** ok, build ok.
Bundle principale 892 → **377 kB**, CSS 448 → 28 kB, precache PWA 5,4 MiB → **877 KiB**.

| Blocco | Contenuto |
|---|---|
| pulizia | via i file Copilot, `.vite` fuori da git, svg morti eliminati, `CLAUDE.md`, `docs/`, README riscritto |
| templates | registry dei template, payload conformi alle specifiche, EPC/SEPA, validazione inline, stato dei form nel generator (P1), history, vitest |
| preview | export 512–2048 px e PDF 5 cm/10 cm/A4, jsPDF lazy, avvisi di scansionabilità, copia PNG |
| options | preset utente con import/export JSON, i18n completo, a11y, tema di sistema, logo validato con EC→H, bandiere e react-select ridotti |
| pwa | offline, installabile, meta/OG, `public/_headers` (CSP + HSTS), aggiornamento su richiesta |
| batch | generazione in serie da CSV → ZIP (fflate lazy) |
| deps | tutte all'ultima minor (copre #20), globals 17, react-refresh 0.5 |
| fix review | 10 correctness, 3 security, 4 performance (nessun P1) |

## Prossimi passi

1. [x] **Restyling grafico**: scelta la direzione A Aurora con il QR inclinato della B (canvas https://claude.ai/artifact/WNa9e2o8FXVpQopr8VWD8d); implementata con palette Personalizzata (127 test ok).
   - [x] Rigenerare icone PWA e og-image con la nuova palette; `public/logo-white.svg` non è più usato.
2. [ ] Prova manuale nel browser (gli agenti non hanno provato a mano): checklist in `docs/testing.md`, ogni template scansionato col telefono.
3. [ ] Push del branch, deploy preview su Netlify e verifica della CSP dalla console.
4. [ ] PR verso `main` (squash); la #20 di Dependabot si chiude, è assorbita da questo branch.

## Rimandati

- TypeScript 7: typescript-eslint supporta solo `<6.1.0`.
- lucide-react 1.x: rimuove le icone brand dei social; serve `simple-icons` o SVG inline.
- @vitejs/plugin-react 6: conflitto di peer con babel 8; ripassare quando l'albero converge.
- CSS globale senza scope (`QROptions.css`): da sistemare insieme al restyling.

## Decisioni aperte

- Preset utente: includere `errorCorrectionLevel`, `imageSize`, `imageMargin`? Oggi esclusi.
- Capacità: controllo solo byte-mode; un contenuto solo numerico molto lungo viene rifiutato prima del necessario.
- Sezione "Sfondo" rimossa: trasparenza e colore di sfondo ora stanno nel pannello Personalizzato.
- Il tema segue il sistema solo all'avvio (nessun listener su `prefers-color-scheme`).
