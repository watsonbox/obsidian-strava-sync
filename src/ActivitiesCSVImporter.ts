import { parse } from "csv-parse/sync";
import { Activity } from "./Activity";

const TIME_ZONE = "UTC";

export class AcitivitiesCSVImporter {
  fileContents: string;

  constructor(fileContents: string) {
    this.fileContents = fileContents;
  }

  async import(): Promise<Activity[]> {
    const records = parse(this.fileContents, {
      columns: true,
      skip_empty_lines: true
    });

    return records.map((record: any, index: number): Activity => {
      const startDateTimestamp = Date.parse(record["Activity Date"] + ` ${TIME_ZONE}`);

      if (isNaN(startDateTimestamp)) {
        throw new Error(`Invalid date: ${record["Activity Date"] + ` ${TIME_ZONE}`}`);
      }

      return {
        id: record["Activity ID"],
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
      }
    });
  }
}
