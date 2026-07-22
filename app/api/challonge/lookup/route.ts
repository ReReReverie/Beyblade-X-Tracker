import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { consumeChallongeRequest, getChallongeUsage } from "@/lib/challonge-usage";

const CHALLONGE_API_KEY = process.env.CHALLONGE_API_KEY || "";

/**
 * Extract tournament slug from a Challonge URL.
 * Supports formats:
 *   https://challonge.com/my_tournament
 *   https://challonge.com/tournaments/12345
 *   https://subdomain.challonge.com/my_tournament
 */
function extractTournamentSlug(url: string): { slug: string; subdomain?: string } | null {
  try {
    const parsed = new URL(url.trim());
    const hostname = parsed.hostname;

    if (hostname !== "challonge.com" && !hostname.endsWith(".challonge.com")) return null;

    const parts = hostname.split(".");
    const subdomain = parts.length === 3 && parts[0] !== "www" ? parts[0] : undefined;

    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts.length === 0) return null;

    if (pathParts[0] === "tournaments" && pathParts[1]) {
      return { slug: pathParts[1], subdomain };
    }

    return { slug: pathParts[0], subdomain };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!CHALLONGE_API_KEY) {
    return NextResponse.json({ error: "Challonge API key is not configured." }, { status: 500 });
  }

  const isAdmin = session.user.role === "ADMIN";

  // Enforce monthly API limit (global 500 + personal 5, admin unlimited personal)
  const usage = await consumeChallongeRequest(session.user.id, isAdmin);
  if (!usage.allowed) {
    return NextResponse.json({
      error: usage.reason || "Monthly Challonge API limit reached.",
      usage
    }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const challongeUrl = typeof body?.url === "string" ? body.url : "";

  const extracted = extractTournamentSlug(challongeUrl);
  if (!extracted) {
    return NextResponse.json({ error: "Invalid Challonge URL. Use a link like https://challonge.com/your_tournament" }, { status: 400 });
  }

  const { slug, subdomain } = extracted;

  try {
    // Single API call using v1 with include_participants and include_matches
    const tournamentSlug = subdomain ? `${subdomain}-${slug}` : slug;
    const apiUrl = `https://api.challonge.com/v1/tournaments/${tournamentSlug}.json?api_key=${CHALLONGE_API_KEY}&include_participants=1&include_matches=1`;

    const res = await fetch(apiUrl);
    if (!res.ok) {
      const status = res.status;
      if (status === 404) return NextResponse.json({ error: "Tournament not found. Check the URL or make sure it's not set to private." }, { status: 404 });
      if (status === 401) return NextResponse.json({ error: "Challonge API key is invalid or expired." }, { status: 401 });
      return NextResponse.json({ error: `Challonge API error (${status}).` }, { status: 502 });
    }

    const data = await res.json();
    const tournament = data?.tournament;
    if (!tournament) {
      return NextResponse.json({ error: "Invalid tournament data received." }, { status: 502 });
    }

    const tournamentName = tournament.name || slug;
    const tournamentId = tournament.id;

    // Parse participants
    const rawParticipants: any[] = tournament.participants || [];
    const participants = rawParticipants.map((entry: any) => {
      const p = entry.participant || entry;
      return {
        id: String(p.id),
        name: p.display_name || p.name || p.username || `Participant ${p.id}`,
        seed: p.seed ?? null,
        finalRank: p.final_rank ?? null
      };
    });

    // Parse matches
    const rawMatches: any[] = tournament.matches || [];
    const matches = rawMatches.map((entry: any) => {
      const m = entry.match || entry;
      return {
        id: String(m.id),
        player1Id: m.player1_id != null ? String(m.player1_id) : null,
        player2Id: m.player2_id != null ? String(m.player2_id) : null,
        winnerId: m.winner_id != null ? String(m.winner_id) : null,
        groupId: m.group_id != null ? String(m.group_id) : null,
        state: m.state ?? null
      };
    });

    return NextResponse.json({
      tournamentName,
      tournamentId,
      participants,
      matches
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to connect to Challonge API." }, { status: 502 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const isAdmin = session.user.role === "ADMIN";
  const usage = await getChallongeUsage(session.user.id, isAdmin);
  return NextResponse.json(usage);
}
