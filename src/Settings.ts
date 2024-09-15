export const DEFAULT_SETTINGS: Settings = {
  folder: "Strava/{{{start_date}}}",
  folderDateFormat: "yyyy-MM-dd"
}

export interface Settings {
  folder: string;
  folderDateFormat: string;
}
