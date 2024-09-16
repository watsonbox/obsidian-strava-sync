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

    const fileName = normalizePath(new ActivityRenderer(this.settings.filename, this.settings.filenameDateFormat).render(activity))
      .replace(ILLEGAL_CHAR_REGEX_FILE, REPLACEMENT_CHAR);

    const filePath = `${folderName}/${fileName}.md`;

    const fileContent = new ActivityRenderer(
      this.settings.activityTemplate,
      this.settings.contentDateFormat,
      this.settings.frontMatterProperties
    ).render(activity);

    try {
      //console.log(fileContent);
      await this.app.vault.create(filePath, fileContent);
    } catch (error) {
      if (error.toString().includes('File already exists')) {
        return false;
      } else {
        throw error;
      }
    }

    return true;
  }
}
