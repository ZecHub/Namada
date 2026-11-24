// "use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../UI/shadcn/card";

import { RefObject, useRef, useState } from "react";

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
  showMetrics?: boolean;
  handleSaveToPng: (target: HTMLDivElement | null, label: string) => Promise<void>;
};

function NamadaChart(props: NamadaChartProps) {
  const [selectedTokenId, setSelectedTokenId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("total supply");
  const totalSupplyRef = useRef<HTMLDivElement | null>(null);
  const shieldedSupplyRef = useRef<HTMLDivElement | null>(null);
  const transparentSupplyRef = useRef<HTMLDivElement | null>(null);
  const rewardsRef = useRef<HTMLDivElement | null>(null);
  const proposalsRef = useRef<HTMLDivElement | null>(null);
  const chartRefs: Record<string, RefObject<HTMLDivElement | null>> = {
    "total supply": totalSupplyRef,
    "shielded supply": shieldedSupplyRef,
    "transparent supply": transparentSupplyRef,
    rewards: rewardsRef,
    proposals: proposalsRef,
  };
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
                      exportRef={totalSupplyRef}
                      selectedTokenId={selectedTokenId}
                      setSelectedTokenId={setSelectedTokenId}
                    />
                  </TabsContent>

                  <TabsContent value="shielded supply" activeTab={activeTab}>
                    <ShieldedTokenEcosystem
                      exportRef={shieldedSupplyRef}
                      selectedTokenId={selectedTokenId}
                      setSelectedTokenId={setSelectedTokenId}
                    />
                  </TabsContent>

                  <TabsContent value="transparent supply" activeTab={activeTab}>
                    <TransparentTokenEcosystem
                      exportRef={transparentSupplyRef}
                      selectedTokenId={selectedTokenId}
                      setSelectedTokenId={setSelectedTokenId}
                    />
                  </TabsContent>

                  <TabsContent value="rewards" activeTab={activeTab}>
                    <RewardChart exportRef={rewardsRef} />
                  </TabsContent>

                  <TabsContent value="proposals" activeTab={activeTab}>
                    <ProposalsChart exportRef={proposalsRef} />
                  </TabsContent>

                  <ChartFooter
                    imgLabel={selectedTokenId}
                    handleSaveToPng={(label: string) =>
                      props.handleSaveToPng(chartRefs[activeTab]?.current ?? null, label)
                    }
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
