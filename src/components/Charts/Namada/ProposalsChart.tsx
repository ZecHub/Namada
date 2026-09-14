import React, { RefObject, useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { DATA_URL } from "../../lib/chart/data-url";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ProposalsChartProps {
  divChartRef?: RefObject<HTMLDivElement | null>;
}

const ProposalsChart = (props: ProposalsChartProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState<number[]>([]);
  const [timeRange, setTimeRange] = useState<"10" | "20" | "all">("all");

  useEffect(() => {
    const fetchVoteCounts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Replace with your actual DATA_URL.propAddressesCounts
        const response = await fetch(DATA_URL.propAddressesCounts);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: number[] = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid data format");
        }

        setVoteCounts(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load vote data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVoteCounts();

    // Optional: Set up polling for live data
    const interval = setInterval(fetchVoteCounts, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Filter data based on time range
  const filteredData = (() => {
    if (timeRange === "all") return voteCounts;
    const count = timeRange === "10" ? 10 : 20;
    return voteCounts.slice(0, count);
  })();

  // Process data for chart
  const chartData = {
    labels: filteredData.map((_, index) => `#${index + 1}`),
    datasets: [
      {
        label: "Number of Addresses Voted",
        data: filteredData,
        backgroundColor: filteredData.map((value, index) => {
          const hue = (index * 360) / filteredData.length;
          return `hsla(${hue}, 70%, 60%, 0.8)`;
        }),
        borderColor: filteredData.map((value, index) => {
          const hue = (index * 360) / filteredData.length;
          return `hsla(${hue}, 70%, 50%, 1)`;
        }),
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: filteredData.map((value, index) => {
          const hue = (index * 360) / filteredData.length;
          return `hsla(${hue}, 70%, 70%, 0.9)`;
        }),
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Proposal Index",
          font: {
            size: 14,
            weight: "bold",
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        title: {
          display: true,
          text: "Number of Addresses",
          font: {
            size: 14,
            weight: "bold",
          },
        },
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: "Voting Participation by Proposal",
        font: {
          size: 18,
          weight: "bold",
        },
        padding: 20,
      },
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function (context: any) {
            return `Addresses: ${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
        <p>Error loading vote data:</p>
        <p className="font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (voteCounts.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-yellow-700">
        No vote data available
      </div>
    );
  }

  console.log("Vote Counts:", voteCounts);
  const totalProposals = voteCounts.length;
  const totalAddresses = voteCounts.reduce((sum, count) => sum + count, 0);
  const avgAddresses = (totalAddresses / totalProposals).toFixed(0);
  const maxVotes = Math.max(...voteCounts);
  const maxProposal = voteCounts.indexOf(maxVotes) + 1;

  return (
    <div
      ref={props.divChartRef}
      className="bg-white dark:bg-slate-900 px-4 py-6 md:px-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700"
      style={{ width: "100%" }}
    >
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <h2 className="flex-1 text-xl font-semibold">
          Proposal Voting Participation
        </h2>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Show:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="w-48 border dark:border-slate-700 rounded px-3 py-2 bg-white dark:bg-slate-800"
          >
            <option value="all">All Proposals ({totalProposals})</option>
            <option value="10">First 10 Proposals</option>
            <option value="20">First 20 Proposals</option>
          </select>
        </div>
      </div>

      <div className="w-full" style={{ height: "480px", position: "relative" }}>
        <Bar data={chartData} options={options} />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300">
            Total Proposals
          </h3>
          <p className="text-2xl font-bold dark:text-white">{totalProposals}</p>
        </div>
        <div className="bg-green-50 dark:bg-slate-800 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 dark:text-green-300">
            Average Participation
          </h3>
          <p className="text-2xl font-bold dark:text-white">
            {avgAddresses} addresses
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-slate-800 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800 dark:text-purple-300">
            Highest Participation
          </h3>
          <p className="text-2xl font-bold dark:text-white">
            {maxVotes.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Proposal {maxProposal}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProposalsChart;
