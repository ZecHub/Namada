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

This protects future dataset updates without claiming that the current
snapshots contain incorrect dashboard results.

## Learn More

Check out [vite.dev](https://vite.dev/) to learn more about Vite.
