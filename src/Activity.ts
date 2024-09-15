export interface Activity {
  id: number;
  start_date: Date;
  name: string;
  type: string;
  description: string;
  private_note: string;
  elapsed_time: number;
  moving_time: number;
  distance: number;
  max_heart_rate: number;
  max_speed: number;
  average_speed: number;
  total_elevation_gain: number;
  elev_low: number;
  elev_high: number;
  calories: number;

  [propName: string]: any
}
