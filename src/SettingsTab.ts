import { App, PluginSettingTab, Setting } from "obsidian";
import StravaSync from "./main";
import { VALID_FRONT_MATTER_PROPERTIES } from "./Settings";

export class SettingsTab extends PluginSettingTab {
  plugin: StravaSync;

  constructor(app: App, plugin: StravaSync) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h3', { text: 'Sync' })

    new Setting(containerEl)
      .setName('Folder')
      .setDesc(
        'Enter the folder where the data will be stored. {{{title}}} and {{{start_date}}} can be used in the folder name',
      )
      .addText(text => text
        .setPlaceholder('Enter the folder')
        .setValue(this.plugin.settings.folder)
        .onChange(async (value) => {
          this.plugin.settings.folder = value
          await this.plugin.saveSettings()
        }));

    new Setting(containerEl)
      .setName('Folder date format')
      .setDesc(
        createFragment((fragment) => {
          fragment.append(
            'If date is used as part of folder name, specify the format date for use. Format ',
            fragment.createEl('a', {
              text: 'reference',
              href: 'https://moment.github.io/luxon/#/formatting?id=table-of-tokens',
            }),
            "."
          )
        }),
      )
      .addText((text) =>
        text
          .setPlaceholder('yyyy-MM-dd')
          .setValue(this.plugin.settings.folderDateFormat)
          .onChange(async (value) => {
            this.plugin.settings.folderDateFormat = value
            await this.plugin.saveSettings()
          }),
      )

    new Setting(containerEl)
      .setName('Filename')
      .setDesc(
        'Enter the filename where the data will be stored. {{id}}, {{{name}}} and {{{start_date}}} can be used in the filename',
      )
      .addText((text) =>
        text
          .setPlaceholder('Enter the filename')
          .setValue(this.plugin.settings.filename)
          .onChange(async (value) => {
            this.plugin.settings.filename = value
            await this.plugin.saveSettings()
          }),
      )

    new Setting(containerEl)
      .setName('Filename date format')
      .setDesc(
        createFragment((fragment) => {
          fragment.append(
            'If date is used as part of file name, specify the format date for use. Format ',
            fragment.createEl('a', {
              text: 'reference',
              href: 'https://moment.github.io/luxon/#/formatting?id=table-of-tokens',
            }),
            "."
          )
        }),
      )
      .addText((text) =>
        text
          .setPlaceholder('yyyy-MM-dd')
          .setValue(this.plugin.settings.filenameDateFormat)
          .onChange(async (value) => {
            this.plugin.settings.filenameDateFormat = value
            await this.plugin.saveSettings()
          }),
      )

    containerEl.createEl('h3', { text: 'Activity' })

    new Setting(containerEl)
      .setName('Front Matter')
      .setDesc(
        createFragment((fragment) => {
          fragment.append(
            'Enter the metadata to be used in your note separated by commas.'
          )
        }),
      )
      .addTextArea((text) => {
        text
          .setPlaceholder('Enter the metadata')
          .setValue(this.plugin.settings.frontMatterProperties.join(','))
          .onChange(async (value) => {
            this.plugin.settings.frontMatterProperties = value
              .split(',')
              .map((v) => v.trim())
              .filter((v, i, a) => VALID_FRONT_MATTER_PROPERTIES.includes(v) && a.indexOf(v) === i)
            await this.plugin.saveSettings()
          })
        text.inputEl.setAttr('rows', 4)
        text.inputEl.setAttr('cols', 30)
      })
  }
}
