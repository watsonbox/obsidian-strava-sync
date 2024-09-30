import { ActivityRenderer, DEFAULT_TEMPLATE } from "../ActivityRenderer";
import type { Activity } from "../Activity";

jest.mock("obsidian", () => ({
  stringifyYaml: jest.fn().mockImplementation((obj) => {
    // Simple YAML-like string representation
    return Object.entries(obj)
      .map(([key, value]) => `${key}: ${value}\n`)
      .join("");
  }),
}));

jest.mock("luxon", () => ({
  DateTime: {
    fromJSDate: jest.fn().mockReturnValue({
      toFormat: jest.fn().mockReturnValue("2023-04-15 10:30:00"),
    }),
  },
}));

describe("ActivityRenderer", () => {
  let activity: Activity;

  beforeEach(() => {
    activity = {
      id: 123456789,
      start_date: new Date("2023-04-15T10:30:00Z"),
      name: "Morning Run",
      sport_type: "Run",
      description: "Great run in the park",
      private_note: "Felt strong today",
      elapsed_time: 3600,
      moving_time: 3500,
      distance: 10000,
      max_heart_rate: 180,
      max_speed: 4.5,
      average_speed: 4,
      total_elevation_gain: 100,
      elev_low: 50,
      elev_high: 150,
      calories: 500,
    };
  });

  test("renders activity with default template", () => {
    const renderer = new ActivityRenderer(
      DEFAULT_TEMPLATE,
      "yyyy-MM-dd HH:mm:ss",
    );
    const result = renderer.render(activity);

    const expected = `# Morning Run

[https://www.strava.com/activities/123456789](https://www.strava.com/activities/123456789)

Description: Great run in the park

> [!NOTE] Private note
> Felt strong today

#Strava
`;

    expect(result).toBe(expected);
  });

  test("renders activity with custom template", () => {
    const customTemplate = `
Activity: {{name}}
Date: {{start_date}}
Sport Type: {{sport_type}}
Distance: {{distance}} meters
Time: {{elapsed_time}} seconds
Description: {{description}}
`;
    const renderer = new ActivityRenderer(
      customTemplate,
      "yyyy-MM-dd HH:mm:ss",
    );
    const result = renderer.render(activity);

    const expected = `
Activity: Morning Run
Date: 2023-04-15 10:30:00
Sport Type: Run
Distance: 10000 meters
Time: 3600 seconds
Description: Great run in the park
`;

    expect(result).toBe(expected);
  });

  test("renders front matter", () => {
    const renderer = new ActivityRenderer(
      DEFAULT_TEMPLATE,
      "yyyy-MM-dd HH:mm:ss",
      ["id", "name", "sport_type", "distance"],
    );
    const result = renderer.render(activity);

    const expected = `---
id: 123456789
name: Morning Run
sport_type: Run
distance: 10000
---
# Morning Run

[https://www.strava.com/activities/123456789](https://www.strava.com/activities/123456789)

Description: Great run in the park

> [!NOTE] Private note
> Felt strong today

#Strava
`;

    expect(result).toBe(expected);
  });

  test("formats date correctly", () => {
    const renderer = new ActivityRenderer(
      "{{start_date}}",
      "yyyy-MM-dd HH:mm:ss",
    );
    const result = renderer.render(activity);

    const expected = "2023-04-15 10:30:00";

    expect(result).toBe(expected);
  });

  test("renders activity with missing description", () => {
    const activityWithoutDescription = { ...activity };
    activityWithoutDescription.description = "";

    const renderer = new ActivityRenderer(
      DEFAULT_TEMPLATE,
      "yyyy-MM-dd HH:mm:ss",
    );
    const result = renderer.render(activityWithoutDescription);

    const expected = `# Morning Run

[https://www.strava.com/activities/123456789](https://www.strava.com/activities/123456789)

> [!NOTE] Private note
> Felt strong today

#Strava
`;

    expect(result).toBe(expected);
  });

  test("renders activity with missing private note", () => {
    const activityWithoutPrivateNote = { ...activity };
    activityWithoutPrivateNote.private_note = "";

    const renderer = new ActivityRenderer(
      DEFAULT_TEMPLATE,
      "yyyy-MM-dd HH:mm:ss",
    );
    const result = renderer.render(activityWithoutPrivateNote);

    const expected = `# Morning Run

[https://www.strava.com/activities/123456789](https://www.strava.com/activities/123456789)

Description: Great run in the park

#Strava
`;

    expect(result).toBe(expected);
  });

  test("renders activity icon in frontmatter and content", () => {
    const customTemplate = `
# {{icon}} {{name}}
Sport Type: {{sport_type}}
`;
    const renderer = new ActivityRenderer(
      customTemplate,
      "yyyy-MM-dd HH:mm:ss",
      ["icon"],
    );
    const result = renderer.render(activity);

    const expected = `---
id: 123456789
icon: 🏃
---

# 🏃 Morning Run
Sport Type: Run
`;

    expect(result).toBe(expected);
  });

  test("renders correct icons for different sport types", () => {
    const template = "{{icon}} {{sport_type}}";
    const renderer = new ActivityRenderer(template, "yyyy-MM-dd HH:mm:ss");

    const testCases = [
      { sport_type: "Run", expectedIcon: "🏃" },
      { sport_type: "Ride", expectedIcon: "🚴" },
      { sport_type: "Swim", expectedIcon: "🏊" },
      { sport_type: "AlpineSki", expectedIcon: "⛷️" },
      { sport_type: "Golf", expectedIcon: "⛳" },
      { sport_type: "Hike", expectedIcon: "🥾" },
      { sport_type: "Walk", expectedIcon: "🚶" },
      { sport_type: "Snowboard", expectedIcon: "🏂" },
      { sport_type: "Workout", expectedIcon: "🏋️" },
      { sport_type: "Yoga", expectedIcon: "🧘" },
      { sport_type: "UnknownActivity", expectedIcon: "🏅" },
    ];

    testCases.forEach(({ sport_type, expectedIcon }) => {
      const testActivity = { ...activity, sport_type };
      const result = renderer.render(testActivity);
      expect(result).toBe(`${expectedIcon} ${sport_type}`);
    });
  });
});
