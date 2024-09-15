import { DateTime } from "luxon";
// @ts-ignore: Not default export error
import Mustache from "mustache";
import { stringifyYaml } from "obsidian";
import { Activity } from "./Activity";

export class ActivityRenderer {
  template: string;
  dateFormat: string;
  frontMatterProperties?: string[];

  constructor(template: string, dateFormat: string, frontMatterProperties?: string[]) {
    this.template = template;
    this.dateFormat = dateFormat;
    this.frontMatterProperties = frontMatterProperties;
  }

  render(activity: Activity) {
    const start_date = DateTime.fromJSDate(new Date(activity.start_date)).toFormat(this.dateFormat);

    const bodyContent = Mustache.render(this.template, {
      ...activity,
      start_date: start_date
    });

    return (this.frontMatterProperties ? this.renderFrontMatter(activity) : "") + bodyContent;
  }

  renderFrontMatter(activity: Activity) {
    let frontMatter: { [id: string]: unknown } = {
      id: activity.id
    };

    this.frontMatterProperties!.forEach((property) => {
      frontMatter[property] = activity[property];
    });

    return `---\n${stringifyYaml(frontMatter)}---\n`;
  }
}
