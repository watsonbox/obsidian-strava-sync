import { App, TFolder, Vault, normalizePath } from "obsidian";
import type { Activity } from "../Activity";
import { ActivitySerializer } from "../ActivitySerializer";
import type { Settings } from "../Settings";

jest.mock("obsidian");
jest.mock("../ActivityRenderer");

describe("ActivitySerializer", () => {
  let app: App;
  let vault: Vault;
  let settings: Settings;
  let activitySerializer: ActivitySerializer;
  let testActivity: Activity;

  beforeEach(() => {
    app = new App();
    vault = new Vault();
    (app as any).vault = vault;

    settings = {
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
        frontMatterProperties: [],
        template: "# {{name}}",
      },
    };

    activitySerializer = new ActivitySerializer(app, settings);

    testActivity = {
      id: 123,
      start_date: new Date("2023-10-01T10:00:00Z"),
      name: "Morning Run",
      sport_type: "Run",
      description: "A nice morning run.",
      private_note: "Felt great!",
      elapsed_time: 3600,
      moving_time: 3500,
      distance: 10000,
      distance_miles: 6.213,
      avg_pace_min_per_mile: 9.5,
      max_heart_rate: 180,
      max_speed: 5,
      average_speed: 3,
      total_elevation_gain: 50,
      elev_low: 10,
      elev_high: 60,
      calories: 500,
      gear_name: "Saucony Endorphin Speed",
      workout_type: "Workout",
    };
  });

  test("should create a new folder and file for the activity", async () => {
    const expectedFolderName = "Rendered Strava/{{start_date}}";
    const expectedFileName = "Rendered {{id}} {{name}}";
    const expectedFilePath = `${expectedFolderName}/${expectedFileName}.md`;
    const expectedFileContent = "Rendered # {{name}}";

    (vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);
    (normalizePath as jest.Mock).mockImplementation((path) => path);

    const result = await activitySerializer.serialize(testActivity);

    expect(vault.getAbstractFileByPath).toHaveBeenCalledWith(
      expectedFolderName,
    );
    expect(vault.createFolder).toHaveBeenCalledWith(expectedFolderName);
    expect(vault.create).toHaveBeenCalledWith(
      expectedFilePath,
      expectedFileContent,
    );
    expect(result).toBe(true);
  });

  test("should not create a new file if it already exists", async () => {
    const expectedFolderName = "Rendered Strava/{{start_date}}";
    const expectedFileName = "Rendered {{id}} {{name}}";
    const expectedFilePath = `${expectedFolderName}/${expectedFileName}.md`;

    (vault.getAbstractFileByPath as jest.Mock).mockReturnValue(new TFolder());
    (normalizePath as jest.Mock).mockImplementation((path) => path);
    (vault.create as jest.Mock).mockRejectedValue(
      new Error("File already exists"),
    );

    const result = await activitySerializer.serialize(testActivity);

    expect(vault.getAbstractFileByPath).toHaveBeenCalledWith(
      expectedFolderName,
    );
    expect(vault.createFolder).not.toHaveBeenCalled();
    expect(vault.create).toHaveBeenCalledWith(
      expectedFilePath,
      expect.any(String),
    );
    expect(result).toBe(false);
  });

  test("should replace illegal characters in folder and file names", async () => {
    settings.sync.folder = "Strava/<{{start_date}}>";
    settings.sync.filename = "{{id}} {{name}}?";
    activitySerializer = new ActivitySerializer(app, settings);

    const expectedFolderName = "Rendered Strava/-{{start_date}}-";
    const expectedFileName = "Rendered {{id}} {{name}}-";
    const expectedFilePath = `${expectedFolderName}/${expectedFileName}.md`;

    (vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);
    (normalizePath as jest.Mock).mockImplementation((path) => path);

    const result = await activitySerializer.serialize(testActivity);

    expect(vault.getAbstractFileByPath).toHaveBeenCalledWith(
      expectedFolderName,
    );
    expect(vault.createFolder).toHaveBeenCalledWith(expectedFolderName);
    expect(vault.create).toHaveBeenCalledWith(
      expectedFilePath,
      expect.any(String),
    );
    expect(result).toBe(true);
  });
});
