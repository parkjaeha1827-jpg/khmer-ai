import React, { useState } from "react";
import {
  Check,
  Copy,
  Code2,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
  AlertTriangle,
  Download,
  Music,
  Video,
  ExternalLink,
  Play,
  Loader2,
  Languages,
} from "lucide-react";
import katex from "katex";
import { ensureExerciseHasSvgDiagram } from "../utils/solutionCardSvgBuilder";
import { stripLatexToPlainUnicode } from "../utils/khmerOrthography";
import { translateAndDubVideoClient, VideoKhmerDubResult } from "../utils/socialMediaDownloader";

interface FormattedContentProps {
  content: string;
}

interface MediaDownloaderPayload {
  platform: "youtube" | "tiktok" | "facebook" | "capcut" | "pinterest";
  platformLabel: string;
  sourceUrl: string;
  title: string;
  author?: string;
  duration?: string;
  thumbnail?: string;
  mp4Url: string;
  mp3Url: string;
  directMp4Url?: string;
  directMp3Url?: string;
  requestedFormat?: "mp3" | "mp4" | "both";
}

const MediaDownloaderCard: React.FC<{ encodedPayload: string }> = ({ encodedPayload }) => {
  const [activeTab, setActiveTab] = useState<"mp4" | "mp3">("mp4");
  const [downloadingFormat, setDownloadingFormat] = useState<"mp4" | "mp3" | null>(null);
  const [isDubbingKhmer, setIsDubbingKhmer] = useState(false);
  const [khmerDubResult, setKhmerDubResult] = useState<VideoKhmerDubResult | null>(null);

  let data: MediaDownloaderPayload | null = null;
  try {
    data = JSON.parse(decodeURIComponent(encodedPayload.trim()));
  } catch {
    return null;
  }
  if (!data) return null;

  const badgeColors =
    data.platform === "youtube"
      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
      : data.platform === "tiktok"
      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
      : data.platform === "capcut"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
      : data.platform === "pinterest"
      ? "bg-red-500/20 text-red-300 border-red-500/40"
      : "bg-blue-500/20 text-blue-300 border-blue-500/40";

  const safeFileBase = (data.title || `${data.platformLabel}_Media`)
    .replace(/[\\/:*?"<>|]+/g, "_")
    .slice(0, 60);

  const buildServerDownloadUrl = (targetUrl: string, format: "mp4" | "mp3", inline = false) => {
    if (!targetUrl) return "";
    if (targetUrl.startsWith("/api/download/file")) {
      const withPlat = targetUrl.includes("platform=")
        ? targetUrl
        : `${targetUrl}&platform=${encodeURIComponent(data.platform || "")}`;
      return inline ? `${withPlat}&inline=1` : withPlat;
    }
    return `/api/download/file?url=${encodeURIComponent(targetUrl)}&format=${format}&platform=${encodeURIComponent(
      data.platform || ""
    )}&title=${encodeURIComponent(safeFileBase)}${inline ? "&inline=1" : ""}`;
  };

  const mp4StreamHref = buildServerDownloadUrl(data.directMp4Url || data.mp4Url, "mp4");
  const mp4InlinePreviewHref = buildServerDownloadUrl(data.directMp4Url || data.mp4Url, "mp4", true);
  const mp3StreamHref = buildServerDownloadUrl(data.directMp3Url || data.mp3Url || data.mp4Url, "mp3");

  const handleDirectDownload = async (format: "mp4" | "mp3") => {
    if (!data) return;
    setDownloadingFormat(format);
    try {
      const downloadEndpoint = format === "mp4" ? mp4StreamHref : mp3StreamHref;
      const fallbackRawUrl =
        format === "mp4"
          ? data.directMp4Url || data.mp4Url
          : data.directMp3Url || data.mp3Url || data.mp4Url;

      const a = document.createElement("a");
      a.href = downloadEndpoint || fallbackRawUrl;
      a.download = `${safeFileBase}.${format}`;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setTimeout(() => setDownloadingFormat(null), 1500);
    }
  };

  return (
    <div className="my-3 rounded-2xl border border-sky-500/35 bg-[#0b1522] overflow-hidden shadow-xl">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#122236] border-b border-sky-500/20">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${badgeColors}`}>
            {data.platformLabel}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-400/40">
            ✨ លុប Logo ខាងក្រោម &amp; ខាងលើវីដេអូ ១០០% (No Watermark)
          </span>
          <span className="text-xs font-semibold text-sky-200">
            ប្រព័ន្ធទាញយក MP4 (HD) &amp; MP3 (សំឡេងច្បាស់ល្អ)
          </span>
        </div>
        <a
          href={data.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
        >
          <span>លីងដើម</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Media Info + Thumbnail */}
      <div className="p-3.5 space-y-3">
        <div className="flex items-start gap-3">
          {data.thumbnail && (
            <img
              src={data.thumbnail}
              alt={data.title}
              className="w-20 h-14 sm:w-24 sm:h-16 object-cover rounded-lg border border-white/10 shrink-0 bg-black/40"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">{data.title}</h4>
            <p className="text-xs text-sky-300/80 mt-1">
              👤 {data.author || data.platformLabel}
              {data.duration ? ` • ⏱️ ${data.duration}` : ""}
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs: Watch MP4 vs Listen MP3 */}
        <div className="flex items-center gap-2 bg-[#08101a] p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("mp4")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "mp4"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-white/65 hover:text-white hover:bg-white/5"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>
              {data.platform === "capcut"
                ? "មើលវីដេអូ (MP4 គ្មាន Logo CapCut)"
                : "មើលវីដេអូ (MP4 HD)"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mp3")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "mp3"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-white/65 hover:text-white hover:bg-white/5"
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>ស្ដាប់សំឡេង (MP3 ច្បាស់ល្អ)</span>
          </button>
        </div>

        {/* Inline Player */}
        <div className="rounded-xl overflow-hidden bg-black/70 border border-white/10">
          {activeTab === "mp4" ? (
            <video
              controls
              playsInline
              preload="metadata"
              poster={data.thumbnail}
              src={mp4InlinePreviewHref || mp4StreamHref || data.directMp4Url || data.mp4Url}
              className="w-full max-h-[280px] object-contain bg-black"
            />
          ) : (
            <div className="p-4 flex flex-col items-center gap-3 bg-gradient-to-b from-emerald-950/40 to-black/80">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                <Play className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                <span>កម្មវិធីចាក់សំឡេង MP3 កម្រិតច្បាស់ (Crystal Clear Audio)</span>
              </div>
              <audio
                controls
                preload="metadata"
                src={mp3StreamHref || data.directMp3Url || data.mp3Url}
                className="w-full h-10"
              />
            </div>
          )}
        </div>

        {/* 1-Click MP4 & MP3 Download Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => handleDirectDownload("mp4")}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              {downloadingFormat === "mp4"
                ? "កំពុងទាញយក MP4..."
                : "🎬 ទាញយកវីដេអូ MP4 (គ្មានជាប់ Logo ១០០%)"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleDirectDownload("mp3")}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Music className="w-4 h-4" />
            <span>
              {downloadingFormat === "mp3"
                ? "កំពុងទាញយក MP3..."
                : "🎵 ទាញយកសំឡេង MP3 (ច្បាស់ល្អ)"}
            </span>
          </button>
        </div>

        {/* 1-Click Translate & Dub Video Audio into Khmer Button */}
        <div className="pt-1">
          <button
            type="button"
            disabled={isDubbingKhmer}
            onClick={async () => {
              if (!data || isDubbingKhmer) return;
              setIsDubbingKhmer(true);
              try {
                const res = await translateAndDubVideoClient({
                  videoUrl: data.directMp4Url || data.sourceUrl,
                  fileName: data.title,
                  userPrompt: `បកប្រែសំឡេង និងសម្រាយរឿងក្នុងវីដេអូ "${data.title}" មកជាភាសាខ្មែរ`,
                });
                setKhmerDubResult(res);
              } finally {
                setIsDubbingKhmer(false);
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
          >
            {isDubbingKhmer ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>កំពុងស្ដាប់ បកប្រែសំឡេង និងសម្រាយរឿង AI ជាភាសាខ្មែរ...</span>
              </>
            ) : (
              <>
                <Languages className="w-4 h-4" />
                <span>🇰🇭 បកប្រែសំឡេង &amp; សម្រាយរឿង AI ជាភាសាខ្មែរ (ផ្ដល់វីដេអូនិយាយខ្មែរមកវិញ)</span>
              </>
            )}
          </button>
        </div>

        {/* Inline Khmer Dubbed Video Result if translated */}
        {khmerDubResult && khmerDubResult.ok && khmerDubResult.dubbedVideoUrl && (
          <div className="mt-2 p-3 rounded-xl border border-purple-400/40 bg-[#131026] space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-purple-200">
              <span>🎬🇰🇭 វីដេអូបកប្រែសំឡេង និងសម្រាយរឿង AI ជាភាសាខ្មែរ ({khmerDubResult.voiceActorKhmer || "សំឡេងខ្មែរ"})</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/30 text-[10px]">
                {khmerDubResult.detectedLanguage} ➔ ខ្មែរ
              </span>
            </div>
            <p className="text-xs text-purple-100/90 leading-relaxed">
              🗣️ <strong>សំឡេងបកប្រែខ្មែរ៖</strong> {khmerDubResult.khmerTranslation}
            </p>
            {khmerDubResult.khmerMovieRecap &&
              khmerDubResult.khmerMovieRecap !== khmerDubResult.khmerTranslation && (
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  🎞️ <strong>សម្រាយរឿង AI៖</strong> {khmerDubResult.khmerMovieRecap}
                </p>
              )}
            <video
              controls
              playsInline
              src={khmerDubResult.dubbedVideoUrl}
              className="w-full max-h-[260px] rounded-lg bg-black border border-purple-400/30"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={khmerDubResult.dubbedVideoUrl}
                download={`${safeFileBase}_Khmer_Dubbed.mp4`}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs text-center"
              >
                <Download className="w-3.5 h-3.5" />
                <span>🎬 ទាញយកវីដេអូបកប្រែខ្មែរ (MP4)</span>
              </a>
              <a
                href={khmerDubResult.dubbedAudioUrl}
                download={`${safeFileBase}_Khmer_Audio.mp3`}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs text-center"
              >
                <Music className="w-3.5 h-3.5" />
                <span>🎵 ទាញយកសំឡេងបកប្រែខ្មែរ (MP3)</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface VideoKhmerDubCardPayload {
  title: string;
  sourceUrl?: string;
  detectedLanguage: string;
  originalTranscript: string;
  khmerTranslation: string;
  khmerMovieRecap?: string;
  dubbedVideoUrl: string;
  dubbedAudioUrl: string;
  voiceActorKhmer?: string;
}

const VideoKhmerDubCard: React.FC<{ encodedPayload: string }> = ({ encodedPayload }) => {
  const [activeTab, setActiveTab] = useState<"mp4" | "mp3">("mp4");

  let data: VideoKhmerDubCardPayload | null = null;
  try {
    data = JSON.parse(decodeURIComponent(encodedPayload.trim()));
  } catch {
    return null;
  }
  if (!data || !data.dubbedVideoUrl) return null;

  const safeBase = (data.title || "Khmer_Dubbed_Video")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .slice(0, 50);

  return (
    <div className="my-3 rounded-2xl border border-purple-500/40 bg-[#100d22] overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-indigo-950 via-purple-950 to-pink-950 border-b border-purple-400/25">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-500/25 text-purple-200 border border-purple-400/40">
            🇰🇭 AI សម្រាយរឿង &amp; បកប្រែវីដេអូ
          </span>
          <span className="text-xs font-semibold text-purple-200">
            វីដេអូបកប្រែសំឡេង និងសម្រាយរឿងជាភាសាខ្មែរ ({data.voiceActorKhmer || "សំឡេងខ្មែរ"})
          </span>
        </div>
        {data.sourceUrl && (
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-purple-200"
          >
            <span>លីងដើម</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="p-3.5 space-y-3">
        <div className="space-y-1.5 text-xs bg-black/35 p-2.5 rounded-xl border border-white/10">
          <div className="font-bold text-white text-sm">{data.title}</div>
          <div className="text-purple-300">
            🌐 <strong>ភាសាដើម៖</strong> {data.detectedLanguage}
          </div>
          {data.originalTranscript && (
            <div className="text-white/75">
              🗣️ <strong>សំឡេងដើម៖</strong> {data.originalTranscript}
            </div>
          )}
          <div className="text-emerald-300 font-medium">
            🇰🇭 <strong>សំឡេងបកប្រែភាសាខ្មែរ៖</strong> {data.khmerTranslation}
          </div>
          {data.khmerMovieRecap && data.khmerMovieRecap !== data.khmerTranslation && (
            <div className="text-amber-300/95 font-medium pt-0.5">
              🎞️ <strong>សម្រាយរឿង AI ជាភាសាខ្មែរ៖</strong> {data.khmerMovieRecap}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 bg-[#080612] p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("mp4")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "mp4"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-white/65 hover:text-white hover:bg-white/5"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>មើលវីដេអូនិយាយភាសាខ្មែរ (MP4)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mp3")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "mp3"
                ? "bg-pink-600 text-white shadow-sm"
                : "text-white/65 hover:text-white hover:bg-white/5"
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>ស្ដាប់សំឡេងបកប្រែខ្មែរ (MP3)</span>
          </button>
        </div>

        <div className="rounded-xl overflow-hidden bg-black/80 border border-white/10">
          {activeTab === "mp4" ? (
            <video
              controls
              playsInline
              preload="metadata"
              src={data.dubbedVideoUrl}
              className="w-full max-h-[300px] object-contain bg-black"
            />
          ) : (
            <div className="p-4 flex flex-col items-center gap-3 bg-gradient-to-b from-purple-950/50 to-black/80">
              <div className="flex items-center gap-2 text-pink-300 text-xs font-semibold">
                <Play className="w-4 h-4 fill-pink-400 text-pink-400" />
                <span>សំឡេងបកប្រែជាភាសាខ្មែរ ({data.voiceActorKhmer || "សំឡេងខ្មែរ"})</span>
              </div>
              <audio controls preload="metadata" src={data.dubbedAudioUrl} className="w-full h-10" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <a
            href={data.dubbedVideoUrl}
            download={`${safeBase}_Khmer_Dubbed.mp4`}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>🎬 ទាញយកវីដេអូបកប្រែខ្មែរ (MP4)</span>
          </a>
          <a
            href={data.dubbedAudioUrl}
            download={`${safeBase}_Khmer_Audio.mp3`}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-md shadow-pink-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Music className="w-4 h-4" />
            <span>🎵 ទាញយកសំឡេងបកប្រែខ្មែរ (MP3)</span>
          </a>
        </div>
      </div>
    </div>
  );
};

interface OrthographyOcrCardPayload {
  ok: boolean;
  mode?: string;
  hasImage?: boolean;
  detectedLanguage: string;
  extractedText: string;
  correctedText: string;
  errorCount: number;
  errors: Array<{ wrong: string; correct: string; rule: string }>;
  grammarSummaryKhmer: string;
  englishSummary?: string;
}

const OrthographyOcrCard: React.FC<{ encodedPayload: string }> = ({ encodedPayload }) => {
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [copiedFixed, setCopiedFixed] = useState(false);

  let data: OrthographyOcrCardPayload | null = null;
  try {
    data = JSON.parse(decodeURIComponent(encodedPayload.trim()));
  } catch {
    return null;
  }
  if (!data) return null;

  const copyText = (txt: string, isOrigin: boolean) => {
    if (!txt) return;
    navigator.clipboard.writeText(txt);
    if (isOrigin) {
      setCopiedOrigin(true);
      setTimeout(() => setCopiedOrigin(false), 2000);
    } else {
      setCopiedFixed(true);
      setTimeout(() => setCopiedFixed(false), 2000);
    }
  };

  return (
    <div className="my-3 rounded-2xl border border-emerald-500/40 bg-[#08151d] overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-[#0d2622] via-[#0e2433] to-[#0d222c] border-b border-emerald-500/25 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-400/40">
            {data.hasImage ? "📸📋 OCR បម្លែងរូបភាពជាអក្សរ" : "📝🇰🇭 ត្រួតពិនិត្យអក្ខរាវិរុទ្ធ & វេយ្យាករណ៍"}
          </span>
          <span className="text-xs font-semibold text-sky-200">
            🌐 {data.detectedLanguage} •{" "}
            {data.errorCount === 0
              ? "✅ ត្រឹមត្រូវឥតខ្ចោះ (០ កំហុស)"
              : `🔍 កែតម្រូវកំហុស ${data.errorCount} កន្លែង`}
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        {data.extractedText && (
          <div className="rounded-xl border border-sky-500/30 bg-[#061019] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-[#0b1b2b] border-b border-sky-500/20">
              <span className="text-xs font-bold text-sky-300">
                {data.hasImage
                  ? "📋 អត្ថបទដកស្រង់ចេញពីរូបភាព (ចុចចម្លងបានភ្លាមៗ)"
                  : "📄 អត្ថបទដើម"}
              </span>
              <button
                type="button"
                onClick={() => copyText(data!.extractedText, true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-[11px] font-bold cursor-pointer"
              >
                {copiedOrigin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedOrigin ? "បានចម្លង!" : "📋 ចម្លងអក្សរដើម"}</span>
              </button>
            </div>
            <pre className="p-3 whitespace-pre-wrap break-words font-sans text-xs sm:text-sm text-white/90 select-all leading-relaxed">
              {data.extractedText}
            </pre>
          </div>
        )}

        <div className="rounded-xl border border-emerald-500/40 bg-[#061612] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-[#0b2720] border-b border-emerald-500/25">
            <span className="text-xs font-bold text-emerald-300">
              ✅ អត្ថបទដែលបានកែអក្ខរាវិរុទ្ធ និងវេយ្យាករណ៍រួចរាល់ (សម្រាប់ចម្លង)
            </span>
            <button
              type="button"
              onClick={() => copyText(data!.correctedText, false)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-extrabold cursor-pointer shadow-sm"
            >
              {copiedFixed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFixed ? "បានចម្លងទុក!" : "📋 ចម្លងអត្ថបទត្រឹមត្រូវ"}</span>
            </button>
          </div>
          <pre className="p-3 whitespace-pre-wrap break-words font-sans text-xs sm:text-sm text-emerald-100 font-medium select-all leading-relaxed">
            {data.correctedText}
          </pre>
        </div>

        {Array.isArray(data.errors) && data.errors.length > 0 && (
          <div className="rounded-xl border border-amber-500/35 bg-[#171107] p-3 space-y-2">
            <div className="text-xs font-bold text-amber-300">
              📖 បញ្ជីពាក្យខុស ➔ ពាក្យត្រូវ និងក្បួនវេយ្យាករណ៍៖
            </div>
            <div className="space-y-1.5">
              {data.errors.map((err, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-black/40 border border-white/10 text-xs space-y-0.5"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-amber-400 font-bold">#{i + 1}</span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 line-through">
                      ❌ {err.wrong}
                    </span>
                    <span className="text-white/50">➔</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      ✅ {err.correct}
                    </span>
                  </div>
                  {err.rule && <div className="text-white/80">💡 {err.rule}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Interactive World Language Translator Card
const WorldTranslatorCard: React.FC<{ encodedPayload: string }> = ({ encodedPayload }) => {
  const [copied, setCopied] = useState(false);
  let data: any = null;
  try {
    data = JSON.parse(decodeURIComponent(encodedPayload.trim()));
  } catch {
    return null;
  }
  if (!data) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(data.translatedText || "").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-[#081526] via-[#0d1f38] to-[#081526] overflow-hidden shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[#0f2744]/90 border-b border-cyan-500/30">
        <div className="text-xs sm:text-sm font-bold text-cyan-200">
          🌍 {data.detectedSourceLang} ➔ {data.targetLangLabel}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "បានចម្លងទុក!" : "📋 ចម្លងអត្ថបទបកប្រែ"}</span>
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div className="p-3 rounded-xl bg-black/35 border border-white/10">
          <div className="text-[11px] text-slate-400 mb-1">📥 អត្ថបទដើម៖</div>
          <div className="text-xs sm:text-sm text-white/90 whitespace-pre-wrap">{data.sourceText}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-400/35 space-y-1.5">
          <div className="text-[11px] text-cyan-300 font-bold">🎯 អត្ថបទបកប្រែផ្លូវការ៖</div>
          <div className="text-sm sm:text-base font-bold text-white whitespace-pre-wrap select-all">
            {data.translatedText}
          </div>
          {data.phoneticRomanization && (
            <div className="text-xs text-cyan-300">
              🗣️ របៀបអាន (Phonetic)៖ <span className="font-mono">{data.phoneticRomanization}</span>
            </div>
          )}
          {data.khmerPronunciationGuide && (
            <div className="text-xs text-amber-300">
              🇰🇭 របៀបអានជាសំឡេងខ្មែរ៖ {data.khmerPronunciationGuide}
            </div>
          )}
        </div>
        {Array.isArray(data.otherMajorTranslations) && data.otherMajorTranslations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.otherMajorTranslations.map((o: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-xl bg-black/30 border border-white/10 text-xs">
                <div className="font-bold text-indigo-300">{o.lang}</div>
                <div className="text-white mt-0.5">{o.text}</div>
                {o.pronunciation && <div className="text-[11px] text-slate-400">{o.pronunciation}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Interactive Illustrated Story Card (with Character Portraits & Per-Episode Scene Illustrations)
const IllustratedStoryCard: React.FC<{ encodedPayload: string }> = ({ encodedPayload }) => {
  let data: any = null;
  try {
    data = JSON.parse(decodeURIComponent(encodedPayload.trim()));
  } catch {
    return null;
  }
  if (!data) return null;

  return (
    <div className="my-3 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-[#120b24] via-[#191032] to-[#0f0b1d] overflow-hidden shadow-xl">
      <div className="px-4 py-3 bg-[#211342]/90 border-b border-purple-500/30 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/25 text-purple-200 border border-purple-400/30">
            {data.genreLabelKhmer}
          </span>
          <h4 className="text-sm sm:text-base font-bold text-white mt-1">📖 {data.title}</h4>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {data.synopsis && (
          <p className="text-xs sm:text-sm text-purple-100/90 bg-black/30 p-3 rounded-xl border border-white/10">
            📝 <b>សេចក្ដីសង្ខេប៖</b> {data.synopsis}
          </p>
        )}

        {Array.isArray(data.characters) && data.characters.length > 0 && (
          <div>
            <div className="text-xs font-bold text-amber-300 mb-2">
              🎭 តួអង្គនៅក្នុងសាច់រឿង (Characters &amp; Portraits)៖
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {data.characters.map((c: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-black/40 border border-white/10 rounded-xl p-2.5 flex items-center gap-2.5"
                >
                  <img
                    src={c.avatarUrl}
                    alt={c.name}
                    className="w-14 h-14 rounded-xl object-cover border border-purple-400/40 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{c.name}</div>
                    <div className="text-[10px] text-purple-300 truncate">{c.role}</div>
                    <div className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">
                      {c.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(data.episodes) && data.episodes.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-pink-300">
              🎬 សាច់រឿង និងរូបភាពតាមវគ្គនីមួយៗ (Illustrated Story Episodes)៖
            </div>
            {data.episodes.map((ep: any, idx: number) => (
              <div
                key={idx}
                className="bg-black/40 border border-white/10 rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-12"
              >
                <div className="md:col-span-5">
                  <img
                    src={ep.imageUrl}
                    alt={ep.title}
                    className="w-full h-44 md:h-full object-cover"
                  />
                </div>
                <div className="md:col-span-7 p-3.5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 text-xs font-bold">
                      វគ្គទី {ep.episodeNumber} ៖ {ep.title}
                    </span>
                    <span className="text-[11px] text-slate-400">📍 {ep.setting}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-white/95 leading-relaxed whitespace-pre-wrap">
                    {ep.narrative}
                  </p>
                  {ep.dialogue && (
                    <div className="bg-purple-950/50 border-l-2 border-purple-400 pl-2.5 py-1 text-xs text-purple-200 italic">
                      💬 {ep.dialogue}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {data.moralKhmer && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/35 text-xs text-amber-200 font-bold">
            🌟 {data.moralKhmer}
          </div>
        )}
      </div>
    </div>
  );
};

// Interactive Tri-Directional Visual Dictionary Card
const VisualDictionaryCard: React.FC<{ encodedPayload: string }> = ({ encodedPayload }) => {
  let data: any = null;
  try {
    data = JSON.parse(decodeURIComponent(encodedPayload.trim()));
  } catch {
    return null;
  }
  const initialMode: "km-km" | "en-km" | "km-en" =
    data?.mode === "en-km" || data?.mode === "km-en" ? data.mode : "km-km";
  const [activeMode, setActiveMode] = useState<"km-km" | "en-km" | "km-en">(initialMode);

  if (!data) return null;

  return (
    <div className="my-3 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-[#191207] via-[#221809] to-[#120d05] overflow-hidden shadow-xl">
      <div className="px-4 py-3 bg-[#2e200b]/90 border-b border-amber-500/30 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs sm:text-sm font-bold text-amber-200">
          {data.emoji}{" "}
          {activeMode === "km-km"
            ? "វចនានុក្រម ខ្មែរ-ខ្មែរ (សម្ដេចព្រះសង្ឃរាជ ជួន ណាត)"
            : activeMode === "en-km"
            ? "វចនានុក្រម អង់គ្លេស-ខ្មែរ (English ➔ Khmer)"
            : "វចនានុក្រម ខ្មែរ-អង់គ្លេស (Khmer ➔ English)"}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "km-km", label: "🇰🇭➡️🇰🇭 ខ្មែរ-ខ្មែរ" },
            { id: "en-km", label: "🇬🇧➡️🇰🇭 អង់គ្លេស-ខ្មែរ" },
            { id: "km-en", label: "🇰🇭➡️🇬🇧 ខ្មែរ-អង់គ្លេស" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveMode(m.id as "km-km" | "en-km" | "km-en")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                activeMode === m.id
                  ? "bg-amber-500 text-slate-950 border-amber-300 shadow"
                  : "bg-black/40 text-amber-100 border-white/15 hover:bg-white/10"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
          {/* Real Photograph of the Word */}
          <div className="md:col-span-5">
            <div className="rounded-xl overflow-hidden border border-amber-400/40 bg-black/50 shadow-md">
              <img
                src={data.imageUrl}
                alt={data.khmerWord || data.headword}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (data.aiImageUrl && target.src !== data.aiImageUrl) {
                    target.src = data.aiImageUrl;
                  } else if (data.svgCardUrl && target.src !== data.svgCardUrl) {
                    target.src = data.svgCardUrl;
                  }
                }}
                className="w-full h-52 object-cover bg-black/40"
              />
              <div className="px-3 py-1.5 bg-black/70 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-amber-300 font-bold">
                  📸 រូបភាពពិតប្រាកដ៖ «
                  {activeMode === "en-km"
                    ? `${data.englishWord} (${data.khmerWord})`
                    : activeMode === "km-en"
                    ? `${data.khmerWord} (${data.englishWord})`
                    : data.khmerWord}
                  »
                </span>
                <span>{data.emoji}</span>
              </div>
            </div>
          </div>

          {/* ONLY the 1 Selected Dictionary Type Content */}
          <div className="md:col-span-7 space-y-2.5 text-xs">
            {activeMode === "km-km" && (
              <div className="p-3 rounded-xl bg-black/45 border border-amber-500/30 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="text-base font-bold text-amber-300">
                    🇰🇭 {data.khmerWord}
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 text-[11px] font-bold">
                    {data.partOfSpeech}
                  </span>
                </div>
                <div className="text-slate-300">
                  🗣️ អានថា៖ <b>{data.pronunciationKhmer}</b>{" "}
                  {data.etymology ? `• 🏛️ ${data.etymology}` : ""}
                </div>
                <div className="font-bold text-amber-300 pt-1">
                  🇰🇭➡️🇰🇭 និយមន័យតាមវចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត៖
                </div>
                <div className="text-white/95 leading-relaxed">{data.khmerToKhmerDef}</div>
              </div>
            )}

            {activeMode === "en-km" && (
              <div className="p-3 rounded-xl bg-black/45 border border-cyan-500/30 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="text-base font-bold text-white">
                    🇬🇧 <span className="text-cyan-300">{data.englishWord}</span> ➔ 🇰🇭{" "}
                    <span className="text-amber-300">{data.khmerWord}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200 text-[11px] font-bold">
                    {data.partOfSpeech}
                  </span>
                </div>
                <div className="text-amber-200">
                  🗣️ អានតាមតុងអង់គ្លេស៖ <b>{data.pronunciationEnglishTone || data.pronunciationIpa}</b>
                </div>
                <div className="font-bold text-cyan-300 pt-1">
                  🇬🇧➡️🇰🇭 និយមន័យ អង់គ្លេស-ខ្មែរ (English ➔ Khmer)៖
                </div>
                <div className="text-white/95 leading-relaxed">{data.englishToKhmerDef}</div>
              </div>
            )}

            {activeMode === "km-en" && (
              <div className="p-3 rounded-xl bg-black/45 border border-emerald-500/30 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="text-base font-bold text-white">
                    🇰🇭 <span className="text-amber-300">{data.khmerWord}</span> ➔ 🇬🇧{" "}
                    <span className="text-emerald-300">{data.englishWord}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 text-[11px] font-bold">
                    {data.partOfSpeech}
                  </span>
                </div>
                <div className="text-amber-200">
                  🗣️ អានតាមតុងអង់គ្លេស៖ <b>{data.pronunciationEnglishTone || data.pronunciationIpa}</b>
                </div>
                <div className="font-bold text-emerald-300 pt-1">
                  🇰🇭➡️🇬🇧 និយមន័យ ខ្មែរ-អង់គ្លេស (Khmer ➔ English)៖
                </div>
                <div className="text-white/95 leading-relaxed">{data.khmerToEnglishDef}</div>
              </div>
            )}

            {Array.isArray(data.examples) && data.examples.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-amber-300">
                  📝 ឧទាហរណ៍ជាល្បះបង្ហាញ និងបញ្ជាក់៖
                </div>
                {data.examples.map((ex: any, i: number) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs space-y-0.5"
                  >
                    {activeMode === "km-km" ? (
                      <>
                        <div className="font-bold text-white">
                          {i + 1}. 🇰🇭 {ex.khmerSentence}
                        </div>
                        <div className="text-slate-300">💡 ការបញ្ជាក់៖ {ex.explanationKhmer}</div>
                      </>
                    ) : activeMode === "en-km" ? (
                      <>
                        <div className="font-bold text-cyan-300">
                          {i + 1}. 🇬🇧 {ex.englishSentence}
                        </div>
                        <div className="text-white">🇰🇭 ប្រែខ្មែរ៖ {ex.khmerSentence}</div>
                        <div className="text-slate-300">💡 ការបញ្ជាក់៖ {ex.explanationKhmer}</div>
                      </>
                    ) : (
                      <>
                        <div className="font-bold text-white">
                          {i + 1}. 🇰🇭 {ex.khmerSentence}
                        </div>
                        <div className="text-emerald-300 italic">🇬🇧 {ex.englishSentence}</div>
                        <div className="text-slate-300">💡 ការបញ្ជាក់៖ {ex.explanationKhmer}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Interactive Cambodia Daily Calendar & Holiday Notifier Card
const CambodiaCalendarCard: React.FC<{ encodedPayload: string }> = ({ encodedPayload }) => {
  let data: any = null;
  try {
    data = JSON.parse(decodeURIComponent(encodedPayload.trim()));
  } catch {
    return null;
  }
  if (!data) return null;

  return (
    <div className="my-3 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-[#061c17] via-[#092720] to-[#051511] overflow-hidden shadow-xl">
      <div className="px-4 py-3 bg-[#0c352b]/90 border-b border-emerald-500/30 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs sm:text-sm font-bold text-emerald-200">
          🇰🇭📅 ប្រតិទិនកម្ពុជា និងអ្នកជូនដំណឹងថ្ងៃបុណ្យជាតិ/អន្តរជាតិ (ឆ្នាំ {data.targetYear})
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/25 text-emerald-200 border border-emerald-400/30">
          {data.buddhistEra} • {data.animalYearKhmer}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-400/40 text-xs sm:text-sm text-white font-medium">
          {data.notificationBanner}
        </div>

        {Array.isArray(data.nextUpcomingHolidays) && data.nextUpcomingHolidays.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-amber-300">
              ⏳ ថ្ងៃបុណ្យជាតិ បុណ្យប្រពៃណី និងទិវាអន្តរជាតិដែលជិតមកដល់បន្ទាប់៖
            </div>
            {data.nextUpcomingHolidays.map((ev: any, idx: number) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs space-y-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-bold text-amber-300">🗓️ {ev.khmerDateShort}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    {ev.statusLabelKhmer}
                  </span>
                </div>
                <div className="font-bold text-white">{ev.titleKhmer}</div>
                <div className="text-slate-300">{ev.descriptionKhmer}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper to render LaTeX math using KaTeX safely
function renderKaTeX(expr: string, displayMode = false): React.ReactNode {
  try {
    const html = katex.renderToString(expr.trim(), {
      displayMode,
      throwOnError: false,
      strict: false,
    });
    return (
      <span
        className={
          displayMode
            ? "block my-2.5 overflow-x-auto text-center font-normal py-1"
            : "inline-block px-1 align-baseline font-normal"
        }
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return <span className="font-mono text-sky-300 font-normal">{expr}</span>;
  }
}

// Interactive SVG Diagram Component for exercise figures
const SvgDiagram: React.FC<{ svgCode: string }> = ({ svgCode }) => {
  const [copied, setCopied] = useState(false);

  let cleanedSvg = svgCode.trim();
  // Ensure xmlns is present for standalone rendering
  if (!cleanedSvg.includes("xmlns=")) {
    cleanedSvg = cleanedSvg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // Upgrade any black/dark strokes or text fills to high-contrast bright colors on dark card background
  cleanedSvg = cleanedSvg
    .replace(
      /stroke=["'](?:#000000|#000|black|#111111|#111|#222222|#222|#333333|#333)["']/gi,
      'stroke="#94a3b8"'
    )
    .replace(/stroke=["']blue["']/gi, 'stroke="#38bdf8"')
    .replace(/stroke=["']red["']/gi, 'stroke="#f43f5e"')
    .replace(/stroke=["']green["']/gi, 'stroke="#4ade80"')
    .replace(/<text\b([^>]*)>/gi, (_full, attrs: string) => {
      let updated = attrs;
      if (/fill=["'](?:#000000|#000|black|#111|#222|#333)["']/i.test(updated)) {
        updated = updated.replace(
          /fill=["'](?:#000000|#000|black|#111|#222|#333)["']/i,
          'fill="#f8fafc"'
        );
      } else if (!/fill=/i.test(updated)) {
        updated += ' fill="#f8fafc"';
      }
      return `<text${updated}>`;
    });

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanedSvg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl border border-sky-500/30 bg-[#0d1624] overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-3 py-2 bg-[#132338] border-b border-sky-500/20 text-xs text-sky-300 font-medium">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-sky-400" />
          <span className="font-semibold">📊 រូបភាពគំនូសបំព្រួញពន្យល់លំហាត់ (Explanatory Diagram)</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/70 text-[11px] transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "បានចម្លង!" : "ចម្លង SVG"}</span>
        </button>
      </div>

      <div
        className="p-4 flex items-center justify-center bg-[#0d1624] overflow-x-auto min-h-[160px]"
        dangerouslySetInnerHTML={{ __html: cleanedSvg }}
      />
      <div className="px-3 py-1.5 text-center text-[11px] text-sky-300/70 bg-[#132338]/60 border-t border-sky-500/10">
        💡 រូបភាពគូសបញ្ជាក់ និងកំណត់សម្គាល់សម្រាប់ស្វែងយល់ដំណោះស្រាយលំហាត់
      </div>
    </div>
  );
};

export const FormattedContent: React.FC<FormattedContentProps> = ({ content }) => {
  // Strip any accidental Thai characters, convert any LaTeX to plain Unicode symbols, and ensure every exercise has a visual SVG diagram
  const safeContent = ensureExerciseHasSvgDiagram(
    stripLatexToPlainUnicode(content.replace(/[\u0E00-\u0E7F]+/g, ""))
  );

  // Split code blocks, block math, and embedded SVG tags
  const parts = safeContent.split(
    /(```[\s\S]*?```|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|<svg[\s\S]*?<\/svg>)/gi
  );

  return (
    <div className="space-y-2 text-[14.5px] leading-relaxed text-inherit break-words">
      {parts.map((part, index) => {
        if (!part) return null;

        // Embedded Raw SVG
        if (part.toLowerCase().startsWith("<svg") && part.toLowerCase().endsWith("</svg>")) {
          return <SvgDiagram key={index} svgCode={part} />;
        }

        // Code block
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.slice(3, -3).trim().split("\n");
          const firstLine = lines[0]?.trim() || "";
          const isLanguageTag = /^[a-zA-Z0-9_+#.-]+$/.test(firstLine);
          const language = isLanguageTag ? firstLine : "code";
          const codeBody = isLanguageTag ? lines.slice(1).join("\n") : lines.join("\n");

          if (language.toLowerCase() === "media-downloader") {
            return <MediaDownloaderCard key={index} encodedPayload={codeBody} />;
          }

          if (language.toLowerCase() === "video-khmer-dub") {
            return <VideoKhmerDubCard key={index} encodedPayload={codeBody} />;
          }

          if (language.toLowerCase() === "orthography-ocr") {
            return <OrthographyOcrCard key={index} encodedPayload={codeBody} />;
          }

          if (language.toLowerCase() === "world-translator") {
            return <WorldTranslatorCard key={index} encodedPayload={codeBody} />;
          }

          if (language.toLowerCase() === "illustrated-story") {
            return <IllustratedStoryCard key={index} encodedPayload={codeBody} />;
          }

          if (language.toLowerCase() === "visual-dictionary") {
            return <VisualDictionaryCard key={index} encodedPayload={codeBody} />;
          }

          if (language.toLowerCase() === "cambodia-calendar") {
            return <CambodiaCalendarCard key={index} encodedPayload={codeBody} />;
          }

          // If the code block itself contains SVG diagram, render as diagram
          if (
            language.toLowerCase() === "svg" ||
            (codeBody.includes("<svg") && codeBody.includes("</svg>"))
          ) {
            const svgMatch = codeBody.match(/<svg[\s\S]*?<\/svg>/i);
            if (svgMatch) {
              return <SvgDiagram key={index} svgCode={svgMatch[0]} />;
            }
          }

          return <CodeSnippet key={index} code={codeBody} language={language} />;
        }

        // Display Math Block $$...$$
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const mathExpr = part.slice(2, -2);
          return (
            <div key={index} className="p-2 my-2 bg-black/20 rounded-lg border border-white/5 overflow-x-auto">
              {renderKaTeX(mathExpr, true)}
            </div>
          );
        }

        // Display Math Block \[...\]
        if (part.startsWith("\\[") && part.endsWith("\\]")) {
          const mathExpr = part.slice(2, -2);
          return (
            <div key={index} className="p-2 my-2 bg-black/20 rounded-lg border border-white/5 overflow-x-auto">
              {renderKaTeX(mathExpr, true)}
            </div>
          );
        }

        return <TextSection key={index} text={part} />;
      })}
    </div>
  );
};

const CodeSnippet: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);

  const langLower = (language || "code").toLowerCase();
  const isWebPreviewable =
    langLower === "html" ||
    langLower === "htm" ||
    code.includes("<!DOCTYPE html") ||
    code.includes("<html") ||
    (code.includes("<div") && (code.includes("<script") || code.includes("<style") || code.includes("class=")));

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    const ext =
      langLower === "html" || isWebPreviewable
        ? "html"
        : langLower === "css"
        ? "css"
        : langLower === "typescript" || langLower === "ts"
        ? "ts"
        : langLower === "tsx" || langLower === "react"
        ? "tsx"
        : "js";
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `khmer-ai-webapp.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  return (
    <div className="my-2.5 rounded-lg overflow-hidden border border-white/10 bg-[#0f1722] text-[#d6e0ea] text-xs shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-[#17212b] border-b border-white/10 text-white/70">
        <div className="flex items-center space-x-1.5 font-mono text-[11px] uppercase tracking-wider text-sky-400">
          <Code2 className="w-3.5 h-3.5" />
          <span>{language}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isWebPreviewable && (
            <button
              type="button"
              onClick={() => setShowLivePreview((prev) => !prev)}
              className={`flex items-center space-x-1 text-[11px] px-2.5 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                showLivePreview
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              <span>{showLivePreview ? "💻 មើលកូដវិញ" : "🌐 មើល Web App ផ្ទាល់ (Live Preview)"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleDownloadCode}
            className="flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-sky-300 transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>ទាញយក</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/80 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">បានចម្លង!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>ចម្លងកូដ</span>
              </>
            )}
          </button>
        </div>
      </div>
      {showLivePreview && isWebPreviewable ? (
        <div className="bg-slate-950 border-b border-white/10">
          <iframe
            title="Web App Live Preview"
            sandbox="allow-scripts"
            srcDoc={code}
            className="w-full h-[380px] border-0 bg-white"
          />
        </div>
      ) : (
        <pre className="p-3 overflow-x-auto font-mono text-[12.5px] leading-relaxed text-[#cbe1f7] whitespace-pre">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
};

const TextSection: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split("\n");

  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Detect Reprimand / Moral & Exercise Scolding block (😠)
        if (
          trimmed.includes("😠") ||
          trimmed.includes("😡") ||
          trimmed.includes("ការស្ដីបន្ទោស") ||
          trimmed.includes("ការស្តីបន្ទោស") ||
          trimmed.includes("ស្ដីបន្ទោសដាស់តឿន") ||
          trimmed.includes("ស្តីបន្ទោសដាស់តឿន") ||
          trimmed.includes("អប់រំសីលធម៌")
        ) {
          return (
            <div
              key={idx}
              className="my-2 p-3 rounded-lg bg-rose-950/55 border-l-4 border-rose-500 text-rose-100 shadow-sm"
            >
              <div className="flex items-start gap-2 text-rose-300 font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{renderInlineWithMath(trimmed.replace(/^[•\-\*]\s*/, ""))}</span>
              </div>
            </div>
          );
        }

        // Detect Encouragement & Shortcomings Explanation block (💪)
        if (
          trimmed.includes("💪") ||
          trimmed.includes("ការលើកទឹកចិត្ត") ||
          trimmed.includes("ពន្យល់ចំណុចខ្វះខាត") ||
          trimmed.includes("ពន្យល់ចំនុចខ្វះខាត") ||
          trimmed.includes("ចំណុចខ្វះខាត៖") ||
          trimmed.includes("ចំនុចខ្វះខាត៖")
        ) {
          return (
            <div
              key={idx}
              className="my-2 p-3 rounded-lg bg-amber-950/45 border-l-4 border-amber-400 text-amber-100 shadow-sm"
            >
              <div className="flex items-start gap-2 text-amber-300 font-semibold">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{renderInlineWithMath(trimmed.replace(/^[•\-\*]\s*/, ""))}</span>
              </div>
            </div>
          );
        }

        // Detect Google Gemini AI 3-Part Exercise Structure (- **គំនិត៖**, - **ការពន្យល់៖**, - **ចម្លើយ៖**) & Ministry pedagogical step blocks
        if (
          /^[•\-\*\s]*(?:\*\*)?គំនិត\s*[៖:]/i.test(trimmed) ||
          trimmed.includes("📝") ||
          trimmed.includes("បម្រាប់ប្រធាន") ||
          trimmed.includes("បម្រាប់:") ||
          trimmed.includes("បម្រាប់៖") ||
          trimmed.startsWith("• បម្រាប់") ||
          /^[•\-\*\s]*ដោយ\s*[:៖(]/.test(trimmed)
        ) {
          return (
            <div
              key={idx}
              className="my-1.5 p-2.5 rounded-lg bg-indigo-950/45 border-l-4 border-indigo-400 text-indigo-100 font-medium"
            >
              <div className="flex items-start gap-2 text-indigo-200">
                <BookOpen className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span className="flex-1">{renderInlineWithMath(trimmed.replace(/^[•\-\*]\s*/, ""))}</span>
              </div>
            </div>
          );
        }

        if (
          trimmed.includes("📐") ||
          trimmed.includes("រូបមន្ត") ||
          trimmed.includes("តាមរូបមន្ត") ||
          trimmed.includes("រូបមន្តដែលត្រូវប្រើ")
        ) {
          return (
            <div
              key={idx}
              className="my-1.5 p-2.5 rounded-lg bg-indigo-950/40 border-l-4 border-indigo-400 text-indigo-100"
            >
              <div className="font-semibold text-indigo-300">
                {renderInlineWithMath(trimmed.replace(/^[•\-\*]\s*/, ""))}
              </div>
            </div>
          );
        }

        if (
          /^[•\-\*\s]*(?:\*\*)?ការពន្យល់\s*[៖:]/i.test(trimmed) ||
          trimmed.includes("🔢") ||
          trimmed.includes("ដំណោះស្រាយ") ||
          trimmed.includes("ការគណនា") ||
          trimmed.includes("ដំណោះស្រាយជាជំហានៗ") ||
          /^[•\-\*\s]*នាំឱ្យ\s*[:៖(]/.test(trimmed)
        ) {
          return (
            <div
              key={idx}
              className="my-1.5 p-2.5 rounded-lg bg-sky-950/45 border-l-4 border-sky-400 text-sky-100"
            >
              <div className="font-semibold text-sky-200">
                {renderInlineWithMath(trimmed.replace(/^[•\-\*]\s*/, ""))}
              </div>
            </div>
          );
        }

        if (
          /^[•\-\*\s]*(?:\*\*)?ចម្លើយ\s*[៖:]/i.test(trimmed) ||
          trimmed.includes("🎯") ||
          trimmed.includes("ចម្លើយចុងក្រោយ") ||
          trimmed.includes("សន្និដ្ឋាន") ||
          trimmed.startsWith("ដូចនេះ") ||
          trimmed.includes("ដូចនេះ:") ||
          trimmed.includes("ដូចនេះ៖")
        ) {
          return (
            <div
              key={idx}
              className="my-2 p-2.5 rounded-lg bg-emerald-950/55 border border-emerald-500/45 text-emerald-100 shadow-sm"
            >
              <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{renderInlineWithMath(trimmed.replace(/^[•\-\*]\s*/, ""))}</span>
              </div>
            </div>
          );
        }

        // Headers: ###, ##, #
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-bold text-base text-sky-300 pt-1">
              {renderInlineWithMath(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={idx} className="font-bold text-lg text-sky-200 border-b border-white/10 pb-1 pt-1.5">
              {renderInlineWithMath(trimmed.slice(3))}
            </h3>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h2 key={idx} className="font-extrabold text-xl text-white border-b border-white/20 pb-1.5 pt-2">
              {renderInlineWithMath(trimmed.slice(2))}
            </h2>
          );
        }

        // Bullet lists
        if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={idx} className="flex items-start space-x-2 pl-1.5 py-0.5">
              <span className="text-sky-400 select-none">•</span>
              <span className="flex-1">{renderInlineWithMath(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Numbered lists: 1. , 2. 
        const numMatch = trimmed.match(/^(\d+[\.\)])\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start space-x-2 pl-1.5 py-0.5">
              <span className="text-sky-400 font-semibold select-none min-w-[1.2rem]">{numMatch[1]}</span>
              <span className="flex-1">{renderInlineWithMath(numMatch[2])}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="py-0.5">
            {renderInlineWithMath(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

// Handle inline math $...$ or \(...\) alongside bold/italic/code
function renderInlineWithMath(text: string): React.ReactNode {
  // Split on inline math delimiters: $...$ or \(...\)
  const mathParts = text.split(/(\$[^\$\n]+\$|\\\([^\n]+?\\\))/g);

  return mathParts.map((part, i) => {
    // Check if inline math $...$
    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
      const expr = part.slice(1, -1);
      return <React.Fragment key={i}>{renderKaTeX(expr, false)}</React.Fragment>;
    }
    // Check if inline math \(...\)
    if (part.startsWith("\\(") && part.endsWith("\\)") && part.length > 4) {
      const expr = part.slice(2, -2);
      return <React.Fragment key={i}>{renderKaTeX(expr, false)}</React.Fragment>;
    }

    // Otherwise render standard markdown inline formatting
    return <React.Fragment key={i}>{renderInlineFormatting(part)}</React.Fragment>;
  });
}

// Inline helper for **bold**, *italic*, and `inline code`
function renderInlineFormatting(text: string): React.ReactNode {
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((codePart, i) => {
    if (codePart.startsWith("`") && codePart.endsWith("`")) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-black/40 text-emerald-300 font-mono text-[12px] border border-white/10"
        >
          {codePart.slice(1, -1)}
        </code>
      );
    }

    // Bold **text**
    const boldParts = codePart.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((boldPart, j) => {
      if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
        return (
          <strong key={`${i}-${j}`} className="font-bold text-white">
            {boldPart.slice(2, -2)}
          </strong>
        );
      }

      // Italic *text*
      const italicParts = boldPart.split(/(\*[^*]+\*)/g);
      return italicParts.map((itPart, k) => {
        if (itPart.startsWith("*") && itPart.endsWith("*") && itPart.length > 2) {
          return (
            <em key={`${i}-${j}-${k}`} className="italic text-sky-200">
              {itPart.slice(1, -1)}
            </em>
          );
        }
        return itPart;
      });
    });
  });
}
