import * as fs from 'fs';
import * as path from 'path';

// Mock Obsidian API
jest.mock('obsidian', () => ({
  Plugin: class {
    loadData = jest.fn().mockResolvedValue({});
    saveData = jest.fn().mockResolvedValue({});
    addRibbonIcon = jest.fn();
    addCommand = jest.fn();
    addSettingTab = jest.fn();
  },
  App: class { },
  TFile: class { },
  Vault: class {
    create = jest.fn();
    getAbstractFileByPath = jest.fn();
  },
  Notice: jest.fn(),
  addIcon: jest.fn(),
  normalizePath: jest.fn().mockImplementation((path) => path),
  PluginSettingTab: class { },
  Setting: class {
    setName = jest.fn().mockReturnThis();
    setDesc = jest.fn().mockReturnThis();
    addText = jest.fn().mockReturnThis();
    addTextArea = jest.fn().mockReturnThis();
  },
}), { virtual: true });

// Import after mocking
import { App, TFile, Vault, PluginManifest, PluginSettingTab, Notice } from 'obsidian';
import StravaSync from '../main';

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
    plugin.settings = { ...plugin.settings, folder: 'Strava' };

    // Call onload to initialize fileSelector and activitySerializer
    plugin.onload();
  });

  test('Import activities CSV', async () => {
    await plugin.importActivitiesCSV();

    expect(plugin.fileSelector.selectContents).toHaveBeenCalledTimes(1);
    expect(plugin.activitySerializer.serialize).toHaveBeenCalledTimes(7);

    const serializedActivities = (plugin.activitySerializer.serialize as jest.Mock).mock.calls.map(call => call[0]);

    expect(serializedActivities[0]).toMatchObject({
      id: 12237768989,
      name: 'Badminton',
      type: 'Workout',
      start_date: expect.any(Date),
      elapsed_time: 5347,
      distance: 0,
      max_heart_rate: 152,
      private_note: 'Tweaked right knee in last game.',
    });

    expect(serializedActivities[6]).toMatchObject({
      id: 12315055573,
      name: 'Lunch Swim',
      type: 'Swim',
      start_date: expect.any(Date),
      elapsed_time: 1697,
      distance: 1000,
      max_heart_rate: 158,
    });

    expect(Notice).toHaveBeenCalledWith(
      '🏃 7 activities created, 0 already existing.',
      expect.any(Number)
    );
  });
});
