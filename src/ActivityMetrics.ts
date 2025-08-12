// Calculate seconds per km from meters per second
export function paceFromSpeedMS(speedMS: number): number | null {
  if (!speedMS || speedMS <= 0 || !Number.isFinite(speedMS)) return null;
  return 1000 / speedMS; // seconds per km
}

// Calculate seconds per mile from meters per second
export function paceFromSpeedMS_mile(speedMS: number): number | null {
  if (!speedMS || speedMS <= 0 || !Number.isFinite(speedMS)) return null;
  return 1609.344 / speedMS; // seconds per mile
}

// Format pace as mm:ss
export function formatPace(secondsPerUnit: number | null): string | null {
  if (secondsPerUnit == null || !Number.isFinite(secondsPerUnit)) return null;
  const total = Math.round(secondsPerUnit);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
