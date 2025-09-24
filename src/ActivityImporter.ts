import type { Activity } from "./Activity";
import type { StravaApi } from "./StravaApi";

// The default “non-upload” rate limit allows 100 requests every 15 minutes, with up to 1,000 requests per day.
export class ActivityImporter {
  private readonly PER_PAGE = 30; // Strava API default

  private stravaApi: StravaApi;
  private lastActivityTimestamp?: number;

  constructor(stravaApi: StravaApi, lastActivityTimestamp?: number) {
    this.stravaApi = stravaApi;
    this.lastActivityTimestamp = lastActivityTimestamp;
  }

  async importLatestActivities(): Promise<Activity[]> {
    await this.stravaApi.refreshTokenIfExpired();

    try {
      const params: { per_page: number; after?: number } = {
        per_page: this.PER_PAGE,
      };

      if (this.lastActivityTimestamp) {
        params.after = this.lastActivityTimestamp;
      }

      const activities = await this.stravaApi.listActivities(params);

      // Process activities with rate limiting to avoid 429 errors
      const detailedActivities = [];
      for (const activity of activities) {
        try {
          const detailedActivity = await this.stravaApi.getActivity(activity.id);
          detailedActivities.push(this.mapStravaActivityToActivity(detailedActivity));
          
          // Add a small delay between requests to respect rate limits
          // Strava allows 100 requests per 15 minutes, so ~400ms between requests is safe
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          if (error.message?.includes('429')) {
            console.warn(`Rate limit hit while fetching activity ${activity.id}. Stopping import.`);
            break; // Stop processing more activities if we hit rate limit
          }
          throw error; // Re-throw other errors
        }
      }

      return detailedActivities;
    } catch (error) {
      console.error("Error fetching activities from Strava:", error);
      
      if (error.message?.includes('429')) {
        throw new Error("Strava API rate limit exceeded. Please wait 15 minutes before trying again, or disable 'Rewrite existing activities' to import only new activities.");
      }
      
      throw new Error(`Failed to import activities from Strava: ${error.message || error}`);
    }
  }

  private mapStravaActivityToActivity(stravaActivity: any): Activity {
    return {
      id: stravaActivity.id,
      start_date: new Date(stravaActivity.start_date),
      name: stravaActivity.name,
      sport_type: stravaActivity.sport_type,
      description: stravaActivity.description || "",
      private_note: stravaActivity.private_note || "",
      elapsed_time: stravaActivity.elapsed_time,
      moving_time: stravaActivity.moving_time,
      distance: stravaActivity.distance,
      max_heart_rate: stravaActivity.max_heartrate || 0,
      max_speed: stravaActivity.max_speed || 0,
      average_speed: stravaActivity.average_speed || 0,
      total_elevation_gain: stravaActivity.total_elevation_gain || 0,
      elev_low: stravaActivity.elev_low || 0,
      elev_high: stravaActivity.elev_high || 0,
      calories: stravaActivity.calories || 0,
    };
  }
}
