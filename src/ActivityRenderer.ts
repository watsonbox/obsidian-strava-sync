import { DateTime } from "luxon";
// @ts-ignore: Not default export error
import Mustache from "mustache";
import { Activity } from "./Activity";

export class ActivityRenderer {
  template: string;
  dateFormat: string;

  constructor(template: string, dateFormat: string) {
    this.template = template;
    this.dateFormat = dateFormat;
  }

  render(activity: Activity) {
    const start_date = DateTime.fromJSDate(new Date(activity.start_date)).toFormat(this.dateFormat);

    return Mustache.render(this.template, {
      start_date: start_date
    });
  }
}
