import { parse } from "csv-parse/sync";
import { Activity } from "./Activity";

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
      return {
        id: record["Activity ID"],
        start_date: new Date(record["Activity Date"] + " UTC"),
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
