// ============================================================================
// SOCIAL MEDIA VIDEO & AUDIO DOWNLOADER UTILITY (YouTube, TikTok, Facebook, CapCut, Pinterest)
// Supports high-quality MP4 video & crystal-clear MP3 audio extraction (Public & Private/Shared Links)
// ============================================================================

export type SocialPlatform = "youtube" | "tiktok" | "facebook" | "capcut" | "pinterest";

export interface SocialMediaDownloadResult {
  ok: boolean;
  platform: SocialPlatform;
  platformLabel: string;
  sourceUrl: string;
  title: string;
  author?: string;
  duration?: string;
  thumbnail?: string;
  mp4Url: string;
  mp3Url: string;
  proxyMp4Url?: string;
  proxyMp3Url?: string;
  requestedFormat: "mp3" | "mp4" | "both";
  error?: string;
}

export interface DetectedSocialLink {
  platform: SocialPlatform;
  platformLabel: string;
  url: string;
  requestedFormat: "mp3" | "mp4" | "both";
}

export function detectSocialVideoUrl(text: string): DetectedSocialLink | null {
  if (!text) return null;
  const urlMatch = text.match(/https?:\/\/[^\s<>"'`]+/i);
  if (!urlMatch) return null;

  const rawUrl = urlMatch[0].replace(/[),.!?]+$/, "");
  const lowerUrl = rawUrl.toLowerCase();
  const lowerText = text.toLowerCase();

  let platform: SocialPlatform | null = null;
  let platformLabel = "";

  if (
    /(?:youtube\.com\/(?:watch|shorts|embed|live|v)|youtu\.be\/|music\.youtube\.com)/i.test(
      lowerUrl
    )
  ) {
    platform = "youtube";
    platformLabel = "YouTube";
  } else if (/(?:tiktok\.com\/|vm\.tiktok\.com\/|vt\.tiktok\.com\/)/i.test(lowerUrl)) {
    platform = "tiktok";
    platformLabel = "TikTok";
  } else if (
    /(?:(?:www\.|m\.|web\.|mbasic\.|touch\.|l\.|business\.)?facebook\.com\/|fb\.watch\/|fb\.gg\/|fb\.me\/)/i.test(
      lowerUrl
    )
  ) {
    // Allow all Facebook Public & Private video/post/reel/share/group/story links (only skip explicit Messenger chat commands)
    const isExplicitDownloadCmd =
      /(?:^\/(?:dl|download)\b|ទាញយក|ដោនឡូត|download|\bmp4\b|\bmp3\b)/i.test(lowerText);
    const isMessengerOrProfileChatCmd =
      /(?:^\/(?:messenger|fbchat|chatto|autosay|sayto|cmdsay)\b|ឆាតទៅ|ផ្ញើសារទៅ|និយាយទៅ|m\.me\/)/i.test(
        lowerText
      );
    if (isMessengerOrProfileChatCmd && !isExplicitDownloadCmd) {
      return null;
    }
    platform = "facebook";
    platformLabel = "Facebook";
  } else if (
    /(?:(?:www\.|m\.|cc\.|pc\.)?capcut\.com\/|capcutshare\.com\/)/i.test(lowerUrl)
  ) {
    platform = "capcut";
    platformLabel = "CapCut";
  } else if (
    /(?:(?:[a-z0-9-]+\.)?pinterest\.[a-z.]+\/|pin\.it\/|(?:i|v1)\.pinimg\.com\/)/i.test(
      lowerUrl
    )
  ) {
    platform = "pinterest";
    platformLabel = "Pinterest";
  }

  if (!platform) return null;

  const wantsMp3Only =
    /\b(?:mp3|audio|មីភីបី|អឹមភីបី)\b/i.test(lowerText) &&
    !/\b(?:mp4|video|both|ទាំងពីរ)\b/i.test(lowerText);
  const wantsMp4Only =
    /\b(?:mp4)\b/i.test(lowerText) && !/\b(?:mp3|audio|សំឡេង|ចម្រៀង|both|ទាំងពីរ)\b/i.test(lowerText);

  const requestedFormat: "mp3" | "mp4" | "both" = wantsMp3Only
    ? "mp3"
    : wantsMp4Only
    ? "mp4"
    : "both";

  return {
    platform,
    platformLabel,
    url: rawUrl,
    requestedFormat,
  };
}

// Client-side fallback extractor for static hosts (TikTok, CapCut, Pinterest via CORS APIs)
export async function extractSocialMediaClientFallback(
  detected: DetectedSocialLink
): Promise<SocialMediaDownloadResult | null> {
  try {
    if (detected.platform === "tiktok") {
      const normalizeTikwmUrl = (u: string) => {
        if (!u || typeof u !== "string") return "";
        if (u.startsWith("http")) return u;
        return u.startsWith("/") ? `https://www.tikwm.com${u}` : `https://www.tikwm.com/${u}`;
      };
      const res = await fetch(
        `https://www.tikwm.com/api/?url=${encodeURIComponent(detected.url)}&hd=1`
      );
      const data = await res.json();
      if (data?.code === 0 && data?.data) {
        const d = data.data;
        const mp4Url =
          normalizeTikwmUrl(d.hdplay) ||
          normalizeTikwmUrl(d.play) ||
          normalizeTikwmUrl(d.wmplay) ||
          "";
        const mp3Url =
          normalizeTikwmUrl(d.music || d.music_info?.play) || mp4Url || "";
        if (mp4Url || mp3Url) {
          return {
            ok: true,
            platform: "tiktok",
            platformLabel: "TikTok (No Watermark)",
            sourceUrl: detected.url,
            title: d.title || "TikTok Video (No Watermark)",
            author: d.author?.nickname || d.author?.unique_id || "TikTok Creator",
            duration: d.duration ? `${d.duration} វិនាទី` : undefined,
            thumbnail: normalizeTikwmUrl(d.cover || d.origin_cover) || undefined,
            mp4Url: mp4Url || mp3Url,
            mp3Url: mp3Url || mp4Url,
            requestedFormat: detected.requestedFormat,
          };
        }
      }
    }

    if (detected.platform === "facebook") {
      const fbEndpoints = [
        `https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(detected.url)}`,
        `https://backend1.tioo.eu.org/fbdown?url=${encodeURIComponent(detected.url)}`,
      ];
      for (const ep of fbEndpoints) {
        try {
          const r = await fetch(ep);
          if (!r.ok) continue;
          const j = await r.json();
          const dList = Array.isArray(j?.data?.downloads) ? j.data.downloads : [];
          const hdUrl =
            dList.find((x: any) => /hd|720|1080/i.test(String(x?.quality || "")))?.url ||
            dList[0]?.url ||
            j?.HD ||
            j?.Normal_video ||
            "";
          if (hdUrl && typeof hdUrl === "string" && hdUrl.startsWith("http")) {
            return {
              ok: true,
              platform: "facebook",
              platformLabel: "Facebook",
              sourceUrl: detected.url,
              title: j?.data?.title || j?.title || "Facebook Video (Public & Private)",
              author: "Facebook",
              thumbnail: j?.data?.thumbnail || j?.thumbnail || undefined,
              mp4Url: hdUrl,
              mp3Url: hdUrl,
              requestedFormat: detected.requestedFormat,
            };
          }
        } catch {}
      }
    }

    if (detected.platform === "capcut") {
      const endpoints = [
        `https://api.ryzendesu.vip/api/downloader/capcut?url=${encodeURIComponent(detected.url)}`,
        `https://backend1.tioo.eu.org/capcut?url=${encodeURIComponent(detected.url)}`,
      ];
      for (const ep of endpoints) {
        try {
          const r = await fetch(ep);
          if (!r.ok) continue;
          const j = await r.json();
          const d = j?.data || j?.result || j;
          const mp4Url =
            d?.video_ori ||
            d?.video ||
            d?.videoUrl ||
            d?.url ||
            d?.mp4 ||
            d?.originalVideoUrl ||
            "";
          const mp3Url = d?.audio || d?.music || d?.mp3 || mp4Url;
          if (
            mp4Url &&
            typeof mp4Url === "string" &&
            mp4Url.startsWith("http") &&
            !mp4Url.includes("cc_landing/video_")
          ) {
            return {
              ok: true,
              platform: "capcut",
              platformLabel: "CapCut",
              sourceUrl: detected.url,
              title: d?.title || d?.description || "CapCut Template & Video",
              author: d?.author?.name || d?.author || "CapCut Creator",
              thumbnail: d?.cover || d?.thumbnail || undefined,
              mp4Url,
              mp3Url: mp3Url || mp4Url,
              requestedFormat: detected.requestedFormat,
            };
          }
        } catch {}
      }
    }

    if (detected.platform === "pinterest") {
      const endpoints = [
        `https://api.ryzendesu.vip/api/downloader/pinterest?url=${encodeURIComponent(detected.url)}`,
        `https://backend1.tioo.eu.org/pinterest?url=${encodeURIComponent(detected.url)}`,
      ];
      for (const ep of endpoints) {
        try {
          const r = await fetch(ep);
          if (!r.ok) continue;
          const j = await r.json();
          const d = j?.data || j?.result || j;
          const mediaList = Array.isArray(d?.media) ? d.media : Array.isArray(d) ? d : [];
          const bestVideo =
            mediaList.find((m: any) => String(m?.url || "").includes(".mp4"))?.url ||
            d?.video ||
            d?.mp4 ||
            d?.url ||
            "";
          if (bestVideo && typeof bestVideo === "string" && bestVideo.startsWith("http")) {
            return {
              ok: true,
              platform: "pinterest",
              platformLabel: "Pinterest",
              sourceUrl: detected.url,
              title: d?.title || "Pinterest Video & Audio",
              author: d?.author || "Pinterest Creator",
              thumbnail: d?.thumbnail || d?.image || undefined,
              mp4Url: bestVideo,
              mp3Url: bestVideo,
              requestedFormat: detected.requestedFormat,
            };
          }
        } catch {}
      }
    }
  } catch {}
  return null;
}

// Detect if user wants to translate/dub a video's audio or do AI Movie Recap (សម្រាយរឿង) into Khmer
export function isVideoTranslationToKhmerRequest(text: string): boolean {
  if (!text) return false;
  return /(?:^\/(?:dub|translatevideo|khmerdub|recap)\b|បកប្រែ\s*(?:សំឡេង|សម្លេង)?\s*(?:ក្នុង)?\s*វីដេអូ|បកប្រែ\s*វីដេអូ|វីដេអូ\s*បកប្រែ\s*(?:ជា)?\s*ភាសាខ្មែរ|បញ្ចូល\s*(?:សំឡេង|សម្លេង)\s*(?:ជា)?\s*ភាសាខ្មែរ|សម្រាយ\s*រឿង|សម្រាយ\s*វីដេអូ|translate\s+video|dub\s+(?:video|to\s+khmer)|movie\s+recap)/i.test(
    text.trim()
  );
}

export interface VideoKhmerDubResult {
  ok: boolean;
  title: string;
  sourceUrl?: string;
  detectedLanguage: string;
  originalTranscript: string;
  khmerTranslation: string;
  khmerMovieRecap?: string;
  englishSummary?: string;
  dubbedVideoUrl: string;
  dubbedAudioUrl: string;
  voiceActorKhmer?: string;
  error?: string;
}

export async function translateAndDubVideoClient(params: {
  videoUrl?: string;
  videoBase64?: string;
  mimeType?: string;
  fileName?: string;
  userPrompt?: string;
}): Promise<VideoKhmerDubResult> {
  try {
    const res = await fetch("/api/video/translate-khmer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.ok && data.dubbedVideoUrl) {
        return data;
      }
    }
  } catch {}
  return {
    ok: false,
    title: params.fileName || "វីដេអូបកប្រែភាសាខ្មែរ",
    detectedLanguage: "Auto",
    originalTranscript: "",
    khmerTranslation: "",
    khmerMovieRecap: "",
    dubbedVideoUrl: "",
    dubbedAudioUrl: "",
    error: "មិនអាចបកប្រែវីដេអូនេះបានទេ សូមពិនិត្យតំណលីង ឬហ្វាល់វីដេអូម្ដងទៀត។",
  };
}

export function buildVideoKhmerDubMarkdown(result: VideoKhmerDubResult): string {
  const safeTitle = (result.title || "វីដេអូបកប្រែ និងសម្រាយរឿងជាភាសាខ្មែរ (Khmer Dubbed Video)")
    .replace(/[\r\n]+/g, " ")
    .trim();
  const payload = {
    title: safeTitle,
    sourceUrl: result.sourceUrl || "",
    detectedLanguage: result.detectedLanguage || "ភាសាបរទេស (Foreign Language)",
    originalTranscript: result.originalTranscript || "",
    khmerTranslation: result.khmerTranslation || "",
    khmerMovieRecap: result.khmerMovieRecap || result.khmerTranslation || "",
    dubbedVideoUrl: result.dubbedVideoUrl,
    dubbedAudioUrl: result.dubbedAudioUrl,
    voiceActorKhmer: result.voiceActorKhmer || "Google AI Studio Voice (ស្រី/ប្រុស)",
  };
  const encodedPayload = encodeURIComponent(JSON.stringify(payload));

  return [
    `### 🎬🇰🇭 វីដេអូបកប្រែសំឡេង និងសម្រាយរឿង AI ជាភាសាខ្មែរ (Khmer AI Video Dub & Movie Recap Studio)`,
    `ចាស/បាទ! 🥰 ប្រព័ន្ធ AI បានស្ដាប់សំឡេង និងវិភាគឈុតឆាកក្នុងវីដេអូពី **${payload.detectedLanguage}** រួចធ្វើការបកប្រែសំឡេង និងសម្រាយរឿងជា **ភាសាខ្មែរ** (**${payload.voiceActorKhmer}**) បញ្ចូលចូលទៅក្នុងវីដេអូ **MP4** ជូនអ្នកត្រឡប់មកវិញរួចរាល់ហើយ!`,
    `• 🌐 **ភាសាដើមក្នុងវីដេអូ៖** ${payload.detectedLanguage}`,
    `• 🗣️ **អត្ថបទសំឡេងដើម៖** ${payload.originalTranscript || "បានវិភាគសំឡេង និងឈុតឆាកពីវីដេអូផ្ទាល់"}`,
    `• 🇰🇭 **ការបកប្រែសំឡេងជាភាសាខ្មែរ (Direct Voice Translation)៖** ${payload.khmerTranslation}`,
    ...(payload.khmerMovieRecap && payload.khmerMovieRecap !== payload.khmerTranslation
      ? [`• 🎞️ **សម្រាយរឿង AI ជាភាសាខ្មែរ (AI Movie Recap Narration)៖** ${payload.khmerMovieRecap}`]
      : []),
    `\`\`\`video-khmer-dub\n${encodedPayload}\n\`\`\``,
    `🇬🇧 English: Your video's speech and scenes have been translated and dubbed into a playable Khmer MP4 video (AI Movie Recap style)—watch or download it directly below!`,
  ].join("\n\n");
}

// Client-side universal social media video & audio extractor:
// 1. Calls /api/download backend first (YouTube, TikTok, Facebook, CapCut No-Logo, Pinterest MP4 & MP3)
// 2. Falls back to client-side CORS APIs if hosted on static-only hosting
export async function extractSocialVideoClient(
  url: string,
  requestedFormat: "mp3" | "mp4" | "both" = "both"
): Promise<SocialMediaDownloadResult> {
  const detected = detectSocialVideoUrl(url) || {
    platform: "youtube" as SocialPlatform,
    platformLabel: "YouTube",
    url,
    requestedFormat,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);
    const res = await fetch("/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: detected.url, format: requestedFormat }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (data?.ok && (data.mp4Url || data.mp3Url)) {
        const safeTitle =
          String(data.title || `${data.platformLabel} Media`)
            .replace(/[^a-zA-Z0-9_-]+/g, "_")
            .slice(0, 45) || "khmer_ai_media";
        const plat = String(data.platform || detected.platform || "");
        const dashParam = data.dashAudioToMux
          ? `&dashAudio=${encodeURIComponent(data.dashAudioToMux)}`
          : "";
        return {
          ...data,
          proxyMp4Url: data.mp4Url
            ? `/api/download/file?url=${encodeURIComponent(
                data.mp4Url
              )}&format=mp4&platform=${encodeURIComponent(plat)}&title=${encodeURIComponent(safeTitle)}${dashParam}`
            : "",
          proxyMp3Url: data.mp3Url
            ? `/api/download/file?url=${encodeURIComponent(
                data.mp3Url
              )}&format=mp3&platform=${encodeURIComponent(plat)}&title=${encodeURIComponent(safeTitle)}`
            : "",
          requestedFormat,
        };
      }
    }
  } catch {}

  const fallback = await extractSocialMediaClientFallback(detected);
  if (fallback) return fallback;

  return {
    ok: true,
    platform: detected.platform,
    platformLabel: detected.platformLabel,
    sourceUrl: detected.url,
    title: `${detected.platformLabel} Video & Audio`,
    author: detected.platformLabel,
    mp4Url: detected.url,
    mp3Url: detected.url,
    requestedFormat,
  };
}

export const buildMediaDownloaderMarkdown = (
  media: SocialMediaDownloadResult,
  _requestedFormat?: "mp3" | "mp4" | "both",
  companionNoteKhmer?: string
): string => buildMediaDownloadMarkdown(media, companionNoteKhmer);

export function buildMediaDownloadMarkdown(
  media: SocialMediaDownloadResult,
  companionNoteKhmer?: string
): string {
  const safeTitle = (media.title || `${media.platformLabel} Media`)
    .replace(/[\r\n]+/g, " ")
    .trim();
  const safeAuthor = (media.author || media.platformLabel).replace(/[\r\n]+/g, " ").trim();

  const payload = {
    platform: media.platform,
    platformLabel: media.platformLabel,
    sourceUrl: media.sourceUrl,
    title: safeTitle,
    author: safeAuthor,
    duration: media.duration || "",
    thumbnail: media.thumbnail || "",
    mp4Url: media.proxyMp4Url || media.mp4Url,
    mp3Url: media.proxyMp3Url || media.mp3Url,
    directMp4Url: media.mp4Url,
    directMp3Url: media.mp3Url,
    requestedFormat: media.requestedFormat,
  };

  const encodedPayload = encodeURIComponent(JSON.stringify(payload));

  const greetingLine =
    companionNoteKhmer ||
    `ចាសបងសម្លាញ់! 💖 នាងខ្ញុំបានទាញយកវីដេអូ និងសំឡេងចេញពី **${media.platformLabel}** ជាប្រភេទ **MP4 (រូបភាពច្បាស់ HD)** និង **MP3 (សំឡេងច្បាស់ពិរោះល្អឮ)** ជូនបងរួចរាល់ហើយណា៎! 🥰 បងអាចចុចមើល ស្ដាប់ ឬចុចប៊ូតុងទាញយក (Download) ខាងក្រោមនេះបានភ្លាមៗតែម្ដងចាស! ចុះបងចូលចិត្តស្ដាប់បទភ្លេង ឬមើលវីដេអូបែបហ្នឹងមែនទេបង? ប្រាប់នាងខ្ញុំផងមើល៍! 😊`;

  return [
    `### 📥 ប្រព័ន្ធទាញយកវីដេអូ និងសំឡេង (${media.platformLabel} MP4 & MP3 Downloader)`,
    greetingLine,
    `• 📝 **ចំណងជើងវីដេអូ៖** ${safeTitle}`,
    `• 👤 **ម្ចាស់ឆានែល / គណនី៖** ${safeAuthor}${media.duration ? ` | ⏱️ រយៈពេល៖ ${media.duration}` : ""}`,
    `• 🎬 **ប្រភេទហ្វាល់ដែលទាញយកបាន៖** វីដេអូ **MP4 (HD)** និង សំឡេង **MP3 (Crystal Clear Audio)**`,
    `\`\`\`media-downloader\n${encodedPayload}\n\`\`\``,
  ].join("\n\n");
}
