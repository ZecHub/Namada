import { useEffect, useMemo, useState } from "react";
import { DATA_URL } from "./lib/chart/data-url";

type ParticipationPoint = { index: number; id: number; count: number };
type RawPoint = Record<string, unknown>;
type RawValue = RawPoint | number | string;

function numericValue(row: RawValue, keys: string[]) {
  if (typeof row === "number" || typeof row === "string") {
    const number = Number(String(row).replace(/,/g, ""));
    return Number.isFinite(number) ? number : 0;
  }
  for (const key of keys) {
    const value = row[key];
    const number =
      typeof value === "string"
        ? Number(value.replace(/,/g, ""))
        : Number(value);
    if (Number.isFinite(number)) return number;
  }
  const match = Object.entries(row).find(
    ([key, value]) =>
      /address|voter|particip|count|total/i.test(key) &&
      (typeof value === "number" || typeof value === "string"),
  );
  const number = match
    ? Number(String(match[1]).replace(/,/g, ""))
    : Number.NaN;
  return Number.isFinite(number) ? number : 0;
}

export default function ProposalParticipationChart() {
  const [points, setPoints] = useState<ParticipationPoint[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"10" | "20" | "all">("all");

  useEffect(() => {
    const loadParticipation = () => {
      setLoaded(false);
      setError(null);
      fetch(DATA_URL.propAddressesCounts)
        .then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
        .then((payload: RawValue[] | { data?: RawValue[] }) => {
          const rows = Array.isArray(payload) ? payload : payload.data || [];
          setPoints(rows.map((row, index) => ({
            index: index + 1,
            id: typeof row === "object" ? Number(row.proposalId ?? row.id ?? row.proposalIndex ?? index + 1) : index + 1,
            count: numericValue(row, ["addresses", "addressCount", "addressesCount", "address_count", "numberOfAddresses", "voters", "voterCount", "participation", "count"]),
          })).filter((row) => Number.isFinite(row.id) && Number.isFinite(row.count)));
        })
        .catch((reason: unknown) => {
          setPoints([]);
          setError(reason instanceof Error ? reason.message : "Unable to load voting data");
        })
        .finally(() => setLoaded(true));
    };
    loadParticipation();
    const interval = window.setInterval(loadParticipation, 300000);
    return () => window.clearInterval(interval);
  }, []);

  const filteredPoints =
    timeRange === "all" ? points : points.slice(0, Number(timeRange));
  const max = Math.max(...filteredPoints.map((point) => point.count), 1);
  const average = points.length
    ? Math.round(
        points.reduce((total, point) => total + point.count, 0) / points.length,
      )
    : 0;
  const highest = points.reduce<ParticipationPoint | null>(
    (best, point) => (!best || point.count > best.count ? point : best),
    null,
  );
  const ticks = useMemo(
    () => [
      max,
      Math.round(max * 0.75),
      Math.round(max * 0.5),
      Math.round(max * 0.25),
      0,
    ],
    [max],
  );

  return (
    <section className="participation-chart">
      <div className="participation-heading">
        <div>
          <span className="metric-label">Governance proposals</span>
          <h3>Proposal voting participation</h3>
        </div>
        <div className="participation-controls">
          <label htmlFor="proposal-range">Show:</label>
          <select
            id="proposal-range"
            value={timeRange}
            onChange={(event) =>
              setTimeRange(event.target.value as "10" | "20" | "all")
            }
          >
            <option value="all">All proposals ({points.length})</option>
            <option value="10">First 10 proposals</option>
            <option value="20">First 20 proposals</option>
          </select>
        </div>
      </div>
      {!loaded ? (
        <div className="participation-empty">
          Loading proposal participation…
        </div>
      ) : error ? (
        <div className="participation-empty participation-error">
          <span>Error loading vote data: {error}</span>
          <button type="button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      ) : filteredPoints.length ? (
        <>
          <div className="axis-chart">
            <div className="y-axis">
              {ticks.map((tick) => (
                <span key={tick}>{tick.toLocaleString()}</span>
              ))}
            </div>
            <div className="plot-area">
              <div className="grid-lines">
                {ticks.map((tick) => (
                  <i key={tick} />
                ))}
              </div>
              <div className="participation-bars">
                {filteredPoints.map((point) => (
                  <div className="participation-bar-column" key={point.index}>
                    <div
                      className="participation-bar"
                      style={{
                        height: `${Math.max(2, (point.count / max) * 100)}%`,
                      }}
                      title={`Index ${point.index} · Proposal ${point.id}: ${point.count.toLocaleString()} addresses`}
                    />
                    <small>#{point.index}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="axis-labels">
            <span>Proposal index</span>
            <span>Number of addresses</span>
          </div>
          <div className="participation-stats">
            <div>
              <span>Total proposals</span>
              <b>{points.length}</b>
            </div>
            <div>
              <span>Average participation</span>
              <b>{average.toLocaleString()} addresses</b>
            </div>
            <div>
              <span>Highest participation</span>
              <b>{highest?.count.toLocaleString() || "—"}</b>
              <small>
                {highest
                  ? `Index ${highest.index} · Proposal ${highest.id}`
                  : ""}
              </small>
            </div>
          </div>
        </>
      ) : (
        <div className="participation-empty">
          No participation data found in the Namada proposal participation feed.
        </div>
      )}
    </section>
  );
}
