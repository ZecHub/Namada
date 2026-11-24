import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { getTabValueForKey } from "../../lib/tab-navigation";
import "./Tabs.css";

type TabsProps = {
  children: (props: {
    activeTab: string;
    setActiveTab: (value: string) => void;
    idPrefix: string;
  }) => ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
};

export const Tabs = ({
  children,
  defaultValue,
  value,
  onValueChange,
}: TabsProps) => {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? value ?? "");
  const activeTab = value ?? uncontrolledValue;
  const idPrefix = `chart-tabs-${useId().replace(/:/g, "")}`;

  const handleTabChange = (newValue: string) => {
    if (value === undefined) setUncontrolledValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <div className="tabs-container">
      {children({ activeTab, setActiveTab: handleTabChange, idPrefix })}
    </div>
  );
};

export const TabsList = ({
  children,
  idPrefix,
  label,
}: {
  children: ReactNode;
  idPrefix: string;
  label: string;
}) => (
  <div
    id={`${idPrefix}-list`}
    role="tablist"
    aria-label={label}
    aria-orientation="horizontal"
    className="chart-tabs-list flex space-x-1 rounded-lg bg-muted bg-slate-100 p-1 mb-4 overflow-x-auto"
  >
    {children}
  </div>
);

export const TabsTrigger = ({
  value,
  children,
  activeTab,
  setActiveTab,
  idPrefix,
  tabValues,
}: {
  value: string;
  children: ReactNode;
  activeTab: string;
  setActiveTab: (value: string) => void;
  idPrefix: string;
  tabValues: string[];
}) => {
  const selected = activeTab === value;
  const tabId = `${idPrefix}-tab-${value.replace(/[^a-z0-9_-]/gi, "-")}`;
  const panelId = `${idPrefix}-panel-${value.replace(/[^a-z0-9_-]/gi, "-")}`;
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const nextValue = getTabValueForKey(value, tabValues, event.key);
    if (!nextValue) return;
    event.preventDefault();
    setActiveTab(nextValue);
    const nextTabId = `${idPrefix}-tab-${nextValue.replace(/[^a-z0-9_-]/gi, "-")}`;
    document.getElementById(nextTabId)?.focus();
  };

  return (
    <button
      id={tabId}
      type="button"
      role="tab"
      aria-selected={selected}
      aria-controls={panelId}
      tabIndex={selected ? 0 : -1}
      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        selected
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-slate-600"
      }`}
      onClick={() => setActiveTab(value)}
      onKeyDown={onKeyDown}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({
  value,
  children,
  activeTab,
  idPrefix,
}: {
  value: string;
  children: ReactNode;
  activeTab: string;
  idPrefix: string;
}) => {
  const safeValue = value.replace(/[^a-z0-9_-]/gi, "-");
  return (
    <div
      id={`${idPrefix}-panel-${safeValue}`}
      role="tabpanel"
      aria-labelledby={`${idPrefix}-tab-${safeValue}`}
      tabIndex={0}
      hidden={activeTab !== value}
      className={activeTab === value ? "block" : "hidden"}
    >
      {children}
    </div>
  );
};
