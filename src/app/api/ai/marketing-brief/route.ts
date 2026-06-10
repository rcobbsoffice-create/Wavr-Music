import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/apiAuth";

// WHO to target by genre
const genreTargets: Record<string, string> = {
  Trap:      "up-and-coming trap artists, SoundCloud rappers building their catalog, and drill artists crossing into mainstream",
  "Hip-Hop": "independent hip-hop artists, battle rappers, and lyricists seeking classic sample-influenced beats",
  Drill:     "UK and Chicago drill artists, up-and-coming street rappers, and content creators in urban niches",
  "R&B":     "R&B singers, neo-soul artists, and vocalists looking for smooth, radio-ready instrumentals",
  Afrobeats: "Afrobeats and Afropop artists, diaspora creators on TikTok, and artists targeting African and UK markets",
  Pop:       "pop vocalists, indie artists pursuing Spotify editorial playlists, and commercial sync opportunities",
  "Lo-Fi":   "study/chill content creators, Spotify playlist curators, YouTube lofi channels, and bedroom producers",
  House:     "DJs, club promoters, electronic music producers, and artists targeting festival audiences",
};

// WHERE to post by genre
const genrePlatforms: Record<string, string[]> = {
  Trap:      ["#trapbeats #newbeat #trapmusic", "Reddit: r/trapproduction, r/WeAreTheMusicMakers", "TikTok producer community"],
  "Hip-Hop": ["#hiphopbeats #boom bap #producerlife", "Reddit: r/hiphopheads, r/MusicProduction", "Twitter hip-hop community"],
  Drill:     ["#drillbeats #ukdrill #drillmusic", "Instagram Reels with drill tag", "YouTube drill channels"],
  "R&B":     ["#rnbbeats #soulbeats #smoothrnb", "Instagram Stories for vocalists", "Twitter R&B vocalist community"],
  Afrobeats: ["#afrobeats #afropop #afrobeatproducer", "TikTok Afrobeats hashtags", "WhatsApp groups, Nigerian Twitter"],
  Pop:       ["#popbeats #popproducer #indieartist", "Instagram + TikTok for commercial reach", "Sync licensing forums"],
  "Lo-Fi":   ["#lofibeats #studymusic #chilledcow", "Submit to YouTube lofi playlists", "Reddit: r/LofiHipHop"],
  House:     ["#housemusic #housebeats #dancemusic", "SoundCloud dance/house community", "Beatport forums"],
};

// WHEN context by performance tier
function getTimingAdvice(plays: number, cvr: number): string {
  if (cvr >= 3) return "Your conversion is strong — focus on volume. Drop Thursday 8–11 PM to maximize visibility during peak platform hours. Post on all channels simultaneously for compounding reach.";
  if (cvr >= 1) return "Mid-range conversion — pair a 48-hour promo window (20–30% off) with a Thursday evening post. The urgency + peak timing combo typically lifts conversions 2–3x.";
  if (plays >= 100) return "High plays but low conversions signal a pricing or visibility issue. Run a 50% flash sale for 24 hours on Friday evening. Urgency combined with a lower barrier typically converts window-shoppers.";
  return "Low play count — focus on discovery first. Post preview clips on TikTok and Instagram Reels Tuesday and Thursday evening to build organic reach before pushing a sale.";
}

function buildBeatBrief(title: string, genre: string, bpm: number, key: string, mood: string, plays: number, sales: number, revenue: number, cvr: number): string {
  const target = genreTargets[genre] ?? `${genre} artists and producers`;
  const platforms = genrePlatforms[genre] ?? ["#newbeat #producer #beatmaker"];
  const timing = getTimingAdvice(plays, cvr);

  const earningLabel = revenue >= 500 ? "high-earning" : revenue >= 100 ? "monetizing" : "early-stage";
  const playLabel = plays >= 1000 ? `${(plays / 1000).toFixed(1)}K` : String(plays);

  return `1. WHO TO TARGET
"${title}" (${genre}, ${bpm} BPM, ${key}${mood ? `, ${mood}` : ""}) is best suited for ${target}. With a ${cvr.toFixed(1)}% CVR and ${playLabel} plays, this is an ${earningLabel} beat. Reach out directly to artists in your DMs who consistently post about needing ${genre.toLowerCase()} beats — they convert higher than cold audiences.

2. WHERE TO POST
Primary: Post a 15–30 second preview on TikTok and Instagram Reels — use ${platforms[0]}. Secondary: Drop in ${platforms[1]} for discovery by serious producers and artists. Include BPM, key, and your direct beat link in the caption. Pin your profile link so the beat link is always one tap away.

3. WHEN TO PROMOTE
${timing} Best days platform-wide: Thursday and Friday evenings (8–11 PM). Repeat your post across formats (Reel → Story → Tweet) within 48 hours of the initial drop for max algorithm coverage without extra content.`;
}

function buildCampaignBrief(title: string, beatTitle: string, discount: string, channel: string, urgency: string): string {
  const discountLine = discount ? `${discount}% discount` : "no discount offer";
  const channelGuide: Record<string, string> = {
    newsletter: "Subject line formula: '[First Name], [Beat/Artist] + [Urgency Hook]'. Open rates peak Tuesday 10 AM and Sunday 3 PM. Use a 3-section email: hook (1 sentence), value (beat + price), CTA (single big button). Segment by genre preference for 40%+ higher CTR.",
    social: "Post format: Beat preview clip (15 sec) + hook text overlay. Include BPM/key on screen. Post Thursday 8–11 PM for peak reach. Repost as Story 24 hours later. Tag 3 mid-size artists (50K–500K followers) relevant to the genre for organic reach.",
    push: "Push notification copy: Under 90 characters total. Lead with urgency: '⚡ [X]% off [Beat] — [X] hours only'. Send Thursday or Friday 6–8 PM. Follow up with a 'Last chance' push 4 hours before expiry.",
    all: "Multi-channel sequence: (1) Email Tuesday AM to warm segment, (2) Social post Thursday 8 PM, (3) Push notification Friday 6 PM as urgency reminder, (4) Final Story on Saturday noon. Each touchpoint reinforces urgency without being redundant.",
  };

  const urgencyPsychology: Record<string, string> = {
    "24h": "24-hour windows create the strongest urgency but need significant amplification. Post across all channels within the first 2 hours. Use countdown language: 'Gone in 24 hours.'",
    "48h": "48-hour sweet spot — enough time for organic sharing while maintaining urgency. Launch Thursday PM, let it run through the weekend peak, close Saturday night.",
    "72h": "72-hour windows suit catalog-wide promos. Structure as: Day 1 = Launch, Day 2 = Social amplification, Day 3 = 'Last chance' blast across all channels.",
    "1 week": "Week-long campaigns work best for new producer introductions or catalog drops. Run daily content (one beat preview per day) to sustain attention across 7 days.",
    ongoing: "Evergreen campaigns need a hook beyond price. Lead with social proof (plays count, notable buyers), exclusive content (stems preview), or scarcity (limited exclusive licenses remaining).",
  };

  return `CAMPAIGN HOOK
"${title}" — ${discountLine}${beatTitle ? ` featuring "${beatTitle}"` : ", platform-wide"}. Lead message: 'This is the sound [target artist type] has been waiting for. [X] hours only.'

TARGET AUDIENCE SEGMENTS
1. Active Buyers — Users who purchased in last 90 days. Highest intent, respond to exclusivity messaging: 'Early access just for you.'
2. High-Play Non-Buyers — Listeners with 5+ plays on ${beatTitle || "featured beats"} who haven't purchased. Use price anchoring: show original price crossed out.
3. Genre-Matched New Users — Users who joined in last 30 days and match this genre. Onboarding + offer combo converts at 2x standard rate.

CHANNEL EXECUTION
${channelGuide[channel] ?? channelGuide.all}

TIMING & URGENCY
${urgencyPsychology[urgency] ?? urgencyPsychology["48h"]}

HASHTAGS & DISCOVERY
#wavr #${(beatTitle || "newbeat").toLowerCase().replace(/\s+/g, "")} #beatmaker #beatsforsale #producerlife`;
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { type } = body;

    if (type === "campaign") {
      const { title, beatTitle, discount, channel, urgency } = body;
      if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
      const description = buildCampaignBrief(title, beatTitle ?? "", discount ?? "", channel ?? "all", urgency ?? "48h");
      return NextResponse.json({ description });
    }

    // Default: beat marketing brief
    const { title, genre, bpm, key, mood, plays, sales, revenue, cvr } = body;
    if (!genre) return NextResponse.json({ error: "genre required" }, { status: 400 });
    const description = buildBeatBrief(
      title ?? "Your Beat", genre, bpm ?? 140, key ?? "", mood ?? "",
      plays ?? 0, sales ?? 0, revenue ?? 0, cvr ?? 0
    );
    return NextResponse.json({ description });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
