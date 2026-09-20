export const FTC_SCOUT_SEASON = 2025;

export type ScoutEvent = {
  season: number;
  code: string;
  name: string;
  start: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};

export type ScoutTeam = { name: string; number: number };

async function scoutRequest(url: string, options?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`FTCScout request failed (${response.status}).`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchScoutEvents(search: string): Promise<ScoutEvent[]> {
  const data = await scoutRequest(
    `https://api.ftcscout.org/rest/v1/events/search/${FTC_SCOUT_SEASON}?searchText=${encodeURIComponent(search)}`,
  );
  if (!Array.isArray(data) || !data.every((event) =>
    typeof event?.code === "string" && typeof event?.name === "string" &&
    typeof event?.season === "number" && typeof event?.start === "string"
  )) throw new Error("FTCScout returned an invalid event list.");
  return data;
}

export async function fetchScoutTeams(event: ScoutEvent): Promise<ScoutTeam[]> {
  const result = await scoutRequest("https://api.ftcscout.org/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query EventTeams($season: Int!, $code: String!) {
        eventByCode(season: $season, code: $code) {
          teams { team { name number } }
        }
      }`,
      variables: { season: event.season, code: event.code },
    }),
  });
  if (result.errors?.length || !result.data?.eventByCode) {
    throw new Error("FTCScout could not load this event’s teams.");
  }
  const entries = result.data.eventByCode.teams;
  if (!Array.isArray(entries) || !entries.every((entry) =>
    typeof entry?.team?.name === "string" && typeof entry?.team?.number === "number"
  )) throw new Error("FTCScout returned an invalid team list.");
  return entries.map(({ team }: { team: ScoutTeam }) => ({
    name: team.name, number: team.number,
  })).sort((a, b) => a.number - b.number);
}
