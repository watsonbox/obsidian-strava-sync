export class ActivityRenderer {
  constructor(public template: string, public dateFormat: string, public frontMatterProperties?: string[]) { }

  render = jest.fn().mockImplementation(() => {
    return `Rendered ${this.template}`;
  });
}
