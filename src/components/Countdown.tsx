import { useEffect, useState } from "react";
import { DATA_URL } from "./lib/chart/data-url";
import {
  calculateEpochTarget,
  getTimeRemaining,
  type TimeRemaining,
} from "../lib/countdown";

export interface CountdownProps {
  targetDate?: Date | string | number;
  label?: string;
  expiredLabel?: string;
  className?: string;
}

const TimeBox = ({ value, label }: { value: string; label: string }) => (
  <div className="glass-container w-[70px] h-[90px] sm:w-[90px] sm:h-[100px] md:w-[122px] md:h-[117px] flex flex-col items-center justify-center rounded-md text-white">
    <span className="text-[20px] sm:text-[35px] lg:text-[48px] leading-10 font-mono font-[700]">
      {value}
    </span>
    <span className="lg:text-[20px] font-space capitalize">{label}</span>
  </div>
);

export default function Countdown({
  targetDate,
  label,
  expiredLabel = "Milestone elapsed",
  className = "flex flex-col items-center mt-14",
}: CountdownProps) {
  const [resolvedTarget, setResolvedTarget] = useState<Date | null>(() => {
    if (targetDate) {
      const parsed = new Date(targetDate);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  });

  const [timeLeft, setTimeLeft] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    mins: 0,
    secs: 0,
    isExpired: false,
  });

  // if targetDate is not provided via prop, fetch protocol_parameters to determine epoch milestone
  useEffect(() => {
    if (targetDate) {
      const parsed = new Date(targetDate);
      setResolvedTarget(isNaN(parsed.getTime()) ? null : parsed);
      return;
    }

    let isMounted = true;
    fetch(DATA_URL.protocol_parametersUrl)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const protocolParams = data?.[0]?.Protocol_Parameters?.[0];
        const minEpochDuration = protocolParams?.Min_epoch_duration; // e.g. "21600 seconds"
        const epochSeconds = minEpochDuration
          ? parseInt(minEpochDuration, 10)
          : 21600;
        setResolvedTarget(calculateEpochTarget(epochSeconds));
      })
      .catch(() => {
        if (!isMounted) return;
        // Default 6-hour epoch fallback if fetch fails
        setResolvedTarget(calculateEpochTarget(21600));
      });

    return () => {
      isMounted = false;
    };
  }, [targetDate]);

  useEffect(() => {
    if (!resolvedTarget) return;

    const updateCountdown = () => {
      setTimeLeft(getTimeRemaining(resolvedTarget));
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [resolvedTarget]);

  return (
    <div className={className}>
      {label && (
        <span className="mb-3 text-sm text-gray-400 font-mono uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className="flex space-x-4">
        <TimeBox
          value={timeLeft.days.toString().padStart(2, "0")}
          label="days"
        />
        <TimeBox
          value={timeLeft.hours.toString().padStart(2, "0")}
          label="hours"
        />
        <TimeBox
          value={timeLeft.mins.toString().padStart(2, "0")}
          label="mins"
        />
        <TimeBox
          value={timeLeft.secs.toString().padStart(2, "0")}
          label="secs"
        />
      </div>
      {timeLeft.isExpired && (
        <div className="mt-4 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-amber-300 font-mono">
          {expiredLabel}
        </div>
      )}
    </div>
  );
}
