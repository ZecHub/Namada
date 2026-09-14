import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Menu,
  Shield,
  X,
} from "lucide-react";
import { NetworkDashboard } from "./Home";
import { DATA_URL } from "../components/lib/chart/data-url";
import ProposalParticipationChart from "../components/ProposalParticipationChart";

const blockchairPriceApi = DATA_URL.blockchairUrl;
const browserFetch = window.fetch.bind(window);
const fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const requestedUrl = String(input);
  const url = requestedUrl.includes("api.coingecko.com")
    ? blockchairPriceApi
    : requestedUrl;
  return browserFetch(url, init).then(async (response) => {
    if (url === blockchairPriceApi) {
      const payload = (await response.clone().json()) as {
        data?: {
          market_price_usd?: number;
          market_price_btc?: number;
          market_cap_usd?: number;
        };
      };
      const data = payload.data || {};
      return new Response(
        JSON.stringify({
          namada: {
            usd: data.market_price_usd,
            btc: data.market_price_btc,
            usd_market_cap: data.market_cap_usd,
          },
        }),
        { status: response.status, headers: response.headers },
      );
    }
    return response;
  });
};

type Validator = {
  Name?: string;
  Address?: string;
  Commission?: string;
  Max_Change?: string;
  Epoch?: string;
  Website?: string;
  Description?: string;
  Email?: string;
  Discord?: string;
  Avatar?: string;
};
type ProtocolData = {
  Governance_Parameters?: Record<string, unknown>[];
  Public_Goods_Funding_Parameters?: Record<string, unknown>[];
  Protocol_Parameters?: Record<string, unknown>[];
  Proof_Of_Stake_Parmeters?: Record<string, unknown>[];
  IBC_Parameters?: Record<string, unknown>[];
};
type SupplyPoint = {
  Date: string;
  Native_Supply_NAM: string;
  Total_Supply: {
    id: string;
    totalSupply: string;
    shieldedSupply?: string;
    transparentSupply?: string;
  }[];
};
type ProposalSnapshot = {
  Last_committed_epoch?: number;
  Proposal?: {
    id: number;
    Type: string;
    Author: string;
    Start_Epoch: string;
    End_Epoch: string;
    Activation_Epoch: string;
  }[];
};
type PriceSnapshot = {
  namada?: {
    usd?: number;
    btc?: number;
    usd_market_cap?: number;
    usd_24h_change?: number;
  };
};
type RewardPoint = {
  Date: string;
  Staked_Ratio: string;
  Annual_Staking_Rewards_Ratio: string;
  Inflation_Rate: string;
};

export function GovernanceProposals() {
  const [snapshot, setSnapshot] = useState<ProposalSnapshot | null>(null);
  useEffect(() => {
    fetch(DATA_URL.proposalsUrl)
      .then((response) => response.json())
      .then((rows: ProposalSnapshot[]) => setSnapshot(rows[0]))
      .catch(() => setSnapshot({ Proposal: [] }));
  }, []);
  const proposals = [...(snapshot?.Proposal || [])].sort((a, b) => b.id - a.id);
  return (
    <section className="governance-proposals section-wrap">
      <div className="epoch-banner">
        <span>Current epoch</span>
        <b>{snapshot?.Last_committed_epoch ?? "Loading…"}</b>
      </div>
      <div className="proposals-table-wrap">
        <table className="proposals-table">
          <thead>
            <tr>
              <th>#</th>
              <th>ID</th>
              <th>Type</th>
              <th>Author</th>
              <th>Start epoch</th>
              <th>End epoch</th>
              <th>Activation epoch</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((proposal, index) => (
              <tr key={proposal.id}>
                <td>{index + 1}</td>
                <td>
                  <b>{proposal.id}</b>
                </td>
                <td>{proposal.Type}</td>
                <td>
                  <code>{proposal.Author}</code>
                </td>
                <td>{proposal.Start_Epoch}</td>
                <td>{proposal.End_Epoch}</td>
                <td>{proposal.Activation_Epoch}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {snapshot && !proposals.length && (
          <p className="dashboard-loading">No proposal data available.</p>
        )}
      </div>
    </section>
  );
}

function formatParameter(value: unknown, key: string) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number" && /rate|ratio/i.test(key))
    return `${value * 100}%`;
  return String(value ?? "—");
}
function ParameterCard({
  title,
  values,
}: {
  title: string;
  values?: Record<string, unknown>;
}) {
  if (!values)
    return (
      <div className="parameter-card">
        <h3>{title}</h3>
        <p className="dashboard-loading">Loading…</p>
      </div>
    );
  const entries = Object.entries(values).filter(
    ([key]) =>
      ![
        "VP_allowlist",
        "Transactions_allowlist",
        "Protocol_Parameters",
      ].includes(key),
  );
  return (
    <div className="parameter-card">
      <h3>{title}</h3>
      <div className="parameter-rows">
        {entries.map(([key, value]) => (
          <div className="parameter-row" key={key}>
            <span>{key.replace(/_/g, " ")}</span>
            <b>{formatParameter(value, key)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
function ProtocolParameters() {
  const [data, setData] = useState<ProtocolData | null>(null);
  useEffect(() => {
    fetch("/data/protocol_parameters.json")
      .then((response) => response.json())
      .then((rows: ProtocolData[]) => setData(rows[0]))
      .catch(() => setData({}));
  }, []);
  const protocol = data?.Protocol_Parameters?.[0];
  const vpAllowlist = protocol?.VP_allowlist as string[] | undefined;
  const transactionsAllowlist = protocol?.Transactions_allowlist as
    | string[]
    | undefined;
  const feeParameters = protocol?.Protocol_Parameters as unknown[] | undefined;
  return (
    <section className="protocol-parameters section-wrap">
      <div className="parameters-heading">
        <div>
          <span className="section-kicker">Complete snapshot</span>
          <h2>Protocol parameters</h2>
        </div>
        <span className="directory-note">Source: Namada data registry</span>
      </div>
      <div className="parameters-grid">
        <ParameterCard
          title="Governance Parameters"
          values={data?.Governance_Parameters?.[0]}
        />
        <ParameterCard
          title="Public Goods Funding"
          values={data?.Public_Goods_Funding_Parameters?.[0]}
        />
        <ParameterCard title="Protocol Parameters" values={protocol} />
        <ParameterCard
          title="Proof of Stake"
          values={data?.Proof_Of_Stake_Parmeters?.[0]}
        />
        <ParameterCard
          title="IBC Parameters"
          values={data?.IBC_Parameters?.[0]}
        />
      </div>
      <div className="parameter-details-grid">
        {vpAllowlist && (
          <details>
            <summary>
              VP allowlist <span>{vpAllowlist.length} entries</span>
            </summary>
            <code>{vpAllowlist.join("\n")}</code>
          </details>
        )}
        {transactionsAllowlist && (
          <details>
            <summary>
              Transactions allowlist{" "}
              <span>{transactionsAllowlist.length} entries</span>
            </summary>
            <code>{transactionsAllowlist.join("\n")}</code>
          </details>
        )}
        {feeParameters && (
          <details>
            <summary>
              Address fee parameters <span>{feeParameters.length} entries</span>
            </summary>
            <code>{JSON.stringify(feeParameters, null, 2)}</code>
          </details>
        )}
      </div>
    </section>
  );
}

function SupplyChart({ rows, value }: { rows: SupplyPoint[]; value: (row: SupplyPoint) => number }) {
  const max = Math.max(...rows.map(value), 1);
  const ticks = [max, Math.round(max * 0.75), Math.round(max * 0.5), Math.round(max * 0.25), 0];
  return (
    <>
      <div className="axis-chart supply-axis-chart">
        <div className="y-axis">{ticks.map((tick) => <span key={tick}>{tick.toLocaleString()}</span>)}</div>
        <div className="plot-area">
          <div className="grid-lines">{ticks.map((tick) => <i key={tick} />)}</div>
          <div className="participation-bars">{rows.map((row, index) => { const amount = value(row); return <div className="participation-bar-column" key={row.Date}><div className="participation-bar" style={{ height: `${Math.max(2, amount / max * 100)}%` }} title={`${row.Date}: ${amount.toLocaleString()} NAM`} /><small>{row.Date.slice(0, 7)}</small><span className="sr-only">Data point {index + 1}</span></div>; })}</div>
        </div>
      </div>
      <div className="axis-labels"><span>Date</span><span>NAM supply</span></div>
    </>
  );
}

function RewardsChart() {
  const [rows, setRows] = useState<RewardPoint[]>([]);
  const [metric, setMetric] = useState<"Staked_Ratio" | "Annual_Staking_Rewards_Ratio" | "Inflation_Rate">("Annual_Staking_Rewards_Ratio");
  const [range, setRange] = useState<"14" | "30" | "90" | "all">("14");
  useEffect(() => {
    fetch(DATA_URL.namadaRewardUrl).then((response) => response.json()).then(setRows).catch(() => setRows([]));
  }, []);
  const visible = range === "all" ? rows : rows.slice(-Number(range));
  const value = (row: RewardPoint) => Number(row[metric]) * 100;
  const max = Math.max(...visible.map(value), 1);
  const latest = rows[rows.length - 1];
  const ticks = [max, Math.round(max * .75 * 100) / 100, Math.round(max * .5 * 100) / 100, Math.round(max * .25 * 100) / 100, 0];
  const labels = { Staked_Ratio: "Staked ratio", Annual_Staking_Rewards_Ratio: "Annual staking rewards", Inflation_Rate: "Inflation rate" };
  return <div className="reward-chart-card"><div className="reward-chart-heading"><div><span className="metric-label">Staking economics</span><h3>Staked ratio, rewards & inflation</h3></div><div className="reward-filters"><label>Metric <select value={metric} onChange={(event) => setMetric(event.target.value as typeof metric)}><option value="Annual_Staking_Rewards_Ratio">Annual rewards</option><option value="Staked_Ratio">Staked ratio</option><option value="Inflation_Rate">Inflation rate</option></select></label><label>Days <select value={range} onChange={(event) => setRange(event.target.value as typeof range)}><option value="14">Last 14 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="all">All history</option></select></label></div></div>{visible.length ? <><div className={`axis-chart reward-axis-chart${range === "all" ? " is-expanded" : ""}`}><div className="y-axis">{ticks.map((tick) => <span key={tick}>{tick.toFixed(2)}%</span>)}</div><div className="plot-area"><div className="grid-lines">{ticks.map((tick) => <i key={tick} />)}</div><div className="participation-bars">{visible.map((row) => <div className="participation-bar-column" key={row.Date}><div className="participation-bar" style={{ height: `${Math.max(2, value(row) / max * 100)}%` }} title={`${row.Date}: ${value(row).toFixed(3)}%`} /><small>{row.Date.slice(0, 7)}</small></div>)}</div></div></div><div className="axis-labels"><span>Date</span><span>{labels[metric]} (%)</span></div><div className="reward-summary"><div><span>Current {labels[metric].toLowerCase()}</span><b>{latest ? `${value(latest).toFixed(3)}%` : "—"}</b></div><div><span>Latest snapshot</span><b>{latest?.Date || "—"}</b></div><div><span>Data points</span><b>{rows.length}</b></div></div></> : <div className="participation-empty">Loading rewards data…</div>}</div>;
}

function ChartsWorkspace() {
  const [price, setPrice] = useState<PriceSnapshot | null>(null);
  const [supplyRows, setSupplyRows] = useState<SupplyPoint[]>([]);
  const [chart, setChart] = useState("Total Supply");
  const chartTabs = [
    "Total Supply",
    "Shielded Supply",
    "Transparent Supply",
    "Rewards",
    "Proposal Voting",
  ];
  useEffect(() => {
    Promise.all([
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=namada&vs_currencies=usd,btc&include_market_cap=true&include_24hr_change=true",
      ).then((response) => response.json()),
      fetch(DATA_URL.namadaSupplyUrl).then((response) => response.json()),
    ])
      .then(([market, supply]) => {
        console.log("Fetched market data:", market);
        setPrice(market);
        setSupplyRows(supply);
      })
      .catch(() => setSupplyRows([]));
  }, []);
  const latest = supplyRows[supplyRows.length - 1];
  const namada = latest?.Total_Supply?.find((token) => token.id === "Namada");
  const usd = price?.namada?.usd;
  const totalSupply = namada?.totalSupply ? Number(namada.totalSupply) : 0;
  const chartValue = (row: SupplyPoint) => {
    const token = row.Total_Supply?.find((item) => item.id === "Namada");
    if (chart === "Shielded Supply") return Number(token?.shieldedSupply || 0);
    if (chart === "Transparent Supply")
      return Number(token?.transparentSupply || 0);
    return Number(token?.totalSupply || 0);
  };
  const rows = supplyRows.slice(-12);
  return (
    <section className="charts-workspace section-wrap">
      <div className="metrics-heading">
        <div>
          <span className="section-kicker">Market & network analytics</span>
          <h2>Namada metrics</h2>
        </div>
        <span className="directory-note">
          Price source: CoinGecko · supply source: Namada
        </span>
      </div>
      <div className="metric-cards">
        <div>
          <span>Market cap</span>
          <b>
            {usd && totalSupply
              ? `$${(usd * totalSupply).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
              : "Loading…"}
          </b>
        </div>
        <div>
          <span>Circulation</span>
          <b>
            {totalSupply
              ? `${totalSupply.toLocaleString(undefined, { maximumFractionDigits: 0 })} NAM`
              : "Loading…"}
          </b>
        </div>
        <div>
          <span>Market price (USD)</span>
          <b>{usd ? `$${usd.toFixed(6)}` : "—"}</b>
          <small>
            {price?.namada?.usd_24h_change
              ? `${price.namada.usd_24h_change.toFixed(2)}% 24h`
              : "Market data loading"}
          </small>
        </div>
        <div>
          <span>Market price (BTC)</span>
          <b>{price?.namada?.btc ? price.namada.btc.toFixed(10) : "—"}</b>
        </div>
      </div>
      <div className="analytics-shell">
        <div className="analytics-shell-heading">
          <h3>Analytics charts</h3>
          <a
            href="https://www.coingecko.com/en/coins/namada"
            target="_blank"
            rel="noreferrer"
          >
            Open price source <ArrowUpRight size={14} />
          </a>
        </div>
        <div className="chart-tabs" role="tablist">
          {chartTabs.map((tab) => (
            <button
              key={tab}
              className={chart === tab ? "active" : ""}
              onClick={() => setChart(tab)}
              role="tab"
              aria-selected={chart === tab}
            >
              {tab}
            </button>
          ))}
        </div>
        {chart === "Proposal Voting" ? (
          <ProposalParticipationChart />
        ) : (
          <div className="chart-panel">
            <div className="chart-panel-heading">
              <div>
                <span className="metric-label">{chart}</span>
                <h3>
                  {chart === "Total Supply"
                    ? "Namada total supply"
                    : `${chart} · NAM`}
                </h3>
              </div>
              <span className="directory-note">
                {rows.length ? `${rows.length} data points` : "Loading data…"}
              </span>
            </div>
            {chart === "Rewards" ? (
              <RewardsChart />
            ) : <SupplyChart rows={rows} value={chartValue} />}
          </div>
        )}
      </div>
    </section>
  );
}

function PaginatedGovernanceProposals() {
  const [snapshots, setSnapshots] = useState<ProposalSnapshot[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  useEffect(() => {
    Promise.all([
      fetch(DATA_URL.proposalsUrl).then((response) => response.json()),
      fetch(DATA_URL.propsDetailsUrl).then((response) => response.json()),
    ])
      .then(([summary, details]: [ProposalSnapshot[], ProposalSnapshot[]]) =>
        setSnapshots([...summary, ...details]),
      )
      .catch(() => setSnapshots([]));
  }, []);
  const proposalMap = new Map<
    number,
    NonNullable<ProposalSnapshot["Proposal"]>[number]
  >();
  snapshots.forEach((snapshot) =>
    snapshot.Proposal?.forEach((proposal) =>
      proposalMap.set(proposal.id, proposal),
    ),
  );
  const proposals = [...proposalMap.values()].sort((a, b) => b.id - a.id);
  const pageCount = Math.max(1, Math.ceil(proposals.length / pageSize));
  const visible = proposals.slice((page - 1) * pageSize, page * pageSize);
  const epoch = Math.max(
    ...snapshots.map((snapshot) => snapshot.Last_committed_epoch || 0),
    0,
  );
  return (
    <section className="governance-proposals section-wrap">
      <div className="epoch-banner">
        <span>Current epoch</span>
        <b>{epoch || "Loading…"}</b>
        <small>{proposals.length} proposals tracked</small>
      </div>
      <div className="proposals-table-wrap">
        <table className="proposals-table">
          <thead>
            <tr>
              <th>#</th>
              <th>ID</th>
              <th>Type</th>
              <th>Author</th>
              <th>Start epoch</th>
              <th>End epoch</th>
              <th>Activation epoch</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((proposal, index) => (
              <tr key={proposal.id}>
                <td>{(page - 1) * pageSize + index + 1}</td>
                <td>
                  <b>{proposal.id}</b>
                </td>
                <td>{proposal.Type}</td>
                <td>
                  <code>{proposal.Author}</code>
                </td>
                <td>{proposal.Start_Epoch}</td>
                <td>{proposal.End_Epoch}</td>
                <td>{proposal.Activation_Epoch}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && (
          <p className="dashboard-loading">Loading proposal data…</p>
        )}
      </div>
      {proposals.length > pageSize && (
        <div className="pagination" aria-label="Proposal pagination">
          <span>
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, proposals.length)} of {proposals.length}
          </span>
          <div>
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <b>
              Page {page} of {pageCount}
            </b>
            <button
              onClick={() =>
                setPage((current) => Math.min(pageCount, current + 1))
              }
              disabled={page === pageCount}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function ValidatorTable() {
  const [validators, setValidators] = useState<Validator[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => {
    fetch("/data/zechub.json")
      .then((response) => response.json())
      .then(setValidators)
      .catch(() => setValidators([]));
  }, []);
  return (
    <section className="validator-directory section-wrap">
      <div className="directory-heading">
        <div>
          <span className="section-kicker">Operator registry</span>
          <h2>Validator table</h2>
        </div>
        <span className="directory-note">
          <CheckCircle2 size={14} /> Embedded Namada data · click a row to
          expand
        </span>
      </div>
      <div className="validator-table-wrap">
        <table className="validator-table">
          <thead>
            <tr>
              <th>Validator</th>
              <th>Status</th>
              <th>Commission</th>
              <th>Max change</th>
              <th>Epoch</th>
              <th>Website</th>
              <th>
                <span className="sr-only">Expand</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {validators.map((validator) => {
              const key = validator.Address || validator.Name || "validator";
              const isExpanded = expanded === key;
              return (
                <>
                  {
                    <tr
                      key={key}
                      className={isExpanded ? "is-expanded" : ""}
                      onClick={() => setExpanded(isExpanded ? null : key)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setExpanded(isExpanded ? null : key);
                        }
                      }}
                    >
                      <td>
                        <span className="table-validator">
                          <span className="validator-avatar">
                            {validator.Avatar ? (
                              <img src={validator.Avatar} alt="" />
                            ) : (
                              (validator.Name || "V").slice(0, 1)
                            )}
                          </span>
                          <span>
                            <b>{validator.Name || "Validator"}</b>
                            <small>
                              {validator.Address || "Address unavailable"}
                            </small>
                          </span>
                        </span>
                      </td>
                      <td>
                        <span className="status-pill">
                          <i /> Active
                        </span>
                      </td>
                      <td>
                        {validator.Commission
                          ? `${Number(validator.Commission) * 100}%`
                          : "—"}
                      </td>
                      <td>{validator.Max_Change || "—"}</td>
                      <td>{validator.Epoch || "—"}</td>
                      <td>
                        {validator.Website ? (
                          <span className="table-link">
                            Visit <ArrowUpRight size={13} />
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <button
                          className="expand-button"
                          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${validator.Name || "validator"}`}
                          aria-expanded={isExpanded}
                          onClick={(event) => {
                            event.stopPropagation();
                            setExpanded(isExpanded ? null : key);
                          }}
                        >
                          <ChevronDown size={17} />
                        </button>
                      </td>
                    </tr>
                  }
                  {isExpanded && (
                    <tr className="details-row" key={`${key}-details`}>
                      <td colSpan={7}>
                        <div className="validator-details">
                          <div className="validator-identity">
                            <div className="detail-avatar">
                              {validator.Avatar ? (
                                <img src={validator.Avatar} alt="" />
                              ) : (
                                (validator.Name || "V").slice(0, 1)
                              )}
                            </div>
                            <div>
                              <h3>{validator.Name || "Validator"}</h3>
                              <p>
                                {validator.Description ||
                                  "Namada network operator"}
                              </p>
                            </div>
                          </div>
                          <div className="detail-panels">
                            <div>
                              <h4>Contact</h4>
                              <p>
                                Email: <b>{validator.Email || "—"}</b>
                              </p>
                              <p>
                                Discord: <b>{validator.Discord || "—"}</b>
                              </p>
                              <p>
                                Website:{" "}
                                {validator.Website ? (
                                  <a
                                    href={validator.Website}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {validator.Website}
                                  </a>
                                ) : (
                                  <b>—</b>
                                )}
                              </p>
                            </div>
                            <div>
                              <h4>Staking details</h4>
                              <p>
                                Commission: <b>{validator.Commission || "—"}</b>
                              </p>
                              <p>
                                Max change: <b>{validator.Max_Change || "—"}</b>
                              </p>
                              <p>
                                Epoch: <b>{validator.Epoch || "—"}</b>
                              </p>
                            </div>
                          </div>
                          <div className="detail-address">
                            <h4>Address</h4>
                            <code>
                              {validator.Address || "Address unavailable"}
                            </code>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
        {!validators.length && (
          <p className="dashboard-loading">Loading validator data…</p>
        )}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("parameters");
  const [menuOpen, setMenuOpen] = useState(false);
  const tabs = [
    { id: "parameters", label: "Protocol Parameters" },
    { id: "proposals", label: "Governance Proposals" },
    { id: "validator", label: "Validator" },
    { id: "charts", label: "Charts" },
  ];
  return (
    <div className="dashboard-page">
      <header className="site-header dashboard-header">
        <a className="brand" href="/" aria-label="Back to Namada ZecHub home">
          <span className="brand-mark">
            <Shield size={19} fill="currentColor" />
          </span>
          <span>
            ZecHub <em>/</em> Namada
          </span>
        </a>
        <nav className={menuOpen ? "main-nav open" : "main-nav"} aria-label="Primary navigation">
          <a href="/" onClick={() => setMenuOpen(false)}>Learn</a>
          <a href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</a>
          <a href="/#participate" onClick={() => setMenuOpen(false)}>Participate</a>
          <a href="/#build" onClick={() => setMenuOpen(false)}>Build</a>
          <a href="https://zechub.wiki" target="_blank" rel="noreferrer">ZecHub <ArrowUpRight size={13} /></a>
        </nav>
        <div className="header-actions">
          <a className="text-link" href="https://bounties.zechub.wiki" target="_blank" rel="noreferrer">Bounties <ArrowUpRight size={15} /></a>
          <button className="menu-button" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>
      <main className="dashboard-main">
        <div className="dashboard-intro section-wrap">
          <span className="section-kicker">Namada network data</span>
          <h1>Dashboard</h1>
          <p>
            Supply, governance, protocol parameters, and validator snapshots for
            the Namada network.
          </p>
        </div>
        <div className="dashboard-view" data-view={activeTab}>
          <nav className="dashboard-tabs" aria-label="Dashboard sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={activeTab === tab.id ? "active" : ""}
                onClick={() => setActiveTab(tab.id)}
                aria-selected={activeTab === tab.id}
                role="tab"
              >
                {tab.label}
              </button>
            ))}
          </nav>
          {activeTab === "parameters" && <ProtocolParameters />}
          {activeTab === "proposals" && <PaginatedGovernanceProposals />}
          {activeTab === "charts" && <ChartsWorkspace />}
          <NetworkDashboard />
          <ValidatorTable />
        </div>
      </main>
    </div>
  );
}

export { PaginatedGovernanceProposals };
