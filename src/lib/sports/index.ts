import "server-only";
import type { SportsDataProvider } from "@/lib/sports/types";
import { MockSportsDataProvider } from "@/lib/sports/mockProvider";
import { FlashscoreProvider } from "@/lib/sports/flashscoreProvider";

/**
 * Resolves the active SportsDataProvider. Defaults to the mock so the app
 * runs fully out of the box; set SPORTS_DATA_PROVIDER=flashscore once
 * FlashscoreProvider's endpoints are implemented (see
 * docs/sports-data-provider.md).
 */
export function getSportsDataProvider(): SportsDataProvider {
  if (process.env.SPORTS_DATA_PROVIDER === "flashscore") {
    try {
      return new FlashscoreProvider();
    } catch (error) {
      console.error("[sports] falling back to mock provider:", (error as Error).message);
      return new MockSportsDataProvider();
    }
  }

  return new MockSportsDataProvider();
}

export * from "@/lib/sports/types";
