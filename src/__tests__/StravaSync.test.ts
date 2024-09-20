import * as fs from 'fs';
import * as path from 'path';

import { App, Vault, PluginManifest, Notice } from 'obsidian';
import StravaSync from '../StravaSync';

jest.mock('obsidian');

jest.mock('../ActivityImporter', () => ({
  ActivityImporter: jest.fn().mockImplementation(() => ({
    importLatestActivities: jest.fn().mockResolvedValue([
      {
        id: 12345678,
        name: 'Morning Run',
        type: 'Run',
        start_date: new Date('2023-04-16T08:00:00Z'),
        elapsed_time: 1800,
        distance: 5000,
        max_heart_rate: 175,
      },
      {
        id: 12345679,
        name: 'Evening Ride',
        type: 'Ride',
        start_date: new Date('2023-04-16T18:00:00Z'),
        elapsed_time: 3600,
        distance: 20000,
        max_heart_rate: 165,
      },
    ]),
  })),
}));

jest.mock('../FileSelector', () => ({
  FileSelector: jest.fn().mockImplementation(() => ({
    selectContents: jest.fn().mockResolvedValue(
      fs.readFileSync(path.join(__dirname, '../../assets/activities.csv'), 'utf8')
    ),
  })),
}));

jest.mock('../ActivitySerializer', () => ({
  ActivitySerializer: jest.fn().mockImplementation(() => ({
    serialize: jest.fn().mockResolvedValue(true),
  })),
}));

jest.mock('strava-v3', () => ({
  default: {
    config: jest.fn(),
    client: jest.fn()
  },
}));

describe('StravaSync', () => {
  let plugin: StravaSync;
  let app: App;
  let vault: Vault;
  let mockManifest: PluginManifest;

  beforeEach(() => {
    app = new App();
    vault = new Vault();
    (app as any).vault = vault;

    mockManifest = {
      id: 'strava-sync',
      name: 'Strava Sync',
      version: '1.0.0',
      minAppVersion: '0.15.0',
      description: 'Sync Strava activities to Obsidian',
      author: 'Your Name',
      authorUrl: 'https://github.com/yourusername',
      isDesktopOnly: false,
    };

    plugin = new StravaSync(app, mockManifest);

    // Call onload to initialize fileSelector and activitySerializer
    plugin.onload();
  });

  test('Import activities CSV', async () => {
    await plugin.importActivitiesFromCSV();

    expect(plugin.fileSelector.selectContents).toHaveBeenCalledTimes(1);
    expect(plugin.activitySerializer.serialize).toHaveBeenCalledTimes(3);

    const serializedActivities = (plugin.activitySerializer.serialize as jest.Mock).mock.calls.map(call => call[0]);

    expect(serializedActivities[0]).toMatchObject({
      id: 12271989718,
      name: 'Lunch Run',
      sport_type: 'Run',
      start_date: expect.any(Date),
      elapsed_time: 1955,
      distance: 4551.31982421875,
      max_heart_rate: 165,
      private_note: 'Light run. Knee pain 2/10.',
    });

    expect(serializedActivities[1]).toMatchObject({
      id: 12288940553,
      name: 'Dynamo Challenge 2024',
      sport_type: 'Ride',
      start_date: expect.any(Date),
      elapsed_time: 23198,
      distance: 93131.53125,
      max_heart_rate: 182,
      private_note: 'Hand numbness 4/10.',
    });

    expect(serializedActivities[2]).toMatchObject({
      id: 12315055573,
      name: 'Lunch Swim',
      sport_type: 'Swim',
      start_date: expect.any(Date),
      elapsed_time: 1697,
      distance: 1000,
      max_heart_rate: 158,
    });

    expect(Notice).toHaveBeenCalledWith(
      '🏃 3 activities created, 0 already existing.',
      expect.any(Number)
    );
  });

  test('Import new activities', async () => {
    jest.spyOn(plugin.activitySerializer, 'serialize').mockImplementation((activity) => {
      return Promise.resolve(activity.id === 12345678);
    });

    await plugin.importNewActivities();

    expect(plugin.activitySerializer.serialize).toHaveBeenCalledTimes(2);
    expect(plugin.settings.sync.lastActivityTimestamp).toBe(Math.floor(new Date('2023-04-16T18:00:00Z').getTime() / 1000));

    expect(Notice).toHaveBeenCalledWith(
      '🏃 1 new activities created, 1 already existing.',
      expect.any(Number)
    );
  });
});
