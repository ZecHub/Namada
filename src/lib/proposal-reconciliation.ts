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
