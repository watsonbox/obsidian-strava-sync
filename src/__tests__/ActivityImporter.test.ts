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
      summary_polyline: "encoded_summary_polyline",
    });

    expect(activities[1]).toMatchObject({
      id: 12288940553,
      name: "Dynamo Challenge 2024",
      sport_type: "Ride",
      start_date: new Date("2024-08-28T05:07:43Z"),
      elapsed_time: 38846,
      distance: 154081.0,
      summary_polyline: "encoded_summary_polyline",
    });

    expect(activities[2]).toMatchObject({
      id: 12315055573,
      name: "Lunch Swim",
      sport_type: "Swim",
      start_date: new Date("2024-09-09T10:23:12Z"),
      elapsed_time: 1697,
      distance: 1000.0,
    });

    expect(activities[2].summary_polyline).toBeUndefined();
  });
});
