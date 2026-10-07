import {
  Dispatch,
  RefObject,
  SetStateAction,
  useEffect,
  useState,
} from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../../UI/shadcn/card";

import { useResponsiveFontSize } from "../../hooks/useResponsiveFontSize";
import { DATA_URL } from "../../lib/chart/data-url";
import { getNamadaSupply } from "../../lib/chart/helpers";
import { FlattenedTokenData } from "../../lib/chart/types";
import { Spinner } from "flowbite-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../UI/shadcn/select";

import { NamadaAsset, NamadaRawData } from "../../lib/chart/types";

type TransparentTokenEcosystemProps = {
  divChartRef: RefObject<HTMLDivElement | null>;
  selectedTokenId: string;
  setSelectedTokenId: Dispatch<SetStateAction<string>>;
};

export default function TransparentTokenEcosystem(
  props: TransparentTokenEcosystemProps
) {
  const [rawData, setRawData] = useState<NamadaRawData[]>([]);
  const [tokenIds, setTokenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fontSize = useResponsiveFontSize();

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      setLoading(true);
      try {
        const data = await getNamadaSupply(
          DATA_URL.namadaSupplyUrl,
          controller.signal
        );
        setRawData(data || []);

        const firstEntry = data?.[100]?.Total_Supply || [];
        setTokenIds(firstEntry.map((t: NamadaAsset) => t.id));
      } catch (err) {
        console.error("Failed to fetch namada data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, []);

  const flattenedData: FlattenedTokenData[] = rawData.map((entry) => {
    const row: FlattenedTokenData = { Date: entry.Date };
    entry.Total_Supply.forEach((token) => {
      const value = parseFloat(token.transparentSupply || "0");
      token.id === "Namada"
        ? (row[token.id] = value)
        : (row[token.id] = value / 1000000);
    });
    return row;
  });

  // Filter out Namada from the "all" view
  const chartData =
    props.selectedTokenId === "all"
      ? flattenedData.map((d) => {
          const filtered = { ...d };
          delete filtered["Namada"]; // Remove Namada from "all" view
          return filtered;
        })
      : flattenedData.map((d) => ({
          Date: d.Date,
          [props.selectedTokenId]: d[props.selectedTokenId],
        }));

  // Filter out Namada from activeTokenIds when showing "all"
  const activeTokenIds =
    props.selectedTokenId === "all"
      ? tokenIds.filter((id) => id !== "Namada")
      : [props.selectedTokenId];

  return (
    <Card
      ref={props.divChartRef}
      className="shadow-sm border border-gray-200 dark:border-slate-700"
    >
      <CardHeader className="flex flex-col items-start gap-4 mb-12 lg:flex-row lg:items-center lg:gap-6">
        <CardTitle className="w-full min-w-0 text-xl lg:flex-1">
          {props.selectedTokenId === "all"
            ? "Namada Tokens Transparent Supply Overview (Excluding Namada)"
            : props.selectedTokenId + " Transparent Supply Chart"}
        </CardTitle>
        <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center lg:w-auto">
          <label className="text-sm font-medium">Filter by Token</label>
          <Select
            value={props.selectedTokenId}
            onValueChange={props.setSelectedTokenId}
          >
            <SelectTrigger className="w-full border dark:border-slate-700 sm:w-48">
              <SelectValue placeholder="All Tokens" />
            </SelectTrigger>
            <SelectContent className="source-chart-select-content border dark:border-slate-700">
              <SelectItem
                className="hover:cursor-pointer bg-slate-50 dark:bg-slate-800 text-background"
                value="all"
              >
                All Tokens (Excluding Namada)
              </SelectItem>
              {tokenIds.map((token) => (
                <SelectItem
                  key={token}
                  value={token}
                  className="hover:cursor-pointer bg-slate-50 dark:bg-slate-800"
                >
                  {token}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-2 imd:px-6">
        <div className="relative">
          <ResponsiveContainer width="100%" height={420}>
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Spinner />
              </div>
            ) : (
              <AreaChart data={chartData}>
                <defs>
                  {activeTokenIds.map((id, index) => (
                    <linearGradient
                      key={id}
                      id={`${id}-gradient`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={`hsl(var(--chart-${(index % 6) + 1}))`}
                        stopOpacity={0.6}
                      />
                      <stop
                        offset="95%"
                        stopColor={`hsl(var(--chart-${(index % 6) + 1}))`}
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  ))}
                </defs>

                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis dataKey="Date" tick={{ fontSize, fill: "#94a3b8" }} />
                <YAxis
                  tick={{ fontSize, fill: "#94a3b8" }}
                  tickFormatter={(value: number) => {
                    // Use billions format for Namada
                    if (props.selectedTokenId === "Namada") {
                      return `${(value / 1e9).toFixed(1)}B`;
                    }

                    // Adaptive formatting for other tokens
                    if (value >= 1000000) {
                      return `${(value / 1e6).toFixed(1)}M`;
                    } else if (value >= 1000) {
                      return `${(value / 1e3).toFixed(0)}k`;
                    } else if (value >= 1) {
                      return `${value.toFixed(0)}`;
                    } else if (value >= 0.1) {
                      return `${value.toFixed(1)}`;
                    } else if (value >= 0.01) {
                      return `${value.toFixed(2)}`;
                    } else if (value > 0) {
                      return `${value.toFixed(3)}`;
                    }
                    return "0";
                  }}
                />
                <Tooltip
                  wrapperStyle={{
                    backgroundColor: "hsl(var(--chart-1)",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  content={() => (
                    <div className="pt-5 flex justify-center gap-6 text-sm mt-2 text-slate-600 dark:text-slate-300 flex-row flex-wrap">
                      {activeTokenIds.map((id, index) => (
                        <div key={id} className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 inline-block rounded-sm"
                            style={{
                              background: `hsl(var(--chart-${
                                (index % 6) + 1
                              }))`,
                            }}
                          />
                          <p>{id}</p>
                        </div>
                      ))}
                    </div>
                  )}
                />
                {activeTokenIds.map((id, index) => (
                  <Area
                    key={id}
                    type="monotone"
                    dataKey={id}
                    stroke={`hsl(var(--chart-${(index % 6) + 1}))`}
                    fill={`url(#${id}-gradient)`}
                    name={id}
                    strokeWidth={2}
                    animationDuration={600}
                  />
                ))}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
