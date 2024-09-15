export const VALID_FRONT_MATTER_PROPERTIES = [
  "id",
  "start_date",
  "name",
  "type",
  "description",
  "private_note",
  "elapsed_time",
  "moving_time",
  "distance",
  "max_heart_rate",
  "max_speed",
  "average_speed",
  "total_elevation_gain",
  "elev_low",
  "elev_high",
  "calories"
]

export const DEFAULT_SETTINGS: Settings = {
  folder: "Strava/{{{start_date}}}",
  folderDateFormat: "yyyy-MM-dd",
  filename: "{{{id}}} {{{name}}}",
  filenameDateFormat: "yyyy-MM-dd",
  frontMatterProperties: []
}

export interface Settings {
  folder: string;
  folderDateFormat: string;
  filename: string;
  filenameDateFormat: string;
  frontMatterProperties: string[];
}
