# Templates

20 content templates in `src/templates/`. Each is a `QRTemplate<D>` with pure `validate` and `buildPayload`
(no clock, no randomness), registered in `src/templates/index.ts`. Shared helpers live in `src/templates/lib/`.
Architecture: [architecture.md](architecture.md).

## Catalog

| Type | Category | Payload | Spec / notes | Source |
|------|----------|---------|--------------|--------|
| `url` | links | `https://example.com` | Bare host gets `https://`; scheme allowlist (below) | `url.ts` |
| `wifi` | links | `WIFI:T:WPA;S:<ssid>;P:<pwd>;H:true;;` | ZXing Wi-Fi format; `T` is `WPA`, `WEP` or `nopass`; `P` omitted for `nopass` or empty; `H:true` only when hidden. WPA covers WPA2/WPA3 transition; WPA3-only (`SAE`) is not offered | `wifi.ts` |
| `calendar` | links | `BEGIN:VCALENDAR` ... `VEVENT` | RFC 5545, CRLF, folded at 75 octets | `calendar.ts` |
| `location` | links | `geo:45.46,9.19` or `geo:lat,lon?q=lat,lon(label)` | RFC 5870 + `q` label (understood by map apps) | `location.ts` |
| `vcard` | contact | `BEGIN:VCARD` ... `END:VCARD` | vCard 3.0 (RFC 2426), CRLF, folded at 75 octets | `vcard.ts` |
| `email` | contact | `mailto:a@x.com,b@y.com?subject=..&body=..` | RFC 6068; several recipients separated by `,` or `;` | `email.ts` |
| `sms` | contact | `sms:+39612345678?body=<text>` | E.164 number | `phoneTemplates.ts` |
| `phone` | contact | `tel:+39612345678` | E.164 number | `phoneTemplates.ts` |
| `whatsapp` | contact | `https://wa.me/39612345678?text=<text>` | `wa.me`: international number without `+` | `phoneTemplates.ts` |
| `telegram` | contact | `https://t.me/<handle>?text=<text>` | Hosts `t.me`, `telegram.me`, `telegram.dog`; a phone handle keeps its `+` (`https://t.me/+393331234567`) | `social.ts` |
| `instagram` | social | `https://instagram.com/<handle>` | Hosts `instagram.com`, `instagr.am` | `social.ts` |
| `twitter` | social | `https://twitter.com/<handle>` | Hosts `twitter.com`, `x.com` | `social.ts` |
| `linkedin` | social | `https://linkedin.com/in/<id>` | Kinds `in` (default), `company`, `school`; `https://linkedin.com/company/acme` keeps its kind | `social.ts` |
| `tiktok` | social | `https://tiktok.com/@<handle>` | | `social.ts` |
| `youtube` | social | `https://youtube.com/@<handle>` | Kinds `channel`, `c`, `user` keep their segment (no `@`) | `social.ts` |
| `facebook` | social | `https://facebook.com/<name>` | Hosts `facebook.com`, `fb.com`; `profile.php?id=...` is kept as is | `social.ts` |
| `snapchat` | social | `https://snapchat.com/add/<handle>` | | `social.ts` |
| `paypal` | payment | `https://paypal.me/<user>[/<amount><CUR>]` | Amount max 2 decimals; currency USD, EUR (default), GBP, CAD, AUD | `payments.ts` |
| `bitcoin` | payment | `bitcoin:<addr>[?amount=<btc>&label=<text>]` | BIP21; amount max 8 decimals; address 14-90 alphanumerics, checksum **not** verified | `payments.ts` |
| `epc` | payment | `BCD` / `002` / `1` / `SCT` / BIC / name / IBAN / `EUR<amount>` / purpose / reference / remittance, LF separated | EPC069-12 "Girocode" (SEPA credit transfer); see below | `payments.ts` |

Categories shown in the dropdown (`TemplateDropdown`): `links`, `contact` ("Contacts and messages"), `social`, `payment`.

### Format details

| Template | Rules (as implemented) |
|----------|------------------------|
| `vcard` | `VERSION:3.0`; `N` and `FN` always emitted (`FN` falls back to the organization); `ORG`, `TITLE`, `TEL`, `EMAIL`, `URL`, `ADR:;;street;city;state;zip;country` only when filled. No `UID` (optional in 3.0, would only enlarge the code). `URL` is a URI: not TEXT-escaped, only kept on one line. Validation: name or organization required, phone at least 3 digits, email pattern, website URL |
| `calendar` | `PRODID:-//QR Code Builder//EN`. Times are floating local (`DTSTART:20250301T093000`, no time zone). All-day: `DTSTART;VALUE=DATE`, and `DTEND;VALUE=DATE` is the day **after** the last day (exclusive end, computed with UTC arithmetic so DST cannot shift it). Validation: title and start required, end not before start |
| `calendar` UID / DTSTAMP | `VEVENT` requires both, but the builder is pure. `UID` = 14-hex-digit cyrb53 hash of the event's content lines + `@qr-code-builder` (same event, same UID; different event, different UID). `DTSTAMP` = the event's own start as UTC (`...Z`), `19700101T000000Z` when empty: apps only compare it between revisions of the same UID |
| `email` | `@` stays readable in the address, everything else `encodeURIComponent`; body line breaks become CRLF (`%0D%0A`) |
| `location` | Comma or dot decimal, leading `+` dropped, `45.` becomes `45`, `.5` becomes `0.5` (RFC 5870 `1*DIGIT ["." 1*DIGIT]`); latitude within +-90, longitude within +-180. Label percent-encoded, with `(` and `)` encoded too because they delimit the label in `q` |
| `epc` | Name required, max 70 chars; IBAN required and checked (structure + ISO 13616 mod-97); BIC optional (8 or 11 chars); amount optional, `0.01` to `999999999.99`, written `EUR` + 2 decimals; remittance (unstructured) max 140 chars; purpose and structured-reference lines left empty. Fields are single-line; trailing empty lines are dropped |
| `paypal`, `bitcoin`, `epc` amounts | `normalizeAmount`: comma or dot, strictly greater than 0, at most N decimals |
| Social handles | Leading `@` stripped; a pasted profile URL of the **same** network is normalized (`www.`, `m.`, `mobile.` ignored); a URL of another network or a value with spaces is `invalidHandle` |

## Escaping and normalization

| Rule | Behavior | Helper |
|------|----------|--------|
| TEXT escaping (vCard 3.0 and iCalendar share it) | `\` first, then `;` `,`, line breaks become `\n` | `escapeText` (`lib/text.ts`) |
| Wi-Fi escaping | `\` `;` `,` `:` `"` prefixed with `\` | `escapeWifi` |
| Wi-Fi hex quoting | An SSID or password made only of hex digits (`/^[0-9a-f]+$/i`) is wrapped in double quotes, otherwise ZXing-style readers decode it as a hex string. Quoted values are not backslash-escaped | `escapeWifiValue` (`wifi.ts`) |
| Line folding | Content lines longer than 75 octets (CRLF excluded) are folded with `CRLF + space`; the continuation space counts in the next line's 75. Never splits a UTF-8 code point or a backslash escape pair | `foldLine` |
| Single line | CR/LF runs become a space, then trimmed (URI values, phone numbers, EPC fields) | `toSingleLine` |
| URI parameters | `encodeURIComponent` | email, sms, wa.me, t.me, bitcoin, geo |
| Amounts | See above | `normalizeAmount` (`lib/amount.ts`) |
| Stable id | cyrb53 53-bit non-cryptographic hash, 14 lowercase hex digits | `hashHex` (`lib/hash.ts`) |

### URL scheme allowlist (`lib/url.ts`)

A QR code is opened by whatever handler the scanner has for the scheme, so schemes are restricted.

| Input | Result |
|-------|--------|
| `example.com/path` | `https://example.com/path` |
| `//example.com` | `https://example.com` |
| `scheme://...` with `http`, `https`, `ftp` | accepted |
| `scheme://...` with anything else (`javascript://`, `file:///`, `data://`...) | `invalidUrlScheme` |
| Opaque `mailto:`, `tel:`, `sms:`, `smsto:`, `geo:`, `bitcoin:`, `wifi:`, `skype:`, `facetime:`, `market:` | accepted as is (must have content after the colon) |
| Whitespace, or a single word without a dot (not `localhost`, not an IPv6 literal) | `invalidUrl` |

### Phone numbers: E.164 (`lib/e164.ts`)

`toE164(callingCode, input)` is pure and does **not** use `libphonenumber-js` (kept out of the main bundle).

- Input starting with `+` or `00` is already international: the selected calling code is ignored.
- A written `(0)` right after a calling code from the zero-trunk list below is dropped (`+44 (0) 7911 123456`).
- Otherwise the national trunk prefix is stripped, then prepended to the calling code.
- Plausible only with 5 to 15 digits; otherwise `null` (`invalidPhone`).

| Calling codes | Trunk prefix stripped |
|---------------|-----------------------|
| 44 49 33 31 32 43 41 353 46 358 421 40 359 385 386 381 380 90 972 61 64 81 82 86 91 27 55 54 20 212 234 254 66 84 62 60 63 92 98 971 966 | `0` |
| 36 (Hungary) | `06` |
| 1 (NANP) | `1`, only when the rest has exactly 10 digits |
| 7 (RU, KZ) | `8`, only when the rest has exactly 10 digits |
| everything else, **including Italy (39), San Marino, Vatican** | none: the leading `0` of Italian landlines is part of the number |

Only countries where the prefix is certain are listed. For the rest, the digits are used as typed.

## How to add a template

1. **Types** (`src/types/qr.ts`): add the id to `QRTemplateType`, a data interface, its entry in `TemplateDataMap`, and a default-data constant.
2. **Module** `src/templates/<name>.ts` exporting a `QRTemplate<D>`: `type`, `category`, lucide `icon`, `defaultData`, pure `validate` (returns `ErrorKey`s only for invalid fields) and pure `buildPayload` (`''` when nothing to encode). Reuse `lib/` helpers; escape every user value per the target spec.
3. **Form** in `src/templates/forms/*Forms.tsx` with `TextField` / `SelectField` / `CheckboxField` / `PhoneField` (`forms/fields.tsx`) and `fieldSetter`; unique field ids; labels from `t.qrDataInput.form`.
4. **Registry**: add the entry to `registry` in `src/templates/index.ts` (the mapped type fails to compile if it is missing). Order there is the order in the dropdown, within its category.
5. **i18n**: `qrDataInput.templates.<type>`, the form labels and any new error key (`qrDataInput.errors`, which defines `ErrorKey`) in `src/i18n/types.ts` **and** `en.ts`, `it.ts`, `ro.ts` ([i18n.md](i18n.md)). A new category also needs `qrDataInput.categories.<id>` and an entry in `displayCategories` (`TemplateDropdown.tsx`).
6. **Tests** in `src/templates/templates.test.ts`: valid and invalid input, escaping, empty default; update the hard-coded `toHaveLength(20)` in the `registry` test; add `lib/lib.test.ts` cases for a new helper.
7. **Batch**: nothing for text fields (CSV columns are the keys of `defaultData()`); booleans are coerced automatically; a closed set of values needs an entry in `CHOICE_FIELDS`, a date-time field in `DATE_FIELDS` / `BLANK_FIELDS` (`Batch/batchRows.ts`).
8. **Docs**: add the row to the catalog above.
9. **Privacy**: no storage code; form data lives in `EditorState.forms` (memory only).
10. **Verify**: `npm run lint && npm test && npm run build`.
