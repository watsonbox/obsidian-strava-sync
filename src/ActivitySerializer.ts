import { type App, TFile, TFolder, normalizePath } from "obsidian";
import type { Activity } from "./Activity";
import { ActivityRenderer } from "./ActivityRenderer";
import type { Settings } from "./Settings";

// On Unix-like systems / is reserved and <>:"/\|?* as well as non-printable characters \u0000-\u001F on Windows
// credit: https://github.com/sindresorhus/filename-reserved-regex
const REPLACEMENT_CHAR = "-";
const ILLEGAL_CHAR_REGEX_FILE = /[<>:"/\\|?*\u0000-\u001F]/g;
const ILLEGAL_CHAR_REGEX_FOLDER = /[<>:"\\|?*\u0000-\u001F]/g;

export class ActivitySerializer {
  app: App;
  settings: Settings;

  constructor(app: App, settings: Settings) {
    this.app = app;
    this.settings = settings;
  }

  async serialize(activity: Activity) {
    const folderName = normalizePath(
      new ActivityRenderer(
        this.settings.sync.folder,
        this.settings.sync.folderDateFormat,
      ).render(activity),
    ).replace(ILLEGAL_CHAR_REGEX_FOLDER, REPLACEMENT_CHAR);

    const folder = this.app.vault.getAbstractFileByPath(folderName);
    if (!(folder instanceof TFolder)) {
      await this.app.vault.createFolder(folderName);
    }

    const fileName = normalizePath(
      new ActivityRenderer(
        this.settings.sync.filename,
        this.settings.sync.filenameDateFormat,
      ).render(activity),
    ).replace(ILLEGAL_CHAR_REGEX_FILE, REPLACEMENT_CHAR);

    const filePath = `${folderName}/${fileName}.md`;

    const fileContent = new ActivityRenderer(
      this.settings.activity.template,
      this.settings.activity.contentDateFormat,
      this.settings.activity.frontMatterProperties,
    ).render(activity);

    const existingFile = this.app.vault.getAbstractFileByPath(filePath);
    
    try {
      if (existingFile && existingFile instanceof TFile) {
        // File exists, update it
        await this.app.vault.modify(existingFile, fileContent);
        return false; // File was updated, not created
      } else {
        // File doesn't exist, create it
        await this.app.vault.create(filePath, fileContent);
        return true; // File was created
      }
    } catch (error) {
      console.error(`Error serializing activity to ${filePath}:`, error);
      throw error;
    }
  }
}
