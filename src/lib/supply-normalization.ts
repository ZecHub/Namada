export type SupplyAsset = {
  id: string;
  totalSupply: string;
  shieldedSupply: string;
  transparentSupply: string;
};

export type SupplyRecord = {
  Date: string;
  Total_Supply: SupplyAsset[];
  Native_Supply_NAM: string;
};

export type SupplyNormalizationResult = {
  records: SupplyRecord[];
  rejectedRecords: number;
  rejectedAssets: number;
  duplicateDatesResolved: number;
};

type Candidate = {
  record: SupplyRecord;
  timestamp: number;
  completeness: number;
  tieBreak: string;
};

function parseDate(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;
  return date.getTime();
}

function numericString(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? String(value).trim() : null;
}

function toCandidate(value: unknown): { candidate: Candidate | null; rejectedAssets: number } {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return { candidate: null, rejectedAssets: 0 };
  const row = value as Record<string, unknown>;
  const timestamp = parseDate(row.Date);
  const nativeSupply = numericString(row.Native_Supply_NAM);
  if (timestamp === null || nativeSupply === null || !Array.isArray(row.Total_Supply))
    return { candidate: null, rejectedAssets: 0 };

  let rejectedAssets = 0;
  const assets: SupplyAsset[] = [];
  for (const item of row.Total_Supply) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      rejectedAssets += 1;
      continue;
    }
    const asset = item as Record<string, unknown>;
    const totalSupply = numericString(asset.totalSupply);
    const shieldedSupply = numericString(asset.shieldedSupply);
    const transparentSupply = numericString(asset.transparentSupply);
    if (
      typeof asset.id !== "string" ||
      !asset.id.trim() ||
      totalSupply === null ||
      shieldedSupply === null ||
      transparentSupply === null
    ) {
      rejectedAssets += 1;
      continue;
    }
    assets.push({
      id: asset.id.trim(),
      totalSupply,
      shieldedSupply,
      transparentSupply,
    });
  }

  const namadaAssets = assets.filter((asset) => asset.id === "Namada");
  if (namadaAssets.length !== 1)
    return { candidate: null, rejectedAssets };

  assets.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const record: SupplyRecord = {
    Date: row.Date as string,
    Total_Supply: assets,
    Native_Supply_NAM: nativeSupply,
  };
  return {
    rejectedAssets,
    candidate: {
      record,
      timestamp,
      completeness: assets.length,
      tieBreak: JSON.stringify(record),
    },
  };
}

export function normalizeSupplyData(value: unknown): SupplyNormalizationResult {
  if (!Array.isArray(value)) {
    return { records: [], rejectedRecords: 1, rejectedAssets: 0, duplicateDatesResolved: 0 };
  }

  const byDate = new Map<number, Candidate>();
  let rejectedRecords = 0;
  let rejectedAssets = 0;
  let duplicateDatesResolved = 0;

  for (const valueRow of value) {
    const { candidate, rejectedAssets: rejected } = toCandidate(valueRow);
    rejectedAssets += rejected;
    if (!candidate) {
      rejectedRecords += 1;
      continue;
    }
    const existing = byDate.get(candidate.timestamp);
    if (!existing) {
      byDate.set(candidate.timestamp, candidate);
      continue;
    }
    duplicateDatesResolved += 1;
    if (
      candidate.completeness > existing.completeness ||
      (candidate.completeness === existing.completeness &&
        candidate.tieBreak < existing.tieBreak)
    ) byDate.set(candidate.timestamp, candidate);
  }

  const records = [...byDate.values()]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(({ record }) => record);
  return { records, rejectedRecords, rejectedAssets, duplicateDatesResolved };
}
