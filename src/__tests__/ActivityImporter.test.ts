import { default as strava } from 'strava-v3';
import { ActivityImporter } from '../ActivityImporter';
import { Authentication } from '../Authentication';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('../Authentication');
jest.mock('strava-v3', () => ({
  default: {
    athlete: {
      listActivities: jest.fn(),
    },
    activities: {
      get: jest.fn(),
    },
  },
}));

describe('ActivityImporter', () => {
  let activityImporter: ActivityImporter;
  let mockAuthentication: jest.Mocked<Authentication>;

  beforeEach(() => {
    mockAuthentication = new Authentication({} as any) as jest.Mocked<Authentication>;
    mockAuthentication.refreshTokenIfExpired = jest.fn().mockResolvedValue(undefined);
    activityImporter = new ActivityImporter(mockAuthentication);
  });

  it('should import latest activities', async () => {
    const mockActivitiesList = JSON.parse(fs.readFileSync(path.join(__dirname, '../../assets/activities.json'), 'utf8'));
    const mockActivity1 = JSON.parse(fs.readFileSync(path.join(__dirname, '../../assets/activity_12271989718.json'), 'utf8'));
    const mockActivity2 = JSON.parse(fs.readFileSync(path.join(__dirname, '../../assets/activity_12288940553.json'), 'utf8'));
    const mockActivity3 = JSON.parse(fs.readFileSync(path.join(__dirname, '../../assets/activity_12315055573.json'), 'utf8'));

    (strava.athlete.listActivities as jest.Mock).mockResolvedValue(mockActivitiesList);
    (strava.activities.get as jest.Mock)
      .mockResolvedValueOnce(mockActivity1)
      .mockResolvedValueOnce(mockActivity2)
      .mockResolvedValueOnce(mockActivity3);

    const activities = await activityImporter.importLatestActivities();

    expect(mockAuthentication.refreshTokenIfExpired).toHaveBeenCalled();
    expect(strava.athlete.listActivities).toHaveBeenCalledWith({ per_page: 5 });
    expect(strava.activities.get).toHaveBeenCalledTimes(3);

    expect(activities).toHaveLength(3);
    expect(activities[0]).toMatchObject({
      id: 12271989718,
      name: 'Lunch Run',
      type: 'Run',
      start_date: new Date('2024-08-24T10:47:26Z'),
      elapsed_time: 1955,
      distance: 4551.3,
    });

    expect(activities[1]).toMatchObject({
      id: 12288940553,
      name: 'Dynamo Challenge 2024',
      type: 'Ride',
      start_date: new Date('2024-08-28T05:07:43Z'),
      elapsed_time: 38846,
      distance: 154081.0,
    });

    expect(activities[2]).toMatchObject({
      id: 12315055573,
      name: 'Lunch Swim',
      type: 'Swim',
      start_date: new Date('2024-09-09T10:23:12Z'),
      elapsed_time: 1697,
      distance: 1000.0,
    });
  });
});
