import { DEFAULT_TEMPLATE } from "./ActivityRenderer";

export const VALID_FRONT_MATTER_PROPERTIES = [
  "id",
  "start_date",
  "name",
  "sport_type",
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
  "calories",
  "icon",
  "gear_name",
  "workout_type",
];

export const DEFAULT_SETTINGS: Settings = {
  authentication: {
    stravaClientId: "",
    stravaClientSecret: "",
    stravaAccessToken: undefined,
    stravaRefreshToken: undefined,
    stravaTokenExpiresAt: undefined,
  },
  sync: {
    folder: "Strava/{{start_date}}",
    folderDateFormat: "yyyy-MM-dd",
    filename: "{{id}} {{name}}",
    filenameDateFormat: "yyyy-MM-dd",
  },
  activity: {
    contentDateFormat: "yyyy-MM-dd HH:mm:ss",
    frontMatterProperties: [
      "name",
      "start_date",
      "sport_type",
      "description",
      "private_note",
      "elapsed_time",
      "moving_time",
      "distance",
      "icon",
      "gear_name",
      "workout_type",
    ],
    template: DEFAULT_TEMPLATE,
  },
};

export interface AuthenticationSettings {
  stravaClientId: string;
  stravaClientSecret: string;
  stravaAccessToken?: string;
  stravaRefreshToken?: string;
  stravaTokenExpiresAt?: number;
}

interface SyncSettings {
  folder: string;
  folderDateFormat: string;
  filename: string;
  filenameDateFormat: string;
  lastActivityTimestamp?: number;
}

interface ActivitySettings {
  contentDateFormat: string;
  frontMatterProperties: string[];
  template: string;
}

export interface Settings {
  authentication: AuthenticationSettings;
  sync: SyncSettings;
  activity: ActivitySettings;
}
