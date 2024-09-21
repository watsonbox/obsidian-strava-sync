import { Authentication } from './Authentication';
import { Activity } from './Activity';
import { default as strava } from 'strava-v3';

// The default “non-upload” rate limit allows 100 requests every 15 minutes, with up to 1,000 requests per day.
export class ActivityImporter {
  private readonly PER_PAGE = 30; // Strava API default

  private authentication: Authentication;
  private lastActivityTimestamp?: number;

  constructor(authentication: Authentication, lastActivityTimestamp?: number) {
    this.authentication = authentication;
    this.lastActivityTimestamp = lastActivityTimestamp;
  }

  async importLatestActivities(): Promise<Activity[]> {
    await this.authentication.refreshTokenIfExpired();

    try {
      let params: { per_page: number; after?: number } = {
        per_page: this.PER_PAGE
      };

      if (this.lastActivityTimestamp) {
        params.after = this.lastActivityTimestamp;
      }

      const activities = await strava.athlete.listActivities(params);

      const detailedActivities = await Promise.all(
        activities.map(async (activity: any) => {
          const detailedActivity = await strava.activities.get({ id: activity.id });
          return this.mapStravaActivityToActivity(detailedActivity);
        })
      );

      return detailedActivities;
    } catch (error) {
      console.error('Error fetching activities from Strava:', error);
      throw new Error('Failed to import activities from Strava');
    }
  }

  private mapStravaActivityToActivity(stravaActivity: any): Activity {
    return {
      id: stravaActivity.id,
      start_date: new Date(stravaActivity.start_date),
      name: stravaActivity.name,
      sport_type: stravaActivity.sport_type,
      description: stravaActivity.description || '',
      private_note: stravaActivity.private_note || '',
      elapsed_time: stravaActivity.elapsed_time,
      moving_time: stravaActivity.moving_time,
      distance: stravaActivity.distance,
      max_heart_rate: stravaActivity.max_heartrate || 0,
      max_speed: stravaActivity.max_speed || 0,
      average_speed: stravaActivity.average_speed || 0,
      total_elevation_gain: stravaActivity.total_elevation_gain || 0,
      elev_low: stravaActivity.elev_low || 0,
      elev_high: stravaActivity.elev_high || 0,
      calories: stravaActivity.calories || 0
    };
  }
}
