/// <reference lib="deno.ns" />

import { createClient } from "npm:@supabase/supabase-js@2";

const SYLVIA_API_KEY = Deno.env.get("SYLVIA_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;

const TRACKING_CODE_RE = /\bTRK-[A-Z0-9]{5}\b/g;
const PRICE_RE = /\$?\d+(\.\d{2})?/g;

interface SubredditConfig {
  id: string;
  subreddit: string;
  active: boolean;
}

interface SylviaPost {
  id: string;
  title?: string;
  subreddit?: string;
  author?: string;
  permalink?: string;
  selftext?: string;
  score?: number;
  created_utc?: number;
  thumbnail?: string;
  url?: string;
  preview?: { images?: Array<{ source?: { url?: string } }> };
  media_metadata?: Record<string, { e?: string; s?: { u?: string }; p?: Array<{ u?: string }> }>;
  gallery_data?: { items?: Array<{ media_id?: string }> };
}

interface SylviaResponse {
  data?: { posts?: SylviaPost[] };
  success?: boolean;
}

function extractImages(post: SylviaPost): string[] {
  const images: string[] = [];

  if (post.preview?.images) {
    for (const img of post.preview.images) {
      const url = img.source?.url;
      if (url) images.push(url.replace(/&amp;/g, "&"));
    }
  }

  if (post.media_metadata) {
    for (const key of Object.keys(post.media_metadata)) {
      const meta = post.media_metadata[key];
      const src = meta.s?.u;
      if (src) images.push(src.replace(/&amp;/g, "&"));
    }
  }

  if (post.url && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(post.url)) {
    images.push(post.url.replace(/&amp;/g, "&"));
  }

  return images;
}

function extractPrice(text: string): string | null {
  const matches = text.match(PRICE_RE);
  if (!matches || matches.length === 0) return null;
  return matches[0].replace(/^\$/, "");
}

function extractTrackingCodes(text: string): string[] {
  const matches = text.matchAll(TRACKING_CODE_RE);
  return [...matches].map((m) => m[0]);
}

function normalizeImageUrl(url: string | null): string | null {
  if (!url) return null;
  const decoded = url.replace(/&amp;/g, "&");
  if (decoded.startsWith("http://") || decoded.startsWith("https://")) return decoded;
  return null;
}

async function cleanupOldPosts(supabase: ReturnType<typeof createClient>) {
  const retentionDays = 7;
  try {
    const { data: setting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "post_retention_days")
      .single();

    if (setting) {
      const val = typeof setting.value === "number"
        ? setting.value
        : parseInt(String(setting.value), 10);
      if (val >= 1) {
        const cutoff = new Date(Date.now() - val * 86400000).toISOString();
        const { count } = await supabase
          .from("posts")
          .delete({ count: "exact" })
          .lt("ingested_at", cutoff);
        if (count) console.log(`TTL cleanup: deleted ${count} old posts (older than ${val} days)`);
      }
    }
  } catch (err) {
    console.error("TTL cleanup error:", err);
  }
}

Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get("authorization");
    const cronHeader = req.headers.get("x-cron-secret");
    const isAdmin = authHeader === `Bearer ${ADMIN_SECRET}`;
    const isCron = CRON_SECRET && cronHeader === CRON_SECRET;

    if (!isAdmin && !isCron) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    await cleanupOldPosts(supabase);

    const { data: subreddits, error: configError } = await supabase
      .from("subreddits_config")
      .select("id, subreddit, active")
      .eq("active", true);

    if (configError) {
      console.error("Failed to fetch subreddits:", configError.message);
      return new Response(JSON.stringify({ error: "db_error", detail: configError.message }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    if (!subreddits || subreddits.length === 0) {
      return new Response(JSON.stringify({ message: "no active subreddits" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    const { data: setting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "require_tracking_code")
      .single();

    const requireTrackingCode = setting
      ? setting.value === true || setting.value === "true"
      : true;

    let totalInserted = 0;
    const errors: Array<{ subreddit: string; error: string }> = [];

    for (const config of subreddits as SubredditConfig[]) {
      try {
        const apiUrl =
          `https://api.sylvia-api.com/v1/reddit/r/${config.subreddit}/new?limit=100`;

        const response = await fetch(apiUrl, {
          headers: { "X-API-KEY": SYLVIA_API_KEY },
        });

        if (response.status === 429) {
          console.warn(`Rate limited on r/${config.subreddit}, skipping`);
          errors.push({ subreddit: config.subreddit, error: "rate_limited" });
          continue;
        }

        if (response.status === 403) {
          console.warn(`Forbidden on r/${config.subreddit}, skipping`);
          errors.push({ subreddit: config.subreddit, error: "forbidden" });
          continue;
        }

        if (!response.ok) {
          console.error(`HTTP ${response.status} on r/${config.subreddit}`);
          errors.push({ subreddit: config.subreddit, error: `http_${response.status}` });
          continue;
        }

        const body = await response.text();
        if (!body) continue;

        let posts: SylviaPost[];
        try {
          const parsed = JSON.parse(body);
          if (Array.isArray(parsed)) {
            posts = parsed;
          } else if (parsed.data?.posts) {
            posts = parsed.data.posts;
          } else if (parsed.data?.children) {
            posts = parsed.data.children.map((c: { data: SylviaPost }) => c.data);
          } else {
            posts = [];
          }
        } catch {
          console.error(`Failed to parse JSON for r/${config.subreddit}`);
          continue;
        }

        for (const post of posts) {
          if (post.selftext === "[removed]" || post.selftext === "[deleted]") {
            try {
              await supabase.from("posts").delete().eq("reddit_post_id", post.id);
            } catch (err) {
              console.error(`Error deleting removed post ${post.id}:`, err);
            }
            continue;
          }

          const fullText = [post.title, post.selftext].filter(Boolean).join(" ");
          const trackingCodes = extractTrackingCodes(fullText);

          if (requireTrackingCode && trackingCodes.length === 0) continue;


          const upsertPost = async (vendorId: string | null) => {
            const images = extractImages(post);
            const thumbnail = normalizeImageUrl(post.thumbnail ?? images[0] ?? null);
            const extractedPrice = extractPrice(fullText);
            const postUrl = post.permalink
              ? `https://reddit.com${post.permalink}`
              : post.url || null;
            const createdUtc = post.created_utc
              ? new Date(post.created_utc * 1000).toISOString()
              : null;

            const { error: upsertError } = await supabase.from("posts").upsert(
              {
                vendor_id: vendorId,
                reddit_post_id: post.id,
                title: post.title || "",
                subreddit: config.subreddit,
                author: post.author || null,
                post_url: postUrl,
                body_snippet: post.selftext?.substring(0, 500) ?? null,
                body_full: post.selftext ?? null,
                images,
                thumbnail,
                extracted_price: extractedPrice,
                reddit_score: post.score ?? null,
                created_utc: createdUtc,
              },
              { onConflict: "reddit_post_id" }
            );

            if (!upsertError) totalInserted++;
          };

          if (trackingCodes.length > 0) {
            for (const trackingCode of trackingCodes) {
              try {
                const { data: vendor } = await supabase
                  .from("vendors")
                  .select("id")
                  .eq("tracking_code", trackingCode)
                  .single();

                await upsertPost(vendor?.id ?? null);
              } catch (err) {
                console.error(`Error processing post ${post.id}:`, err);
              }
            }
          } else {
            try {
              await upsertPost(null);
            } catch (err) {
              console.error(`Error processing post ${post.id}:`, err);
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Error polling r/${config.subreddit}:`, msg);
        errors.push({ subreddit: config.subreddit, error: msg });
      }
    }

    return new Response(
      JSON.stringify({ inserted: totalInserted, subreddits: subreddits.length, errors }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Fatal error:", msg);
    return new Response(JSON.stringify({ error: "internal", detail: msg }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});
