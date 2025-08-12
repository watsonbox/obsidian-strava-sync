import { parse } from "csv-parse/browser/esm/sync";
import type { Activity } from "./Activity";
import {
  formatPace,
  formatSecondsToHMS,
  paceFromSpeedMS,
  paceFromSpeedMS_mile,
} from "./ActivityMetrics";

const TIME_ZONE = "UTC";

const REQUIRED_COLUMNS = [
  "Activity ID",
  "Activity Date",
  "Activity Name",
  "Activity Type",
  "Activity Description",
  "Activity Private Note",
  "Elapsed Time",
  "Moving Time",
  "Distance",
  "Max Heart Rate",
  "Max Speed",
  "Average Speed",
  "Elevation Gain",
  "Elevation Low",
  "Elevation High",
  "Calories",
  "Activity Gear",
];

export class CSVImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CSVImportError";
  }
}

export class ActivitiesCSVImporter {
  fileContents: string;

  constructor(fileContents: string) {
    this.fileContents = fileContents;
  }

  async import(): Promise<Activity[]> {
    let records: Record<string, string>[];

    try {
      records = parse(this.fileContents, {
        columns: true,
        skip_empty_lines: true,
      });
    } catch (error) {
      throw new CSVImportError(`Failed to parse CSV: ${error.message}`);
    }

    if (records.length === 0) {
      throw new CSVImportError(
        "The CSV file is empty or contains no valid data.",
      );
    }

    const missingColumns = REQUIRED_COLUMNS.filter(
      (col) => !(col in records[0]),
    );
    if (missingColumns.length > 0) {
      throw new CSVImportError(
        `Missing required column(s): ${missingColumns.join(", ")}`,
      );
    }

    return records.map((record: any): Activity => {
      const startDateTimestamp = Date.parse(
        `${record["Activity Date"]} ${TIME_ZONE}`,
      );

      if (Number.isNaN(startDateTimestamp)) {
        throw new CSVImportError(
          `Invalid date: ${record["Activity Date"]} ${TIME_ZONE}`,
        );
      }

      return {
        id: Number.parseInt(record["Activity ID"]),
        start_date: new Date(startDateTimestamp),
        name: record["Activity Name"],
        sport_type: record["Activity Type"],
        description: record["Activity Description"],
        private_note: record["Activity Private Note"],
        elapsed_time: Number.parseFloat(record["Elapsed Time"]), // s
        moving_time: Number.parseFloat(record["Moving Time"]), // s
        distance: Number.parseFloat(record["Distance"]), // m
        distance_km: Number(
          (Number.parseFloat(record["Distance"]) / 1000).toFixed(2),
        ),
        distance_mile: Number(
          (Number.parseFloat(record["Distance"]) / 1609.344).toFixed(2),
        ),
        max_heart_rate: Number.parseFloat(record["Max Heart Rate"]), // bpm
        max_speed: Number(Number.parseFloat(record["Max Speed"]).toFixed(3)), // m/s (not kph)
        average_speed: Number(
          Number.parseFloat(record["Average Speed"]).toFixed(3),
        ), // m/s (not kph)
        total_elevation_gain: Number.parseFloat(record["Elevation Gain"]), // m
        elev_low: Number.parseFloat(record["Elevation Low"]), // m
        elev_high: Number.parseFloat(record["Elevation High"]), // m
        calories: Number.parseFloat(record["Calories"]),
        gear_name: record["Activity Gear"],
        pace: formatPace(
          paceFromSpeedMS(Number.parseFloat(record["Average Speed"])),
        ), // min/km
        pace_mile: formatPace(
          paceFromSpeedMS_mile(Number.parseFloat(record["Average Speed"])),
        ), // min/mile
      };
    });
  }
}
