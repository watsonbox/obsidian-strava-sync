import { App, normalizePath, TFolder, Notice } from "obsidian";
import { Settings } from "./Settings";
import { Activity } from "./Activity";
import { ActivityRenderer } from "./ActivityRenderer";

// On Unix-like systems / is reserved and <>:"/\|?* as well as non-printable characters \u0000-\u001F on Windows
// credit: https://github.com/sindresorhus/filename-reserved-regex
// eslint-disable-next-line no-control-regex
const REPLACEMENT_CHAR = '-';
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
    const folderName = normalizePath(new ActivityRenderer(this.settings.folder, this.settings.folderDateFormat).render(activity))
      .replace(ILLEGAL_CHAR_REGEX_FOLDER, REPLACEMENT_CHAR);

    const folder = this.app.vault.getAbstractFileByPath(folderName);
    if (!(folder instanceof TFolder)) {
      await this.app.vault.createFolder(folderName);
    }

    const fileName = normalizePath(`${folderName}/${activity.id}.md`);

    try {
      await this.app.vault.create(fileName, `\`\`\`\n${JSON.stringify(activity)}\n\`\`\``);
    } catch (error) {
      if (error.toString().includes('File already exists')) {
        new Notice(`Skipping file creation: ${fileName}. Please check if you have duplicated activity titles and delete the file if needed.`);
      } else {
        throw error;
      }
    }
  }
}