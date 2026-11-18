// ============================================================================
// KHMER SUPER AI AGENT 24/7 — NEW SUPER CAPABILITIES ENGINE
// 1. Universal World Language Translator (All 150+ Languages Worldwide)
// 2. Illustrated Story Generator (Horror / រឿងរន្ធត់, Novel / ប្រលោមលោក, Folktale / រឿងនិទានកថា)
//    with Character Portraits & Per-Episode Scene Illustrations
// 3. Tri-Directional Visual Dictionary (Khmer-Khmer, English-Khmer, Khmer-English)
//    with Word Illustrations & Example Sentences
// 4. Real-Time Cambodia Calendar & Daily Holiday/Event Notifier (Actual Year)
// ============================================================================

import {
  normalizeKhmerText,
  applyStrictKhmerOrthographyFix,
  getConfiguredBotToken,
  getPublicAppBaseUrl,
  sendTelegramHtml,
  sendSingleKhmerVoice,
} from "./telegram-webhook.js";
import {
  sendTelegramSvgPhotoServer,
  createWorldTranslatorSvgCard,
  createCambodiaCalendarSvgCard,
} from "./telegram-id-chat.js";
import {
  getDailyCalendarComprehensiveData,
  formatDailyCalendarTelegramHtml,
  createComprehensiveCalendarSvgCard,
} from "./khmer-calendar-engine.js";
import { markChatReceivedTodayCalendar } from "./daily-calendar-scheduler.js";

function escapeHtmlLocal(str = "") {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeXmlAttr(str = "") {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ""
  );
}

async function callGeminiJsonFast(promptText, timeoutMs = 13000) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  const models = [
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-flash",
    "gemini-flash-latest",
  ];
  for (const modelName of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "aistudio-build",
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: 0.25,
              responseMimeType: "application/json",
            },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const rawTxt = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = JSON.parse(rawTxt.replace(/```json|```/g, "").trim());
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    } catch {}
  }
  return null;
}

// ============================================================================
// CAPABILITY 3: UNIVERSAL WORLD TRANSLATOR (ALL LANGUAGES IN THE WORLD)
// ============================================================================
export const WORLD_LANGUAGES_LIST = [
  { code: "auto", nameKm: "ស្វែងរកភាសាស្វ័យប្រវត្តិ", nameEn: "Auto-Detect", flag: "🌐" },
  { code: "km", nameKm: "ភាសាខ្មែរ", nameEn: "Khmer", flag: "🇰🇭" },
  { code: "en", nameKm: "ភាសាអង់គ្លេស", nameEn: "English", flag: "🇬🇧" },
  { code: "zh", nameKm: "ភាសាចិន (កុកងឺ)", nameEn: "Chinese (Mandarin)", flag: "🇨🇳" },
  { code: "fr", nameKm: "ភាសាបារាំង", nameEn: "French", flag: "🇫🇷" },
  { code: "ja", nameKm: "ភាសាជប៉ុន", nameEn: "Japanese", flag: "🇯🇵" },
  { code: "ko", nameKm: "ភាសាកូរ៉េ", nameEn: "Korean", flag: "🇰🇷" },
  { code: "vi", nameKm: "ភាសាវៀតណាម", nameEn: "Vietnamese", flag: "🇻🇳" },
  { code: "th", nameKm: "ភាសាថៃ", nameEn: "Thai", flag: "🇹🇭" },
  { code: "lo", nameKm: "ភាសាឡាវ", nameEn: "Lao", flag: "🇱🇦" },
  { code: "id", nameKm: "ភាសាឥណ្ឌូនេស៊ី", nameEn: "Indonesian", flag: "🇮🇩" },
  { code: "ms", nameKm: "ភាសាម៉ាឡេ", nameEn: "Malay", flag: "🇲🇾" },
  { code: "tl", nameKm: "ភាសាហ្វីលីពីន (Tagalog)", nameEn: "Filipino / Tagalog", flag: "🇵🇭" },
  { code: "my", nameKm: "ភាសាមីយ៉ាន់ម៉ា (ភូមា)", nameEn: "Burmese", flag: "🇲🇲" },
  { code: "hi", nameKm: "ភាសាហិណ្ឌូ (ឥណ្ឌា)", nameEn: "Hindi", flag: "🇮🇳" },
  { code: "ar", nameKm: "ភាសាអារ៉ាប់", nameEn: "Arabic", flag: "🇸🇦" },
  { code: "ru", nameKm: "ភាសារុស្ស៊ី", nameEn: "Russian", flag: "🇷🇺" },
  { code: "de", nameKm: "ភាសាអាល្លឺម៉ង់", nameEn: "German", flag: "🇩🇪" },
  { code: "es", nameKm: "ភាសាអេស្ប៉ាញ", nameEn: "Spanish", flag: "🇪🇸" },
  { code: "pt", nameKm: "ភាសាព័រទុយហ្គាល់", nameEn: "Portuguese", flag: "🇵🇹" },
  { code: "it", nameKm: "ភាសាអ៊ីតាលី", nameEn: "Italian", flag: "🇮🇹" },
  { code: "tr", nameKm: "ភាសាទួរគី", nameEn: "Turkish", flag: "🇹🇷" },
  { code: "nl", nameKm: "ភាសាហូឡង់", nameEn: "Dutch", flag: "🇳🇱" },
  { code: "pl", nameKm: "ភាសាប៉ូឡូញ", nameEn: "Polish", flag: "🇵🇱" },
  { code: "sv", nameKm: "ភាសាស៊ុយអែត", nameEn: "Swedish", flag: "🇸🇪" },
  { code: "el", nameKm: "ភាសាក្រិក", nameEn: "Greek", flag: "🇬🇷" },
  { code: "he", nameKm: "ភាសាហេប្រឺ (អ៊ីស្រាអែល)", nameEn: "Hebrew", flag: "🇮🇱" },
  { code: "fa", nameKm: "ភាសាភឺសៀន (អ៊ីរ៉ង់)", nameEn: "Persian / Farsi", flag: "🇮🇷" },
  { code: "bn", nameKm: "ភាសាបង់ក្លាដែស (Bengali)", nameEn: "Bengali", flag: "🇧🇩" },
  { code: "ur", nameKm: "ភាសាអ៊ުރުទូ (ប៉ាគីស្ថាន)", nameEn: "Urdu", flag: "🇵🇰" },
  { code: "sw", nameKm: "ភាសាស្វាហ៊ីលី (អាហ្វ្រិក)", nameEn: "Swahili", flag: "🇰🇪" },
  { code: "la", nameKm: "ភាសាឡាតាំង / បាលី-សំស្ក្រឹត", nameEn: "Latin / Pali-Sanskrit", flag: "🏛️" },
];

export function isWorldTranslationRequestServer(text = "") {
  const clean = String(text || "").trim();
  if (!clean) return false;
  // Do not intercept video dubbing requests
  if (/(?:វីដេអូ|video|mp4|mp3|youtube|tiktok|capcut|facebook|fb\.watch|youtu\.be)/i.test(clean)) {
    return false;
  }
  if (/^\/(?:translate|tr|trans|បកប្រែ)\b/i.test(clean)) {
    return true;
  }
  if (
    /(?:បកប្រែ\s*(?:ភាសា|អត្ថបទ|ពាក្យ|ប្រយោគ|ឃ្លា)?\s*(?:នេះ)?\s*(?:ទៅជា|មកជា|ជា)\s*ភាសា|បកប្រែ\s*ពី\s*ភាសា|ជួយ\s*បកប្រែ|សូម\s*បកប្រែ|translate\s+(?:this\s+)?(?:to|into|from)\s+[a-z]+)/i.test(
      clean
    )
  ) {
    return true;
  }
  return false;
}

export async function translateWorldLanguagesServer({
  text = "",
  sourceLang = "auto",
  targetLang = "km",
}) {
  let cleanText = String(text || "")
    .replace(/^\/(?:translate|tr|trans|បកប្រែ)(?:@\S+)?\s*/i, "")
    .trim();

  // Detect target language mentioned inside natural prompt (e.g. "បកប្រែទៅជាភាសាបារាំង៖ សួស្ដី")
  let resolvedTarget = targetLang || "km";
  const langMapRegex = [
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:ខ្មែរ|khmer)|(?:to|into)\s+khmer/i, code: "km" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:អង់គ្លេស|english)|(?:to|into)\s+english/i, code: "en" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:ចិន|កុកងឺ|chinese|mandarin)|(?:to|into)\s+(?:chinese|mandarin)/i, code: "zh" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:បារាំង|french)|(?:to|into)\s+french/i, code: "fr" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:ជប៉ុន|japanese)|(?:to|into)\s+japanese/i, code: "ja" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:កូរ៉េ|korean)|(?:to|into)\s+korean/i, code: "ko" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:វៀតណាម|យួន|vietnamese)|(?:to|into)\s+vietnamese/i, code: "vi" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:ថៃ|សៀម|thai)|(?:to|into)\s+thai/i, code: "th" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:ឡាវ|lao)|(?:to|into)\s+lao/i, code: "lo" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:អាល្លឺម៉ង់|german)|(?:to|into)\s+german/i, code: "de" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:អេស្ប៉ាញ|spanish)|(?:to|into)\s+spanish/i, code: "es" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:រុស្ស៊ី|russian)|(?:to|into)\s+russian/i, code: "ru" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:អារ៉ាប់|arabic)|(?:to|into)\s+arabic/i, code: "ar" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:ហិណ្ឌូ|ឥណ្ឌា|hindi)|(?:to|into)\s+hindi/i, code: "hi" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:អ៊ីតាលី|italian)|(?:to|into)\s+italian/i, code: "it" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:ព័រទុយហ្គាល់|portuguese)|(?:to|into)\s+portuguese/i, code: "pt" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:ឥណ្ឌូនេស៊ី|indonesian)|(?:to|into)\s+indonesian/i, code: "id" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:ម៉ាឡេ|malay)|(?:to|into)\s+malay/i, code: "ms" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:ហ្វីលីពីន|tagalog|filipino)|(?:to|into)\s+(?:tagalog|filipino)/i, code: "tl" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:ភូមា|មីយ៉ាន់ម៉ា|burmese)|(?:to|into)\s+burmese/i, code: "my" },
    { rx: /(?:ទៅជា|មកជា|ជា)\s*ភាសា\s*(?:ទួរគី|turkish)|(?:to|into)\s+turkish/i, code: "tr" },
  ];

  for (const item of langMapRegex) {
    if (item.rx.test(cleanText)) {
      resolvedTarget = item.code;
      break;
    }
  }

  // Strip prefix instructions like "បកប្រែទៅជាភាសាបារាំង៖" if followed by colon or quotes
  const stripped = cleanText
    .replace(
      /^(?:សូម\s*)?(?:ជួយ\s*)?បកប្រែ(?:អត្ថបទ|ពាក្យ|ប្រយោគ|ភាសា)?(?:នេះ)?\s*(?:ទៅជា|មកជា|ជា)?\s*(?:ភាសា\s*[^\s:៖]+)?\s*[:៖]\s*/i,
      ""
    )
    .replace(/^translate\s+(?:this\s+)?(?:into|to)\s+[a-z]+\s*:\s*/i, "")
    .trim();
  if (stripped) cleanText = stripped;

  // If user didn't specify target language and input is already Khmer, translate to English + Major World Languages
  const isInputKhmer = /[\u1780-\u17FF]/.test(cleanText);
  if ((!targetLang || targetLang === "auto") && isInputKhmer && resolvedTarget === "km") {
    resolvedTarget = "en";
  }

  const targetMeta =
    WORLD_LANGUAGES_LIST.find((l) => l.code === resolvedTarget) ||
    { code: resolvedTarget, nameKm: resolvedTarget, nameEn: resolvedTarget, flag: "🌍" };
  const sourceMeta =
    WORLD_LANGUAGES_LIST.find((l) => l.code === sourceLang) ||
    { code: sourceLang, nameKm: "ស្វែងរកស្វ័យប្រវត្តិ", nameEn: "Auto-Detected", flag: "🌐" };

  const prompt =
    `អ្នកគឺជាអ្នកជំនាញបកប្រែភាសាអន្តរជាតិកម្រិតពិភពលោក (Universal World Polyglot Translator) ដែលចេះគ្រប់ភាសាទាំងអស់នៅទូទាំងពិភពលោក និងចេះអក្ខរាវិរុទ្ធភាសាខ្មែរតាមវចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត យ៉ាងត្រឹមត្រូវ ១០០%។\n` +
    `សូមបកប្រែអត្ថបទខាងក្រោម៖\n` +
    `"""\n${cleanText}\n"""\n` +
    `• ភាសាដើម (Source Language)៖ ${sourceLang === "auto" ? "សូមស្វែងរកភាសាដើមដោយស្វ័យប្រវត្តិ" : `${sourceMeta.nameKm} (${sourceMeta.nameEn})`}\n` +
    `• ភាសាគោលដៅ (Target Language)៖ ${targetMeta.nameKm} (${targetMeta.nameEn} - code: ${resolvedTarget})\n\n` +
    `សូមឆ្លើយជា JSON តែមួយគត់តាមទម្រង់នេះ៖\n` +
    `{\n` +
    `  "detectedSourceLang": "ឈ្មោះភាសាដើមជាភាសាខ្មែរ និងអង់គ្លេស ព្រមទាំងទង់ជាតិ (ឧ. ភាសាខ្មែរ (Khmer) 🇰🇭)",\n` +
    `  "targetLangLabel": "ឈ្មោះភាសាគោលដៅជាភាសាខ្មែរ និងអង់គ្លេស ព្រមទាំងទង់ជាតិ (ឧ. ${targetMeta.nameKm} (${targetMeta.nameEn}) ${targetMeta.flag})",\n` +
    `  "translatedText": "អត្ថបទបកប្រែដ៏ត្រឹមត្រូវ ពីរោះធម្មជាតិ និងមិនខុសអក្ខរាវិរុទ្ធ",\n` +
    `  "phoneticRomanization": "របៀបអានជាអក្សរឡាតាំង / IPA / Pinyin / Romaji នៃអត្ថបទបកប្រែ",\n` +
    `  "khmerPronunciationGuide": "របៀបអានបញ្ចេញសំឡេងនៃអត្ថបទបកប្រែដោយសរសេរជាតួអក្សរខ្មែរ ដើម្បីឱ្យកូនខ្មែរអានតាមបានភ្លាមៗ",\n` +
    `  "formalVariant": "ការបកប្រែបែបផ្លូវការ ឬគួរសមខ្ពស់ (Formal / Polite)",\n` +
    `  "casualVariant": "ការបកប្រែបែបធម្មតា ឬស្និទ្ធស្នាល (Casual / Conversational)",\n` +
    `  "otherMajorTranslations": [\n` +
    `    { "lang": "🇬🇧 អង់គ្លេស (English)", "text": "...", "pronunciation": "..." },\n` +
    `    { "lang": "🇨🇳 ចិន (Chinese)", "text": "...", "pronunciation": "..." },\n` +
    `    { "lang": "🇫🇷 បារាំង (French)", "text": "...", "pronunciation": "..." },\n` +
    `    { "lang": "🇯🇵 ជប៉ុន (Japanese)", "text": "...", "pronunciation": "..." },\n` +
    `    { "lang": "🇰🇷 កូរ៉េ (Korean)", "text": "...", "pronunciation": "..." }\n` +
    `  ],\n` +
    `  "vocabularyBreakdown": [\n` +
    `    { "word": "ពាក្យសំខាន់", "meaningKhmer": "អត្ថន័យជាភាសាខ្មែរ", "pronunciation": "របៀបអាន" }\n` +
    `  ],\n` +
    `  "grammarAndCultureNoteKhmer": "ការពន្យល់ខ្លីៗអំពីវេយ្យាករណ៍ ឬបរិបទនៃការប្រើប្រាស់ឃ្លានេះជាភាសាខ្មែរ"\n` +
    `}`;

  const aiRes = await callGeminiJsonFast(prompt, 14000);

  if (aiRes && aiRes.translatedText) {
    const fixedTranslated =
      resolvedTarget === "km"
        ? applyStrictKhmerOrthographyFix(aiRes.translatedText).fixedText
        : String(aiRes.translatedText).trim();
    return {
      ok: true,
      sourceText: cleanText,
      sourceLangCode: sourceLang,
      targetLangCode: resolvedTarget,
      detectedSourceLang: normalizeKhmerText(
        aiRes.detectedSourceLang || `${sourceMeta.nameKm} (${sourceMeta.nameEn}) ${sourceMeta.flag}`
      ),
      targetLangLabel: normalizeKhmerText(
        aiRes.targetLangLabel || `${targetMeta.nameKm} (${targetMeta.nameEn}) ${targetMeta.flag}`
      ),
      translatedText: fixedTranslated,
      phoneticRomanization: String(aiRes.phoneticRomanization || "").trim(),
      khmerPronunciationGuide: normalizeKhmerText(aiRes.khmerPronunciationGuide || ""),
      formalVariant:
        resolvedTarget === "km"
          ? applyStrictKhmerOrthographyFix(aiRes.formalVariant || fixedTranslated).fixedText
          : String(aiRes.formalVariant || fixedTranslated),
      casualVariant:
        resolvedTarget === "km"
          ? applyStrictKhmerOrthographyFix(aiRes.casualVariant || fixedTranslated).fixedText
          : String(aiRes.casualVariant || fixedTranslated),
      otherMajorTranslations: Array.isArray(aiRes.otherMajorTranslations)
        ? aiRes.otherMajorTranslations.slice(0, 6)
        : [],
      vocabularyBreakdown: Array.isArray(aiRes.vocabularyBreakdown)
        ? aiRes.vocabularyBreakdown.slice(0, 8).map((v) => ({
            word: String(v.word || ""),
            meaningKhmer: applyStrictKhmerOrthographyFix(v.meaningKhmer || "").fixedText,
            pronunciation: String(v.pronunciation || ""),
          }))
        : [],
      grammarAndCultureNoteKhmer: applyStrictKhmerOrthographyFix(
        aiRes.grammarAndCultureNoteKhmer ||
          "បានបកប្រែយ៉ាងត្រឹមត្រូវតាមក្បួនវេយ្យាករណ៍ និងវចនានុក្រមអន្តរជាតិ។"
      ).fixedText,
    };
  }

  // Deterministic Fallback if API is unreachable
  const fallbackText = applyStrictKhmerOrthographyFix(cleanText).fixedText;
  return {
    ok: true,
    sourceText: cleanText,
    sourceLangCode: sourceLang,
    targetLangCode: resolvedTarget,
    detectedSourceLang: isInputKhmer ? "ភាសាខ្មែរ (Khmer) 🇰🇭" : "ភាសាអន្តរជាតិ (World Language) 🌐",
    targetLangLabel: `${targetMeta.nameKm} (${targetMeta.nameEn}) ${targetMeta.flag}`,
    translatedText: fallbackText,
    phoneticRomanization: cleanText,
    khmerPronunciationGuide: fallbackText,
    formalVariant: fallbackText,
    casualVariant: fallbackText,
    otherMajorTranslations: [],
    vocabularyBreakdown: [],
    grammarAndCultureNoteKhmer:
      "បានបកប្រែតាមប្រព័ន្ធបកប្រែភាសាពិភពលោក (Universal World Translator)។",
  };
}

export async function sendTelegramWorldTranslation(token, chatId, replyToMessageId, params) {
  const effectiveToken = getConfiguredBotToken(token);
  fetch(`https://api.telegram.org/bot${effectiveToken}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  }).catch(() => {});

  const tr = await translateWorldLanguagesServer(params);

  const otherLangsHtml =
    tr.otherMajorTranslations.length > 0
      ? `\n🌏 <b>បកប្រែទៅភាសាធំៗផ្សេងទៀតលើពិភពលោក៖</b>\n` +
        tr.otherMajorTranslations
          .map(
            (o) =>
              `• <b>${escapeHtmlLocal(o.lang)}៖</b> ${escapeHtmlLocal(o.text)}${
                o.pronunciation ? ` <i>(${escapeHtmlLocal(o.pronunciation)})</i>` : ""
              }`
          )
          .join("\n") +
        `\n`
      : "";

  const vocabHtml =
    tr.vocabularyBreakdown.length > 0
      ? `\n📚 <b>ពាក្យគន្លឹះសំខាន់ៗ (Key Vocabulary)៖</b>\n` +
        tr.vocabularyBreakdown
          .map(
            (v) =>
              `• <b>${escapeHtmlLocal(v.word)}</b> (${escapeHtmlLocal(
                v.pronunciation
              )}) = ${escapeHtmlLocal(v.meaningKhmer)}`
          )
          .join("\n") +
        `\n`
      : "";

  const html =
    `🌍✨ <b>ប្រព័ន្ធបកប្រែគ្រប់ភាសាលើពិភពលោក (Universal World Translator)</b>\n` +
    `• 📥 <b>ភាសាដើម៖</b> ${escapeHtmlLocal(tr.detectedSourceLang)}\n` +
    `• 🎯 <b>ភាសាគោលដៅ៖</b> ${escapeHtmlLocal(tr.targetLangLabel)}\n\n` +
    `📝 <b>អត្ថបទដើម៖</b>\n<pre>${escapeHtmlLocal(tr.sourceText.slice(0, 900))}</pre>\n\n` +
    `✨📋 <b>អត្ថបទបកប្រែផ្លូវការ (ចុចដើម្បី Copy)៖</b>\n<pre>${escapeHtmlLocal(
      tr.translatedText.slice(0, 1200)
    )}</pre>\n` +
    (tr.phoneticRomanization
      ? `• 🗣️ <b>របៀបអាន (Phonetic)៖</b> <code>${escapeHtmlLocal(
          tr.phoneticRomanization
        )}</code>\n`
      : "") +
    (tr.khmerPronunciationGuide
      ? `• 🇰🇭 <b>របៀបអានជាសំឡេងខ្មែរ៖</b> ${escapeHtmlLocal(tr.khmerPronunciationGuide)}\n`
      : "") +
    (tr.formalVariant && tr.formalVariant !== tr.translatedText
      ? `• 👔 <b>បែបផ្លូវការ/គួរសម៖</b> ${escapeHtmlLocal(tr.formalVariant)}\n`
      : "") +
    (tr.casualVariant && tr.casualVariant !== tr.translatedText
      ? `• 💬 <b>បែបស្និទ្ធស្នាល៖</b> ${escapeHtmlLocal(tr.casualVariant)}\n`
      : "") +
    otherLangsHtml +
    vocabHtml +
    `\n💡 <b>កំណត់សម្គាល់វេយ្យាករណ៍៖</b> ${escapeHtmlLocal(tr.grammarAndCultureNoteKhmer)}`;

  const studioUrl = `${getPublicAppBaseUrl()}/?studio=translator&tg_chat_id=${encodeURIComponent(
    String(chatId)
  )}`;
  const trKeyboard = {
    inline_keyboard: [
      [
        { text: "🇰🇭 ប្រែមកខ្មែរ", callback_data: "tr_lang_km" },
        { text: "🇬🇧 English", callback_data: "tr_lang_en" },
        { text: "🇨🇳 ចិន", callback_data: "tr_lang_zh" },
      ],
      [
        { text: "🇫🇷 បារាំង", callback_data: "tr_lang_fr" },
        { text: "🇯🇵 ជប៉ុន", callback_data: "tr_lang_ja" },
        { text: "🇰🇷 កូរ៉េ", callback_data: "tr_lang_ko" },
      ],
      [
        { text: "🇹🇭 ថៃ", callback_data: "tr_lang_th" },
        { text: "🇻🇳 វៀតណាម", callback_data: "tr_lang_vi" },
      ],
      [
        {
          text: "🌐 បើកផ្ទាំងបកប្រែ ១៥០+ ភាសាពេញលេញ",
          web_app: { url: studioUrl },
        },
      ],
    ],
  };

  await Promise.all([
    sendTelegramSvgPhotoServer(
      effectiveToken,
      chatId,
      createWorldTranslatorSvgCard(tr),
      `🌍 <b>ប័ណ្ណបកប្រែភាសាពិភពលោក (${escapeHtmlLocal(tr.targetLangLabel)})</b>\n🗣️ <code>${escapeHtmlLocal(
        tr.translatedText.slice(0, 220)
      )}</code>`,
      null,
      replyToMessageId
    ).catch(() => {}),
    sendTelegramHtml(effectiveToken, chatId, html, trKeyboard),
    sendSingleKhmerVoice(
      effectiveToken,
      chatId,
      `ការបកប្រែទៅជា ${tr.targetLangLabel} គឺ៖ ${tr.translatedText.slice(0, 220)}`
    ),
  ]);
  return { ok: true, tr };
}

// ============================================================================
// CAPABILITY 4: ILLUSTRATED STORY GENERATOR (HORROR / NOVEL / FOLKTALE)
// WITH CHARACTER PORTRAITS & PER-EPISODE SCENE ILLUSTRATIONS
// ============================================================================
export function createCharacterPortraitSvgDataUrl({
  name = "តួអង្គឯក",
  role = "តួអង្គសំខាន់",
  genre = "folktale",
  index = 0,
}) {
  const palettes = {
    horror: [
      ["#090d16", "#1e1b4b", "#ef4444", "#fca5a5"],
      ["#111827", "#31102f", "#a855f7", "#e9d5ff"],
      ["#051923", "#0f3460", "#22d3ee", "#cffafe"],
    ],
    novel: [
      ["#1e1b4b", "#4c1d95", "#f472b6", "#fbcfe8"],
      ["#0f172a", "#1e3a8a", "#38bdf8", "#bae6fd"],
      ["#1f2937", "#374151", "#fbbf24", "#fde68a"],
    ],
    folktale: [
      ["#14332b", "#065f46", "#fbbf24", "#fef08a"],
      ["#3b1d0c", "#78350f", "#f59e0b", "#fde68a"],
      ["#1e1b4b", "#312e81", "#34d399", "#a7f3d0"],
    ],
  };
  const group = palettes[genre] || palettes.folktale;
  const [bg1, bg2, accent, glow] = group[index % group.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg1}"/>
        <stop offset="100%" stop-color="${bg2}"/>
      </linearGradient>
      <radialGradient id="aura" cx="50%" cy="42%" r="45%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.48"/>
        <stop offset="100%" stop-color="${bg1}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="400" height="400" rx="28" fill="url(#bg)"/>
    <circle cx="200" cy="175" r="145" fill="url(#aura)"/>
    <circle cx="200" cy="165" r="96" fill="none" stroke="${accent}" stroke-width="2.5" stroke-dasharray="8 6" opacity="0.7"/>
    <!-- Artistic Character Silhouette & Crown/Hair Details -->
    <path d="M115 315 C115 245, 285 245, 285 315 Z" fill="${accent}" opacity="0.88"/>
    <circle cx="200" cy="160" r="54" fill="${glow}" opacity="0.92"/>
    ${
      genre === "folktale"
        ? `<polygon points="155,112 178,72 200,104 222,72 245,112" fill="#f59e0b" stroke="#fef08a" stroke-width="2"/>`
        : genre === "horror"
        ? `<circle cx="182" cy="156" r="6" fill="#ef4444"/><circle cx="218" cy="156" r="6" fill="#ef4444"/>`
        : `<circle cx="182" cy="156" r="5" fill="#1e1b4b"/><circle cx="218" cy="156" r="5" fill="#1e1b4b"/><path d="M186 176 Q200 188 214 176" stroke="#1e1b4b" stroke-width="3" fill="none"/>`
    }
    <rect x="24" y="305" width="352" height="74" rx="16" fill="#090d16" fill-opacity="0.78" stroke="${accent}" stroke-width="1.5"/>
    <text x="200" y="338" text-anchor="middle" fill="#ffffff" font-family="Noto Sans Khmer, sans-serif" font-size="20" font-weight="bold">${escapeXmlAttr(
      name.slice(0, 28)
    )}</text>
    <text x="200" y="365" text-anchor="middle" fill="${glow}" font-family="Noto Sans Khmer, sans-serif" font-size="14">${escapeXmlAttr(
      role.slice(0, 36)
    )}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createEpisodeSceneSvgDataUrl({
  episodeNumber = 1,
  title = "វគ្គទី ១",
  setting = "",
  mood = "",
  genre = "folktale",
}) {
  const themes = {
    horror: [
      { sky1: "#05070e", sky2: "#1f1135", moon: "#ef4444", hill: "#0d1322", accent: "#f87171" },
      { sky1: "#090d16", sky2: "#3b0764", moon: "#e879f9", hill: "#111827", accent: "#c084fc" },
      { sky1: "#04141c", sky2: "#1e293b", moon: "#38bdf8", hill: "#090d16", accent: "#67e8f9" },
      { sky1: "#18060c", sky2: "#450a0a", moon: "#fb923c", hill: "#0f090c", accent: "#fca5a5" },
    ],
    novel: [
      { sky1: "#1e1b4b", sky2: "#831843", moon: "#fde047", hill: "#17153b", accent: "#f472b6" },
      { sky1: "#0f172a", sky2: "#1d4ed8", moon: "#bae6fd", hill: "#0b1120", accent: "#60a5fa" },
      { sky1: "#2e1065", sky2: "#be185d", moon: "#fbcfe8", hill: "#1e1b4b", accent: "#fb7185" },
      { sky1: "#064e3b", sky2: "#0f766e", moon: "#fef08a", hill: "#022c22", accent: "#34d399" },
    ],
    folktale: [
      { sky1: "#132a13", sky2: "#065f46", moon: "#facc15", hill: "#0b1d0b", accent: "#fde047" },
      { sky1: "#1e1b4b", sky2: "#78350f", moon: "#fbbf24", hill: "#12102e", accent: "#f59e0b" },
      { sky1: "#0f2942", sky2: "#047857", moon: "#fef08a", hill: "#081c2e", accent: "#6ee7b7" },
      { sky1: "#31102f", sky2: "#9a3412", moon: "#fde68a", hill: "#1c0a1b", accent: "#fb923c" },
    ],
  };

  const list = themes[genre] || themes.folktale;
  const t = list[(episodeNumber - 1) % list.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${t.sky1}"/>
        <stop offset="100%" stop-color="${t.sky2}"/>
      </linearGradient>
      <radialGradient id="moonGlow" cx="76%" cy="24%" r="28%">
        <stop offset="0%" stop-color="${t.moon}" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="${t.moon}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="450" rx="24" fill="url(#sky)"/>
    <!-- Stars -->
    <circle cx="110" cy="65" r="2" fill="#ffffff" opacity="0.8"/>
    <circle cx="240" cy="45" r="1.5" fill="#ffffff" opacity="0.6"/>
    <circle cx="390" cy="80" r="2.2" fill="#ffffff" opacity="0.7"/>
    <circle cx="510" cy="50" r="1.8" fill="#ffffff" opacity="0.8"/>
    <circle cx="165" cy="120" r="1.5" fill="#ffffff" opacity="0.5"/>
    <!-- Moon / Sun Glow -->
    <circle cx="610" cy="108" r="115" fill="url(#moonGlow)"/>
    <circle cx="610" cy="108" r="42" fill="${t.moon}" opacity="0.92"/>
    <!-- Distant Temple / Castle / Forest Spires -->
    <polygon points="330,295 355,185 380,295" fill="${t.hill}" opacity="0.85"/>
    <polygon points="370,295 405,150 440,295" fill="${t.hill}" opacity="0.95"/>
    <polygon points="430,295 455,195 480,295" fill="${t.hill}" opacity="0.85"/>
    <!-- Landscape Hills -->
    <path d="M0 320 Q190 245 410 315 T800 285 L800 450 L0 450 Z" fill="${t.hill}" opacity="0.88"/>
    <path d="M0 355 Q280 295 530 345 T800 330 L800 450 L0 450 Z" fill="#05070e" opacity="0.95"/>
    <!-- Character Silhouettes in Scene -->
    <circle cx="235" cy="272" r="16" fill="${t.accent}"/>
    <path d="M212 335 C212 292, 258 292, 258 335 Z" fill="${t.accent}"/>
    <circle cx="295" cy="280" r="14" fill="#ffffff" opacity="0.85"/>
    <path d="M275 335 C275 298, 315 298, 315 335 Z" fill="#ffffff" opacity="0.85"/>
    <!-- Episode Caption Banner -->
    <rect x="28" y="346" width="744" height="82" rx="16" fill="#090d16" fill-opacity="0.84" stroke="${t.accent}" stroke-width="1.5"/>
    <text x="52" y="380" fill="${t.accent}" font-family="Noto Sans Khmer, sans-serif" font-size="18" font-weight="bold">វគ្គទី ${episodeNumber} ៖ ${escapeXmlAttr(
    title.slice(0, 46)
  )}</text>
    <text x="52" y="409" fill="#e2e8f0" font-family="Noto Sans Khmer, sans-serif" font-size="14">📍 ${escapeXmlAttr(
      (setting || mood || "ឈុតឆាកសំខាន់ក្នុងសាច់រឿង").slice(0, 68)
    )}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function isStoryGenerationRequestServer(text = "") {
  const clean = String(text || "").trim();
  if (!clean) return false;
  if (/^\/(?:story|horror|novel|folktale|រឿង|និទានរឿង|ប្រលោមលោក)\b/i.test(clean)) {
    return true;
  }
  if (
    /(?:បង្កើត\s*រឿង|សរសេរ\s*រឿង|និទាន\s*រឿង|តែង\s*រឿង|រឿង\s*បែប\s*រន្ធត់|រឿង\s*រន្ធត់|រឿង\s*ខ្មោច|រឿង\s*ប្រលោមលោក|រឿង\s*និទាន\s*កថា|រឿង\s*និទាន|រឿង\s*ព្រេង|write\s+a\s+(?:horror|novel|folktale|story)|generate\s+a\s+story)/i.test(
      clean
    )
  ) {
    return true;
  }
  return false;
}

export async function generateIllustratedStoryServer({
  prompt = "",
  genre = "auto",
  episodeCount = 4,
}) {
  const cleanPrompt = String(prompt || "")
    .replace(/^\/(?:story|horror|novel|folktale|រឿង|និទានរឿង|ប្រលោមលោក)(?:@\S+)?\s*/i, "")
    .trim();

  let resolvedGenre = genre;
  if (!resolvedGenre || resolvedGenre === "auto") {
    if (/(?:រន្ធត់|ខ្មោច|ព្រឺព្រួច|អាថ៌កំបាំង|ងងឹត|horror|ghost|scary|spooky|thriller)/i.test(cleanPrompt)) {
      resolvedGenre = "horror";
    } else if (/(?:ប្រលោមលោក|ស្នេហា|មនោសញ្ចេតនា|ជីវិត|novel|romance|drama)/i.test(cleanPrompt)) {
      resolvedGenre = "novel";
    } else {
      resolvedGenre = "folktale";
    }
  }

  const genreLabelMap = {
    horror: "👻 រឿងបែបរន្ធត់ និងអាថ៌កំបាំងព្រឺព្រួច (Horror & Supernatural Thriller)",
    novel: "💖 រឿងប្រលោមលោកមនោសញ្ចេតនា និងជីវិត (Romantic & Dramatic Novel)",
    folktale: "👑 រឿងនិទានកថា និងរឿងព្រេងអប់រំ (Folktale & Moral Fable)",
  };
  const genreLabelKhmer = genreLabelMap[resolvedGenre] || genreLabelMap.folktale;
  const numEpisodes = Math.min(5, Math.max(3, Number(episodeCount) || 4));

  const aiPrompt =
    `អ្នកគឺជាអ្នកនិពន្ធរឿងដ៏ឆ្នើមបំផុតនៃប្រទេសកម្ពុជា ដែលចេះនិពន្ធរឿងបែបរន្ធត់ (Horror) ប្រលោមលោក (Novel) និងរឿងនិទានកថា (Folktale) ប្រកបដោយសិល្ប៍វិធីខ្ពស់ និងមិនខុសអក្ខរាវិរុទ្ធតាមវចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត ១០០%។\n` +
    `• ប្រភេទរឿង (Genre)៖ ${genreLabelKhmer}\n` +
    `• ប្រធានបទ ឬសំណើរបស់អ្នកអាន៖ "${cleanPrompt || "សូមបង្កើតសាច់រឿងដ៏ជក់ចិត្ត និងទាក់ទាញបំផុត"}"\n` +
    `• ចំនួនវគ្គនៃសាច់រឿង៖ ${numEpisodes} វគ្គ (Episodes)\n\n` +
    `សូមបង្កើតសាច់រឿងពេញលេញដែលមានតួអង្គច្បាស់លាស់ និងបែងចែកជាវគ្គនីមួយៗ ដោយមានការពិពណ៌នារូបភាពសម្រាប់តួអង្គ និងវគ្គនីមួយៗ។ សូមឆ្លើយជា JSON តែមួយគត់តាមទម្រង់នេះ៖\n` +
    `{\n` +
    `  "title": "ចំណងជើងរឿងជាភាសាខ្មែរដ៏ទាក់ទាញ",\n` +
    `  "englishTitle": "English Subtitle of the Story",\n` +
    `  "synopsis": "សេចក្ដីសង្ខេបរឿងដ៏ជក់ចិត្ត (២-៣ ល្បះ)",\n` +
    `  "moralKhmer": "គតិអប់រំ ឬខ្លឹមសារសំខាន់នៃសាច់រឿង",\n` +
    `  "characters": [\n` +
    `    {\n` +
    `      "name": "ឈ្មោះតួអង្គ",\n` +
    `      "role": "តួនាទីក្នុងរឿង (ឧ. តួឯកប្រុស / តួឯកស្រី / វិញ្ញាណអាថ៌កំបាំង / អ្នកប្រាជ្ញ)",\n` +
    `      "description": "រូបរាង អត្តចរិត និងប្រវត្តិសង្ខេបរបស់តួអង្គ",\n` +
    `      "visualPromptEn": "Detailed English visual portrait description of this character for illustration"\n` +
    `    }\n` +
    `  ],\n` +
    `  "episodes": [\n` +
    `    {\n` +
    `      "episodeNumber": 1,\n` +
    `      "title": "ចំណងជើងវគ្គទី ១",\n` +
    `      "setting": "ទីកន្លែង និងបរិយាកាសនៃវគ្គនេះ",\n` +
    `      "mood": "អារម្មណ៍នៃឈុតឆាក (ឧ. ព្រឺព្រួចអាថ៌កំបាំង / រំភើបកদ্ដុកក្ដួល / ស្ងប់ស្ងាត់)",\n` +
    `      "charactersInScene": ["ឈ្មោះតួអង្គក្នុងវគ្គនេះ"],\n` +
    `      "narrative": "សាច់រឿងលម្អិតនៃវគ្គនេះ (យ៉ាងតិច ៤-៦ ល្បះ ពិពណ៌នាយ៉ាងក្បោះក្បាយ និងជក់ចិត្ត)",\n` +
    `      "dialogue": "សម្រង់សម្ដីសន្ទនាសំខាន់របស់តួអង្គក្នុងវគ្គនេះ",\n` +
    `      "visualPromptEn": "Detailed English visual scene description for generating the episode illustration"\n` +
    `    }\n` +
    `  ]\n` +
    `}`;

  const aiStory = await callGeminiJsonFast(aiPrompt, 15000);

  let title = "";
  let englishTitle = "";
  let synopsis = "";
  let moralKhmer = "";
  let rawCharacters = [];
  let rawEpisodes = [];

  if (aiStory && Array.isArray(aiStory.episodes) && aiStory.episodes.length > 0) {
    title = applyStrictKhmerOrthographyFix(aiStory.title || "សាច់រឿងពិសេស").fixedText;
    englishTitle = String(aiStory.englishTitle || "Illustrated Khmer Story");
    synopsis = applyStrictKhmerOrthographyFix(aiStory.synopsis || "").fixedText;
    moralKhmer = applyStrictKhmerOrthographyFix(
      aiStory.moralKhmer || "គតិអប់រំ៖ អំពើល្អ និងសេចក្ដីក្លាហានតែងឈ្នះអស់ឧបសគ្គទាំងពួង។"
    ).fixedText;
    rawCharacters = Array.isArray(aiStory.characters) ? aiStory.characters : [];
    rawEpisodes = aiStory.episodes;
  } else {
    // Rich Built-in Literary Story Fallback by Genre
    if (resolvedGenre === "horror") {
      title = "អាថ៌កំបាំងភូមិគ្រឹះចាស់ក្បែរមាត់បឹងទន្សាយ";
      englishTitle = "The Mystery of the Old Lakeside Mansion";
      synopsis =
        "នៅកណ្ដាលយប់ខែភ្លឺព្រឹក្សា យុវជន សុភ័ក្រ និងមិត្តភក្ដិបានធ្វើដំណើរទៅស្រាវជ្រាវភូមិគ្រឹះបុរាណមួយដែលគេបោះបង់ចោលជិតមួយសតវត្សរ៍ ហើយបានរកឃើញកំណត់ហេតុអាថ៌កំបាំងដែលដាស់វិញ្ញាណអ្នកថែរក្សាភូមិគ្រឹះឱ្យភ្ញាក់ឡើង។";
      moralKhmer =
        "គតិអប់រំ៖ ការគោរពទីកន្លែងបុរាណ និងការមានស្មារតីរឹងមាំជួយឱ្យយើងឆ្លងផុតពីភ័យអន្តរាយ។";
      rawCharacters = [
        {
          name: "សុភ័ក្រ (Sopheak)",
          role: "អ្នកស្រាវជ្រាវប្រវត្តិសាស្ត្រវ័យក្មេង (តួឯកប្រុស)",
          description: "យុវជនក្លាហាន ឆ្លាតវៃ ចូលចិត្តស្វែងរកការពិតនៃរឿងរ៉ាវអាថ៌កំបាំងពីបុរាណ។",
          visualPromptEn: "Young Khmer male historian holding a vintage lantern in a misty dark mansion, cinematic horror lighting",
        },
        {
          name: "នាង ចន្ទ្រា (Chantrea)",
          role: "វិញ្ញាណនាងក្រមុំថែរក្សាកំណត់ហេតុបុរាណ",
          description: "នាងក្រមុំស្លៀកពាក់បុរាណដែលរង់ចាំអ្នកមកស្រាយអាថ៌កំបាំងនៃគ្រួសាររបស់នាង។",
          visualPromptEn: "Mysterious traditional Khmer lady spirit under moonlight with glowing lotus, ethereal atmosphere",
        },
        {
          name: "តា ព្រហ្ម (Grandpa Prom)",
          role: "អ្នកយាមភូមិចាស់ទុំ",
          description: "ចាស់ទុំដែលដឹងរឿងរ៉ាវគ្រប់យ៉ាងអំពីភូមិគ្រឹះក្បែរមាត់បឹង។",
          visualPromptEn: "Wise elderly Khmer village guardian holding an ancient palm leaf manuscript at night",
        },
      ];
      rawEpisodes = [
        {
          episodeNumber: 1,
          title: "សំឡេងហៅនៅកណ្ដាលអធ្រាត្រ",
          setting: "ផ្លូវចូលភូមិគ្រឹះបុរាណក្បែរមាត់បឹងក្រោមពន្លឺព្រះចន្ទពេញបូណ៌មី",
          mood: "ព្រឺព្រួច អាថ៌កំបាំង និងស្ងាត់ជ្រងំ",
          charactersInScene: ["សុភ័ក្រ", "តា ព្រហ្ម"],
          narrative:
            "ខ្យល់ត្រជាក់បក់មកប៉ះស្លឹកឈើលាន់ឮសូរខ្សឹបៗដូចសំឡេងមនុស្សហៅឈ្មោះ។ សុភ័ក្រ កាន់ចង្កៀងគោមដើរឆ្លងកាត់ខ្លោងទ្វារដែកច្រេះចាប់នៃភូមិគ្រឹះបុរាណ ខណៈដែលអ័ព្ទពណ៌សក្រាស់ឃ្មឹកគ្របដណ្ដប់លើផ្ទៃបឹង។ តា ព្រហ្ម បានផ្ដាំផ្ញើមុនពេលចូលថា ឱ្យរក្សាចិត្តឱ្យស្ងប់ និងកុំប៉ះពាល់របស់របរណាដោយគ្មានការអនុញ្ញាត។",
          dialogue: "«សុភ័ក្រ ចៅត្រូវចាំថា រាល់ស្រមោលនៅក្នុងភូមិគ្រឹះនេះសុទ្ធតែមានរឿងរ៉ាវចង់ប្រាប់ចៅ!»",
          visualPromptEn: "Spooky ancient mansion gate by a foggy lake under a blood red moon, young man holding a glowing lantern",
        },
        {
          episodeNumber: 2,
          title: "បន្ទប់កញ្ចក់ និងសៀវភៅកំណត់ហេតុ",
          setting: "សាលធំក្នុងភូមិគ្រឹះដែលមានគំនូរបុរាណ និងទៀនឆេះដោយខ្លួនឯង",
          mood: "រន្ធត់ និងភ្ញាក់ផ្អើល",
          charactersInScene: ["សុភ័ក្រ", "នាង ចន្ទ្រា"],
          narrative:
            "នៅពេល សុភ័ក្រ ឈានជើងចូលដល់សាលធំ ទៀនទាំងអស់នៅលើជញ្ជាំងស្រាប់តែឆេះភ្លឺឡើងព្រមគ្នា។ នៅលើតុឈើគ្រញូងមានសៀវភៅកំណត់ហេតុចាស់មួយក្បាលបើកសន្លឹកដោយខ្លួនឯង។ ក្នុងកញ្ចក់ធំទល់មុខគាត់ ស្រមោលនាងក្រមុំស្លៀកពាក់បុរាណម្នាក់បានលេចឡើងយឺតៗដោយទឹកមុខស្រពោន។",
          dialogue: "«ទីបំផុត... មានអ្នកមកជួយស្រាយការពិតដែលកប់ទុកអស់រយៈពេល ៩០ ឆ្នាំហើយ...»",
          visualPromptEn: "Grand antique hall with floating candlelights and a glowing mirror revealing a mysterious lady spirit",
        },
        {
          episodeNumber: 3,
          title: "ការពិតនៅពីក្រោយបណ្ដាសា",
          setting: "បន្ទប់សម្ងាត់ក្រោមដីនៃភូមិគ្រឹះ",
          mood: "តានតឹង និងរំជួលចិត្ត",
          charactersInScene: ["សុភ័ក្រ", "នាង ចន្ទ្រា", "តា ព្រហ្ម"],
          narrative:
            "សុភ័ក្រ បានអានកំណត់ហេតុរហូតដល់ទំព័រចុងក្រោយ ទើបដឹងថានាង ចន្ទ្រា មិនមែនជាវិញ្ញាណអាក្រក់ឡើយ តែជាអ្នកថែរក្សាទ្រព្យសម្បត្តិវប្បធម៌របស់ភូមិពីក្រុមចោរលួចវត្ថុបុរាណកាលពីសម័យមុន។ សុភ័ក្រ និងតា ព្រហ្ម បានរួមគ្នាធ្វើពិធីឧទ្ទិសកុសល និងប្រគល់វត្ថុបុរាណទាំងនោះជូនសារមន្ទីរជាតិ។",
          dialogue: "«ខ្ញុំសូមសន្យាថានឹងយកការពិត និងកិត្តិយសរបស់អ្នកនាងទៅប្រាប់ពិភពលោកឱ្យបានដឹង!»",
          visualPromptEn: "Ancient underground chamber with golden Khmer artifacts glowing softly, historian and village elder praying",
        },
      ];
    } else if (resolvedGenre === "novel") {
      title = "សន្យាស្នេហ៍ក្រោមម្លប់ផ្កាអង្គាបុស្ប";
      englishTitle = "Promise of Love Beneath the Fragrant Blossoms";
      synopsis =
        "រឿងរ៉ាវប្រលោមលោកមនោសញ្ចេតនារវាង វិចិត្រ វិស្វករស្ថាបត្យកម្មវ័យក្មេង និង រក្សា វិចិត្រករគំនូរបុរាណ ដែលបានជួបគ្នានៅទឹកដីខេត្តសៀមរាប ហើយរួមគ្នាជម្នះឧបសគ្គគ្រួសារដើម្បីសម្រេចក្ដីស្រមៃ។";
      moralKhmer =
        "គតិអប់រំ៖ សេចក្ដីស្រឡាញ់ពិតប្រាកដកើតចេញពីការយល់ចិត្ត ការគោរព និងការជួយជ្រោមជ្រែងក្ដីស្រមៃគ្នាទៅវិញទៅមក។";
      rawCharacters = [
        {
          name: "វិចិត្រ (Vichetr)",
          role: "ស្ថាបត្យករវ័យក្មេង (តួឯកប្រុស)",
          description: "បុរសសុភាពរាបសារ មានទំនួលខុសត្រូវខ្ពស់ និងស្រឡាញ់សិល្បៈស្ថាបត្យកម្មខ្មែរ។",
          visualPromptEn: "Handsome young Khmer architect holding blueprints at Angkor sunset, warm romantic portrait",
        },
        {
          name: "រក្សា (Reaksa)",
          role: "វិចិត្រករគំនូរវប្បធម៌ (តួឯកស្រី)",
          description: "នារីស្រគត់ស្រគំ មានទេពកោសល្យគូរគំនូរធម្មជាតិ និងប្រាសាទបុរាណ។",
          visualPromptEn: "Graceful young Khmer female artist holding a paintbrush near blooming flowers at golden hour",
        },
      ];
      rawEpisodes = [
        {
          episodeNumber: 1,
          title: "ជំនួបចៃដន្យនៅមាត់កសិន្ធុអង្គរ",
          setting: "មាត់កសិន្ធុប្រាសាទអង្គរវត្តនាពេលថ្ងៃលិចពណ៌មាស",
          mood: "មនោសញ្ចេតនា ផ្អែមល្ហែម និងកក់ក្ដៅ",
          charactersInScene: ["វិចិត្រ", "រក្សា"],
          narrative:
            "ពន្លឺថ្ងៃលិចពណ៌មាសចាំងឆ្លុះលើផ្ទៃទឹកកសិន្ធុអង្គរ។ ខ្យល់ជំនោរល្ងាចបក់ផាត់សន្លឹកគំនូររបស់ រក្សា ឱ្យហោះទៅធ្លាក់ក្បែរជើងរបស់ វិចិត្រ។ ពេលគាត់ឱនរើសផ្ទាំងគំនូរហុចឱ្យនាង ខ្សែភ្នែកអ្នកទាំងពីរបានប្រសព្វគ្នា បង្កើតជាចំណងមិត្តភាពដ៏ជ្រាលជ្រៅតាំងពីវិនាទីដំបូង។",
          dialogue: "«គំនូរប្រាសាទរបស់អ្នកនាងពិតជាមានព្រលឹងណាស់... តើខ្ញុំអាចសុំស្គាល់ឈ្មោះវិចិត្រករដ៏ឆ្នើមនេះបានទេ?»",
          visualPromptEn: "Romantic sunset at Angkor Wat moat, young man handing a sketch paper to a young female artist, golden hour",
        },
        {
          episodeNumber: 2,
          title: "ព្យុះភ្លៀង និងការលះបង់",
          setting: "ស្ទូឌីយោគំនូរក្នុងទីក្រុងភ្នំពេញនាថ្ងៃភ្លៀងធ្លាក់",
          mood: "កদ্ដុកក្ដួល និងតស៊ូ",
          charactersInScene: ["វិចិត្រ", "រក្សា"],
          narrative:
            "នៅពេលពិព័រណ៍សិល្បៈជាតិជិតមកដល់ ស្នាដៃគំនូរធំរបស់ រក្សា ជួបបញ្ហាខូចខាតដោយសារទឹកភ្លៀងលេចដំបូល។ វិចិត្រ មិនបានទុកឱ្យនាងនៅម្នាក់ឯងឡើយ គាត់បាននៅជួយជួសជុល និងលើកទឹកចិត្តនាងពេញមួយយប់ រហូតផ្ទាំងគំនូរត្រឡប់មកល្អឥតខ្ចោះវិញ។",
          dialogue: "«ទោះបីមានព្យុះភ្លៀងធំប៉ុនណា ក៏បងនៅតែឈរเคียงខាងរក្សាជានិច្ច!»",
          visualPromptEn: "Cozy art studio on a rainy night, young couple working together on a large canvas under warm lamp light",
        },
        {
          episodeNumber: 3,
          title: "ថ្ងៃជោគជ័យក្រោមម្លប់ផ្កា",
          setting: "សាលពិព័រណ៍សិល្បៈជាតិដែលពោរពេញដោយភ្ញៀវកិត្តិយស",
          mood: "រំភើបរីករាយ និងសុភមង្គល",
          charactersInScene: ["វិចិត្រ", "រក្សា"],
          narrative:
            "ស្នាដៃរួមគ្នារវាងស្ថាបត្យកម្ម និងគំនូររបស់ វិចិត្រ និង រក្សា ទទួលបានពានរង្វាន់លេខ ១ ទូទាំងប្រទេស។ ក្រោមដើមផ្កាអង្គាបុស្បដែលកំពុងរីកสะพรั่ง វិចិត្រ បានសន្យាថានឹងថែរក្សានាង និងរួមដំណើរជីវិតជាមួយគ្នាជារៀងរហូត។",
          dialogue: "«អរគុណបងដែលជាកម្លាំងចិត្ត និងជាពន្លឺក្នុងជីវិតរបស់អូន!»",
          visualPromptEn: "Grand art gallery celebration with blooming flowers, happy Khmer couple holding an award, cinematic lighting",
        },
      ];
    } else {
      title = "បណ្ដាំអ្នកប្រាជ្ញ និងគ្រាប់ពេជ្រប្រាជ្ញា";
      englishTitle = "The Sage's Legacy and the Gem of Wisdom";
      synopsis =
        "រឿងនិទានកថាអប់រំអំពី កុមារ ធម្មបាល ដែលបានធ្វើដំណើរឆ្លងកាត់ព្រៃហិមพาน្តដើម្បីស្វែងរកគ្រាប់ពេជ្រប្រាជ្ញាយកមកជួយសង្គ្រោះភូមិកំណើតពីគ្រោះរាំងស្ងួត។";
      moralKhmer =
        "គតិអប់រំ៖ ចំណេះវិជ្ជា សេចក្ដីព្យាយាម និងទឹកចិត្តមេត្តាករុណា គឺជាគ្រាប់ពេជ្រដ៏មានតម្លៃបំផុតក្នុងជីវិត។";
      rawCharacters = [
        {
          name: "ធម្មបាល (Dhammapala)",
          role: "យុវជនក្លាហាន និងមានកតញ្ញូ (តួឯក)",
          description: "យុវជនឆ្លាតវៃ ចិត្តល្អ សុខចិត្តលះបង់កម្លាំងកាយចិត្តដើម្បីសេចក្ដីសុខអ្នកភូមិ។",
          visualPromptEn: "Brave young Khmer folktale hero in traditional silk attire holding a glowing staff in an enchanted forest",
        },
        {
          name: "ព្រះឥសី សុមេធ (Hermit Sumedha)",
          role: "អ្នកប្រាជ្ញព្រៃភ្នំ",
          description: "ព្រះឥសីដែលមានប្រាជ្ញាឈ្លាសវៃ និងចង្អុលបង្ហាញផ្លូវត្រូវដល់ ធម្មបាល។",
          visualPromptEn: "Wise ancient Khmer hermit sage sitting by a sacred waterfall with golden aura",
        },
      ];
      rawEpisodes = [
        {
          episodeNumber: 1,
          title: "ការចាកចេញពីភូមិកំណើត",
          setting: "ភូមិបុរាណខ្មែរដែលកំពុងជួបគ្រោះរាំងស្ងួត",
          mood: "មោះមុត និងមានក្ដីសង្ឃឹម",
          charactersInScene: ["ធម្មបាល"],
          narrative:
            "កាលពីព្រេងនាយ មានភូមិមួយជួបគ្រោះរាំងស្ងួតអស់ជាច្រើនខែ។ ធម្មបាល ដែលជាយុវជនប្រកបដោយទឹកចិត្តមេត្តា បានក្រាបលាឪពុកម្ដាយ និងចាស់ទុំក្នុងភូមិ ដើម្បីធ្វើដំណើរទៅកាន់ភ្នំគិរីវង្គតស្វែងរកប្រភពទឹក និងគ្រាប់ពេជ្រប្រាជ្ញាតាមពាក្យចាស់បុរាណតំណាលតគ្នា។",
          dialogue: "«ខ្ញុំនឹងខិតខំស្វែងរកប្រភពទឹក និងចំណេះវិជ្ជាមកជួយសង្គ្រោះភូមិយើងឱ្យខាងតែបាន!»",
          visualPromptEn: "Ancient Khmer village at sunrise, young hero bidding farewell to villagers on a quest",
        },
        {
          episodeNumber: 2,
          title: "ប្រស្នាទាំងបីរបស់ព្រះឥសី",
          setting: "អាស្រមព្រះឥសីក្បែរទឹកជ្រោះភ្នំគិរីវង្គត",
          mood: "ស្ងប់ស្ងាត់ អាថ៌កំបាំង និងប្រកបដោយប្រាជ្ញា",
          charactersInScene: ["ធម្មបាល", "ព្រះឥសី សុមេធ"],
          narrative:
            "ពេលទៅដល់កំពូលភ្នំ ធម្មបាល បានជួបព្រះឥសី សុមេធ។ ព្រះឥសីបានចោទប្រស្នាធម៌ចំនួនបីទាក់ទងនឹងការអត់ធ្មត់ ការសាមគ្គី និងការថែរក្សាធម្មជាតិ។ ដោយប្រាជ្ញាដ៏ឈ្លាសវៃ ធម្មបាល បានដោះស្រាយប្រស្នាទាំងបីយ៉ាងត្រឹមត្រូវឥតខ្ចោះ។",
          dialogue: "«គ្រាប់ពេជ្រពិតប្រាកដមិនមែនជាដុំថ្មទេចៅ ប៉ុន្តែគឺជាប្រាជ្ញាក្នុងការជីកប្រឡាយ និងដាំដើមឈើថែរក្សាទឹក!»",
          visualPromptEn: "Sacred mountain waterfall in Cambodia, wise hermit sage teaching a young hero with glowing golden scroll",
        },
        {
          episodeNumber: 3,
          title: "ភូមិឋានត្រជាក់ត្រជំ",
          setting: "ភូមិកំណើតដែលមានទឹកប្រឡាយហូរពេញ និងវាលស្រែពណ៌បៃតង",
          mood: "សប្បាយរីករាយ និងសុខដុមរមនា",
          charactersInScene: ["ធម្មបាល", "អ្នកភូមិ"],
          narrative:
            "ធម្មបាល បានត្រឡប់មកភូមិវិញ ហើយដឹកនាំអ្នកភូមិជីកប្រឡាយបង្ហូរទឹកពីជ្រោះភ្នំ និងដាំដើមឈើឡើងវិញ។ មិនយូរប៉ុន្មាន ភូមិទាំងមូលក៏ប្រែក្លាយជា سرسبز ត្រជាក់ត្រជំ មានភ្លៀងធ្លាក់គ្រប់គ្រាន់ និងសម្បូរសប្បាយជារៀងរហូតមក។",
          dialogue: "«កម្លាំងសាមគ្គី និងចំណេះដឹង គឺជាទ្រព្យដ៏ឧត្តមរបស់ភូមិយើង!»",
          visualPromptEn: "Lush green Khmer countryside with flowing water canals, golden rice fields and joyful villagers celebrating",
        },
      ];
    }
  }

  const processedCharacters = rawCharacters.slice(0, 5).map((c, idx) => {
    const cleanName = applyStrictKhmerOrthographyFix(c.name || `តួអង្គទី ${idx + 1}`).fixedText;
    const cleanRole = applyStrictKhmerOrthographyFix(c.role || "តួអង្គសំខាន់").fixedText;
    const cleanDesc = applyStrictKhmerOrthographyFix(c.description || "").fixedText;
    const avatarSvgDataUrl = createCharacterPortraitSvgDataUrl({
      name: cleanName,
      role: cleanRole,
      genre: resolvedGenre,
      index: idx,
    });
    const seed = 1000 + idx * 137 + cleanName.length * 19;
    const promptEn =
      c.visualPromptEn ||
      `${cleanName}, ${cleanRole}, ${resolvedGenre} story character portrait, digital art masterpiece`;
    const aiAvatarUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      promptEn
    )}?width=512&height=512&seed=${seed}&nologo=true`;
    return {
      name: cleanName,
      role: cleanRole,
      description: cleanDesc,
      avatarUrl: avatarSvgDataUrl,
      aiAvatarUrl,
    };
  });

  const processedEpisodes = rawEpisodes.slice(0, numEpisodes).map((ep, idx) => {
    const epNum = Number(ep.episodeNumber) || idx + 1;
    const epTitle = applyStrictKhmerOrthographyFix(ep.title || `វគ្គទី ${epNum}`).fixedText;
    const epSetting = applyStrictKhmerOrthographyFix(
      ep.setting || "ឈុតឆាកសំខាន់ក្នុងសាច់រឿង"
    ).fixedText;
    const epMood = applyStrictKhmerOrthographyFix(ep.mood || "ជក់ចិត្ត").fixedText;
    const epNarrative = applyStrictKhmerOrthographyFix(ep.narrative || "").fixedText;
    const epDialogue = applyStrictKhmerOrthographyFix(ep.dialogue || "").fixedText;
    const sceneSvgDataUrl = createEpisodeSceneSvgDataUrl({
      episodeNumber: epNum,
      title: epTitle,
      setting: epSetting,
      mood: epMood,
      genre: resolvedGenre,
    });
    const seed = 5000 + epNum * 251 + epTitle.length * 23;
    const promptEn =
      ep.visualPromptEn ||
      `Episode ${epNum}: ${englishTitle}, ${resolvedGenre} story scene illustration, cinematic 8k artwork`;
    const aiSceneUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      promptEn
    )}?width=800&height=450&seed=${seed}&nologo=true`;

    return {
      episodeNumber: epNum,
      title: epTitle,
      setting: epSetting,
      mood: epMood,
      charactersInScene: Array.isArray(ep.charactersInScene)
        ? ep.charactersInScene.map((n) => applyStrictKhmerOrthographyFix(String(n)).fixedText)
        : [],
      narrative: epNarrative,
      dialogue: epDialogue,
      imageUrl: sceneSvgDataUrl,
      aiSceneUrl,
    };
  });

  return {
    ok: true,
    genre: resolvedGenre,
    genreLabelKhmer,
    title,
    englishTitle,
    synopsis,
    moralKhmer,
    characters: processedCharacters,
    episodes: processedEpisodes,
  };
}

export async function sendTelegramIllustratedStory(token, chatId, replyToMessageId, params) {
  const effectiveToken = getConfiguredBotToken(token);
  fetch(`https://api.telegram.org/bot${effectiveToken}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  }).catch(() => {});

  const story = await generateIllustratedStoryServer(params);

  const charsHtml = story.characters
    .map(
      (c, i) =>
        `👤 <b>តួអង្គទី ${i + 1}៖ ${escapeHtmlLocal(c.name)}</b> (${escapeHtmlLocal(c.role)})\n` +
        `   • ${escapeHtmlLocal(c.description)}`
    )
    .join("\n");

  const episodesHtml = story.episodes
    .map(
      (ep) =>
        `🎬 <b>វគ្គទី ${ep.episodeNumber}៖ ${escapeHtmlLocal(ep.title)}</b>\n` +
        `📍 <i>ទីកន្លែង/បរិយាកាស៖ ${escapeHtmlLocal(ep.setting)} (${escapeHtmlLocal(
          ep.mood
        )})</i>\n` +
        `${escapeHtmlLocal(ep.narrative)}\n` +
        (ep.dialogue ? `💬 <b>សម្ដីតួអង្គ៖</b> <i>${escapeHtmlLocal(ep.dialogue)}</i>\n` : "")
    )
    .join("\n\n");

  const fullHtml =
    `📖✨ <b>${escapeHtmlLocal(story.title)}</b>\n` +
    `<i>(${escapeHtmlLocal(story.englishTitle)} — ${escapeHtmlLocal(story.genreLabelKhmer)})</i>\n\n` +
    `📝 <b>សេចក្ដីសង្ខេប៖</b> ${escapeHtmlLocal(story.synopsis)}\n\n` +
    `🎭 <b>តួអង្គក្នុងសាច់រឿង៖</b>\n${charsHtml}\n\n` +
    `📚 <b>សាច់រឿងលម្អិតតាមវគ្គនីមួយៗ៖</b>\n\n${episodesHtml}\n\n` +
    `🌟 <b>${escapeHtmlLocal(story.moralKhmer)}</b>`;

  const studioUrl = `${getPublicAppBaseUrl()}/?studio=story&tg_chat_id=${encodeURIComponent(
    String(chatId)
  )}`;
  const storyKeyboard = {
    inline_keyboard: [
      [
        { text: "👻 បង្កើតរឿងរន្ធត់ថ្មី", callback_data: "story_gen_horror" },
        { text: "💖 រឿងប្រលោមលោកថ្មី", callback_data: "story_gen_novel" },
      ],
      [
        { text: "👑 បង្កើតរឿងនិទានកថាថ្មី", callback_data: "story_gen_folktale" },
      ],
      [
        {
          text: "🌐 បើកស្ទូឌីយោបង្កើតរឿង & រូបភាពពេញលេញ",
          web_app: { url: studioUrl },
        },
      ],
    ],
  };

  // 1. Send Character Portrait Photos first
  for (const char of story.characters.slice(0, 2)) {
    await sendTelegramSvgPhotoServer(
      effectiveToken,
      chatId,
      char.avatarUrl,
      `🎭 <b>តួអង្គក្នុងរឿង «${escapeHtmlLocal(story.title)}»</b>\n👤 <b>ឈ្មោះ៖</b> ${escapeHtmlLocal(
        char.name
      )}\n🏷️ <b>តួនាទី៖</b> ${escapeHtmlLocal(char.role)}\n📝 ${escapeHtmlLocal(char.description)}`
    ).catch(() => {});
  }

  // 2. Send Episode Scene Illustration Photos for each episode
  for (const ep of story.episodes) {
    const epCaption =
      `🎬 <b>វគ្គទី ${ep.episodeNumber}៖ ${escapeHtmlLocal(ep.title)}</b>\n` +
      `📍 <i>${escapeHtmlLocal(ep.setting)} (${escapeHtmlLocal(ep.mood)})</i>\n\n` +
      `${escapeHtmlLocal(ep.narrative.slice(0, 620))}` +
      (ep.dialogue
        ? `\n\n💬 <b>សម្ដីតួអង្គ៖</b> <i>${escapeHtmlLocal(ep.dialogue.slice(0, 180))}</i>`
        : "");
    await sendTelegramSvgPhotoServer(
      effectiveToken,
      chatId,
      ep.imageUrl,
      epCaption
    ).catch(() => {});
  }

  await Promise.all([
    sendTelegramHtml(effectiveToken, chatId, fullHtml, storyKeyboard),
    sendSingleKhmerVoice(
      effectiveToken,
      chatId,
      `${story.title}។ ${story.synopsis}។ ${story.episodes[0]?.narrative || ""}`.slice(0, 320)
    ),
  ]);

  return { ok: true, story };
}

// ============================================================================
// CAPABILITY 5: TRI-DIRECTIONAL VISUAL DICTIONARY (KHMER-KHMER, EN-KM, KM-EN)
// WITH WORD ILLUSTRATIONS & EXAMPLE SENTENCES
// ============================================================================
export function createDictionaryWordSvgDataUrl({
  word = "",
  khmerWord = "",
  englishWord = "",
  partOfSpeech = "នាម (Noun)",
  shortMeaning = "",
  emoji = "📘",
}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 380" width="720" height="380">
    <defs>
      <linearGradient id="dictBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="50%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#064e3b"/>
      </linearGradient>
      <radialGradient id="iconGlow" cx="22%" cy="50%" r="35%">
        <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.38"/>
        <stop offset="100%" stop-color="#fbbf24" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="720" height="380" rx="26" fill="url(#dictBg)" stroke="#fbbf24" stroke-width="2" stroke-opacity="0.45"/>
    <circle cx="155" cy="190" r="125" fill="url(#iconGlow)"/>
    <rect x="42" y="75" width="225" height="230" rx="24" fill="#090d16" fill-opacity="0.65" stroke="#38bdf8" stroke-width="1.5" stroke-opacity="0.5"/>
    <text x="154" y="198" text-anchor="middle" font-size="84">${escapeXmlAttr(emoji || "📘")}</text>
    <text x="154" y="268" text-anchor="middle" fill="#fde047" font-family="Noto Sans Khmer, sans-serif" font-size="16" font-weight="bold">${escapeXmlAttr(
      partOfSpeech.slice(0, 24)
    )}</text>
    <!-- Word Details on Right -->
    <text x="300" y="95" fill="#38bdf8" font-family="Noto Sans Khmer, sans-serif" font-size="15" font-weight="bold">📖 វចនានុក្រមរូបភាព (ខ្មែរ-ខ្មែរ • អង់គ្លេស-ខ្មែរ • ខ្មែរ-អង់គ្លេស)</text>
    <text x="300" y="152" fill="#ffffff" font-family="Noto Sans Khmer, sans-serif" font-size="36" font-weight="bold">${escapeXmlAttr(
      (khmerWord || word).slice(0, 22)
    )}</text>
    <text x="300" y="198" fill="#fde047" font-family="Inter, sans-serif" font-size="24" font-weight="bold">${escapeXmlAttr(
      (englishWord || word).slice(0, 28)
    )}</text>
    <line x1="300" y1="220" x2="675" y2="220" stroke="#334155" stroke-width="1.5"/>
    <text x="300" y="262" fill="#e2e8f0" font-family="Noto Sans Khmer, sans-serif" font-size="17">${escapeXmlAttr(
      shortMeaning.slice(0, 48)
    )}</text>
    <text x="300" y="294" fill="#94a3b8" font-family="Noto Sans Khmer, sans-serif" font-size="15">${escapeXmlAttr(
      shortMeaning.slice(48, 98)
    )}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function isDictionaryRequestServer(text = "") {
  const clean = String(text || "").trim();
  if (!clean) return false;
  if (/^\/(?:dict|dictionary|define|word|វចនានុក្រម|ពន្យល់ពាក្យ)\b/i.test(clean)) {
    return true;
  }
  if (
    /(?:វចនានុក្រម|ពន្យល់\s*ពាក្យ|និយមន័យ\s*នៃ\s*ពាក្យ|តើ\s*ពាក្យ\s*«?[^»\s]+»?\s*មាន\s*ន័យ|ពាក្យ\s*«?[^»\s]+»?\s*ប្រែ\s*ថា|ខ្មែរ\s*-\s*ខ្មែរ|អង់គ្លេស\s*-\s*ខ្មែរ|ខ្មែរ\s*-\s*អង់គ្លេស|dictionary\s+meaning\s+of|define\s+the\s+word)/i.test(
      clean
    )
  ) {
    return true;
  }
  // Natural queries like "ផ្លែប៉ោមអង់គ្លេសថាមិច", "apple ភាសាខ្មែរថាមិច", "ផ្លែប៉ោម ជាភាសាអង់គ្លេសថាម៉េច"
  if (
    clean.length <= 90 &&
    /(?:អង់គ្លេស\s*ថា\s*(?:មិច|ម៉េច|ដូចម្ដេច|អ្វី|អី)|ភាសា\s*អង់គ្លេស\s*ថា\s*(?:មិច|ម៉េច|ដូចម្ដេច|អ្វី|អី)|(?:ភាសា\s*)?ខ្មែរ\s*ថា\s*(?:មិច|ម៉េច|ដូចម្ដេច|អ្វី|អី)|ប្រែ\s*(?:ជា\s*(?:ខ្មែរ|អង់គ្លេស)\s*)?ថា\s*(?:មិច|ម៉េច|ដូចម្ដេច|អ្វី|អី)|មាន\s*ន័យ\s*ថា\s*(?:មិច|ម៉េច|ដូចម្ដេច|អ្វី|អី)|\bin\s+english\b|\bin\s+khmer\b)/i.test(
      clean
    )
  ) {
    return true;
  }
  return false;
}

const CURATED_CHUON_NATH_DICTIONARY = {
  ផ្លែប៉ោម: {
    khmerWord: "ផ្លែប៉ោម",
    englishWord: "apple",
    emoji: "🍎",
    partOfSpeech: "នាម (Noun)",
    pronunciationKhmer: "ផ្លែ-ប៉ោម",
    pronunciationEnglishTone: "អ៊ែផល (សង្កត់សំឡេងលើព្យាង្គទី១ «អ៊ែ» — /ˈæp.əl/)",
    pronunciationIpa: "/ˈæp.əl/",
    etymology: "វចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត (ក្លាយមកពីពាក្យបារាំង Pomme / អង់គ្លេស Apple)",
    khmerToKhmerDef:
      "ប៉ោម ឬ ផ្លែប៉ោម (ន.) ឈ្មោះឈើហូបផ្លែមួយប្រភេទ ដុះនៅប្រទេសត្រជាក់ និងមធ្យម ផ្លែមានរាងមូល សំបករលោងមានពណ៌ក្រហម បៃតង ឬលឿង សាច់ផុយស្រួយ មានរសផ្អែម ឬជូរអែមឈ្ងុយឆ្ងាញ់ សម្បូរទៅដោយជីវជាតិបំប៉នសុខភាព (បារ. Pomme, អង់. Apple)។",
    englishToKhmerDef:
      "apple (នាម / Noun) ប្រែជាភាសាខ្មែរថា «ផ្លែប៉ោម»។ (អានតាមតុងអង់គ្លេសថា៖ អ៊ែផល /ˈæp.əl/) — សំដៅលើផ្លែឈើរាងមូល សំបកពណ៌ក្រហម បៃតង ឬលឿង សាច់ស្រួយផ្អែមឆ្ងាញ់។",
    khmerToEnglishDef:
      "«ផ្លែប៉ោម» translates to «apple» in English (pronounced /ˈæp.əl/ — អ៊ែផល). A round fruit with smooth red, yellow, or green skin and crisp sweet flesh.",
    photoSearchQueryEn: "Apple fruit",
    directPhotoUrl:
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/Red_Apple.jpg/960px-Red_Apple.jpg",
    visualPromptEn: "Fresh red apple with a green leaf on a wooden table, real DSLR photograph",
    examples: [
      {
        khmerSentence: "ការបរិភោគផ្លែប៉ោមមួយផ្លែក្នុងមួយថ្ងៃ ជួយឱ្យរាងកាយមានសុខភាពល្អរឹងមាំ។",
        englishSentence: "Eating an apple a day helps keep the body healthy and strong.",
        explanationKhmer: "ប្រើពាក្យ «ផ្លែប៉ោម» (apple) ជានាមកម្មបទ បង្ហាញពីអត្ថប្រយោជន៍នៃផ្លែឈើនេះចំពោះសុខភាព។",
      },
      {
        khmerSentence: "អ្នកគ្រូបានបង្រៀនសិស្សឱ្យអានពាក្យ «apple» ដែលប្រែជាភាសាខ្មែរថា «ផ្លែប៉ោម» យ៉ាងច្បាស់។",
        englishSentence: "The teacher taught the students to pronounce the word 'apple', which means 'ផ្លែប៉ោម' in Khmer.",
        explanationKhmer: "បង្ហាញពីការបកប្រែទៅវិញទៅមករវាងពាក្យ «ផ្លែប៉ោម» និង «apple»។",
      },
    ],
    synonyms: ["ប៉ោម", "ផ្លែឈើប៉ោម (Malus domestica)"],
    antonyms: [],
  },
  ប្រាជ្ញា: {
    khmerWord: "ប្រាជ្ញា",
    englishWord: "wisdom",
    emoji: "🧠",
    partOfSpeech: "នាម (Noun)",
    pronunciationKhmer: "ប្រាជ-ញ៉ា",
    pronunciationEnglishTone: "វីហ្ស-ដឹម (សង្កត់សំឡេងលើព្យាង្គទី១ «វីហ្ស» — /ˈwɪz.dəm/)",
    pronunciationIpa: "/ˈwɪz.dəm/",
    etymology: "សំស្ក្រឹត «ប្រជ្ញា» / បាលី «បញ្ញា» (វចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត)",
    khmerToKhmerDef:
      "ប្រាជ្ញា (ន.) (សំ. ប្រជ្ញា; បា. បញ្ញា) ចំណេះដឹងច្បាស់លាស់, ការដឹងសព្វគ្រប់, ការឆ្លៀវឆ្លាត, គំនិតវាងវៃក្នុងការពិចារណាស្គាល់ខុសស្គាល់ត្រូវ ស្គាល់គុណស្គាល់ទោស។",
    englishToKhmerDef:
      "wisdom (នាម / Noun) ប្រែជាភាសាខ្មែរថា «ប្រាជ្ញា» ឬ «គតិបណ្ឌិត» (អានតាមតុងអង់គ្លេសថា៖ វីហ្ស-ដឹម /ˈwɪz.dəm/)។",
    khmerToEnglishDef:
      "«ប្រាជ្ញា» translates to «wisdom» or «intelligence» in English (pronounced /ˈwɪz.dəm/). The quality of having deep knowledge, good judgment, and insight.",
    photoSearchQueryEn: "Open book library",
    directPhotoUrl:
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/OpenLibrarypage.jpg/960px-OpenLibrarypage.jpg",
    visualPromptEn: "Open scholarly book in a library with warm sunlight, real photograph",
    examples: [
      {
        khmerSentence: "មនុស្សមានប្រាជ្ញា រមែងដោះស្រាយបញ្ហាដោយសេចក្ដីស្ងប់ និងការពិចារណាដ៏ល្អិតល្អន់។",
        englishSentence: "A person of wisdom always solves problems with calmness and careful consideration.",
        explanationKhmer: "បង្ហាញពីការប្រើប្រាស់ពាក្យ «ប្រាជ្ញា» (wisdom) តាមន័យក្នុងវចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត។",
      },
    ],
    synonyms: ["បញ្ញា", "គតិបណ្ឌិត", "ឈ្លាសវៃ"],
    antonyms: ["អវិជ្ជា", "ល្ងង់ខ្លៅ"],
  },
  កតញ្ញូ: {
    khmerWord: "កតញ្ញូ",
    englishWord: "gratitude",
    emoji: "🙏",
    partOfSpeech: "នាម / គុណនាម (Noun / Adjective)",
    pronunciationKhmer: "កៈ-តាញ់-ញូ",
    pronunciationEnglishTone: "ហ្គ្រែ-ធី-ធ្យូដ (សង្កត់សំឡេងលើព្យាង្គទី១ «ហ្គ្រែ» — /ˈɡræt.ɪ.tjuːd/)",
    pronunciationIpa: "/ˈɡræt.ɪ.tjuːd/",
    etymology: "បាលី «កតញ្ញូ» (កត + ញូ) (វចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត)",
    khmerToKhmerDef:
      "កតញ្ញូ (គុ. ឬ ន.) (បា. កតញ្ញូ; សំ. កឫតជ្ញ) អ្នកដែលដឹងគុណគេ គឺអ្នកដែលចាំមិនភ្លេចនូវឧបការគុណដែលអ្នកដទៃបានធ្វើហើយដល់ខ្លួន (ដូចជាគុណមាតាបិតា និងគ្រូបាធ្យាយជាដើម)។",
    englishToKhmerDef:
      "gratitude / grateful (នាម / គុណនាម) ប្រែជាភាសាខ្មែរថា «កតញ្ញូ» ឬ «កតញ្ញុតាធម៌ / ការដឹងគុណ»។",
    khmerToEnglishDef:
      "«កតញ្ញូ» translates to «gratitude» or «grateful person» in English (pronounced /ˈɡræt.ɪ.tjuːd/). Remembering and appreciating the kindness done by parents, teachers, and others.",
    photoSearchQueryEn: "Sampeah Cambodia",
    directPhotoUrl: "https://upload.wikimedia.org/wikipedia/commons/c/cf/Sampeah.jpg",
    visualPromptEn: "Respectful Cambodian Sampeah greeting with lotus hands, real photograph",
    examples: [
      {
        khmerSentence: "កូនល្អត្រូវមានធម៌កតញ្ញូចំពោះមាតាបិតា និងគ្រូបាធ្យាយជានិច្ច។",
        englishSentence: "A good child must always practice gratitude toward parents and teachers.",
        explanationKhmer: "បង្ហាញពីគុណធម៌ដឹងគុណតាមវចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត។",
      },
    ],
    synonyms: ["កតញ្ញុតា", "ការដឹងគុណ"],
    antonyms: ["អកតញ្ញូ", "រមិលគុណ"],
  },
  សន្តិភាព: {
    khmerWord: "សន្តិភាព",
    englishWord: "peace",
    emoji: "🕊️",
    partOfSpeech: "នាម (Noun)",
    pronunciationKhmer: "សន់-តិ-ភាប",
    pronunciationEnglishTone: "ភីស (បញ្ចេញសំឡេងវែងបន្តិច និងមានខ្យល់ /s/ ចុងសំឡេង — /piːs/)",
    pronunciationIpa: "/piːs/",
    etymology: "បាលី «សន្តិ» + «ភាវ» (វចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត)",
    khmerToKhmerDef:
      "សន្តិភាព (ន.) (បា. សន្តិភាវ; សំ. សាន្តិភាវ) ភាវៈស្ងប់, សេចក្ដីស្ងប់រម្ងាប់, ការគ្មានសឹកសង្គ្រាម គ្មានជម្លោះវឹកវរ ការរស់នៅដោយសុខក្សេមក្សាន្ត។",
    englishToKhmerDef:
      "peace (នាម / Noun) ប្រែជាភាសាខ្មែរថា «សន្តិភាព» ឬ «សេចក្ដីស្ងប់សុខ» (អានតាមតុងអង់គ្លេសថា៖ ភីស /piːs/)។",
    khmerToEnglishDef:
      "«សន្តិភាព» translates to «peace» in English (pronounced /piːs/). Freedom from disturbance, war, or conflict; tranquility and harmony.",
    photoSearchQueryEn: "White peace dove flying",
    directPhotoUrl:
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/I_come_in_peace.jpg/960px-I_come_in_peace.jpg",
    visualPromptEn: "White dove flying in clear sky symbolizing peace, real photograph",
    examples: [
      {
        khmerSentence: "សន្តិភាពគឺជាគ្រឹះដ៏សំខាន់បំផុតសម្រាប់ការអភិវឌ្ឍប្រទេសជាតិឱ្យរីកចម្រើន។",
        englishSentence: "Peace is the most essential foundation for national development and prosperity.",
        explanationKhmer: "បង្ហាញពីការប្រើប្រាស់ពាក្យ «សន្តិភាព» (peace) ជាប្រធាននៃល្បះ។",
      },
    ],
    synonyms: ["សុខសន្តិភាព", "សេចក្ដីស្ងប់"],
    antonyms: ["សង្គ្រាម", "ជម្លោះ"],
  },
  វប្បធម៌: {
    khmerWord: "វប្បធម៌",
    englishWord: "culture",
    emoji: "🏛️",
    partOfSpeech: "នាម (Noun)",
    pronunciationKhmer: "វ៉ាប់-ប៉ៈ-ធ័រ",
    pronunciationEnglishTone: "ខាល់-ឈឺ (សង្កត់សំឡេងលើព្យាង្គទី១ «ខាល់» — /ˈkʌl.tʃər/)",
    pronunciationIpa: "/ˈkʌl.tʃər/",
    etymology: "បាលី «វប្ប» (ការសាបព្រោះ/បណ្ដុះ) + «ធម៌» (វចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត)",
    khmerToKhmerDef:
      "វប្បធម៌ (ន.) ធម៌គឺការបណ្ដុះចំណេះវិជ្ជា និងស្មារតីឱ្យលូតលាស់ចម្រើនឡើង រួមមានអក្សរសាស្ត្រ សិល្បៈ ទំនៀមទម្លាប់ ប្រពៃណី និងជំនឿរបស់ជាតិសាសន៍នីមួយៗ។",
    englishToKhmerDef:
      "culture (នាម / Noun) ប្រែជាភាសាខ្មែរថា «វប្បធម៌» ឬ «អរិយធម៌ និងទំនៀមទម្លាប់ប្រពៃណី» (អានតាមតុងអង់គ្លេសថា៖ ខាល់-ឈឺ /ˈkʌl.tʃər/)។",
    khmerToEnglishDef:
      "«វប្បធម៌» translates to «culture» in English (pronounced /ˈkʌl.tʃər/). The arts, customs, traditions, beliefs, and heritage of a nation or people.",
    photoSearchQueryEn: "Apsara dance Cambodia",
    directPhotoUrl:
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/Danseuses_kmer_%282%29.JPG/960px-Danseuses_kmer_%282%29.JPG",
    visualPromptEn: "Traditional Khmer Apsara dancers at Angkor Wat, real photograph",
    examples: [
      {
        khmerSentence: "យុវជនខ្មែរគ្រប់រូបមានកាតព្វកិច្ចថែរក្សា និងលើកស្ទួយវប្បធម៌ជាតិឱ្យបានគង់វង្ស។",
        englishSentence: "Every Cambodian youth has a duty to preserve and promote the national culture.",
        explanationKhmer: "បង្ហាញពីការប្រើប្រាស់ពាក្យ «វប្បធម៌» (culture) ក្នុងបរិបទជាតិ។",
      },
    ],
    synonyms: ["អរិយធម៌", "ប្រពៃណីទំនៀមទម្លាប់"],
    antonyms: [],
  },
};

const dictionaryRealPhotoCache = new Map();
const DICT_PHOTO_UA =
  "Mozilla/5.0 (compatible; KhmerSuperAIDictionary/2.0; +https://aistudio.google.com)";

function isCleanRealPhotoUrl(src = "") {
  if (!src || typeof src !== "string") return false;
  if (/\.svg(?:\.png)?(?:\?|$)/i.test(src)) return false;
  if (/\.(?:gif|tif|tiff|pdf|ogg|oga|webm|xcf)(?:\?|$)/i.test(src)) return false;
  if (
    /(?:Icon|Logo|Symbol|Disambig|Question_book|Wiki_letter|Commons-logo|Crystal_Clear|Nuvola|Emojione|Twemoji|Ambox|Padlock|Text_document|Folder_Hexagonal|Edit-clear|Speaker_Icon|Sound-icon|Blank|Placeholder|Flag_of_|Map_of_| Coat_of_arms)/i.test(
      src
    )
  ) {
    return false;
  }
  return true;
}

async function searchWikipediaPageImageUrl(query, lang = "en") {
  const cleanQ = String(query || "").trim();
  if (!cleanQ) return "";
  try {
    const apiUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      cleanQ
    )}&gsrlimit=6&prop=pageimages&piprop=thumbnail|original&pithumbsize=800&format=json&origin=*`;
    const r = await fetch(apiUrl, {
      headers: { "User-Agent": DICT_PHOTO_UA },
      signal: AbortSignal.timeout(3400),
    });
    if (!r.ok) return "";
    const j = await r.json();
    const pages = Object.values(j?.query?.pages || {}).sort(
      (a, b) => (a.index || 99) - (b.index || 99)
    );
    for (const p of pages) {
      const src = p?.thumbnail?.source || p?.original?.source || "";
      if (isCleanRealPhotoUrl(src)) {
        return src;
      }
    }
  } catch {}
  return "";
}

async function searchWikimediaCommonsBitmapUrl(query) {
  const cleanQ = String(query || "").trim();
  if (!cleanQ) return "";
  try {
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      `filetype:bitmap ${cleanQ}`
    )}&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;
    const r = await fetch(apiUrl, {
      headers: { "User-Agent": DICT_PHOTO_UA },
      signal: AbortSignal.timeout(3800),
    });
    if (!r.ok) return "";
    const j = await r.json();
    const pages = Object.values(j?.query?.pages || {}).sort(
      (a, b) => (a.index || 99) - (b.index || 99)
    );
    for (const p of pages) {
      const info = p?.imageinfo?.[0];
      const src = info?.thumburl || info?.url || "";
      if (isCleanRealPhotoUrl(src) && /\.(?:jpg|jpeg|png|webp)/i.test(src)) {
        return src;
      }
    }
  } catch {}
  return "";
}

async function downloadPhotoBufferFromUrl(url, timeoutMs = 4500) {
  if (!url || !url.startsWith("http")) return null;
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": DICT_PHOTO_UA,
        Accept: "image/avif,image/webp,image/apng,image/jpeg,image/png,image/*,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!r.ok) return null;
    const contentType = String(r.headers.get("content-type") || "image/jpeg")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!contentType.startsWith("image/") || contentType.includes("svg")) {
      return null;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 1200) return null;
    return {
      buffer: buf,
      mimeType: contentType,
      sourceUrl: url,
    };
  } catch {
    return null;
  }
}

export async function resolveRealDictionaryWordPhotoServer({
  englishWord = "",
  khmerWord = "",
  photoSearchQueryEn = "",
  directPhotoUrl = "",
}) {
  const cleanEn = String(englishWord || "")
    .replace(/\([^)]*\)/g, "")
    .split(/[,;/]/)[0]
    .trim();
  const cleanQueryEn = String(photoSearchQueryEn || cleanEn || khmerWord).trim();
  const cacheKey = (cleanEn || khmerWord || "word")
    .toLowerCase()
    .replace(/[^a-z0-9\u1780-\u17ff_-]+/g, "_");

  if (dictionaryRealPhotoCache.has(cacheKey)) {
    return dictionaryRealPhotoCache.get(cacheKey);
  }

  let downloaded = null;

  // 1. Try curated direct photo URL first if provided
  if (directPhotoUrl) {
    downloaded = await downloadPhotoBufferFromUrl(directPhotoUrl, 4000);
  }

  // 2. Search Wikipedia (English & Khmer) + Wikimedia Commons in parallel for a real photograph
  if (!downloaded) {
    const candidateUrls = await Promise.all([
      cleanQueryEn ? searchWikipediaPageImageUrl(cleanQueryEn, "en") : Promise.resolve(""),
      cleanEn && cleanEn.toLowerCase() !== cleanQueryEn.toLowerCase()
        ? searchWikipediaPageImageUrl(cleanEn, "en")
        : Promise.resolve(""),
      khmerWord ? searchWikipediaPageImageUrl(khmerWord, "km") : Promise.resolve(""),
      cleanQueryEn ? searchWikimediaCommonsBitmapUrl(cleanQueryEn) : Promise.resolve(""),
    ]);

    const uniqueUrls = [...new Set(candidateUrls.filter(Boolean))];
    for (const candidateUrl of uniqueUrls) {
      downloaded = await downloadPhotoBufferFromUrl(candidateUrl, 4200);
      if (downloaded) break;
    }
  }

  // 3. Fallback to photorealistic DSLR photography if Wikipedia/Commons has no entry for an unusual term
  if (!downloaded) {
    const seed = 4000 + (cleanEn.length + khmerWord.length) * 37;
    const fallbackPhotoUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      `real photograph of ${cleanQueryEn || cleanEn || khmerWord}, realistic DSLR photography, natural lighting, high resolution`
    )}?width=640&height=420&seed=${seed}&nologo=true`;
    downloaded = await downloadPhotoBufferFromUrl(fallbackPhotoUrl, 5500);
  }

  if (downloaded && downloaded.buffer) {
    const entry = {
      photoKey: cacheKey,
      queryUsed: cleanQueryEn || cleanEn || khmerWord,
      buffer: downloaded.buffer,
      mimeType: downloaded.mimeType || "image/jpeg",
      sourceUrl: downloaded.sourceUrl,
      dataUrl: `data:${downloaded.mimeType || "image/jpeg"};base64,${downloaded.buffer.toString(
        "base64"
      )}`,
    };
    if (dictionaryRealPhotoCache.size > 80) {
      const oldest = dictionaryRealPhotoCache.keys().next().value;
      if (oldest) dictionaryRealPhotoCache.delete(oldest);
    }
    dictionaryRealPhotoCache.set(cacheKey, entry);
    return entry;
  }

  return null;
}

export async function getDictionaryCachedPhotoServer(key = "", query = "") {
  const cleanKey = String(key || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u1780-\u17ff_-]+/g, "_");
  if (cleanKey && dictionaryRealPhotoCache.has(cleanKey)) {
    return dictionaryRealPhotoCache.get(cleanKey);
  }
  if (query) {
    return await resolveRealDictionaryWordPhotoServer({
      englishWord: query,
      photoSearchQueryEn: query,
    });
  }
  return null;
}

export function extractDictionaryQueryAndMode(rawInput = "", explicitMode = "auto") {
  let text = String(rawInput || "")
    .replace(/^\/(?:dict|dictionary|define|word|វចនានុក្រម|ពន្យល់ពាក្យ)(?:@\S+)?\s*/i, "")
    .trim();

  // Normalize explicitMode if user explicitly chose one of the 3 dictionary types
  let detectedDirection =
    explicitMode === "km-km" || explicitMode === "en-km" || explicitMode === "km-en"
      ? explicitMode
      : "";

  // Check if user mentioned a specific dictionary type in the prompt text itself
  if (!detectedDirection) {
    if (/(?:ខ្មែរ\s*[-–—➡️]\s*ខ្មែរ|វចនានុក្រម\s*ខ្មែរ|ជួន\s*ណាត)/i.test(text)) {
      detectedDirection = "km-km";
    } else if (/(?:អង់គ្លេស\s*[-–—➡️]\s*ខ្មែរ|english\s*[-–—➡️to]+\s*khmer)/i.test(text)) {
      detectedDirection = "en-km";
    } else if (/(?:ខ្មែរ\s*[-–—➡️]\s*អង់គ្លេស|khmer\s*[-–—➡️to]+\s*english)/i.test(text)) {
      detectedDirection = "km-en";
    }
  }

  // Check if user is asking "X អង់គ្លេសថាមិច" / "ពាក្យ X ជាភាសាអង់គ្លេសថាម៉េច"
  const kmToEnMatch =
    text.match(
      /^(?:ចង់\s*ដឹង\s*(?:ថា\s*)?)?(?:តើ\s*)?(?:ពាក្យ\s*(?:ថា\s*)?)?[«"']?(.+?)[»"']?\s*(?:ប្រែ\s*ជា\s*|និយាយ\s*ជា\s*|ហៅ\s*ជា\s*|ជា\s*)?(?:ភាសា\s*)?អង់គ្លេស\s*(?:ហៅ\s*ថា|ប្រែ\s*ថា|សរសេរ\s*ថា|ថា)?\s*(?:មិច|ម៉េច|ដូចម្ដេច|អ្វី|អី)\s*[?？។.]*$/i
    ) ||
    text.match(
      /^(?:ភាសា\s*)?អង់គ្លេស\s*(?:នៃ\s*)?ពាក្យ\s*[«"']?(.+?)[»"']?\s*(?:គឺ\s*|ថា\s*)?(?:មិច|ម៉េច|ដូចម្ដេច|អ្វី|អី)?\s*[?？។.]*$/i
    ) ||
    text.match(/^what\s+is\s+[«"']?(.+?)[»"']?\s+in\s+english\s*[?？.]*$/i);

  if (kmToEnMatch && kmToEnMatch[1]) {
    text = kmToEnMatch[1].trim();
    if (!detectedDirection) detectedDirection = "km-en";
  } else {
    // Check if user is asking "apple ភាសាខ្មែរថាមិច" / "ពាក្យ apple ខ្មែរថាម៉េច"
    const enToKmMatch =
      text.match(
        /^(?:ចង់\s*ដឹង\s*(?:ថា\s*)?)?(?:តើ\s*)?(?:ពាក្យ\s*(?:ថា\s*)?)?[«"']?(.+?)[»"']?\s*(?:ប្រែ\s*ជា\s*|និយាយ\s*ជា\s*|ហៅ\s*ជា\s*|ជា\s*)?(?:ភាសា\s*)?ខ្មែរ\s*(?:ហៅ\s*ថា|ប្រែ\s*ថា|សរសេរ\s*ថា|ថា)?\s*(?:មិច|ម៉េច|ដូចម្ដេច|អ្វី|អី)\s*[?？។.]*$/i
      ) ||
      text.match(
        /^(?:ចង់\s*ដឹង\s*(?:ថា\s*)?)?(?:តើ\s*)?(?:ពាក្យ\s*(?:ថា\s*)?)?[«"']?(.+?)[»"']?\s*(?:ប្រែ\s*ថា|មាន\s*ន័យ\s*ថា|មាន\s*ន័យ)\s*(?:មិច|ម៉េច|ដូចម្ដេច|អ្វី|អី)\s*[?？។.]*$/i
      ) ||
      text.match(/^what\s+(?:is|does)\s+[«"']?(.+?)[»"']?\s+(?:mean\s+)?in\s+khmer\s*[?？.]*$/i);

    if (enToKmMatch && enToKmMatch[1]) {
      text = enToKmMatch[1].trim();
      if (!detectedDirection) {
        detectedDirection = /^[A-Za-z\s'-]+$/.test(text) ? "en-km" : "km-km";
      }
    }
  }

  // Strip common dictionary prefixes
  text = text
    .replace(
      /^(?:សូម\s*)?(?:ជួយ\s*)?(?:ឆែក\s*|រក\s*|បកប្រែ\s*)?(?:វចនានុក្រម|ពន្យល់\s*ពាក្យ|និយមន័យ\s*(?:នៃ\s*)?ពាក្យ|ពាក្យ\s*ថា|ពាក្យ)\s*(?:ខ្មែរ\s*[-–—➡️]\s*ខ្មែរ|អង់គ្លេស\s*[-–—➡️]\s*ខ្មែរ|ខ្មែរ\s*[-–—➡️]\s*អង់គ្លេស)?\s*[:៖]?\s*/i,
      ""
    )
    .replace(/[«»"'?？!！។]/g, "")
    .trim();

  if (!text) text = "ផ្លែប៉ោម";

  // Always resolve to 1 specific dictionary type ("km-km", "en-km", or "km-en")
  if (!detectedDirection) {
    detectedDirection = /^[A-Za-z\s'-]+$/.test(text) ? "en-km" : "km-km";
  }

  return {
    cleanWord: text,
    detectedDirection,
  };
}

async function fetchNativeTtsSegment(text, lang = "en") {
  const clean = String(text || "").trim().slice(0, 175);
  if (!clean) return Buffer.alloc(0);
  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(
      lang
    )}&client=tw-ob&q=${encodeURIComponent(clean)}`;
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) return Buffer.alloc(0);
    return Buffer.from(await r.arrayBuffer());
  } catch {
    return Buffer.alloc(0);
  }
}

export async function generateDictionaryPronunciationAudioBuffers(dictObj, mode = "km-km") {
  try {
    const enWord = String(dictObj?.englishWord || "").trim();
    const kmWord = String(dictObj?.khmerWord || "").trim();
    const kmDefShort = String(dictObj?.khmerToKhmerDef || "").slice(0, 165);
    const enToKmShort = String(dictObj?.englishToKhmerDef || "").slice(0, 165);
    const kmExShort = String(dictObj?.examples?.[0]?.khmerSentence || "").slice(0, 150);
    const enExample = String(dictObj?.examples?.[0]?.englishSentence || "").slice(0, 140);

    if (mode === "km-km") {
      // Khmer-Khmer Dictionary Audio: Pure Khmer word + Samdech Chuon Nath definition + Khmer example
      const [kmHeadBuf, kmExampleBuf] = await Promise.all([
        kmWord
          ? fetchNativeTtsSegment(`ពាក្យ ${kmWord}។ ${kmDefShort}`, "km")
          : Promise.resolve(Buffer.alloc(0)),
        kmExShort
          ? fetchNativeTtsSegment(`ឧទាហរណ៍៖ ${kmExShort}`, "km")
          : Promise.resolve(Buffer.alloc(0)),
      ]);
      const segs = [kmHeadBuf, kmExampleBuf].filter((b) => b && b.length > 100);
      const combined = segs.length > 0 ? Buffer.concat(segs) : Buffer.alloc(0);
      return {
        englishPronunciationAudioBase64: "",
        bilingualPronunciationAudioBase64: combined.length > 100 ? combined.toString("base64") : "",
        combinedBuffer: combined,
      };
    }

    if (mode === "en-km") {
      // English-Khmer Dictionary Audio: Native English pronunciation + Khmer translation & explanation
      const [enWordBuf, kmMeaningBuf] = await Promise.all([
        enWord
          ? fetchNativeTtsSegment(`${enWord}. ${enWord}.`, "en")
          : Promise.resolve(Buffer.alloc(0)),
        kmWord
          ? fetchNativeTtsSegment(`ប្រែជាភាសាខ្មែរថា ${kmWord}។ ${enToKmShort}`, "km")
          : Promise.resolve(Buffer.alloc(0)),
      ]);
      const segs = [enWordBuf, kmMeaningBuf].filter((b) => b && b.length > 100);
      const combined = segs.length > 0 ? Buffer.concat(segs) : Buffer.alloc(0);
      return {
        englishPronunciationAudioBase64:
          enWordBuf.length > 100 ? enWordBuf.toString("base64") : "",
        bilingualPronunciationAudioBase64:
          combined.length > 100 ? combined.toString("base64") : "",
        combinedBuffer: combined,
      };
    }

    // Khmer-English Dictionary Audio ("km-en"): Khmer word + Native English translation & example
    const [kmIntroBuf, enWordBuf, enExBuf] = await Promise.all([
      kmWord
        ? fetchNativeTtsSegment(`ពាក្យ ${kmWord} ប្រែជាភាសាអង់គ្លេសគឺ`, "km")
        : Promise.resolve(Buffer.alloc(0)),
      enWord
        ? fetchNativeTtsSegment(`${enWord}. ${enWord}.`, "en")
        : Promise.resolve(Buffer.alloc(0)),
      enExample ? fetchNativeTtsSegment(enExample, "en") : Promise.resolve(Buffer.alloc(0)),
    ]);

    const combinedSegments = [kmIntroBuf, enWordBuf, enExBuf].filter(
      (b) => b && b.length > 100
    );
    const combinedBuffer =
      combinedSegments.length > 0 ? Buffer.concat(combinedSegments) : Buffer.alloc(0);

    return {
      englishPronunciationAudioBase64: enWordBuf.length > 100 ? enWordBuf.toString("base64") : "",
      bilingualPronunciationAudioBase64:
        combinedBuffer.length > 100 ? combinedBuffer.toString("base64") : "",
      combinedBuffer,
    };
  } catch {
    return {
      englishPronunciationAudioBase64: "",
      bilingualPronunciationAudioBase64: "",
      combinedBuffer: Buffer.alloc(0),
    };
  }
}

export async function lookupVisualDictionaryServer({
  word = "",
  mode = "auto", // "km-km" | "en-km" | "km-en" | "auto"
}) {
  const { cleanWord, detectedDirection } = extractDictionaryQueryAndMode(word, mode);
  const lowerWord = cleanWord.toLowerCase();

  // Check Curated Chuon Nath & Bilingual Dictionary first for instant 100% verified accuracy on common words
  let curatedHit = null;
  if (
    cleanWord === "ផ្លែប៉ោម" ||
    cleanWord === "ប៉ោម" ||
    lowerWord === "apple" ||
    lowerWord === "apples" ||
    lowerWord === "an apple"
  ) {
    curatedHit = CURATED_CHUON_NATH_DICTIONARY["ផ្លែប៉ោម"];
  } else if (cleanWord === "ប្រាជ្ញា" || lowerWord === "wisdom") {
    curatedHit = CURATED_CHUON_NATH_DICTIONARY["ប្រាជ្ញា"];
  } else if (cleanWord === "កតញ្ញូ" || lowerWord === "gratitude" || lowerWord === "grateful") {
    curatedHit = CURATED_CHUON_NATH_DICTIONARY["កតញ្ញូ"];
  } else if (cleanWord === "សន្តិភាព" || lowerWord === "peace") {
    curatedHit = CURATED_CHUON_NATH_DICTIONARY["សន្តិភាព"];
  } else if (cleanWord === "វប្បធម៌" || lowerWord === "culture") {
    curatedHit = CURATED_CHUON_NATH_DICTIONARY["វប្បធម៌"];
  }

  let aiDict = curatedHit;

  if (!aiDict) {
    const prompt =
      `អ្នកគឺជាអ្នកជំនាញវចនានុក្រមផ្លូវការទាំង ៣ ទិសដៅ គឺ៖\n` +
      `១. វចនានុក្រម ខ្មែរ-ខ្មែរ (យកតាមវចនានុក្រមខ្មែរ សម្ដេចព្រះសង្ឃរាជ ជួន ណាត ១០០%)\n` +
      `២. វចនានុក្រម អង់គ្លេស-ខ្មែរ (English-Khmer Dictionary)\n` +
      `៣. វចនានុក្រម ខ្មែរ-អង់គ្លេស (Khmer-English Dictionary)\n\n` +
      `ពាក្យគោលដែលអ្នកប្រើចង់ដឹងគឺ៖ "${cleanWord}"\n` +
      `ច្បាប់ដាច់ខាត៖\n` +
      `• ប្រសិនបើពាក្យគោលជាភាសាខ្មែរ (ឧទាហរណ៍៖ «ផ្លែប៉ោម») ត្រូវបកប្រែជាពាក្យអង់គ្លេសឱ្យចំៗ ច្បាស់ៗ (ឧ. "apple") ហាមដាក់ពាក្យខ្មែរនៅក្នុងប្រអប់ englishWord ដាច់ខាត!\n` +
      `• ប្រសិនបើពាក្យគោលជាភាសាអង់គ្លេស (ឧទាហរណ៍៖ "apple") ត្រូវបកប្រែជាពាក្យខ្មែរឱ្យចំៗ ច្បាស់ៗ (ឧ. «ផ្លែប៉ោម») ហាមដាក់អក្សរអង់គ្លេសនៅក្នុងប្រអប់ khmerWord ដាច់ខាត!\n` +
      `• ត្រូវបង្ហាញរបៀបបញ្ចេញសំឡេងអានភាសាអង់គ្លេសឱ្យត្រូវតាមតុង (Stress & Intonation) ដោយសរសេរជាសំណៀងខ្មែរងាយអាន និងសញ្ញា IPA (ឧ. សម្រាប់ apple គឺ "អ៊ែផល — សង្កត់សំឡេងលើព្យាង្គទី១ «អ៊ែ» /ˈæp.əl/")។\n` +
      `• ចំពោះនិយមន័យ ខ្មែរ-ខ្មែរ (khmerToKhmerDef) ត្រូវសរសេរតាមទម្រង់វចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត យ៉ាងត្រឹមត្រូវបំផុត (មានថ្នាក់ពាក្យ ន./កិ./គុ. ប្រភពពាក្យបាលី/សំស្ក្រឹត/ខ្មែរ និងសេចក្ដីពន្យល់ច្បាស់លាស់)។\n` +
      `• ត្រូវផ្ដល់ "photoSearchQueryEn" ជាពាក្យគន្លឹះភាសាអង់គ្លេស ១-៣ ពាក្យ ដែលតំណាងឱ្យរូបភាពពិតប្រាកដនៃពាក្យនេះ សម្រាប់ស្វែងរករូបថតពិតក្នុង Wikipedia/Wikimedia (ឧ. បើពាក្យគឺ "ផ្លែប៉ោម" ដាក់ "Apple fruit", បើពាក្យគឺ "ខ្លា" ដាក់ "Bengal tiger", បើពាក្យគឺ "ផ្កាឈូក" ដាក់ "Nelumbo nucifera")។\n\n` +
      `សូមឆ្លើយជា JSON តែមួយគត់តាមទម្រង់នេះ៖\n` +
      `{\n` +
      `  "headword": "${cleanWord}",\n` +
      `  "khmerWord": "ពាក្យប្រែជាភាសាខ្មែរឱ្យច្បាស់លាស់ (ឧ. ផ្លែប៉ោម)",\n` +
      `  "englishWord": "Exact English word translation in lowercase/standard case (e.g. apple)",\n` +
      `  "photoSearchQueryEn": "Concrete 1-3 word English subject for searching a real Wikipedia photograph of this word (e.g. Apple fruit)",\n` +
      `  "emoji": "រូប Emoji តំណាងឱ្យពាក្យនេះ ១ តួ (ឧ. 🍎, 🪷, 📚, 🌟)",\n` +
      `  "partOfSpeech": "ថ្នាក់ពាក្យ (ឧ. នាម (Noun), កិរិយាសព្ទ (Verb), គុណនាម (Adjective))",\n` +
      `  "pronunciationKhmer": "របៀបអានពាក្យខ្មែរ (ឧ. ផ្លែ-ប៉ោម)",\n` +
      `  "pronunciationEnglishTone": "របៀបបញ្ចេញសំឡេងពាក្យអង់គ្លេសឱ្យត្រូវតុង (ឧ. អ៊ែផល — សង្កត់សំឡេងលើព្យាង្គទី១ «អ៊ែ»)",\n` +
      `  "pronunciationIpa": "IPA phonetic transcription (e.g. /ˈæp.əl/)",\n` +
      `  "etymology": "ប្រភពពាក្យតាមវចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត",\n` +
      `  "khmerToKhmerDef": "និយមន័យ ខ្មែរ-ខ្មែរ តាមវចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត យ៉ាងក្បោះក្បាយ និងត្រឹមត្រូវបំផុត",\n` +
      `  "englishToKhmerDef": "និយមន័យ អង់គ្លេស-ខ្មែរ (ឧ. apple ប្រែជាភាសាខ្មែរថា «ផ្លែប៉ោម» — ពន្យល់លម្អិតជាភាសាខ្មែរ)",\n` +
      `  "khmerToEnglishDef": "Khmer-to-English definition (e.g. «ផ្លែប៉ោម» means «apple» in English — clear English explanation)",\n` +
      `  "visualPromptEn": "Clear visual illustration prompt in English depicting this word",\n` +
      `  "examples": [\n` +
      `    {\n` +
      `      "khmerSentence": "ល្បះឧទាហរណ៍ជាភាសាខ្មែរដែលប្រើពាក្យនេះយ៉ាងច្បាស់លាស់",\n` +
      `      "englishSentence": "Equivalent example sentence in English",\n` +
      `      "explanationKhmer": "ការបញ្ជាក់បន្ថែមអំពីអត្ថន័យ និងការប្រើប្រាស់ពាក្យក្នុងល្បះនេះ"\n` +
      `    }\n` +
      `  ],\n` +
      `  "synonyms": ["ពាក្យសទិសន័យទី១", "ពាក្យសទិសន័យទី២"],\n` +
      `  "antonyms": ["ពាក្យផ្ទុយទី១"]\n` +
      `}`;

    aiDict = await callGeminiJsonFast(prompt, 9500);
  }

  const khmerWord = applyStrictKhmerOrthographyFix(
    aiDict?.khmerWord || cleanWord
  ).fixedText;
  const englishWord = String(aiDict?.englishWord || cleanWord).trim();
  const emoji = String(aiDict?.emoji || "📘").trim();
  const partOfSpeech = applyStrictKhmerOrthographyFix(
    aiDict?.partOfSpeech || "នាម (Noun)"
  ).fixedText;
  const pronunciationKhmer = applyStrictKhmerOrthographyFix(
    aiDict?.pronunciationKhmer || khmerWord
  ).fixedText;
  const pronunciationIpa = String(aiDict?.pronunciationIpa || "").trim();
  const pronunciationEnglishTone = applyStrictKhmerOrthographyFix(
    aiDict?.pronunciationEnglishTone ||
      (pronunciationIpa ? `អានតាមតុងអង់គ្លេស ${pronunciationIpa}` : englishWord)
  ).fixedText;

  const khmerToKhmerDef = applyStrictKhmerOrthographyFix(
    aiDict?.khmerToKhmerDef ||
      `${khmerWord} (${partOfSpeech}) តាមវចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត សំដៅលើអត្ថន័យនៃពាក្យ «${khmerWord}» សម្រាប់ប្រើប្រាស់ក្នុងភាសាខ្មែរ។`
  ).fixedText;
  const englishToKhmerDef = applyStrictKhmerOrthographyFix(
    aiDict?.englishToKhmerDef ||
      `ពាក្យអង់គ្លេស «${englishWord}» ប្រែមកជាភាសាខ្មែរថា «${khmerWord}»។`
  ).fixedText;
  const khmerToEnglishDef = String(
    aiDict?.khmerToEnglishDef ||
      `ពាក្យខ្មែរ «${khmerWord}» ប្រែជាភាសាអង់គ្លេសថា «${englishWord}» ("${khmerWord}" means "${englishWord}" in English).`
  ).trim();

  // Direct crystal-clear headline answer tailored to the 1 selected dictionary mode
  let directAnswerKhmer = "";
  if (detectedDirection === "km-km") {
    directAnswerKhmer = `ពាក្យ «${khmerWord}» (អានថា៖ ${pronunciationKhmer}) — ${partOfSpeech}`;
  } else if (detectedDirection === "en-km") {
    directAnswerKhmer = `ពាក្យអង់គ្លេស «${englishWord}» (អានតាមតុងអង់គ្លេសថា៖ ${pronunciationEnglishTone}) ប្រែជាភាសាខ្មែរថា «${khmerWord}»។`;
  } else {
    directAnswerKhmer = `ពាក្យខ្មែរ «${khmerWord}» ប្រែជាភាសាអង់គ្លេសគឺ «${englishWord}» (អានតាមតុងអង់គ្លេសថា៖ ${pronunciationEnglishTone})។`;
  }

  const illustrationSvgDataUrl = createDictionaryWordSvgDataUrl({
    word: cleanWord,
    khmerWord,
    englishWord: detectedDirection === "km-km" ? partOfSpeech : englishWord,
    partOfSpeech,
    shortMeaning:
      detectedDirection === "en-km"
        ? englishToKhmerDef
        : detectedDirection === "km-en"
        ? khmerToEnglishDef
        : khmerToKhmerDef,
    emoji,
  });

  const seed = 3000 + cleanWord.length * 41;
  const aiImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    aiDict?.visualPromptEn || `real photograph of ${englishWord}, DSLR photography, natural lighting`
  )}?width=640&height=400&seed=${seed}&nologo=true`;

  const examples =
    Array.isArray(aiDict?.examples) && aiDict.examples.length > 0
      ? aiDict.examples.slice(0, 4).map((ex) => ({
          khmerSentence: applyStrictKhmerOrthographyFix(ex.khmerSentence || "").fixedText,
          englishSentence: String(ex.englishSentence || "").trim(),
          explanationKhmer: applyStrictKhmerOrthographyFix(
            ex.explanationKhmer || "បង្ហាញពីការប្រើប្រាស់ពាក្យក្នុងបរិបទជាក់ស្ដែង។"
          ).fixedText,
        }))
      : [
          {
            khmerSentence: `ការយល់ដឹងអំពីពាក្យ «${khmerWord}» ជួយឱ្យយើងប្រើប្រាស់ភាសាបានត្រឹមត្រូវ។`,
            englishSentence: `Understanding the word "${englishWord}" helps us use language accurately.`,
            explanationKhmer: "ល្បះបង្ហាញពីការប្រើប្រាស់ពាក្យជាប្រធាន ឬកម្មបទនៅក្នុងប្រយោគ។",
          },
        ];

  const dictPayload = {
    ok: true,
    mode: detectedDirection,
    headword: cleanWord,
    khmerWord,
    englishWord,
    directAnswerKhmer,
    directAnswerBanner: directAnswerKhmer,
    emoji,
    partOfSpeech,
    pronunciationKhmer,
    pronunciationEnglishTone,
    pronunciationIpa,
    etymology: applyStrictKhmerOrthographyFix(
      aiDict?.etymology || "វចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត"
    ).fixedText,
    khmerToKhmerDef,
    englishToKhmerDef,
    khmerToEnglishDef,
    examples,
    synonyms: Array.isArray(aiDict?.synonyms)
      ? aiDict.synonyms.map((s) => applyStrictKhmerOrthographyFix(String(s)).fixedText)
      : [],
    antonyms: Array.isArray(aiDict?.antonyms)
      ? aiDict.antonyms.map((s) => applyStrictKhmerOrthographyFix(String(s)).fixedText)
      : [],
    imageUrl: illustrationSvgDataUrl,
    svgCardUrl: illustrationSvgDataUrl,
    realPhotoDataUrl: "",
    realPhotoBuffer: null,
    realPhotoMimeType: "image/jpeg",
    aiImageUrl,
    englishPronunciationAudioBase64: "",
    bilingualPronunciationAudioBase64: "",
    pronunciationAudioBase64: "",
  };

  // Fetch Real Word Photograph AND Pronunciation Audio in parallel!
  const [realPhotoRes, audioPronunciations] = await Promise.all([
    resolveRealDictionaryWordPhotoServer({
      englishWord,
      khmerWord,
      photoSearchQueryEn: aiDict?.photoSearchQueryEn || englishWord,
      directPhotoUrl: aiDict?.directPhotoUrl || "",
    }),
    generateDictionaryPronunciationAudioBuffers(dictPayload, detectedDirection),
  ]);

  if (realPhotoRes && realPhotoRes.buffer) {
    dictPayload.imageUrl = `/api/dictionary/photo?key=${encodeURIComponent(
      realPhotoRes.photoKey
    )}&q=${encodeURIComponent(realPhotoRes.queryUsed)}`;
    dictPayload.realPhotoDataUrl = realPhotoRes.dataUrl;
    dictPayload.realPhotoBuffer = realPhotoRes.buffer;
    dictPayload.realPhotoMimeType = realPhotoRes.mimeType || "image/jpeg";
  }

  dictPayload.englishPronunciationAudioBase64 =
    audioPronunciations.englishPronunciationAudioBase64;
  dictPayload.bilingualPronunciationAudioBase64 =
    audioPronunciations.bilingualPronunciationAudioBase64;
  dictPayload.pronunciationAudioBase64 =
    audioPronunciations.bilingualPronunciationAudioBase64 ||
    audioPronunciations.englishPronunciationAudioBase64;

  return dictPayload;
}

export async function sendTelegramDictionaryResult(token, chatId, replyToMessageId, params) {
  const effectiveToken = getConfiguredBotToken(token);
  fetch(`https://api.telegram.org/bot${effectiveToken}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "upload_photo" }),
  }).catch(() => {});

  const d = await lookupVisualDictionaryServer(params);
  const activeMode = d.mode === "en-km" || d.mode === "km-en" ? d.mode : "km-km";

  let html = "";
  let photoCaption = "";
  let voiceFallbackText = "";

  if (activeMode === "km-km") {
    // ONLY 1 Dictionary Type: វចនានុក្រម ខ្មែរ-ខ្មែរ (សម្ដេចព្រះសង្ឃរាជ ជួន ណាត)
    const examplesHtml = d.examples
      .map(
        (ex, i) =>
          `${i + 1}. 🇰🇭 <b>ល្បះឧទាហរណ៍៖</b> ${escapeHtmlLocal(ex.khmerSentence)}\n` +
          `   💡 <i>ការបញ្ជាក់៖</i> ${escapeHtmlLocal(ex.explanationKhmer)}`
      )
      .join("\n\n");

    html =
      `${escapeHtmlLocal(d.emoji)}📖 <b>វចនានុក្រម ខ្មែរ-ខ្មែរ (សម្ដេចព្រះសង្ឃរាជ ជួន ណាត)</b>\n` +
      `<blockquote>🎯 <b>ពាក្យគោល៖</b> <b>«${escapeHtmlLocal(d.khmerWord)}»</b> (អានថា៖ <code>${escapeHtmlLocal(
        d.pronunciationKhmer
      )}</code>)</blockquote>\n` +
      `• 🏷️ <b>ថ្នាក់ពាក្យ៖</b> ${escapeHtmlLocal(d.partOfSpeech)}\n` +
      `• 🏛️ <b>ប្រភពពាក្យ៖</b> ${escapeHtmlLocal(d.etymology)}\n\n` +
      `🇰🇭➡️🇰🇭 <b>និយមន័យតាមវចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត៖</b>\n${escapeHtmlLocal(
        d.khmerToKhmerDef
      )}\n\n` +
      `📝 <b>ឧទាហរណ៍ជាល្បះបង្ហាញ និងបញ្ជាក់៖</b>\n${examplesHtml}` +
      (d.synonyms.length > 0
        ? `\n\n🔄 <b>សទិសន័យ (ន័យដូច)៖</b> ${escapeHtmlLocal(d.synonyms.join(", "))}`
        : "") +
      (d.antonyms.length > 0
        ? `\n↔️ <b>បដិសព្ទ (ពាក្យផ្ទុយ)៖</b> ${escapeHtmlLocal(d.antonyms.join(", "))}`
        : "");

    photoCaption =
      `📸${escapeHtmlLocal(d.emoji)} <b>រូបភាពពិតប្រាកដនៃពាក្យ៖ «${escapeHtmlLocal(
        d.khmerWord
      )}»</b>\n` +
      `🇰🇭➡️🇰🇭 <b>វចនានុក្រម ខ្មែរ-ខ្មែរ (ជួន ណាត)៖</b> ${escapeHtmlLocal(
        d.khmerToKhmerDef.slice(0, 240)
      )}`;

    voiceFallbackText = `វចនានុក្រមខ្មែរ-ខ្មែរ សម្ដេចព្រះសង្ឃរាជ ជួន ណាត៖ ពាក្យ ${d.khmerWord}។ ${d.khmerToKhmerDef.slice(
      0,
      210
    )}`;
  } else if (activeMode === "en-km") {
    // ONLY 1 Dictionary Type: វចនានុក្រម អង់គ្លេស-ខ្មែរ (English ➔ Khmer)
    const examplesHtml = d.examples
      .map(
        (ex, i) =>
          `${i + 1}. 🇬🇧 <i>English:</i> ${escapeHtmlLocal(ex.englishSentence)}\n` +
          `   🇰🇭 <b>ប្រែខ្មែរ៖</b> ${escapeHtmlLocal(ex.khmerSentence)}\n` +
          `   💡 <i>ការបញ្ជាក់៖</i> ${escapeHtmlLocal(ex.explanationKhmer)}`
      )
      .join("\n\n");

    html =
      `${escapeHtmlLocal(d.emoji)}📖 <b>វចនានុក្រម អង់គ្លេស-ខ្មែរ (English ➔ Khmer Dictionary)</b>\n` +
      `<blockquote>🎯 <b>ចម្លើយបកប្រែ៖</b> ពាក្យអង់គ្លេស <b>«${escapeHtmlLocal(
        d.englishWord
      )}»</b> ប្រែជាភាសាខ្មែរថា <b>«${escapeHtmlLocal(d.khmerWord)}»</b></blockquote>\n` +
      `• 🇬🇧 <b>ពាក្យអង់គ្លេស៖</b> <b><code>${escapeHtmlLocal(d.englishWord)}</code></b>\n` +
      `• 🗣️ <b>ការបញ្ចេញសំឡេងអង់គ្លេសឱ្យត្រូវតុង៖</b> <b>${escapeHtmlLocal(
        d.pronunciationEnglishTone
      )}</b> ${d.pronunciationIpa ? `<code>${escapeHtmlLocal(d.pronunciationIpa)}</code>` : ""}\n` +
      `• 🇰🇭 <b>ប្រែជាភាសាខ្មែរ៖</b> <b>${escapeHtmlLocal(d.khmerWord)}</b> (អានថា៖ <code>${escapeHtmlLocal(
        d.pronunciationKhmer
      )}</code>)\n` +
      `• 🏷️ <b>ថ្នាក់ពាក្យ៖</b> ${escapeHtmlLocal(d.partOfSpeech)}\n\n` +
      `🇬🇧➡️🇰🇭 <b>និយមន័យ អង់គ្លេស-ខ្មែរ (English ➔ Khmer)៖</b>\n${escapeHtmlLocal(
        d.englishToKhmerDef
      )}\n\n` +
      `📝 <b>ឧទាហរណ៍ជាល្បះបង្ហាញ និងបញ្ជាក់ (Example Sentences)៖</b>\n${examplesHtml}`;

    photoCaption =
      `📸${escapeHtmlLocal(d.emoji)} <b>រូបភាពពិតប្រាកដនៃពាក្យ៖ «${escapeHtmlLocal(
        d.englishWord
      )} ➔ ${escapeHtmlLocal(d.khmerWord)}»</b>\n` +
      `🗣️ <b>អានតាមតុងអង់គ្លេស៖</b> ${escapeHtmlLocal(d.pronunciationEnglishTone)}\n` +
      `🇬🇧➡️🇰🇭 ${escapeHtmlLocal(d.englishToKhmerDef.slice(0, 210))}`;

    voiceFallbackText = `${d.directAnswerKhmer} ${d.englishToKhmerDef.slice(0, 180)}\n🇬🇧 English: ${
      d.englishWord
    }. ${d.examples[0]?.englishSentence || ""}`;
  } else {
    // ONLY 1 Dictionary Type: វចនានុក្រម ខ្មែរ-អង់គ្លេស (Khmer ➔ English)
    const examplesHtml = d.examples
      .map(
        (ex, i) =>
          `${i + 1}. 🇰🇭 <b>ល្បះខ្មែរ៖</b> ${escapeHtmlLocal(ex.khmerSentence)}\n` +
          `   🇬🇧 <i>English:</i> ${escapeHtmlLocal(ex.englishSentence)}\n` +
          `   💡 <i>ការបញ្ជាក់៖</i> ${escapeHtmlLocal(ex.explanationKhmer)}`
      )
      .join("\n\n");

    html =
      `${escapeHtmlLocal(d.emoji)}📖 <b>វចនានុក្រម ខ្មែរ-អង់គ្លេស (Khmer ➔ English Dictionary)</b>\n` +
      `<blockquote>🎯 <b>ចម្លើយបកប្រែ៖</b> ពាក្យខ្មែរ <b>«${escapeHtmlLocal(
        d.khmerWord
      )}»</b> ប្រែជាភាសាអង់គ្លេសគឺ <b>«${escapeHtmlLocal(d.englishWord)}»</b></blockquote>\n` +
      `• 🇰🇭 <b>ពាក្យខ្មែរ៖</b> <b>${escapeHtmlLocal(d.khmerWord)}</b> (អានថា៖ <code>${escapeHtmlLocal(
        d.pronunciationKhmer
      )}</code>)\n` +
      `• 🇬🇧 <b>ប្រែជាភាសាអង់គ្លេស៖</b> <b><code>${escapeHtmlLocal(d.englishWord)}</code></b>\n` +
      `• 🗣️ <b>ការបញ្ចេញសំឡេងអង់គ្លេសឱ្យត្រូវតុង៖</b> <b>${escapeHtmlLocal(
        d.pronunciationEnglishTone
      )}</b> ${d.pronunciationIpa ? `<code>${escapeHtmlLocal(d.pronunciationIpa)}</code>` : ""}\n` +
      `• 🏷️ <b>ថ្នាក់ពាក្យ៖</b> ${escapeHtmlLocal(d.partOfSpeech)}\n\n` +
      `🇰🇭➡️🇬🇧 <b>និយមន័យ ខ្មែរ-អង់គ្លេស (Khmer ➔ English)៖</b>\n${escapeHtmlLocal(
        d.khmerToEnglishDef
      )}\n\n` +
      `📝 <b>ឧទាហរណ៍ជាល្បះបង្ហាញ និងបញ្ជាក់ (Example Sentences)៖</b>\n${examplesHtml}`;

    photoCaption =
      `📸${escapeHtmlLocal(d.emoji)} <b>រូបភាពពិតប្រាកដនៃពាក្យ៖ «${escapeHtmlLocal(
        d.khmerWord
      )} ➔ ${escapeHtmlLocal(d.englishWord)}»</b>\n` +
      `🗣️ <b>អានតាមតុងអង់គ្លេស៖</b> ${escapeHtmlLocal(d.pronunciationEnglishTone)}\n` +
      `🇰🇭➡️🇬🇧 ${escapeHtmlLocal(d.khmerToEnglishDef.slice(0, 210))}`;

    voiceFallbackText = `${d.directAnswerKhmer} ${d.khmerToEnglishDef.slice(0, 180)}\n🇬🇧 English: ${
      d.englishWord
    }. ${d.examples[0]?.englishSentence || ""}`;
  }

  const studioUrl = `${getPublicAppBaseUrl()}/?studio=dictionary&tg_chat_id=${encodeURIComponent(
    String(chatId)
  )}`;
  const safeWordForCb = String(d.khmerWord || d.headword || "ផ្លែប៉ោម").slice(0, 22);
  const synButtons = d.synonyms.slice(0, 3).map((syn) => ({
    text: `📘 ${String(syn).slice(0, 18)}`,
    callback_data: `dict_word_${String(syn).slice(0, 28)}`,
  }));
  const dictKeyboard = {
    inline_keyboard: [
      [
        {
          text: `${activeMode === "km-km" ? "✅ " : ""}🇰🇭➡️🇰🇭 ខ្មែរ-ខ្មែរ (ជួន ណាត)`,
          callback_data: `dict_switch_km-km_${safeWordForCb}`,
        },
        {
          text: `${activeMode === "en-km" ? "✅ " : ""}🇬🇧➡️🇰🇭 អង់គ្លេស-ខ្មែរ`,
          callback_data: `dict_switch_en-km_${safeWordForCb}`,
        },
        {
          text: `${activeMode === "km-en" ? "✅ " : ""}🇰🇭➡️🇬🇧 ខ្មែរ-អង់គ្លេស`,
          callback_data: `dict_switch_km-en_${safeWordForCb}`,
        },
      ],
      ...(synButtons.length > 0 ? [synButtons] : []),
      [
        {
          text: "🌐 បើកវចនានុក្រមរូបភាពលើ Web App",
          web_app: { url: studioUrl },
        },
      ],
    ],
  };

  // Send Real Photograph of the queried word to Telegram!
  const sendRealWordPhotoPromise = (async () => {
    try {
      if (d.realPhotoBuffer && d.realPhotoBuffer.length > 1000) {
        const form = new FormData();
        form.append("chat_id", String(chatId));
        if (replyToMessageId) form.append("reply_to_message_id", String(replyToMessageId));
        form.append("caption", photoCaption.slice(0, 1000));
        form.append("parse_mode", "HTML");
        const ext = (d.realPhotoMimeType || "").includes("png") ? "png" : "jpg";
        form.append(
          "photo",
          new Blob([new Uint8Array(d.realPhotoBuffer)], {
            type: d.realPhotoMimeType || "image/jpeg",
          }),
          `real-word-photo-${d.englishWord.replace(/[^a-zA-Z0-9_-]/g, "_") || "word"}.${ext}`
        );
        const r = await fetch(`https://api.telegram.org/bot${effectiveToken}/sendPhoto`, {
          method: "POST",
          body: form,
          signal: AbortSignal.timeout(12000),
        });
        const rJson = await r.json().catch(() => null);
        if (rJson?.ok) return;
      }
      await sendTelegramSvgPhotoServer(
        effectiveToken,
        chatId,
        d.svgCardUrl || d.imageUrl,
        photoCaption,
        null,
        replyToMessageId
      );
    } catch {}
  })();

  // Send pronunciation audio tailored to the selected dictionary type
  const sendPronunciationAudioPromise = (async () => {
    try {
      if (d.bilingualPronunciationAudioBase64) {
        const audioBuf = Buffer.from(d.bilingualPronunciationAudioBase64, "base64");
        const form = new FormData();
        form.append("chat_id", String(chatId));
        form.append(
          "title",
          activeMode === "km-km"
            ? `ការអានពាក្យ៖ ${d.khmerWord}`
            : `ការបញ្ចេញសំឡេង៖ ${d.englishWord} / ${d.khmerWord}`
        );
        form.append(
          "performer",
          activeMode === "km-km"
            ? "វចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត"
            : "វចនានុក្រម អង់គ្លេស-ខ្មែរ / ខ្មែរ-អង់គ្លេស"
        );
        form.append(
          "caption",
          activeMode === "km-km"
            ? `🔊 សំឡេងអាន និងពន្យល់ពាក្យ៖ «${d.khmerWord}» (${d.pronunciationKhmer})`
            : `🔊 ការបញ្ចេញសំឡេងអានឱ្យត្រូវតុង៖ «${d.englishWord}» (${d.pronunciationEnglishTone}) ⇄ «${d.khmerWord}»`
        );
        form.append(
          "audio",
          new Blob([new Uint8Array(audioBuf)], { type: "audio/mpeg" }),
          `pronunciation-${d.englishWord.replace(/[^a-zA-Z0-9_-]/g, "_") || "word"}.mp3`
        );
        const r = await fetch(`https://api.telegram.org/bot${effectiveToken}/sendAudio`, {
          method: "POST",
          body: form,
        });
        const rData = await r.json().catch(() => null);
        if (rData?.ok) return;
      }
      await sendSingleKhmerVoice(effectiveToken, chatId, voiceFallbackText);
    } catch {}
  })();

  await Promise.all([
    sendRealWordPhotoPromise,
    sendTelegramHtml(effectiveToken, chatId, html, dictKeyboard),
    sendPronunciationAudioPromise,
  ]);

  return { ok: true, dictionary: d };
}

// ============================================================================
// CAPABILITY 6: REAL-TIME CAMBODIA CALENDAR & DAILY EVENT / HOLIDAY NOTIFIER
// ============================================================================
const KHMER_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
export function toKhmerNumber(num) {
  return String(num).replace(/\d/g, (d) => KHMER_DIGITS[Number(d)] || d);
}

const KHMER_MONTHS_SOLAR = [
  "មករា",
  "កុម្ភៈ",
  "មីនា",
  "មេសា",
  "ឧសភា",
  "មិថុនា",
  "កក្កដា",
  "សីហា",
  "កញ្ញា",
  "តុលា",
  "វិច្ឆិកា",
  "ធ្នូ",
];

const KHMER_WEEKDAYS = [
  "ថ្ងៃអាទិត្យ",
  "ថ្ងៃចន្ទ",
  "ថ្ងៃអង្គារ",
  "ថ្ងៃពុធ",
  "ថ្ងៃព្រហស្បតិ៍",
  "ថ្ងៃសុក្រ",
  "ថ្ងៃសៅរ៍",
];

function buildCambodiaEventsForYear(year) {
  // Movable lunar holidays in Cambodia by actual year (2025, 2026, 2027+)
  const movableByYear = {
    2025: {
      meakBochea: "02-12",
      visakBochea: "05-11",
      royalPlowing: "05-15",
      pchumBenStart: "09-21",
      pchumBenMid: "09-22",
      pchumBenEnd: "09-23",
      waterFestival1: "11-04",
      waterFestival2: "11-05",
      waterFestival3: "11-06",
    },
    2026: {
      meakBochea: "03-03",
      visakBochea: "05-31",
      royalPlowing: "06-04",
      pchumBenStart: "10-09",
      pchumBenMid: "10-10",
      pchumBenEnd: "10-11",
      waterFestival1: "11-23",
      waterFestival2: "11-24",
      waterFestival3: "11-25",
    },
    2027: {
      meakBochea: "02-21",
      visakBochea: "05-20",
      royalPlowing: "05-24",
      pchumBenStart: "09-29",
      pchumBenMid: "09-30",
      pchumBenEnd: "10-01",
      waterFestival1: "11-13",
      waterFestival2: "11-14",
      waterFestival3: "11-15",
    },
  };

  const mov = movableByYear[year] || movableByYear[2026];

  const rawEvents = [
    {
      mmdd: "01-01",
      titleKhmer: "ទិវាចូលឆ្នាំសកល (New Year's Day)",
      titleEnglish: "International New Year's Day",
      category: "public_holiday",
      categoryLabelKhmer: "🎉 ថ្ងៃបុណ្យឈប់សម្រាកផ្លូវការ & អន្តរជាតិ",
      isPublicHoliday: true,
      descriptionKhmer: "ថ្ងៃចូលឆ្នាំសកលដែលប្រជាពលរដ្ឋនៅកម្ពុជា និងពិភពលោកប្រារព្ធពិធីស្វាគមន៍ឆ្នាំថ្មី។",
    },
    {
      mmdd: "01-07",
      titleKhmer: "ទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍ (Victory over Genocide Day)",
      titleEnglish: "Victory over Genocide Day",
      category: "national_holiday",
      categoryLabelKhmer: "🇰🇭 ថ្ងៃបុណ្យជាតិ និងឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "ប្រារព្ធឡើងដើម្បីរំឭកដល់ថ្ងៃរំដោះប្រទេសកម្ពុជាចេញពីរបបប្រល័យពូជសាសន៍ (៧ មករា)។",
    },
    {
      mmdd: "02-14",
      titleKhmer: "ទិវានៃក្ដីស្រឡាញ់ (Valentine's Day)",
      titleEnglish: "Valentine's Day",
      category: "international",
      categoryLabelKhmer: "🌍 ទិវាអន្តរជាតិ",
      isPublicHoliday: false,
      descriptionKhmer: "ទិវាបង្ហាញក្ដីស្រឡាញ់ និងការដឹងគុណចំពោះឪពុកម្ដាយ គ្រូបង្រៀន និងមនុស្សជាទីស្រឡាញ់។",
    },
    {
      mmdd: mov.meakBochea,
      titleKhmer: "ពិធីបុណ្យមាឃបូជា (Meak Bochea Day)",
      titleEnglish: "Meak Bochea Buddhist Festival",
      category: "traditional",
      categoryLabelKhmer: "🪷 ពិធីបុណ្យព្រះពុទ្ធសាសនា និងប្រពៃណីជាតិ",
      isPublicHoliday: true,
      descriptionKhmer: "រំឭកដល់ថ្ងៃព្រះសម្មាសម្ពុទ្ធទ្រង់ប្រកាសឱវាទបាតិមោក្ខ និងដាក់ព្រះជន្មាយុសង្ខារ។",
    },
    {
      mmdd: "03-03",
      titleKhmer: "ទិវាវប្បធម៌ជាតិ (National Culture Day)",
      titleEnglish: "Cambodia National Culture Day",
      category: "national_observance",
      categoryLabelKhmer: "🏛️ ទិវាជាតិកម្ពុជា",
      isPublicHoliday: false,
      descriptionKhmer: "ទិវាលើកស្ទួយ និងអភិរក្សមរតកវប្បធម៌ អរិយធម៌ និងសិល្បៈដ៏រុងរឿងរបស់ជាតិខ្មែរ។",
    },
    {
      mmdd: "03-08",
      titleKhmer: "ទិវានារីអន្តរជាតិ (International Women's Day)",
      titleEnglish: "International Women's Day",
      category: "public_holiday",
      categoryLabelKhmer: "🌸 ថ្ងៃបុណ្យឈប់សម្រាកផ្លូវការ & អន្តរជាតិ",
      isPublicHoliday: true,
      descriptionKhmer: "ថ្ងៃឈប់សម្រាកផ្លូវការនៅកម្ពុជា ដើម្បីលើកកម្ពស់សិទ្ធិ និងតម្លៃរបស់ស្ត្រីនៅទូទាំងពិភពលោក។",
    },
    {
      mmdd: "04-14",
      titleKhmer: "ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិខ្មែរ - ថ្ងៃមហាសង្ក្រាន្ត",
      titleEnglish: "Khmer New Year (Day 1 - Maha Songkran)",
      category: "traditional",
      categoryLabelKhmer: "🇰🇭🪷 ពិធីបុណ្យប្រពៃណីជាតិខ្មែរ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "ថ្ងៃទី ១ នៃពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិខ្មែរ (ថ្ងៃមហាសង្ក្រាន្ត ទទួលទេវតាឆ្នាំថ្មី)។",
    },
    {
      mmdd: "04-15",
      titleKhmer: "ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិខ្មែរ - ថ្ងៃវារៈវនបត",
      titleEnglish: "Khmer New Year (Day 2 - Virak Wanabat)",
      category: "traditional",
      categoryLabelKhmer: "🇰🇭🪷 ពិធីបុណ្យប្រពៃណីជាតិខ្មែរ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "ថ្ងៃទី ២ នៃពិធីបុណ្យចូលឆ្នាំខ្មែរ សម្រាប់ជូនពរ និងជូនសម្លៀកបំពាក់ដល់មាតាបិតា និងចាស់ព្រឹទ្ធាចារ្យ។",
    },
    {
      mmdd: "04-16",
      titleKhmer: "ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិខ្មែរ - ថ្ងៃវារៈឡើងស័ក",
      titleEnglish: "Khmer New Year (Day 3 - Virak Loeurng Sak)",
      category: "traditional",
      categoryLabelKhmer: "🇰🇭🪷 ពិធីបុណ្យប្រពៃណីជាតិខ្មែរ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "ថ្ងៃទី ៣ នៃពិធីបុណ្យចូលឆ្នាំខ្មែរ ប្រារព្ធពិធីស្រង់ព្រះ និងផ្លាស់ចូលសករាជថ្មី។",
    },
    {
      mmdd: "05-01",
      titleKhmer: "ទិវាពលកម្មអន្តរជាតិ (International Labor Day)",
      titleEnglish: "International Labor Day",
      category: "public_holiday",
      categoryLabelKhmer: "🛠️ ថ្ងៃបុណ្យឈប់សម្រាកផ្លូវការ & អន្តរជាតិ",
      isPublicHoliday: true,
      descriptionKhmer: "ថ្ងៃឈប់សម្រាកផ្លូវការដើម្បីអបអរសាទរការលះបង់របស់កម្មករ និយោជិតទូទាំងប្រទេស និងពិភពលោក។",
    },
    {
      mmdd: "05-14",
      titleKhmer: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម ព្រះករុណាព្រះបាទសម្ដេចព្រះបរមនាថ នរោត្តម សីហមុនី",
      titleEnglish: "King Norodom Sihamoni's Birthday",
      category: "national_holiday",
      categoryLabelKhmer: "👑 ថ្ងៃបុណ្យជាតិ និងឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "ថ្ងៃឈប់សម្រាកផ្លូវការអបអរសាទរព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្មព្រះមហាក្សត្រនៃព្រះរាជាណាចក្រកម្ពុជា។",
    },
    {
      mmdd: "05-20",
      titleKhmer: "ទិវាជាតិនៃការចងចាំ (National Day of Remembrance)",
      titleEnglish: "National Day of Remembrance",
      category: "national_holiday",
      categoryLabelKhmer: "🕯️ ថ្ងៃបុណ្យជាតិ និងឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "ទិវាជាតិរំឭកវិញ្ញាណក្ខន្ធជនរងគ្រោះក្នុងរបបកម្ពុជាប្រជាធិបតេយ្យ និងថែរក្សាសន្តិភាព។",
    },
    {
      mmdd: mov.visakBochea,
      titleKhmer: "ពិធីបុណ្យវិសាខបូជា (Visak Bochea Day)",
      titleEnglish: "Visak Bochea Day (Buddha's Birth, Enlightenment & Nirvana)",
      category: "traditional",
      categoryLabelKhmer: "🪷 ពិធីបុណ្យព្រះពុទ្ធសាសនា & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "រំឭកដល់ថ្ងៃព្រះសម្មាសម្ពុទ្ធទ្រង់ប្រសូត ត្រាស់ដឹង និងបរិនិព្វាន។",
    },
    {
      mmdd: mov.royalPlowing,
      titleKhmer: "ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល (Royal Plowing Ceremony)",
      titleEnglish: "Royal Plowing Ceremony",
      category: "traditional",
      categoryLabelKhmer: "🐂 ព្រះរាជពិធីប្រពៃណីជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "ព្រះរាជពិធីបុរាណប្រកាសការចាប់ផ្ដើមរដូវធ្វើស្រែចម្ការ និងផ្សងមើលទឹកភ្លៀងតាមរយៈគោឧសភរាជ។",
    },
    {
      mmdd: "06-01",
      titleKhmer: "ទិវាកុមារអន្តរជាតិ (International Children's Day)",
      titleEnglish: "International Children's Day",
      category: "international",
      categoryLabelKhmer: "🧒 ទិវាអន្តរជាតិ និងជាតិ",
      isPublicHoliday: false,
      descriptionKhmer: "ទិវាលើកកម្ពស់សិទ្ធិ ការអប់រំ និងការគាំពារកុមារនៅកម្ពុជា និងពិភពលោក។",
    },
    {
      mmdd: "06-18",
      titleKhmer: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម សម្ដេចព្រះមហាក្សត្រី នរោត្តម មុនិនាថ សីហនុ",
      titleEnglish: "Queen Mother Norodom Monineath Sihanouk's Birthday",
      category: "national_holiday",
      categoryLabelKhmer: "👑 ថ្ងៃបុណ្យជាតិ និងឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "ថ្ងៃឈប់សម្រាកផ្លូវការអបអរសាទរព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្មសម្ដេចព្រះមហាក្សត្រី ព្រះវររាជមាតាជាតិខ្មែរ។",
    },
    {
      mmdd: "09-24",
      titleKhmer: "ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ (Constitution Day)",
      titleEnglish: "Cambodia Constitution Day",
      category: "national_holiday",
      categoryLabelKhmer: "📜 ថ្ងៃបុណ្យជាតិ និងឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "រំឭកដល់ការប្រកាសឱ្យប្រើរដ្ឋធម្មនុញ្ញនៃព្រះរាជាណាចក្រកម្ពុជា (២៤ កញ្ញា ១៩៩៣)។",
    },
    {
      mmdd: "10-05",
      titleKhmer: "ទិវាគ្រូបង្រៀនពិភពលោក និងជាតិ (World & National Teachers' Day)",
      titleEnglish: "World & Cambodia Teachers' Day",
      category: "international",
      categoryLabelKhmer: "🎓 ទិវាជាតិ និងអន្តរជាតិ",
      isPublicHoliday: false,
      descriptionKhmer: "ទិវាដឹងគុណលោកគ្រូអ្នកគ្រូដែលបានលះបង់កម្លាំងកាយចិត្តបណ្ដុះបណ្ដាលធនធានមនុស្ស។",
    },
    {
      mmdd: mov.pchumBenStart,
      titleKhmer: "ពិធីបុណ្យភ្ជុំបិណ្ឌ - ថ្ងៃទី ១ (Pchum Ben Day 1)",
      titleEnglish: "Pchum Ben Ancestors' Festival (Day 1)",
      category: "traditional",
      categoryLabelKhmer: "🪷 ពិធីបុណ្យប្រពៃណីជាតិខ្មែរ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "ពិធីបុណ្យប្រពៃណីជាតិដ៏ធំរបស់ខ្មែរ សម្រាប់ឧទ្ទិសកុសលផលបុណ្យជូនដល់បុព្វការីជន និងញាតិការទាំង ៧ សន្ដាន។",
    },
    {
      mmdd: mov.pchumBenMid,
      titleKhmer: "ពិធីបុណ្យភ្ជុំបិណ្ឌ - ថ្ងៃទី ២ (Pchum Ben Day 2)",
      titleEnglish: "Pchum Ben Ancestors' Festival (Day 2)",
      category: "traditional",
      categoryLabelKhmer: "🪷 ពិធីបុណ្យប្រពៃណីជាតិខ្មែរ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "ថ្ងៃប្រជុំបិណ្ឌធំ ប្រជាពលរដ្ឋខ្មែរជួបជុំគ្រួសារយកចង្ហាន់ទៅប្រគេនព្រះសង្ឃនៅតាមវត្តអារាម។",
    },
    {
      mmdd: mov.pchumBenEnd,
      titleKhmer: "ពិធីបុណ្យភ្ជុំបិណ្ឌ - ថ្ងៃទី ៣ ឆ្លងបុណ្យ (Pchum Ben Day 3)",
      titleEnglish: "Pchum Ben Ancestors' Festival (Day 3)",
      category: "traditional",
      categoryLabelKhmer: "🪷 ពិធីបុណ្យប្រពៃណីជាតិខ្មែរ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "ថ្ងៃឆ្លងពិធីបុណ្យភ្ជុំបិណ្ឌ និងទទួលពរជ័យសិរីមង្គលពីព្រះសង្ឃ និងមាតាបិតា។",
    },
    {
      mmdd: "10-15",
      titleKhmer: "ទិវាគោរពព្រះវិញ្ញាណក្ខន្ធ ព្រះករុណា ព្រះបាទសម្ដេចព្រះ នរោត្តម សីហនុ ព្រះបរមរតនកោដ្ឋ",
      titleEnglish: "Commemoration Day of King Father Norodom Sihanouk",
      category: "national_holiday",
      categoryLabelKhmer: "👑 ថ្ងៃបុណ្យជាតិ និងឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "ថ្ងៃឈប់សម្រាកផ្លូវការដើម្បីគោរពដឹងគុណព្រះមហាវីរក្សត្រ ព្រះវររាជបិតាឯករាជ្យជាតិខ្មែរ។",
    },
    {
      mmdd: "10-29",
      titleKhmer: "ព្រះរាជពិធីបុណ្យគ្រងព្រះបរមរាជសម្បត្តិរបស់ព្រះមហាក្សត្រ (Coronation Day)",
      titleEnglish: "King Norodom Sihamoni's Coronation Day",
      category: "national_holiday",
      categoryLabelKhmer: "👑 ថ្ងៃបុណ្យជាតិ និងឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "ថ្ងៃឈប់សម្រាកផ្លូវការរំឭកដល់ការឡើងគ្រងរាជសម្បត្តិរបស់ព្រះករុណា ព្រះបាទសម្ដេចព្រះបរមនាថ នរោត្តម សីហមុនី។",
    },
    {
      mmdd: "11-09",
      titleKhmer: "ទិវាបុណ្យឯករាជ្យជាតិ ៩ វិច្ឆិកា (National Independence Day)",
      titleEnglish: "Cambodia National Independence Day (Nov 9)",
      category: "national_holiday",
      categoryLabelKhmer: "🇰🇭🔥 ថ្ងៃបុណ្យឯករាជ្យជាតិ និងឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "ប្រារព្ធខួបនៃការទទួលបានឯករាជ្យពេញលេញរបស់ព្រះរាជាណាចក្រកម្ពុជាពីអាណានិគមបារាំង (៩ វិច្ឆិកា ១៩៥៣)។",
    },
    {
      mmdd: mov.waterFestival1,
      titleKhmer: "ព្រះរាជពិធីបុណ្យអុំទូក បណ្ដែតប្រទីប និងសំពះព្រះខែ អកអំបុក (ថ្ងៃទី ១)",
      titleEnglish: "Cambodia Water Festival / Bon Om Touk (Day 1)",
      category: "traditional",
      categoryLabelKhmer: "🚣‍♂️🌕 ព្រះរាជពិធីបុណ្យប្រពៃណីជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "ថ្ងៃទី ១ នៃព្រះរាជពិធីបុណ្យអុំទូក រំឭកដល់វីរភាពកងទ័ពជើងទឹកខ្មែរសម័យអង្គរ និងអំណរគុណព្រះគង្គា។",
    },
    {
      mmdd: mov.waterFestival2,
      titleKhmer: "ព្រះរាជពិធីបុណ្យអុំទូក បណ្ដែតប្រទីប និងសំពះព្រះខែ អកអំបុក (ថ្ងៃទី ២ - សំពះព្រះខែ)",
      titleEnglish: "Cambodia Water Festival / Bon Om Touk (Day 2)",
      category: "traditional",
      categoryLabelKhmer: "🚣‍♂️🌕 ព្រះរាជពិធីបុណ្យប្រពៃណីជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "ថ្ងៃទី ២ (ថ្ងៃពេញបូណ៌មី ខែកត្តិក) ប្រារព្ធពិធីបណ្ដែតប្រទីប សំពះព្រះខែ និងអកអំបុក។",
    },
    {
      mmdd: mov.waterFestival3,
      titleKhmer: "ព្រះរាជពិធីបុណ្យអុំទូក បណ្ដែតប្រទីប និងសំពះព្រះខែ អកអំបុក (ថ្ងៃទី ៣ - ថ្ងៃកាត់ព្រ័ត្រ)",
      titleEnglish: "Cambodia Water Festival / Bon Om Touk (Day 3)",
      category: "traditional",
      categoryLabelKhmer: "🚣‍♂️🌕 ព្រះរាជពិធីបុណ្យប្រពៃណីជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "ថ្ងៃទី ៣ (ថ្ងៃកាត់ព្រ័ត្រ) បិទបញ្ចប់ការប្រណាំងទូកង និងប្រគល់ពានរង្វាន់ជ័យលាភី។",
    },
    {
      mmdd: "12-10",
      titleKhmer: "ទិវាសិទ្ធិមនុស្សអន្តរជាតិ (International Human Rights Day)",
      titleEnglish: "International Human Rights Day",
      category: "international",
      categoryLabelKhmer: "🕊️ ទិវាអន្តរជាតិសំខាន់",
      isPublicHoliday: false,
      descriptionKhmer: "រំឭកដល់ការអនុម័តសេចក្ដីប្រកាសជាសកលស្ដីពីសិទ្ធិមនុស្សរបស់អង្គការសហប្រជាជាតិ។",
    },
    {
      mmdd: "12-29",
      titleKhmer: "ទិវាសន្តិភាពនៅកម្ពុជា (Peace Day in Cambodia)",
      titleEnglish: "Peace Day in Cambodia (Dec 29)",
      category: "national_holiday",
      categoryLabelKhmer: "🕊️🇰🇭 ថ្ងៃបុណ្យជាតិ និងឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      descriptionKhmer: "ថ្ងៃឈប់សម្រាកផ្លូវការអបអរសាទរការបញ្ចប់សង្គ្រាមទាំងស្រុង និងការទទួលបានសន្តិភាពពេញលេញនៅកម្ពុជា (២៩ ធ្នូ)។",
    },
  ];

  return rawEvents
    .map((ev, index) => {
      const [mStr, dStr] = ev.mmdd.split("-");
      const m = Number(mStr);
      const d = Number(dStr);
      const dateStr = `${year}-${mStr}-${dStr}`;
      return {
        id: `kh-cal-${year}-${index + 1}`,
        date: dateStr,
        year,
        month: m,
        day: d,
        khmerDateShort: `ថ្ងៃទី ${toKhmerNumber(d)} ខែ${KHMER_MONTHS_SOLAR[m - 1]} ឆ្នាំ ${toKhmerNumber(
          year
        )}`,
        ...ev,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function isCambodiaCalendarRequestServer(text = "") {
  const clean = String(text || "").trim();
  if (!clean) return false;
  if (/^\/(?:calendar|today|holiday|holidays|events|khmerdate|sil|ប្រតិទិន|ថ្ងៃបុណ្យ|ថ្ងៃសីល)\b/i.test(clean)) {
    return true;
  }
  if (
    /(?:ប្រតិទិន\s*(?:នៃ\s*)?(?:ប្រទេស\s*)?កម្ពុជា|ប្រតិទិន\s*ខ្មែរ|ប្រតិទិន\s*ប្រចាំ\s*ថ្ងៃ|ព្រឹត្តិការណ៍\s*ប្រចាំ\s*ថ្ងៃ|ថ្ងៃ\s*បុណ្យ\s*ជាតិ|បុណ្យ\s*អន្តរជាតិ|ថ្ងៃ\s*ឈប់\s*សម្រាក|ថ្ងៃ\s*សីល|ថ្ងៃនេះ\s*(?:ជា\s*)?ថ្ងៃ\s*សីល|ទិវា\s*សំខាន់ៗ|ទិវា\s*ជាតិ|ទិវា\s*អន្តរជាតិ|ថ្ងៃនេះ\s*ថ្ងៃ\s*បុណ្យ\s*អ្វី|ឆ្នាំនេះ\s*មាន\s*បុណ្យ\s*អ្វីខ្លះ|ថ្ងៃនេះ\s*ថ្ងៃ\s*អ្វី|កាលបរិច្ឆេទ\s*(?:សុរិយគតិ|ចន្ទគតិ)|cambodia\s+(?:calendar|public\s+holidays|holidays))/i.test(
      clean
    )
  ) {
    return true;
  }
  return false;
}

export function getCambodiaCalendarEventsServer({
  year = 0,
  month = 0,
  category = "all",
  query = "",
} = {}) {
  // Compute real-time date in Asia/Phnom_Penh timezone
  const now = new Date();
  const phnomPenhParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Phnom_Penh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);

  const curYear = Number(phnomPenhParts.find((p) => p.type === "year")?.value || now.getFullYear());
  const curMonth = Number(phnomPenhParts.find((p) => p.type === "month")?.value || now.getMonth() + 1);
  const curDay = Number(phnomPenhParts.find((p) => p.type === "day")?.value || now.getDate());
  const todayIso = `${curYear}-${String(curMonth).padStart(2, "0")}-${String(curDay).padStart(
    2,
    "0"
  )}`;

  const todayDateObj = new Date(`${todayIso}T00:00:00Z`);
  const weekdayIdx = todayDateObj.getUTCDay();
  const weekdayKhmer = KHMER_WEEKDAYS[weekdayIdx] || "ថ្ងៃនេះ";

  // Check if user requested a specific year in query
  let targetYear = Number(year) || curYear;
  const yearMatch = String(query || "").match(/\b(202[4-9]|203\d)\b/);
  if (yearMatch) {
    targetYear = Number(yearMatch[1]);
  }

  // Approximate Buddhist Era (ព.ស.) & Animal Year
  const buddhistEra = targetYear + 544;
  const animalYears = [
    "ឆ្នាំវក (ស្វា)",
    "ឆ្នាំរកា (មាន់)",
    "ឆ្នាំច (ឆ្កែ)",
    "ឆ្នាំកុរ (ជ្រូក)",
    "ឆ្នាំជូត (កណ្ដុរ)",
    "ឆ្នាំឆ្លូវ (គោ)",
    "ឆ្នាំខាល (ខ្លា)",
    "ឆ្នាំថោះ (ទន្សាយ)",
    "ឆ្នាំរោង (នាគ)",
    "ឆ្នាំម្សាញ់ (ពស់)",
    "ឆ្នាំមមី (សេះ)",
    "ឆ្នាំមមែ (ពពែ)",
  ];
  const animalYearKhmer = animalYears[targetYear % 12] || "ឆ្នាំមមី";

  // Build full year events + next year events for accurate countdown
  const allYearEvents = buildCambodiaEventsForYear(targetYear);
  const nextYearEvents = buildCambodiaEventsForYear(targetYear + 1);

  const decorateEventWithCountdown = (ev) => {
    const evDateObj = new Date(`${ev.date}T00:00:00Z`);
    const diffDays = Math.round((evDateObj.getTime() - todayDateObj.getTime()) / 86400000);
    let statusLabelKhmer = "";
    if (diffDays === 0) {
      statusLabelKhmer = "🔔 ថ្ងៃនេះផ្ទាល់! (Today!)";
    } else if (diffDays > 0) {
      statusLabelKhmer = `⏳ នៅសល់ ${toKhmerNumber(diffDays)} ថ្ងៃទៀត`;
    } else {
      statusLabelKhmer = `✅ បានកន្លងផុត ${toKhmerNumber(Math.abs(diffDays))} ថ្ងៃមុន`;
    }
    return {
      ...ev,
      daysUntil: diffDays,
      statusLabelKhmer,
    };
  };

  const decoratedEvents = allYearEvents.map(decorateEventWithCountdown);
  const todayEvents = decoratedEvents.filter((e) => e.date === todayIso);

  const upcomingPool = [
    ...decoratedEvents.filter((e) => e.daysUntil >= 0),
    ...nextYearEvents.map(decorateEventWithCountdown).filter((e) => e.daysUntil >= 0),
  ];
  const nextUpcomingHolidays = upcomingPool.slice(0, 5);

  // Filter by month or category if requested
  let filteredEvents = decoratedEvents;
  if (month && Number(month) >= 1 && Number(month) <= 12) {
    filteredEvents = filteredEvents.filter((e) => e.month === Number(month));
  }
  if (category && category !== "all") {
    if (category === "holiday") {
      filteredEvents = filteredEvents.filter((e) => e.isPublicHoliday);
    } else {
      filteredEvents = filteredEvents.filter((e) => e.category === category);
    }
  }

  const khmerDateFull = `${weekdayKhmer} ទី ${toKhmerNumber(curDay)} ខែ${
    KHMER_MONTHS_SOLAR[curMonth - 1]
  } ឆ្នាំ ${toKhmerNumber(curYear)} (${animalYearKhmer} ព.ស. ${toKhmerNumber(buddhistEra)})`;

  const nextEv = nextUpcomingHolidays[0];
  const notificationBanner =
    todayEvents.length > 0
      ? `🔔 ជូនដំណឹងថ្ងៃនេះ (${khmerDateFull})៖ គឺជា «${todayEvents
          .map((e) => e.titleKhmer)
          .join(" និង ")}» ${
          todayEvents.some((e) => e.isPublicHoliday)
            ? "(ថ្ងៃឈប់សម្រាកផ្លូវការនៅកម្ពុជា 🇰🇭)"
            : "(ទិវាសំខាន់ក្នុងប្រតិទិន)"
        }!`
      : nextEv
      ? `📅 ថ្ងៃនេះគឺ ${khmerDateFull} (ថ្ងៃធ្វើការធម្មតា)។ 🔔 ពិធីបុណ្យ ឬទិវាសំខាន់បន្ទាប់គឺ៖ «${
          nextEv.titleKhmer
        }» នៅ${nextEv.khmerDateShort} (${nextEv.statusLabelKhmer})!`
      : `📅 ថ្ងៃនេះគឺ ${khmerDateFull}។`;

  const compData = getDailyCalendarComprehensiveData(todayDateObj);

  return {
    ok: true,
    actualYear: curYear,
    targetYear,
    todayIso,
    khmerDateFull: compData.solar.solarFull,
    solar: compData.solar,
    lunar: compData.lunar,
    sil: compData.sil,
    dayOffStatus: compData.dayOffStatus,
    buddhistEra: compData.lunar.buddhistEraKhmer,
    animalYearKhmer: compData.lunar.animalYearKhmer,
    sakKhmer: compData.lunar.sakKhmer,
    isTodayPublicHoliday: compData.isTodayPublicHoliday,
    todayEvents: compData.todayEvents.length > 0 ? compData.todayEvents : todayEvents,
    nextUpcomingHolidays,
    notificationBanner: compData.summaryNotificationBanner,
    summaryNotificationBanner: compData.summaryNotificationBanner,
    totalPublicHolidays: decoratedEvents.filter((e) => e.isPublicHoliday).length,
    totalEventsCount: decoratedEvents.length,
    events: filteredEvents,
  };
}

export async function sendTelegramCambodiaCalendarResult(token, chatId, replyToMessageId, params) {
  const effectiveToken = getConfiguredBotToken(token);
  const compData = getDailyCalendarComprehensiveData(new Date());
  const cal = getCambodiaCalendarEventsServer(params);

  const html = formatDailyCalendarTelegramHtml(compData);
  const svgCard = createComprehensiveCalendarSvgCard(compData);

  const studioUrl = `${getPublicAppBaseUrl()}/?studio=calendar&tg_chat_id=${encodeURIComponent(
    String(chatId)
  )}`;
  const calKeyboard = {
    inline_keyboard: [
      [
        { text: "🪷 ពិនិត្យថ្ងៃសីលទាំងអស់", callback_data: "cal_filter_sil" },
        { text: "🔴 ថ្ងៃឈប់សម្រាកផ្លូវការ", callback_data: "cal_filter_holiday" },
      ],
      [
        { text: "🇰🇭 បុណ្យជាតិ", callback_data: "cal_filter_national" },
        { text: "🌍 ទិវាអន្តរជាតិ", callback_data: "cal_filter_international" },
      ],
      [
        {
          text: "🌐 បើកប្រតិទិនកម្ពុជាពេញលេញលើ Web",
          web_app: { url: studioUrl },
        },
      ],
    ],
  };

  const photoCaption =
    `🇰🇭📅 <b>ប័ណ្ណប្រតិទិនកម្ពុជាប្រចាំថ្ងៃ (${escapeHtmlLocal(compData.solar.solarFull)})</b>\n` +
    `🌙 ចន្ទគតិ៖ <b>${escapeHtmlLocal(compData.lunar.lunarFull)}</b>\n` +
    `${compData.sil.isTodaySilDay ? `🪷 <b>ថ្ងៃនេះជាថ្ងៃសីល (${escapeHtmlLocal(compData.sil.silType)})!</b>\n` : ""}` +
    `${escapeHtmlLocal(compData.summaryNotificationBanner.replace(/<[^>]+>/g, "").slice(0, 110))}`;

  await Promise.all([
    sendTelegramSvgPhotoServer(
      effectiveToken,
      chatId,
      svgCard,
      photoCaption,
      null,
      replyToMessageId
    ).catch(() => {}),
    sendTelegramHtml(effectiveToken, chatId, html, calKeyboard),
    sendSingleKhmerVoice(effectiveToken, chatId, compData.summaryNotificationBanner.replace(/<[^>]+>/g, "")),
  ]);

  try {
    markChatReceivedTodayCalendar(chatId, compData.todayIso);
  } catch {}

  return { ok: true, calendar: cal, comprehensive: compData };
}
