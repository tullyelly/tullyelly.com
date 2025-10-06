export type TrackPayload = Record<string, unknown>;

export interface AnalyticsClient {
  track(event: string, payload?: TrackPayload): void;
}

const analyticsImpl: AnalyticsClient = {
  track() {
    // Placeholder analytics client; replace with production implementation when available.
  },
};

export const analytics = analyticsImpl;
