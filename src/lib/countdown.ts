export interface TimeRemaining {
  days: number;
  hours: number;
  mins: number;
  secs: number;
  isExpired: boolean;
}

export function getTimeRemaining(
  target: Date | string | number,
  now: Date = new Date()
): TimeRemaining {
  const targetTime = new Date(target).getTime();
  const currentTime = now.getTime();
  const difference = targetTime - currentTime;

  if (isNaN(difference) || difference <= 0) {
    return { days: 0, hours: 0, mins: 0, secs: 0, isExpired: true };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((difference / 1000 / 60) % 60);
  const secs = Math.floor((difference / 1000) % 60);

  return { days, hours, mins, secs, isExpired: false };
}

export function calculateEpochTarget(
  epochDurationSeconds: number,
  currentTimeMs: number = Date.now()
): Date {
  const durationMs = (epochDurationSeconds > 0 ? epochDurationSeconds : 21600) * 1000;
  const nextEpochMs = Math.ceil(currentTimeMs / durationMs) * durationMs;
  return new Date(nextEpochMs);
}
