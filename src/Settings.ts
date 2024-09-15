export const DEFAULT_SETTINGS: Settings = {
  folder: "Strava/{{{date}}} {{{title}}}",
  folderDateFormat: "yyyy-MM-dd"
}

export interface Settings {
  folder: string;
  folderDateFormat: string;
}
