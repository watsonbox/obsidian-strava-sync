import { Notice, Plugin, addIcon } from "obsidian";
import { ActivitiesCSVImporter, CSVImportError } from "./ActivitiesCSVImporter";
import type { Activity } from "./Activity";
import { ActivityImporter } from "./ActivityImporter";
import { ActivitySerializer } from "./ActivitySerializer";
import { FileSelector } from "./FileSelector";
import { DEFAULT_SETTINGS, type Settings } from "./Settings";
import { SettingsTab } from "./SettingsTab";
import { StravaApi } from "./StravaApi";

const ICON_ID = "strava";
const SUCCESS_NOTICE_DURATION = 4000;
const ERROR_NOTICE_DURATION = 8000;

export default class StravaSync extends Plugin {
  settings: Settings;
  settingsTab: SettingsTab;
  stravaApi: StravaApi;
  activities: Activity[] = [];
  fileSelector: FileSelector;
  activitySerializer: ActivitySerializer;

  async onload() {
    await this.loadSettings();

    this.settingsTab = new SettingsTab(this.app, this);
    this.stravaApi = new StravaApi(this.settings.authentication);
    this.fileSelector = new FileSelector(".csv");
    this.activitySerializer = new ActivitySerializer(this.app, this.settings);

    addIcon(
      ICON_ID,
      `<svg fill="currentColor" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>`,
    );

    this.addRibbonIcon(
      ICON_ID,
      "Import new activities from Strava",
      (evt: MouseEvent) => {
        this.importNewActivities();
      },
    );

    this.registerObsidianProtocolHandler("strava-sync", async (args) => {
      await this.stravaApi.exchangeCodeForToken(args.code);
      this.settings.authentication = this.stravaApi.settings;
      await this.saveSettings();

      new Notice(
        "✅ Successfully authenticated with Strava!",
        SUCCESS_NOTICE_DURATION,
      );

      // Refresh the settings tab to update the authentication status
      this.settingsTab.display();
    });

    this.addCommand({
      id: "import-new",
      name: "Import new activities from Strava",
      callback: () => {
        this.importNewActivities();
      },
    });

    this.addCommand({
      id: "import-csv",
      name: "Import Strava activities from bulk export CSV",
      callback: () => {
        this.importActivitiesFromCSV();
      },
    });

    this.addSettingTab(this.settingsTab);
  }

  onunload() {}

  async importActivitiesFromCSV() {
    try {
      const fileContents = await this.fileSelector.selectContents();
      this.activities = await new ActivitiesCSVImporter(fileContents).import();

      await this.serializeActivities(false);
    } catch (error) {
      if (error instanceof CSVImportError) {
        new Notice(
          `🛑 CSV Import Error:\n\n${error.message}`,
          ERROR_NOTICE_DURATION,
        );
      } else {
        console.error("Unexpected error during CSV import:", error);
        new Notice(
          "🛑 An unexpected error occurred during import. Check the console for details.",
          ERROR_NOTICE_DURATION,
        );
      }
    }
  }

  async importNewActivities() {
    try {
      if (!this.stravaApi.isAuthenticated()) {
        new Notice(
          "🛑 Please authenticate with Strava first in the plugin settings.",
          ERROR_NOTICE_DURATION,
        );
        return;
      }

      new Notice(
        "🔄 Importing new activities from Strava...",
        SUCCESS_NOTICE_DURATION,
      );

      this.activities = await new ActivityImporter(
        this.stravaApi,
        this.settings.sync.lastActivityTimestamp,
      ).importLatestActivities();

      await this.serializeActivities(true);

      if (this.activities.length > 0) {
        this.settings.sync.lastActivityTimestamp = Math.max(
          ...this.activities.map(
            (activity) => activity.start_date.getTime() / 1000,
          ),
        );
      }

      await this.saveSettings();
    } catch (error) {
      console.error("Unexpected error during Strava import:", error);
      new Notice(
        "🛑 An unexpected error occurred during import. Check the console for details.",
        ERROR_NOTICE_DURATION,
      );
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async serializeActivities(newLabel: boolean) {
    let createdCount = 0;
    let updatedCount = 0;

    await Promise.all(
      this.activities.map(async (activity) => {
        if (await this.activitySerializer.serialize(activity)) {
          createdCount++;
        } else {
          updatedCount++;
        }
      }),
    );

    let message = `🏃 ${createdCount} ${newLabel ? "new " : ""}activities created`;

    if (updatedCount > 0) {
      message += `, ${updatedCount} already existing`;
    }

    new Notice(`${message}.`, SUCCESS_NOTICE_DURATION);
  }
}
