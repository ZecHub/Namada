const COMMITS_API = "https://api.github.com/repos/ZecHub/Namada/commits";

const commitsFor = (path: string) =>
  `${COMMITS_API}?path=${path}&per_page=1`;

// Each chart tab on the dashboard reads exactly one data file; its "Last
// updated" date must come from that file's latest commit.
const CHART_TAB_DATA_FILES: Record<string, string> = {
  "total supply": "public/data/namada_supply.json",
  "shielded supply": "public/data/namada_supply.json",
  "transparent supply": "public/data/namada_supply.json",
  rewards: "public/data/namada_rewards_rate.json",
  proposals: "public/data/proposals/propAddressesCounts.json",
};

/** GitHub commits URL for the data file behind a chart tab, or null if unknown. */
export function commitUrlForChartTab(tab: string): string | null {
  const path = CHART_TAB_DATA_FILES[tab.trim().toLowerCase()];
  return path ? commitsFor(path) : null;
}

/** Committer date of the newest commit in a GitHub commits response, or null. */
export function latestCommitDate(response: unknown): Date | null {
  if (!Array.isArray(response) || response.length === 0) return null;
  const raw = response[0]?.commit?.committer?.date;
  if (typeof raw !== "string") return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}
