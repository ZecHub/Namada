import {
  reconcileProposals,
  type NormalizedProposal,
  type ProposalSnapshot,
} from "./proposal-reconciliation.js";

export const NAMADA_INDEXER_BASE = "https://indexer.namada.net/api/v1";
export const LOCAL_GOVERNANCE_SOURCES = {
  summary: "/data/props.json",
  details: "/data/proposals/propsDetails.json",
} as const;
export const LOCAL_GOVERNANCE_UPDATED_URL =
  "https://api.github.com/repos/ZecHub/Namada/commits?path=public/data/proposals/propsDetails.json&per_page=1";

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

type IndexerProposal = {
  id: number;
  content?: string;
  type?: string;
  author?: string;
  startEpoch?: number;
  endEpoch?: number;
  activationEpoch?: number;
  status?: string;
};

type IndexerProposalPage = {
  results?: IndexerProposal[];
  pagination?: {
    page?: number;
    totalPages?: number;
  };
};

type IndexerEpoch = {
  epoch?: string | number;
};

type GithubCommit = {
  commit?: {
    committer?: {
      date?: string;
    };
  };
};

export type GovernanceData = {
  epoch: number;
  proposals: NormalizedProposal[];
  source: "live" | "snapshot";
  sourceLabel: string;
};

function parseContent(content?: string) {
  if (!content) return undefined;
  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === "object" ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function normalizeIndexerProposal(
  proposal: IndexerProposal,
): NormalizedProposal {
  return {
    id: proposal.id,
    Type: proposal.type,
    Author: proposal.author,
    Start_Epoch:
      proposal.startEpoch === undefined ? undefined : String(proposal.startEpoch),
    End_Epoch:
      proposal.endEpoch === undefined ? undefined : String(proposal.endEpoch),
    Activation_Epoch:
      proposal.activationEpoch === undefined
        ? undefined
        : String(proposal.activationEpoch),
    Status: proposal.status,
    Content: parseContent(proposal.content),
  };
}

async function fetchJson<T>(fetcher: FetchLike, url: string): Promise<T> {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`Governance source returned ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function loadLiveGovernance(fetcher: FetchLike): Promise<GovernanceData> {
  const [firstPage, epochResult] = await Promise.all([
    fetchJson<IndexerProposalPage>(
      fetcher,
      `${NAMADA_INDEXER_BASE}/gov/proposal?page=1`,
    ),
    fetchJson<IndexerEpoch>(
      fetcher,
      `${NAMADA_INDEXER_BASE}/chain/epoch/latest`,
    ),
  ]);

  const totalPages = Math.max(1, firstPage.pagination?.totalPages || 1);
  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchJson<IndexerProposalPage>(
        fetcher,
        `${NAMADA_INDEXER_BASE}/gov/proposal?page=${index + 2}`,
      ),
    ),
  );

  const proposals = [firstPage, ...remainingPages]
    .flatMap((page) => page.results || [])
    .map(normalizeIndexerProposal)
    .sort((a, b) => b.id - a.id);

  const epoch = Number(epochResult.epoch);
  if (!Number.isFinite(epoch) || epoch <= 0) {
    throw new Error("Live Namada indexer returned an invalid epoch");
  }

  return {
    epoch,
    proposals,
    source: "live",
    sourceLabel: "Live Namada indexer",
  };
}

async function loadSnapshotGovernance(
  fetcher: FetchLike,
): Promise<GovernanceData> {
  const [summarySnapshots, detailSnapshots] = await Promise.all([
    fetchJson<ProposalSnapshot[]>(fetcher, LOCAL_GOVERNANCE_SOURCES.summary),
    fetchJson<ProposalSnapshot[]>(fetcher, LOCAL_GOVERNANCE_SOURCES.details),
  ]);

  const { proposals } = reconcileProposals([
    { name: "summary", authority: 1, snapshots: summarySnapshots },
    { name: "details", authority: 2, snapshots: detailSnapshots },
  ]);
  const epoch = Math.max(
    ...summarySnapshots.map((snapshot) => snapshot.Last_committed_epoch || 0),
    ...detailSnapshots.map((snapshot) => snapshot.Last_committed_epoch || 0),
    0,
  );
  const updatedAt = await fetchJson<GithubCommit[]>(
    fetcher,
    LOCAL_GOVERNANCE_UPDATED_URL,
  )
    .then((commits) => commits[0]?.commit?.committer?.date?.slice(0, 10) || null)
    .catch(() => null);
  const snapshotStamp = updatedAt ? `updated ${updatedAt}` : `epoch ${epoch}`;

  return {
    epoch,
    proposals,
    source: "snapshot",
    sourceLabel: `Historical snapshot · ${snapshotStamp} · live indexer unavailable`,
  };
}

export async function loadGovernanceData(
  fetcher: FetchLike = fetch,
): Promise<GovernanceData> {
  try {
    return await loadLiveGovernance(fetcher);
  } catch {
    return loadSnapshotGovernance(fetcher);
  }
}
