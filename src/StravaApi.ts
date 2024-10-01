import type { AuthenticationSettings } from "./Settings";

export class StravaApi {
  private readonly SCOPES = "read,activity:read_all";
  private readonly REDIRECT_URI = "obsidian://obsidian-strava-sync";

  settings: AuthenticationSettings;

  constructor(settings: AuthenticationSettings) {
    this.settings = settings;
  }

  isAuthenticated(): boolean {
    return !!(
      this.settings.stravaAccessToken &&
      this.settings.stravaRefreshToken &&
      this.settings.stravaTokenExpiresAt
    );
  }

  buildAuthorizeUrl(): string {
    const params = new URLSearchParams({
      client_id: this.settings.stravaClientId,
      redirect_uri: this.REDIRECT_URI,
      response_type: "code",
      scope: this.SCOPES,
      approval_prompt: "force",
    });

    return `https://www.strava.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string) {
    this.updateTokens(
      await this.tokenRequest({
        grant_type: "authorization_code",
        code: code,
      }),
    );
  }

  async refreshTokenIfExpired(): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error(
        "Not authenticated. Please authenticate with Strava first.",
      );
    }

    if (Date.now() / 1000 > this.settings.stravaTokenExpiresAt!) {
      await this.refreshToken();
    }
  }

  private async refreshToken() {
    if (!this.settings.stravaRefreshToken) {
      throw new Error("No refresh token available. Please re-authenticate.");
    }

    this.updateTokens(
      await this.tokenRequest({
        grant_type: "refresh_token",
        refresh_token: this.settings.stravaRefreshToken,
      }),
    );
  }

  private async tokenRequest(params: Record<string, string>): Promise<any> {
    const response = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: this.settings.stravaClientId,
        client_secret: this.settings.stravaClientSecret,
        ...params,
      }),
    });

    return response.json();
  }

  private updateTokens(response: any) {
    this.settings.stravaAccessToken = response.access_token;
    this.settings.stravaRefreshToken = response.refresh_token;
    this.settings.stravaTokenExpiresAt = response.expires_at;
  }

  async listActivities(params: { per_page: number; after?: number }): Promise<
    any[]
  > {
    await this.refreshTokenIfExpired();
    const queryParams = new URLSearchParams(params as any).toString();
    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${this.settings.stravaAccessToken}`,
        },
      },
    );

    return response.json();
  }

  async getActivity(id: number): Promise<any> {
    await this.refreshTokenIfExpired();
    const response = await fetch(
      `https://www.strava.com/api/v3/activities/${id}`,
      {
        headers: {
          Authorization: `Bearer ${this.settings.stravaAccessToken}`,
        },
      },
    );

    return response.json();
  }
}
