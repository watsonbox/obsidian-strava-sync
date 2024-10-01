import { type App, Notice, PluginSettingTab, Setting } from "obsidian";
import { DEFAULT_SETTINGS, VALID_FRONT_MATTER_PROPERTIES } from "./Settings";
import type StravaSync from "./StravaSync";

export class SettingsTab extends PluginSettingTab {
  plugin: StravaSync;

  readonly STRAVA_CONNECT_BUTTON_IMAGE_URL =
    "https://cdn.jsdelivr.net/gh/watsonbox/obsidian-strava-sync@latest/assets/btn_strava_connectwith_orange.png";
  readonly STRAVA_POWERED_BY_IMAGE_URL =
    "https://cdn.jsdelivr.net/gh/watsonbox/obsidian-strava-sync@latest/assets/api_logo_pwrdBy_strava_horiz_light.png";

  constructor(app: App, plugin: StravaSync) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl).setName("Authentication").setHeading();

    new Setting(containerEl)
      .setName("Strava Client ID")
      .setDesc(
        createFragment((fragment) => {
          fragment.append(
            "Enter your Strava API Client ID (",
            fragment.createEl("a", {
              text: "instructions",
              href: "https://github.com/watsonbox/obsidian-strava-sync?tab=readme-ov-file#sync-configuration",
            }),
            ")",
          );
        }),
      )
      .addText((text) =>
        text
          .setPlaceholder("Enter Client ID")
          .setValue(this.plugin.settings.authentication.stravaClientId)
          .onChange(async (value) => {
            this.plugin.settings.authentication.stravaClientId = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Strava Client Secret")
      .setDesc(
        createFragment((fragment) => {
          fragment.append(
            "Enter your Strava API Client Secret (",
            fragment.createEl("a", {
              text: "instructions",
              href: "https://github.com/watsonbox/obsidian-strava-sync?tab=readme-ov-file#sync-configuration",
            }),
            ")",
          );
        }),
      )
      .addText((text) =>
        text
          .setPlaceholder("Enter Client Secret")
          .setValue(this.plugin.settings.authentication.stravaClientSecret)
          .onChange(async (value) => {
            this.plugin.settings.authentication.stravaClientSecret = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Authenticate with Strava")
      .setDesc("Click to start the OAuth flow with Strava")
      .setClass("strava-sync-authenticate")
      .addButton((button) => {
        button.buttonEl.innerHTML = `<img src="${this.STRAVA_CONNECT_BUTTON_IMAGE_URL}" />`;
        button.onClick(() => {
          if (
            !this.plugin.settings.authentication.stravaClientId ||
            !this.plugin.settings.authentication.stravaClientSecret
          ) {
            new Notice(
              "🛑 Please enter your Strava Client ID and Client Secret first.",
              8000,
            );
            return;
          }

          window.open(this.plugin.stravaApi.buildAuthorizeUrl(), "_blank");
        });
      });

    if (this.plugin.settings.authentication.stravaAccessToken) {
      const el = containerEl.createEl("div");
      el.setText("✅");
      containerEl
        .find(".strava-sync-authenticate > .setting-item-control ")
        .prepend(el);
    }

    new Setting(containerEl).setName("Sync").setHeading();

    new Setting(containerEl)
      .setName("Folder")
      .setDesc(
        "Enter the folder where the data will be stored. {{id}}, {{name}} and {{start_date}} can be used in the folder name",
      )
      .addText((text) =>
        text
          .setPlaceholder("Enter the folder")
          .setValue(this.plugin.settings.sync.folder)
          .onChange(async (value) => {
            this.plugin.settings.sync.folder = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Folder date format")
      .setDesc(
        createFragment((fragment) => {
          fragment.append(
            "If date is used as part of folder name, specify the format date for use. Format ",
            fragment.createEl("a", {
              text: "reference",
              href: "https://moment.github.io/luxon/#/formatting?id=table-of-tokens",
            }),
            ".",
          );
        }),
      )
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.sync.folderDateFormat)
          .setValue(this.plugin.settings.sync.folderDateFormat)
          .onChange(async (value) => {
            this.plugin.settings.sync.folderDateFormat = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Filename")
      .setDesc(
        "Enter the filename where the data will be stored. {{id}}, {{name}} and {{start_date}} can be used in the filename",
      )
      .addText((text) =>
        text
          .setPlaceholder("Enter the filename")
          .setValue(this.plugin.settings.sync.filename)
          .onChange(async (value) => {
            this.plugin.settings.sync.filename = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Filename date format")
      .setDesc(
        createFragment((fragment) => {
          fragment.append(
            "If date is used as part of file name, specify the format date for use. Format ",
            fragment.createEl("a", {
              text: "reference",
              href: "https://moment.github.io/luxon/#/formatting?id=table-of-tokens",
            }),
            ".",
          );
        }),
      )
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.sync.filenameDateFormat)
          .setValue(this.plugin.settings.sync.filenameDateFormat)
          .onChange(async (value) => {
            this.plugin.settings.sync.filenameDateFormat = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Import Strava bulk export")
      .setDesc(
        createFragment((fragment) => {
          fragment.append(
            "Import activities.csv from a Strava bulk export CSV file following ",
            fragment.createEl("a", {
              text: "these instructions",
              href: "https://support.strava.com/hc/en-us/articles/216918437-Exporting-your-Data-and-Bulk-Export#h_01GG58HC4F1BGQ9PQZZVANN6WF",
            }),
            " to generate the export.",
          );
        }),
      )
      .addButton((button) =>
        button
          .setButtonText("Import CSV")
          .setCta()
          .onClick(async () => {
            try {
              await this.plugin.importActivitiesFromCSV();
              new Notice(
                "Strava bulk export import completed successfully",
                4000,
              );
            } catch (error) {
              console.error("Error importing Strava bulk export:", error);
              new Notice(
                "Error importing Strava bulk export. Check the console for details.",
                8000,
              );
            }
          }),
      );

    new Setting(containerEl).setName("Activity").setHeading();

    new Setting(containerEl)
      .setName("Properties / Front matter")
      .setDesc(
        createFragment((fragment) => {
          fragment.append(
            "Enter the metadata to be used in your note separated by commas.",
          );
        }),
      )
      .addTextArea((text) => {
        text
          .setPlaceholder("Enter the metadata")
          .setValue(
            this.plugin.settings.activity.frontMatterProperties.join(","),
          )
          .onChange(async (value) => {
            this.plugin.settings.activity.frontMatterProperties = value
              .split(",")
              .map((v) => v.trim())
              .filter(
                (v, i, a) =>
                  VALID_FRONT_MATTER_PROPERTIES.includes(v) &&
                  a.indexOf(v) === i,
              );
            await this.plugin.saveSettings();
          });
        text.inputEl.setAttr("rows", 4);
        text.inputEl.setAttr("cols", 30);
      });

    new Setting(containerEl)
      .setName("Activity date format")
      .setDesc(
        createFragment((fragment) => {
          fragment.append(
            "If date is used as part of activity content, specify the format date for use. Format ",
            fragment.createEl("a", {
              text: "reference",
              href: "https://moment.github.io/luxon/#/formatting?id=table-of-tokens",
            }),
            ".",
          );
        }),
      )
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.activity.contentDateFormat)
          .setValue(this.plugin.settings.activity.contentDateFormat)
          .onChange(async (value) => {
            this.plugin.settings.activity.contentDateFormat = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Activity template")
      .setDesc(
        createFragment((fragment) => {
          fragment.append(
            "Enter template to render activities with.",
            fragment.createEl("br"),
            fragment.createEl("br"),
            fragment.createEl("a", {
              text: "More information",
              href: "https://github.com/watsonbox/obsidian-strava-sync?tab=readme-ov-file#content",
            }),
          );
        }),
      )
      .addExtraButton((button) => {
        // Add a button to reset template
        button
          .setIcon("reset")
          .setTooltip("Reset template")
          .onClick(async () => {
            this.plugin.settings.activity.template =
              DEFAULT_SETTINGS.activity.template;
            await this.plugin.saveSettings();
            this.display();
            new Notice("Template reset");
          });
      })
      .addTextArea((text) => {
        text
          .setPlaceholder("Enter the template")
          .setValue(this.plugin.settings.activity.template)
          .onChange(async (value) => {
            this.plugin.settings.activity.template = value
              ? value
              : DEFAULT_SETTINGS.activity.template;
            await this.plugin.saveSettings();
          });
        text.inputEl.setAttr("rows", 15);
        text.inputEl.setAttr("cols", 50);
      });

    const el = containerEl.createEl("div");
    el.innerHTML = `<img src="${this.STRAVA_POWERED_BY_IMAGE_URL}" />`;
    el.classList.add("strava-powered-by");
    containerEl.appendChild(el);
  }
}
