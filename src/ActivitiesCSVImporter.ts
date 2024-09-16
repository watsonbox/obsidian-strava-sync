import { parse } from "csv-parse/sync";
import { Activity } from "./Activity";

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
  "Calories"
];

export class CSVImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CSVImportError";
  }
}

export class AcitivitiesCSVImporter {
  fileContents: string;

  constructor(fileContents: string) {
    this.fileContents = fileContents;
  }

  async import(): Promise<Activity[]> {
    let records: Record<string, string>[];

    try {
      records = parse(this.fileContents, {
        columns: true,
        skip_empty_lines: true
      });
    } catch (error) {
      throw new CSVImportError(`Failed to parse CSV: ${error.message}`);
    }

    if (records.length === 0) {
      throw new CSVImportError("The CSV file is empty or contains no valid data.");
    }

    const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in records[0]));
    if (missingColumns.length > 0) {
      throw new CSVImportError(`Missing required column(s): ${missingColumns.join(", ")}`);
    }

    return records.map((record: any): Activity => {
      const startDateTimestamp = Date.parse(record["Activity Date"] + ` ${TIME_ZONE}`);

      if (isNaN(startDateTimestamp)) {
        throw new CSVImportError(`Invalid date: ${record["Activity Date"] + ` ${TIME_ZONE}`}`);
      }

      return {
        id: parseInt(record["Activity ID"]),
        start_date: new Date(startDateTimestamp),
        name: record["Activity Name"],
        type: record["Activity Type"],
        description: record["Activity Description"],
        private_note: record["Activity Private Note"],
        elapsed_time: parseFloat(record["Elapsed Time"]),           // s
        moving_time: parseFloat(record["Moving Time"]),             // s
        distance: parseFloat(record["Distance"]),                   // m
        max_heart_rate: parseFloat(record["Max Heart Rate"]),       // bpm
        max_speed: parseFloat(record["Max Speed"]),                 // m/s (not kph)
        average_speed: parseFloat(record["Average Speed"]),         // m/s (not kph)
        total_elevation_gain: parseFloat(record["Elevation Gain"]), // m
        elev_low: parseFloat(record["Elevation Low"]),              // m
        elev_high: parseFloat(record["Elevation High"]),            // m
        calories: parseFloat(record["Calories"])
      };
    });
  }
}
