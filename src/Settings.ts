export const DEFAULT_SETTINGS: Settings = {
  folder: "Strava/{{{start_date}}}",
  folderDateFormat: "yyyy-MM-dd",
  filename: "{{{id}}} {{{name}}}",
  filenameDateFormat: "yyyy-MM-dd"
}

export interface Settings {
  folder: string;
  folderDateFormat: string;
  filename: string;
  filenameDateFormat: string;
}
