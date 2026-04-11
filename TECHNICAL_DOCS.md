# Technical documentation — Receipt Splitter

## Overview

The Receipt Splitter is a client-side React application bundled with Vite. Core splitting, tax/tip allocation, and CSV generation live in **pure TypeScript modules** under `app/web/src/lib/` so they can be covered by **Vitest** without loading the UI.

## Technology stack

| Layer | Choice |
|--------|--------|
| UI | React 19 (function components, hooks) |
| Language | TypeScript |
| Build | Vite 8; production output goes to `app/ec2/` |
| Tests | Vitest |
| Deploy | Static `index.html` + hashed JS/CSS under `app/ec2/assets/` |

## Directory layout

### `app/web/src/lib/`

| Module | Role |
|--------|------|
| `types.ts` | `Person`, `Item`, summary and running-row shapes |
| `math.ts` | `round2` |
| `ids.ts` | `generatePersonId`, `generateItemId` |
| `splits.ts` | Subtotals, tax/tip shares, per-item share breakdown, invalid custom-line counting, payer validity |
| `running.ts` | `buildRunningRows` for the running total table |
| `csv.ts` | `buildCsvContent`, `downloadCsv` |
| `itemHelpers.ts` | `createEmptyItem`, syncing custom-split maps when people change |

### `app/web/src/components/`

- `PeopleConfig.tsx` — people grid and add/delete
- `ItemsTable.tsx` — item rows, payer select, custom split inputs
- `TaxTip.tsx` — tax and tip inputs
- `SummaryPanel.tsx` — per-person subtotal / tax / tip / total
- `RunningTotalPanel.tsx` — line-by-line breakdown + grand total

### `app/ec2/` (build output)

Terraform (`tf/main.tf`) zips `app/ec2/` as `ec2_assets.zip` and the EC2 user-data script unpacks it to `/opt/receipt-splitter/site`. No CDN scripts: React and dependencies are bundled into `assets/*.js`.

## Data flow

1. **State** (`App.tsx`): `people`, `items`, `taxAmount`, `tipAmount`.
2. When **person IDs** change, `syncAllItemsPeople` ensures each item’s `custom.values` has a key per person.
3. **`computeSummary`** derives subtotals, tax/tip shares, and totals.
4. **`buildRunningRows`** feeds the running total table.
5. **`countInvalidCustomItems`** drives the banner and disables export when &gt; 0.
6. **`buildCsvContent`** mirrors the same summary logic for downloads.

## Behavioral rules

- **Invalid custom split** (cost &gt; 0, payer Custom, percentages or dollars do not match): that line does not contribute to subtotals; the UI shows a summary banner and disables CSV export until every custom line is valid.
- **Enter key**: only the **item description** input adds a new row on Enter (reduced surprise vs. firing on cost/payer/custom fields).
- **Minimum people**: two; delete is hidden when only two remain.
- **Stale payer** after a person is removed: that item’s payer is cleared.

## Testing

Tests live next to logic in `*.test.ts` files. They cover even-split remainder handling, proportional tax/tip, custom valid/invalid behavior, CSV escaping, and invalid custom line counting.

Run from `app/web`:

```bash
npm run test
```

## Infrastructure note

After UI changes, run `npm run build` in `app/web` before `terraform apply` so the S3 object for `ec2_assets.zip` updates.
