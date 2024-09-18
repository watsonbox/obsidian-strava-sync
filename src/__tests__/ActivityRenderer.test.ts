import { ActivityRenderer, DEFAULT_TEMPLATE } from '../ActivityRenderer';
import { Activity } from '../Activity';

jest.mock('obsidian', () => ({
  stringifyYaml: jest.fn().mockImplementation((obj) => {
    // Simple YAML-like string representation
    return Object.entries(obj).map(([key, value]) => `${key}: ${value}\n`).join('');
  })
}));

jest.mock('luxon', () => ({
  DateTime: {
    fromJSDate: jest.fn().mockReturnValue({
      toFormat: jest.fn().mockReturnValue('2023-04-15 10:30:00')
    })
  }
}));

describe('ActivityRenderer', () => {
  let activity: Activity;

  beforeEach(() => {
    activity = {
      id: 123456789,
      start_date: new Date('2023-04-15T10:30:00Z'),
      name: 'Morning Run',
      type: 'Run',
      description: 'Great run in the park',
      private_note: 'Felt strong today',
      elapsed_time: 3600,
      moving_time: 3500,
      distance: 10000,
      max_heart_rate: 180,
      max_speed: 4.5,
      average_speed: 4,
      total_elevation_gain: 100,
      elev_low: 50,
      elev_high: 150,
      calories: 500
    };
  });

  test('renders activity with default template', () => {
    const renderer = new ActivityRenderer(DEFAULT_TEMPLATE, 'yyyy-MM-dd HH:mm:ss');
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

  test('renders activity with custom template', () => {
    const customTemplate = `
Activity: {{name}}
Date: {{start_date}}
Type: {{type}}
Distance: {{distance}} meters
Time: {{elapsed_time}} seconds
Description: {{description}}
`;
    const renderer = new ActivityRenderer(customTemplate, 'yyyy-MM-dd HH:mm:ss');
    const result = renderer.render(activity);

    const expected = `
Activity: Morning Run
Date: 2023-04-15 10:30:00
Type: Run
Distance: 10000 meters
Time: 3600 seconds
Description: Great run in the park
`;

    expect(result).toBe(expected);
  });

  test('renders front matter', () => {
    const renderer = new ActivityRenderer(DEFAULT_TEMPLATE, 'yyyy-MM-dd HH:mm:ss', ['id', 'name', 'type', 'distance']);
    const result = renderer.render(activity);

    const expected = `---
id: 123456789
name: Morning Run
type: Run
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

  test('formats date correctly', () => {
    const renderer = new ActivityRenderer('{{start_date}}', 'yyyy-MM-dd HH:mm:ss');
    const result = renderer.render(activity);

    const expected = '2023-04-15 10:30:00';

    expect(result).toBe(expected);
  });
});
