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

## Governance proposal source and reconciliation

The dashboard uses the official Namada indexer
(`https://indexer.namada.net`) as the primary source for the current epoch and
governance proposals. It follows the indexer's pagination and validates the
returned proposal count before presenting the data as current.

If the live indexer cannot be reached, the UI falls back to the bundled summary
snapshot in `public/data/props.json` and the richer records in
`public/data/proposals/propsDetails.json`. That fallback is explicitly labeled
as a historical snapshot rather than current network state.

Snapshot reconciliation is deterministic and does not depend on fetch or array
order:

1. The detailed dataset has explicit authority over the summary dataset.
2. Within the same authority, the newest `Last_committed_epoch` wins.
3. Completeness and stable source identifiers break any remaining ties.
4. Missing fields are backfilled from lower-priority records, so an incomplete
   record cannot erase useful metadata.
5. Populated fields with different values are returned as conflicts, including
   their source provenance. Development builds log those conflicts for review.

This protects future dataset updates without claiming that the current
snapshots contain incorrect dashboard results.

## Namada supply history normalization

All dashboard supply consumers use `normalizeSupplyData` from
`src/lib/supply-normalization.ts`. It accepts only real `MM/DD/YYYY` dates,
finite non-negative native NAM supply, and exactly one valid Namada total
supply asset. An asset with missing or invalid numeric values is omitted from
that record instead of being treated as zero; records without the required
Namada values are rejected.

Records are sorted oldest to newest. Duplicate dates are reduced to the record
with the most valid asset entries; ties select the lexicographically smallest
normalized record. This makes latest metrics and chart history independent of
the order in which equal-date source rows arrive. The source currently contains
multiple same-date rows, including three rows dated `05/23/2025` with different
NAM supply values, so array position alone does not identify a unique daily
snapshot.

## Learn More

Check out [vite.dev](https://vite.dev/) to learn more about Vite.
