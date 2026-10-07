// "use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../UI/shadcn/card";

import { RefObject, useState } from "react";

import { ErrorBoundary } from "../../ErrorBoundary/ErrorBoundary";
import CryptoMetrics from "../../ShieldedPool/Metric";
import ChartFooter from "../ChartFooter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../Tabs";
import RewardChart from "./RewardsChart";
import TokenEcosystem from "./TokenEcosystem";
import ShieldedTokenEcosystem from "./ShieldedTokenEcosystem";
import TransparentTokenEcosystem from "./TransparentTokenEcosystem";
import ProposalsChart from "./ProposalsChart";

type NamadaChartProps = {
  lastUpdated: Date;
  divChartRef: RefObject<HTMLDivElement | null>;
  showMetrics?: boolean;
  handleSaveToPng: (
    poolType: string,
    poolData: Record<
      string,
      {
        timestamp: string;
        supply: number;
      } | null
    >,
    toolType: string
  ) => Promise<void>;
};

function NamadaChart(props: NamadaChartProps) {
  const [selectedTokenId, setSelectedTokenId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("total supply");
  const tabLabels = [
    "Total Supply",
    "Shielded Supply",
    "Transparent Supply",
    "Rewards",
    "Proposals",
  ];

  return (
    <ErrorBoundary fallback="Failed to render Namada Chart">
      <div className="space-y-6">
        {props.showMetrics !== false && (
          <CryptoMetrics
            selectedCoin={selectedTokenId === "all" ? "Namada" : selectedTokenId}
          />
        )}

        <Card className="shadow-sm border mt-8 border-gray-200 dark:border-slate-700">
          <CardHeader className="mb-4">
            <CardTitle className="text-xl">Analytics Charts</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {({ activeTab, setActiveTab }: any) => (
                <>
                  <TabsList>
                    {tabLabels.map((label) => (
                      <TabsTrigger
                        key={label}
                        value={label.toLowerCase()}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                      >
                        {label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="total supply" activeTab={activeTab}>
                    <TokenEcosystem
                      divChartRef={props.divChartRef}
                      selectedTokenId={selectedTokenId}
                      setSelectedTokenId={setSelectedTokenId}
                    />
                  </TabsContent>

                  <TabsContent value="shielded supply" activeTab={activeTab}>
                    <ShieldedTokenEcosystem
                      divChartRef={props.divChartRef}
                      selectedTokenId={selectedTokenId}
                      setSelectedTokenId={setSelectedTokenId}
                    />
                  </TabsContent>

                  <TabsContent value="transparent supply" activeTab={activeTab}>
                    <TransparentTokenEcosystem
                      divChartRef={props.divChartRef}
                      selectedTokenId={selectedTokenId}
                      setSelectedTokenId={setSelectedTokenId}
                    />
                  </TabsContent>

                  <TabsContent value="rewards" activeTab={activeTab}>
                    <RewardChart divChartRef={props.divChartRef} />
                  </TabsContent>

                  <TabsContent value="proposals" activeTab={activeTab}>
                    <ProposalsChart divChartRef={props.divChartRef} />
                  </TabsContent>

                  <ChartFooter
                    imgLabel={selectedTokenId}
                    handleSaveToPng={props.handleSaveToPng}
                    lastUpdatedDate={activeTab}
                  />
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}

export default NamadaChart;
