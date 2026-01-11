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

// Convert seconds to HH:mm:ss
export function formatSecondsToHMS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}
