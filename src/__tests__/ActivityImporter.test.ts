import * as fs from "node:fs";
import * as path from "node:path";
import { ActivityImporter } from "../ActivityImporter";
import { StravaApi } from "../StravaApi";

jest.mock("../StravaApi");

describe("ActivityImporter", () => {
  let activityImporter: ActivityImporter;
  let mockStravaApi: jest.Mocked<StravaApi>;

  beforeEach(() => {
    mockStravaApi = new StravaApi({} as any) as jest.Mocked<StravaApi>;
    mockStravaApi.refreshTokenIfExpired = jest
      .fn()
      .mockResolvedValue(undefined);
    activityImporter = new ActivityImporter(mockStravaApi);
  });

  it("should import latest activities", async () => {
    const mockActivitiesList = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../../assets/activities.json"),
        "utf8",
      ),
    );
    const mockActivity1 = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../../assets/activity_12271989718.json"),
        "utf8",
      ),
    );
    const mockActivity2 = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../../assets/activity_12288940553.json"),
        "utf8",
      ),
    );
    const mockActivity3 = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../../assets/activity_12315055573.json"),
        "utf8",
      ),
    );

    (mockStravaApi.listActivities as jest.Mock).mockResolvedValue(
      mockActivitiesList,
    );
    (mockStravaApi.getActivity as jest.Mock)
      .mockResolvedValueOnce(mockActivity1)
      .mockResolvedValueOnce(mockActivity2)
      .mockResolvedValueOnce(mockActivity3);

    const activities = await activityImporter.importLatestActivities();

    expect(mockStravaApi.refreshTokenIfExpired).toHaveBeenCalled();
    expect(mockStravaApi.listActivities).toHaveBeenCalledWith({ per_page: 30 });
    expect(mockStravaApi.getActivity).toHaveBeenCalledTimes(3);

    expect(activities).toHaveLength(3);
    expect(activities[0]).toMatchObject({
      id: 12271989718,
      name: "Lunch Run",
      sport_type: "Run",
      start_date: new Date("2024-08-24T10:47:26Z"),
      elapsed_time: 1955,
      distance: 4551.3,
      gear_name: "Nike Zoom Vomero 11",
      workout_type: "General",
      splits: [
        {
          distance: 1609.4,
          elapsed_time: 540,
          elevation_difference: 0.0,
          moving_time: 540,
          split: 1,
          average_speed: 2.98,
          average_grade_adjusted_speed: 2.98,
          average_heartrate: 162.4925925925926,
          pace_zone: 1,
        },
        {
          distance: 1609.7,
          elapsed_time: 551,
          elevation_difference: 0.0,
          moving_time: 551,
          split: 2,
          average_speed: 2.92,
          average_grade_adjusted_speed: 2.92,
          average_heartrate: 165.61161524500906,
          pace_zone: 1,
        },
      ],
    });

    expect(activities[1]).toMatchObject({
      id: 12288940553,
      name: "Dynamo Challenge 2024",
      sport_type: "Ride",
      start_date: new Date("2024-08-28T05:07:43Z"),
      elapsed_time: 38846,
      distance: 154081.0,
      gear_name: "2021 Cannondale Synapse",
      workout_type: "General",
    });

    expect(activities[2]).toMatchObject({
      id: 12315055573,
      name: "Lunch Swim",
      sport_type: "Swim",
      start_date: new Date("2024-09-09T10:23:12Z"),
      elapsed_time: 1697,
      distance: 1000.0,
    });
  });
});
