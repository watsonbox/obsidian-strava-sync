import { addIcon, Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, Settings } from "./Settings";
import { SettingsTab } from "./SettingsTab";
import { Activity } from './Activity';
import { AcitivitiesCSVImporter } from './ActivitiesCSVImporter';
import { FileSelector } from './FileSelector';

const ICON_ID = "strava";

export default class StravaSync extends Plugin {
	settings: Settings;
	activities: Activity[] = [];

	async onload() {
		await this.loadSettings();

		addIcon(
			ICON_ID,
			`<svg fill="currentColor" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>`,
		)

		this.addRibbonIcon(ICON_ID, 'Import Strava Activities CSV', (evt: MouseEvent) => {
			this.importActivitiesCSV();
		});

		this.addCommand({
			id: 'import-csv',
			name: 'Import activities CSV',
			callback: () => {
				this.importActivitiesCSV();
			}
		});

		this.addSettingTab(new SettingsTab(this.app, this));
	}

	onunload() {

	}

	async importActivitiesCSV() {
		const fileContents = await new FileSelector(".csv").selectContents();
		const activities = await new AcitivitiesCSVImporter(fileContents).import();

		this.activities = activities;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
