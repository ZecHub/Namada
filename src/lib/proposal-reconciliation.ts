export type ProposalContent = {
  authors?: string;
  details?: string;
  "discussions-to"?: string;
  motivation?: string;
  title?: string;
};

export type GovernanceProposal = {
  id?: number;
  Id?: number;
  Type?: string;
  Author?: string;
  Start_Epoch?: string;
  End_Epoch?: string;
  Activation_Epoch?: string;
  Status?: string;
  Data?: string;
  Result?: string;
  Content?: ProposalContent;
};

export type ProposalSnapshot = {
  Last_committed_epoch?: number;
  Proposal?: GovernanceProposal[];
};

export type NormalizedProposal = Omit<GovernanceProposal, "Id"> & {
  id: number;
};

export type ProposalSource = {
  name: string;
  authority: number;
  snapshots: ProposalSnapshot[];
};

type SourceReference = {
  source: string;
  epoch: number;
};

export type ProposalConflict = {
  id: number;
  field: string;
  chosen: unknown;
  values: Array<SourceReference & { value: unknown }>;
};

export type ProposalReconciliation = {
  proposals: NormalizedProposal[];
  conflicts: ProposalConflict[];
  provenance: Record<number, Record<string, SourceReference>>;
};

type Candidate = SourceReference & {
  authority: number;
  proposal: NormalizedProposal;
};

const proposalFields = [
  "Type",
  "Author",
  "Start_Epoch",
  "End_Epoch",
  "Activation_Epoch",
  "Status",
  "Data",
  "Result",
] as const;

const contentFields = [
  "authors",
  "details",
  "discussions-to",
  "motivation",
  "title",
] as const;

function hasValue(value: unknown) {
  return value !== undefined && value !== null && value !== "";
}

function normalizeProposal(proposal: GovernanceProposal) {
  const rawId = proposal.id ?? proposal.Id;
  const id = typeof rawId === "number" ? rawId : Number(rawId);

  if (!Number.isInteger(id) || id < 0) return null;

  const normalized = { ...proposal };
  delete normalized.Id;
  return { ...normalized, id } as NormalizedProposal;
}

function completeness(proposal: NormalizedProposal) {
  const proposalValues = proposalFields.filter((field) =>
    hasValue(proposal[field]),
  ).length;
  const contentValues = contentFields.filter((field) =>
    hasValue(proposal.Content?.[field]),
  ).length;
  return proposalValues + contentValues;
}

function stableValue(value: unknown): string {
  if (value === undefined) return "";
  if (Array.isArray(value)) return JSON.stringify(value.map(stableValue));
  if (value !== null && typeof value === "object") {
    return JSON.stringify(
      Object.fromEntries(
        Object.entries(value)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, nestedValue]) => [key, stableValue(nestedValue)]),
      ),
    );
  }
  return JSON.stringify(value) ?? String(value);
}

function compareCandidates(a: Candidate, b: Candidate) {
  return (
    b.authority - a.authority ||
    b.epoch - a.epoch ||
    completeness(b.proposal) - completeness(a.proposal) ||
    a.source.localeCompare(b.source) ||
    stableValue(a.proposal).localeCompare(stableValue(b.proposal))
  );
}

function getField(proposal: NormalizedProposal, field: string) {
  if (field.startsWith("Content.")) {
    return proposal.Content?.[field.slice(8) as keyof ProposalContent];
  }
  return proposal[field as keyof NormalizedProposal];
}

function mergeCandidates(candidates: Candidate[]) {
  const ordered = [...candidates].sort(compareCandidates);
  const proposal = { id: ordered[0].proposal.id } as NormalizedProposal;
  const provenance: Record<string, SourceReference> = {};

  // Apply the least preferred candidates first so authoritative, fresh and
  // complete values win without allowing missing fields to erase good data.
  [...ordered].reverse().forEach((candidate) => {
    proposalFields.forEach((field) => {
      const value = candidate.proposal[field];
      if (!hasValue(value)) return;
      Object.assign(proposal, { [field]: value });
      provenance[field] = {
        source: candidate.source,
        epoch: candidate.epoch,
      };
    });

    contentFields.forEach((field) => {
      const value = candidate.proposal.Content?.[field];
      if (!hasValue(value)) return;
      proposal.Content = { ...proposal.Content, [field]: value };
      provenance[`Content.${field}`] = {
        source: candidate.source,
        epoch: candidate.epoch,
      };
    });
  });

  return { ordered, proposal, provenance };
}

function findConflicts(
  id: number,
  candidates: Candidate[],
  proposal: NormalizedProposal,
) {
  const fields = [
    ...proposalFields,
    ...contentFields.map((field) => `Content.${field}`),
  ];

  return fields.flatMap((field) => {
    const values = candidates
      .map((candidate) => ({
        source: candidate.source,
        epoch: candidate.epoch,
        value: getField(candidate.proposal, field),
      }))
      .filter(({ value }) => hasValue(value));
    const distinctValues = new Set(values.map(({ value }) => stableValue(value)));

    if (distinctValues.size < 2) return [];
    return [{ id, field, chosen: getField(proposal, field), values }];
  });
}

/**
 * Reconcile overlapping governance snapshots without relying on input order.
 * Higher source authority wins, followed by snapshot epoch and completeness.
 * Missing fields are backfilled from lower-priority records.
 */
export function reconcileProposals(
  sources: ProposalSource[],
): ProposalReconciliation {
  const candidatesById = new Map<number, Candidate[]>();

  sources.forEach((source) =>
    source.snapshots.forEach((snapshot) =>
      snapshot.Proposal?.forEach((rawProposal) => {
        const proposal = normalizeProposal(rawProposal);
        if (!proposal) return;
        const candidate = {
          proposal,
          source: source.name,
          authority: source.authority,
          epoch: snapshot.Last_committed_epoch ?? 0,
        };
        candidatesById.set(proposal.id, [
          ...(candidatesById.get(proposal.id) ?? []),
          candidate,
        ]);
      }),
    ),
  );

  const conflicts: ProposalConflict[] = [];
  const provenance: Record<number, Record<string, SourceReference>> = {};
  const proposals = [...candidatesById.entries()].map(([id, candidates]) => {
    const merged = mergeCandidates(candidates);
    provenance[id] = merged.provenance;
    conflicts.push(...findConflicts(id, merged.ordered, merged.proposal));
    return merged.proposal;
  });

  return {
    proposals: proposals.sort((a, b) => b.id - a.id),
    conflicts: conflicts.sort(
      (a, b) => b.id - a.id || a.field.localeCompare(b.field),
    ),
    provenance,
  };
}

export const NAMADA_INDEXER_BASE_URL = "https://indexer.namada.net";

type NamadaIndexerProposal = {
  id?: number;
  content?: string | ProposalContent;
  type?: string;
  author?: string;
  startEpoch?: number;
  endEpoch?: number;
  activationEpoch?: number;
  status?: string;
};

type NamadaIndexerProposalPage = {
  results?: NamadaIndexerProposal[];
  pagination?: {
    page?: number;
    perPage?: number;
    totalPages?: number;
    totalItems?: number;
  };
};

type NamadaIndexerEpoch = {
  epoch?: string | number;
};

export type CurrentGovernance = {
  snapshot: ProposalSnapshot;
  fetchedAt: string;
  latestProposalId: number;
  totalItems: number;
};

function proposalContent(value: unknown): ProposalContent | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;

  const source = value as Record<string, unknown>;
  const content: ProposalContent = {};
  contentFields.forEach((field) => {
    const candidate = source[field];
    if (typeof candidate === "string" && candidate.length) {
      Object.assign(content, { [field]: candidate });
    }
  });
  return Object.keys(content).length ? content : undefined;
}

export function normalizeIndexerProposal(
  row: NamadaIndexerProposal,
): NormalizedProposal | null {
  const id = Number(row.id);
  if (!Number.isInteger(id) || id < 0) return null;

  let rawContent: unknown = row.content;
  if (typeof rawContent === "string") {
    try {
      rawContent = JSON.parse(rawContent);
    } catch {
      rawContent = undefined;
    }
  }

  const content = proposalContent(rawContent);
  return {
    id,
    ...(row.type ? { Type: row.type } : {}),
    ...(row.author ? { Author: row.author } : {}),
    ...(row.startEpoch !== undefined
      ? { Start_Epoch: String(row.startEpoch) }
      : {}),
    ...(row.endEpoch !== undefined ? { End_Epoch: String(row.endEpoch) } : {}),
    ...(row.activationEpoch !== undefined
      ? { Activation_Epoch: String(row.activationEpoch) }
      : {}),
    ...(row.status ? { Status: row.status } : {}),
    ...(content ? { Content: content } : {}),
  };
}

export function buildLiveGovernanceSnapshot(
  epochPayload: NamadaIndexerEpoch,
  proposalPages: NamadaIndexerProposalPage[],
): Omit<CurrentGovernance, "fetchedAt"> {
  const epoch = Number(epochPayload?.epoch);
  if (!Number.isInteger(epoch) || epoch < 0) {
    throw new Error("Namada indexer returned an invalid latest epoch");
  }
  if (!proposalPages.length) {
    throw new Error("Namada indexer returned no proposal pages");
  }

  const expectedPages = Number(proposalPages[0].pagination?.totalPages ?? 1);
  const expectedItems = Number(
    proposalPages[0].pagination?.totalItems ??
      proposalPages.reduce((total, page) => total + (page.results?.length ?? 0), 0),
  );

  if (
    !Number.isInteger(expectedPages) ||
    expectedPages < 1 ||
    proposalPages.length !== expectedPages
  ) {
    throw new Error("Namada indexer proposal pagination is incomplete");
  }

  const normalized = proposalPages
    .flatMap((page) => page.results ?? [])
    .map(normalizeIndexerProposal)
    .filter((proposal): proposal is NormalizedProposal => proposal !== null);

  if (
    !Number.isInteger(expectedItems) ||
    expectedItems < 1 ||
    normalized.length !== expectedItems
  ) {
    throw new Error("Namada indexer proposal count does not match pagination");
  }

  const ids = normalized.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Namada indexer returned duplicate proposal IDs");
  }

  const latestProposalId = Math.max(...ids);
  // On-chain proposal IDs are a zero-based monotonically increasing counter.
  // If pagination says N proposals exist, the latest source record must not be
  // older than N - 1 or the displayed list would silently lag the source.
  if (latestProposalId < expectedItems - 1) {
    throw new Error("Namada indexer proposal set is stale or incomplete");
  }

  return {
    snapshot: {
      Last_committed_epoch: epoch,
      Proposal: normalized,
    },
    latestProposalId,
    totalItems: expectedItems,
  };
}

export async function fetchCurrentGovernance(
  fetcher: typeof fetch = fetch,
  baseUrl = NAMADA_INDEXER_BASE_URL,
  signal?: AbortSignal,
): Promise<CurrentGovernance> {
  const getJson = async <T>(url: string): Promise<T> => {
    const response = await fetcher(url, { signal });
    if (!response.ok) {
      throw new Error(`Namada indexer request failed: ${response.status}`);
    }
    return (await response.json()) as T;
  };

  const [epochPayload, firstPage] = await Promise.all([
    getJson<NamadaIndexerEpoch>(`${baseUrl}/api/v1/chain/epoch/latest`),
    getJson<NamadaIndexerProposalPage>(`${baseUrl}/api/v1/gov/proposal`),
  ]);

  const totalPages = Number(firstPage.pagination?.totalPages ?? 1);
  if (!Number.isInteger(totalPages) || totalPages < 1) {
    throw new Error("Namada indexer returned invalid proposal pagination");
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      getJson<NamadaIndexerProposalPage>(
        `${baseUrl}/api/v1/gov/proposal?page=${index + 2}`,
      ),
    ),
  );

  const current = buildLiveGovernanceSnapshot(epochPayload, [
    firstPage,
    ...remainingPages,
  ]);

  return {
    ...current,
    fetchedAt: new Date().toISOString(),
  };
}
