import { default as strava, RefreshTokenResponse } from "strava-v3";
import { AuthenticationSettings } from "./Settings";

export class Authentication {
  settings: AuthenticationSettings;

  private readonly SCOPES = 'read,activity:read_all';
  private readonly REDIRECT_URI = 'obsidian://obsidian-strava-sync';

  constructor(settings: AuthenticationSettings) {
    this.settings = settings;
    this.configureStrava();
  }

  async initiateOAuthFlow() {
    window.open(
      await strava.oauth.getRequestAccessURL({
        scope: this.SCOPES,
        approval_prompt: 'force'
      }),
      '_blank'
    );
  }

  isAuthenticated() {
    return this.settings.stravaAccessToken && this.settings.stravaRefreshToken && this.settings.stravaTokenExpiresAt;
  }

  async exchangeCodeForToken(code: string) {
    const tokenResponse: RefreshTokenResponse = await strava.oauth.getToken(code);

    this.settings.stravaAccessToken = tokenResponse.access_token;
    this.settings.stravaRefreshToken = tokenResponse.refresh_token;
    this.settings.stravaTokenExpiresAt = tokenResponse.expires_at;

    this.configureStrava();
  }

  async refreshTokenIfExpired() {
    if (this.isAuthenticated() && Date.now() / 1000 > this.settings.stravaTokenExpiresAt!) {
      await this.refreshToken();
    }
  }

  async refreshToken() {
    if (!this.isAuthenticated()) {
      throw new Error("Not authenticated. Please authenticate with Strava first.");
    }

    const tokenResponse: RefreshTokenResponse = await strava.oauth.refreshToken(this.settings.stravaRefreshToken!);

    this.settings.stravaAccessToken = tokenResponse.access_token;
    this.settings.stravaRefreshToken = tokenResponse.refresh_token;
    this.settings.stravaTokenExpiresAt = tokenResponse.expires_at;

    this.configureStrava();
  }

  private configureStrava() {
    strava.config({
      access_token: this.settings.stravaAccessToken || '',
      client_id: this.settings.stravaClientId,
      client_secret: this.settings.stravaClientSecret,
      redirect_uri: this.REDIRECT_URI
    });
  }
}
