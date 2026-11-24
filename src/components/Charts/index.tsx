import { Button } from "../UI/shadcn/button";
import { useEffect, useState } from "react";

import "./index.css";

import useExportDashboardAsPNG from "../hooks/useExportDashboardAsPNG";
import { DATA_URL } from "../lib/chart/data-url";
import { getLastUpdatedDate } from "../lib/chart/helpers";
import NamadaChart from "./Namada/NamadaChart";

const Dashboard = () => {
  const [selectedCrypto, setSelectedCrypto] = useState("namada");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { handleSaveToPng } = useExportDashboardAsPNG();

  useEffect(() => {
    const controller = new AbortController();

    const fetchAllData = async () => {
      try {
        const [lastUpdated] = await Promise.all([
          getLastUpdatedDate(DATA_URL.shieldedUrl, controller.signal),
        ]);

        if (lastUpdated) {
          setLastUpdated(new Date(lastUpdated));
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchAllData();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className="min-h-screen p-1 imd:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="mt-12">
            <h1 className="text-3xl font-bold">Namada ZecHub Dashboard</h1>
            <p className="text-muted-foreground">
              Analyze Namada network metrics and trends
            </p>
          </div>

          {/* Crypto Selector */}
          <div className="flex gap-2">
            <Button
              className="bg-yellow-300/75 text-white"
              variant={selectedCrypto === "namada" ? "default" : "outline"}
              onClick={() => setSelectedCrypto("namada")}
            >
              Namada
            </Button>
          </div>
        </div>

        {/* Namada Dashboard */}
        {selectedCrypto === "namada" && (
          <NamadaChart
            lastUpdated={lastUpdated!}
            handleSaveToPng={handleSaveToPng}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
