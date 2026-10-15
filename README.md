# Namada

Governance and Network Metrics Dashboard

## 🚀 Setup

To set up the development environment, follow these steps:

1. **Install the project dependencies:**

   ```bash
   npm install

   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Run the checks:**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

## Governance proposal reconciliation

The dashboard combines the summary snapshot in `public/data/props.json` with
the richer records in `public/data/proposals/propsDetails.json`. Reconciliation
is deterministic and does not depend on fetch or array order:

1. The detailed dataset has explicit authority over the summary dataset.
2. Within the same authority, the newest `Last_committed_epoch` wins.
3. Completeness and stable source identifiers break any remaining ties.
4. Missing fields are backfilled from lower-priority records, so an incomplete
   record cannot erase useful metadata.
5. Populated fields with different values are returned as conflicts, including
   their source provenance. Development builds log those conflicts for review.

The dashboard now treats the Namada indexer as the current governance source:

- proposals: `https://indexer.namada.net/api/v1/gov/proposal`
- current epoch: `https://indexer.namada.net/api/v1/chain/epoch/latest`

All proposal pages are loaded automatically, so new governance proposals appear
without editing bundled JSON. The local `props.json` and `propsDetails.json`
files remain an offline fallback only. When the indexer is unavailable, the UI
labels that data as a **Historical snapshot** and changes "Current epoch" to
"Snapshot epoch" so stale data cannot silently present itself as current.

The reconciliation rules below are used only for that fallback path.

## Learn More

Check out [vite.dev](https://vite.dev/) to learn more about Vite.
