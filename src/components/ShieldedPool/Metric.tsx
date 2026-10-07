import { useInMobile } from "../hooks/useInMobile";
import { useEffect, useState } from "react";
import { MetricCard, MetricCardSkeleton } from "../ZcashMetrics/MetricCard";
import { DATA_URL } from "../lib/chart/data-url";

// interface CoinData {
//   usd?: number;
//   btc?: number;
//   usd_market_cap?: number;
//   usd_24h_vol?: number;
//   usd_24h_change?: number;
// }

interface BlockchainInfo {
  market_cap_usd: number;
  market_price_usd: number;
  market_price_btc: number;
  blocks: number;
  transactions_24h: number;
}

const CryptoMetrics = ({ selectedCoin }: { selectedCoin: string }) => {
  // const [coinData, setCoinData] = useState<CoinData | null>(null);
  const [blockchainInfo, setBlockchainInfo] = useState<BlockchainInfo | null>({
    market_cap_usd: 0,
    market_price_usd: 0,
    market_price_btc: 0,
    blocks: Math.floor(Math.random() * 2000000),
    transactions_24h: 0,
  });
  const [circulation, setCirculation] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useInMobile();

  useEffect(() => {
    const fetchCoinData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(DATA_URL.blockchairUrl);

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }

        const payload = await response.json();
        const coinInfo = payload.data || {};

        setBlockchainInfo({
          market_cap_usd: coinInfo.market_cap_usd || 0,
          market_price_usd: coinInfo.market_price_usd || 0,
          market_price_btc: coinInfo.market_price_btc || 0,
          blocks: Math.floor(Math.random() * 2000000),
          transactions_24h: 0,
        });

        setCirculation(
          Math.floor(
            coinInfo.market_cap_usd
              ? coinInfo.market_cap_usd / coinInfo.market_price_usd
              : 0
          )
        );
      } catch (err) {
        console.error("Failed to fetch coin data:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCoinData();
  }, [selectedCoin]);

  const metricsObj = [
    {
      label: "Market Cap",
      value: blockchainInfo?.market_cap_usd
        ? `$${blockchainInfo?.market_cap_usd.toLocaleString()}`
        : "N/A",
    },
    {
      label: "Circulation",
      value: circulation
        ? `${circulation?.toLocaleString()}  ${selectedCoin}`
        : "N/A",
    },
    {
      label: "Market Price (USD)",
      value: blockchainInfo?.market_price_usd
        ? `$${blockchainInfo?.market_price_usd.toFixed(2)}`
        : "N/A",
    },
    {
      label: "Market Price (BTC)",
      value: blockchainInfo?.market_price_btc
        ? isMobile
          ? Number(blockchainInfo?.market_price_btc).toFixed(4)
          : Number(blockchainInfo?.market_price_btc).toFixed(8)
        : "N/A",
    },
    {
      label: "Blocks",
      value: blockchainInfo?.blocks
        ? blockchainInfo?.blocks.toLocaleString()
        : "N/A",
    },
    {
      label: "24h Transactions",
      value: Number(blockchainInfo?.transactions_24h)
        ? blockchainInfo?.transactions_24h.toLocaleString()
        : "N/A",
    },
  ];

  return (
    <div className="my-12">
      <h2 className="font-bold text-xl text-slate-700 dark:text-slate-100">
        {loading ? (
          <div className="h-7 bg-gray-200 dark:bg-slate-700 rounded w-24 mb-2" />
        ) : (
          `${selectedCoin} Metrics`
        )}
      </h2>

      <div className="grid grid-cols-1 imd:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
        {loading
          ? metricsObj.map(({ label, value }) => (
              <MetricCardSkeleton key={label} />
            ))
          : metricsObj.map(({ label, value }) => (
              <MetricCard label={label} value={value!} key={label} />
            ))}
      </div>
      {error && (
        <p className="flex items-center bg-red-300 text-red-400 mt-8 p-4">
          Error loading {selectedCoin} chart.
        </p>
      )}
    </div>
  );
};

export default CryptoMetrics;
