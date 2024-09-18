import { addIcon, Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, Settings } from "./Settings";
import { SettingsTab } from "./SettingsTab";
import { Authentication } from './Authentication';
import { Activity } from './Activity';
import { AcitivitiesCSVImporter, CSVImportError } from './ActivitiesCSVImporter';
import { FileSelector } from './FileSelector';
import { ActivitySerializer } from './ActivitySerializer';
import { ActivityImporter } from './ActivityImporter';

const ICON_ID = "strava";
const SUCCESS_NOTICE_DURATION = 4000;
const ERROR_NOTICE_DURATION = 8000;

export default class StravaSync extends Plugin {
	settings: Settings;
	authentication: Authentication;
	activities: Activity[] = [];
	fileSelector: FileSelector;
	activitySerializer: ActivitySerializer;

	async onload() {
		await this.loadSettings();

		this.authentication = new Authentication(this.settings.authentication);
		this.fileSelector = new FileSelector(".csv");
		this.activitySerializer = new ActivitySerializer(this.app, this.settings);

		addIcon(
			ICON_ID,
			`<svg fill="currentColor" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>`,
		)

		this.addRibbonIcon(ICON_ID, 'Import new activities from Strava', (evt: MouseEvent) => {
			this.importNewActivities();
		});

		this.registerObsidianProtocolHandler(
			'obsidian-strava-sync',
			async (args) => {
				await this.authentication.exchangeCodeForToken(args.code);
				this.settings.authentication = this.authentication.settings;
				await this.saveSettings();

				new Notice('✅ Successfully authenticated with Strava!', SUCCESS_NOTICE_DURATION);
				console.log(this.settings.authentication.stravaAccessToken);
			}
		)

		this.addCommand({
			id: 'import-new',
			name: 'Import new activities from Strava',
			callback: () => {
				this.importNewActivities();
			}
		});

		this.addCommand({
			id: 'import-csv',
			name: 'Import Strava activities from CSV export',
			callback: () => {
				this.importActivitiesFromCSV();
			}
		});

		this.addSettingTab(new SettingsTab(this.app, this));
	}

	onunload() {

	}

	async importActivitiesFromCSV() {
		try {
			const fileContents = await this.fileSelector.selectContents();
			const activities = await new AcitivitiesCSVImporter(fileContents).import();

			this.activities = activities;

			let createdCount = 0;
			let updatedCount = 0;

			await Promise.all(
				this.activities.map(async (activity) => {
					if (await this.activitySerializer.serialize(activity)) {
						createdCount++;
					} else {
						updatedCount++;
					}
				})
			);

			new Notice(`🏃 ${createdCount} activities created, ${updatedCount} already existing.`, SUCCESS_NOTICE_DURATION);
		} catch (error) {
			if (error instanceof CSVImportError) {
				new Notice(`🛑 CSV Import Error:\n\n${error.message}`, ERROR_NOTICE_DURATION);
			} else {
				console.error("Unexpected error during CSV import:", error);
				new Notice(`🛑 An unexpected error occurred during import. Check the console for details.`, ERROR_NOTICE_DURATION);
			}
		}
	}

	async importNewActivities() {
		try {
			const activities = await new ActivityImporter(
				this.authentication,
				this.settings.sync.lastActivityTimestamp
			).importLatestActivities();

			let createdCount = 0;
			let updatedCount = 0;

			await Promise.all(
				activities.map(async (activity) => {
					if (await this.activitySerializer.serialize(activity)) {
						createdCount++;
					} else {
						updatedCount++;
					}
				})
			);

			if (activities.length > 0) {
				this.settings.sync.lastActivityTimestamp = Math.max(...activities.map(activity => activity.start_date.getTime() / 1000));
			}

			await this.saveSettings();

			// FIXME: Improve messages
			new Notice(`🏃 ${createdCount} new activities created, ${updatedCount} already existing.`, SUCCESS_NOTICE_DURATION);
		} catch (error) {
			console.error("Unexpected error during Strava import:", error);
			new Notice(`🛑 An unexpected error occurred during import. Check the console for details.`, ERROR_NOTICE_DURATION);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
