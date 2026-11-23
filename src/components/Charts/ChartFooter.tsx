import { useEffect, useState } from "react";
import { ExportButton } from "./ExportButton";
import SupplyDataLastUpdated from "./LastUpdated";
import { commitUrlForChartTab, latestCommitDate } from "../../lib/chart-freshness";

type ChartFooterProps = {
  lastUpdatedDate: string;
  handleSaveToPng: any;
  imgLabel: string;
};

const ChartFooter = (props: ChartFooterProps) => {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  useEffect(() => {
    // Never show the previous tab's date while this tab's date loads.
    setLastUpdated(null);
    const url = commitUrlForChartTab(props.lastUpdatedDate);
    if (!url) return;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => setLastUpdated(latestCommitDate(body)))
      .catch(() => {
        if (!controller.signal.aborted) setLastUpdated(null);
      });
    return () => controller.abort();
  }, [props.lastUpdatedDate]);
  return (
    <div
      className="flex items-baseline"
      style={{
        display: "flex",
        justifyContent: lastUpdated ? "space-between" : "flex-end",
        marginTop: 48,
      }}
    >
      {lastUpdated && <SupplyDataLastUpdated lastUpdated={lastUpdated} />}

      <ExportButton
        handleSaveToPng={props.handleSaveToPng}
        imgLabel={props.imgLabel}
      />
    </div>
  );
};

export default ChartFooter;
