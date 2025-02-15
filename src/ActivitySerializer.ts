import { DateTime } from "luxon";
import { type App, TFolder, normalizePath } from "obsidian";
import type { Activity } from "./Activity";
import { ActivityRenderer } from "./ActivityRenderer";
import type { Settings } from "./Settings";

// On Unix-like systems / is reserved and <>:"/\|?* as well as non-printable characters \u0000-\u001F on Windows
// credit: https://github.com/sindresorhus/filename-reserved-regex
const REPLACEMENT_CHAR = "-";
const ILLEGAL_CHAR_REGEX_FILE = /[<>:"/\\|?*\u0000-\u001F]/g;
const ILLEGAL_CHAR_REGEX_FOLDER = /[<>:"\\|?*\u0000-\u001F]/g;
const ILLEGAL_TRAILING_WHITESPACE_REGEX = /\s+$/;

const DIR_CHAR = "/";

export class ActivitySerializer {
  app: App;
  settings: Settings;

  constructor(app: App, settings: Settings) {
    this.app = app;
    this.settings = settings;
  }

  async serialize(activity: Activity) {
    let folderName = normalizePath(
      new ActivityRenderer(
        this.settings.sync.folder,
        this.settings.sync.folderDateFormat,
      ).render(activity),
    )
      .replace(ILLEGAL_CHAR_REGEX_FOLDER, REPLACEMENT_CHAR)
      .replace(ILLEGAL_TRAILING_WHITESPACE_REGEX, "");

    const folderNameSplit = folderName.split("/");
    const d = DateTime.fromFormat(
      folderNameSplit[folderNameSplit.length - 1],
      this.settings.sync.folderDateFormat,
    );

    if (d.isValid) {
      folderNameSplit[folderNameSplit.length - 1] = folderNameSplit[
        folderNameSplit.length - 1
      ].replace(/-/g, DIR_CHAR);
      folderName = folderNameSplit.join("/");
      console.log(folderNameSplit);
    }

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

    try {
      await this.app.vault.create(filePath, fileContent);
    } catch (error) {
      if (error.toString().includes("File already exists")) {
        return false;
      }

      throw error;
    }

    return true;
  }
}
