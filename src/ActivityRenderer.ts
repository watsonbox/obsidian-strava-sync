import { DateTime } from "luxon";
import * as Handlebars from "handlebars";
import { stringifyYaml } from "obsidian";
import { Activity } from "./Activity";

export const DEFAULT_TEMPLATE = `# {{name}}

[https://www.strava.com/activities/{{id}}](https://www.strava.com/activities/{{id}})
{{#if description}}

Description: {{description}}
{{/if}}
{{#if private_note}}

> [!NOTE] Private note
> {{private_note}}
{{/if}}

#Strava
`

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

    const bodyContent = Handlebars.compile(this.template)({
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
