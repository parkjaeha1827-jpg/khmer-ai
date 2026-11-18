// Multilingual Native Speech Engine
// Ensures 100% authentic native pronunciation for all foreign languages
// (English, French, Chinese, Japanese, Thai, Vietnamese, Korean, Spanish, German, Russian)
// using Google AI Studio and custom Telegram voices for Khmer speech.

export interface SpeechSegment {
  text: string;
  lang: string;
  isKhmer: boolean;
  edgeVoice: string;
  googleLang: string;
  voiceLabel: string;
}

export const SUPPORTED_NATIVE_VOICES: Record<
  string,
  {
    maleEdge: string;
    femaleEdge: string;
    googleLang: string;
    label: string;
    bcp47: string;
  }
> = {
  km: {
    maleEdge: "custom-male-voice",
    femaleEdge: "custom-female-voice",
    googleLang: "km",
    label: "ភាសាខ្មែរ (សំឡេងផ្ទាល់ខ្លួន)",
    bcp47: "km-KH",
  },
  en: {
    maleEdge: "en-US-ChristopherNeural",
    femaleEdge: "en-US-JennyNeural",
    googleLang: "en",
    label: "English (US)",
    bcp47: "en-US",
  },
  fr: {
    maleEdge: "fr-FR-HenriNeural",
    femaleEdge: "fr-FR-DeniseNeural",
    googleLang: "fr",
    label: "Français",
    bcp47: "fr-FR",
  },
  zh: {
    maleEdge: "zh-CN-YunxiNeural",
    femaleEdge: "zh-CN-XiaoxiaoNeural",
    googleLang: "zh-CN",
    label: "中文 (Mandarin)",
    bcp47: "zh-CN",
  },
  ja: {
    maleEdge: "ja-JP-KeitaNeural",
    femaleEdge: "ja-JP-NanamiNeural",
    googleLang: "ja",
    label: "日本語",
    bcp47: "ja-JP",
  },
  th: {
    maleEdge: "th-TH-NiwatNeural",
    femaleEdge: "th-TH-PremwadeeNeural",
    googleLang: "th",
    label: "ภาษาไทย",
    bcp47: "th-TH",
  },
  vi: {
    maleEdge: "vi-VN-NamMinhNeural",
    femaleEdge: "vi-VN-HoaiMyNeural",
    googleLang: "vi",
    label: "Tiếng Việt",
    bcp47: "vi-VN",
  },
  ko: {
    maleEdge: "ko-KR-InJoonNeural",
    femaleEdge: "ko-KR-SunHiNeural",
    googleLang: "ko",
    label: "한국어",
    bcp47: "ko-KR",
  },
  es: {
    maleEdge: "es-ES-AlvaroNeural",
    femaleEdge: "es-ES-ElviraNeural",
    googleLang: "es",
    label: "Español",
    bcp47: "es-ES",
  },
  de: {
    maleEdge: "de-DE-ConradNeural",
    femaleEdge: "de-DE-KatjaNeural",
    googleLang: "de",
    label: "Deutsch",
    bcp47: "de-DE",
  },
  ru: {
    maleEdge: "ru-RU-DmitryNeural",
    femaleEdge: "ru-RU-SvetlanaNeural",
    googleLang: "ru",
    label: "Русский",
    bcp47: "ru-RU",
  },
  hi: {
    maleEdge: "hi-IN-MadhurNeural",
    femaleEdge: "hi-IN-SwaraNeural",
    googleLang: "hi",
    label: "हिन्दी (Hindi - India)",
    bcp47: "hi-IN",
  },
};

/**
 * Detect the dominant language of a given text segment
 */
export function detectSpeechLanguage(rawText: string): string {
  const clean = String(rawText || "").trim();
  if (!clean) return "km";

  // Check language flag or label keywords at the beginning
  if (/^(?:🇨🇳|\bchinese\b|\b中文\b|ភាសាចិន|ចិន|汉语|普通话)/i.test(clean)) return "zh";
  if (/^(?:🇮🇳|\bhindi\b|\bindian\b|ភាសាឥណ្ឌា|ឥណ្ឌា|ហិណ្ឌី|हिन्दी|देवनागरी)/i.test(clean)) return "hi";
  if (/^(?:🇬🇧|🇺🇸|\benglish\b|\bin english\b|ភាសាអង់គ្លេស|អង់គ្លេស)/i.test(clean)) return "en";
  if (/^(?:🇫🇷|\bfrench\b|\bfrançais\b|ភាសាបារាំង|បារាំង)/i.test(clean)) return "fr";
  if (/^(?:🇯🇵|\bjapanese\b|\b日本語\b|ភាសាជប៉ុន|ជប៉ុន)/i.test(clean)) return "ja";
  if (/^(?:🇹🇭|\bthai\b|\bภาษาไทย\b|ភាសាថៃ|ថៃ)/i.test(clean)) return "th";
  if (/^(?:🇻🇳|\bvietnamese\b|\btiếng việt\b|ភាសាវៀតណាម|វៀតណាម)/i.test(clean)) return "vi";
  if (/^(?:🇰🇷|\bkorean\b|\b한국어\b|ភាសាកូរ៉េ|កូរ៉េ)/i.test(clean)) return "ko";
  if (/^(?:🇪🇸|\bspanish\b|\bespañol\b|ភាសាអេស្ប៉ាញ|អេស្ប៉ាញ)/i.test(clean)) return "es";
  if (/^(?:🇩🇪|\bgerman\b|\bdeutsch\b|ភាសាអាល្លឺម៉ង់|អាល្លឺម៉ង់)/i.test(clean)) return "de";
  if (/^(?:🇷🇺|\brussian\b|\bрусский\b|ភាសារុស្ស៊ី|រុស្ស៊ី)/i.test(clean)) return "ru";

  // Check distinctive non-Latin script ranges
  const hasJapaneseKana = /[\u3040-\u309F\u30A0-\u30FF]/.test(clean);
  if (hasJapaneseKana) return "ja";

  const hasKoreanHangul = /[\uAC00-\uD7AF\u1100-\u11FF]/.test(clean);
  if (hasKoreanHangul) return "ko";

  const hasHindi = /[\u0900-\u097F]/.test(clean);
  if (hasHindi) return "hi";

  const hasThai = /[\u0E00-\u0E7F]/.test(clean);
  if (hasThai) return "th";

  const hasCyrillic = /[\u0400-\u04FF]/.test(clean);
  if (hasCyrillic) return "ru";

  const hasChineseHanzi = /[\u4E00-\u9FFF]/.test(clean);
  if (hasChineseHanzi) return "zh";

  // Vietnamese diacritics check
  if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(clean)) {
    return "vi";
  }

  // Count Latin vs Khmer characters
  const latinMatches = clean.match(/[a-zA-Z\u00C0-\u024F]/g);
  const khmerMatches = clean.match(/[\u1780-\u17FF\u19E0-\u19FF]/g);
  const latinCount = latinMatches ? latinMatches.length : 0;
  const khmerCount = khmerMatches ? khmerMatches.length : 0;

  // Predominantly Latin text: classify into European / Asian Latin languages
  if (latinCount > 0 && (latinCount >= khmerCount || !khmerMatches)) {
    if (
      /\b(?:bonjour|merci|salut|comment|allez-vous|ça\s*va|s'il\s*vous\s*pla[îi]t|oui|non|je\s*suis|mon\s*ami|bonne\s*nuit|au\s*revoir|français)\b/i.test(
        clean
      ) ||
      (/[àâæçéèêëîïôœùûüÿ]/i.test(clean) && !/[ñ¿¡áíóú]/i.test(clean))
    ) {
      return "fr";
    }

    if (
      /\b(?:hola|gracias|por\s*favor|cómo\s*estás|amigo|buenos\s*días|buenas\s*noches|adiós|español)\b/i.test(
        clean
      ) ||
      /[ñ¿¡]/i.test(clean)
    ) {
      return "es";
    }

    if (
      /\b(?:guten\s*tag|danke|bitte|auf\s*wiedersehen|deutsch|wie\s*geht's)\b/i.test(clean) ||
      /[äöüß]/i.test(clean)
    ) {
      return "de";
    }

    return "en";
  }

  return "km";
}

export function cleanSpeechTextForKhmerTts(rawText: string): string {
  let s = String(rawText || "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/```[\s\S]*?```/g, " ")
    // 1. Strip markdown headers (# ... or ### ...) containing emotion/scolding/warning words
    .replace(/(?:^|\n)\s*#+\s*.*?(?:ការខឹង|ស្ដីបន្ទោស|អន់ចិត្ត|តូចចិត្ត|ឌឺដង|ម៉ួម៉ៅ|កំហឹង|មនោសញ្ចេតនា|អារម្មណ៍|ខឹង|ក្ដៅចិត្ត|លួងលោម|សប្បាយ|ផ្អែមល្ហែម|ហត់នឿយ|ព្រមាន|ការទប់ស្កាត់)[^\n]*/gi, "")
    // 2. Strip ANY bold header/title (**...**) containing scolding/emotion/warning words
    .replace(/(?:\*\*|__)[^*_\n]*(?:ការខឹង|ស្ដីបន្ទោស|អន់ចិត្ត|តូចចិត្ត|ឌឺដង|ម៉ួម៉ៅ|កំហឹង|មនោសញ្ចេតនា|អារម្មណ៍|ខឹង|ក្ដៅចិត្ត|លួងលោម|សប្បាយ|ផ្អែមល្ហែម|ហត់នឿយ|ព្រមាន|ការទប់ស្កាត់)[^*_\n]*(?:\*\*|__)\s*[:៖\-]?\s*/gmiu, "")
    // 3. Strip bracket tags like [ការខឹង និងស្ដីបន្ទោស...]
    .replace(/\[\s*.*?(?:ខឹង|ស្ដីបន្ទោស|អន់ចិត្ត|តូចចិត្ត|ឌឺដង|ម៉ួម៉ៅ|កំហឹង|អារម្មណ៍|តួនាទី|ស្ថានភាព|ព្រមាន)[^\]]*\]/gi, " ")
    // 4. Strip leftover bullets and markdown symbols
    .replace(/^[•\-\*]\s+/gm, " ")
    .replace(/[#*_~`>|•]/g, " ")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, " ")
    .replace(/\r/g, "")
    .trim();
  return s;
}

/**
 * Clean text to prepare for speech synthesis
 */
export function cleanTextForSpeech(raw: string, lang = "km"): string {
  const ttsPreCleaned = cleanSpeechTextForKhmerTts(raw);
  let s = String(ttsPreCleaned || "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 លើ $2")
    .replace(/\\sqrt\{([^}]+)\}/g, "ឫសការេនៃ $1")
    .replace(/\\vec\{([^}]+)\}/g, "វ៉ិចទ័រ $1")
    .replace(/\\times/g, " គុណនឹង ")
    .replace(/\\div/g, " ចែកនឹង ")
    .replace(/\\pm/g, " បូកឬដក ")
    .replace(/\\approx/g, " ប្រហែល ")
    .replace(/\\Delta/g, " ដេលតា ")
    .replace(/\\alpha/g, " អាល់ហ្វា ")
    .replace(/\\beta/g, " បេតា ")
    .replace(/\\theta/g, " តេតា ")
    .replace(/\\pi/g, " ផាយ ")
    .replace(/\\cdot/g, " គុណ ")
    .replace(/\$\$([\s\S]*?)\$\$/g, " $1 ")
    .replace(/\$([^\$]+)\$/g, " $1 ")
    .replace(/[#*_~`>|•]/g, " ")
    .replace(/\r/g, "")
    .trim();

  if (lang === "zh" || lang === "zh-CN") {
    // Strip romanized pinyin in parentheses for Chinese speech e.g. 你好 (Nǐ hǎo) -> 你好
    if (/[\u4E00-\u9FFF]/.test(s)) {
      s = s.replace(/\s*[(（][a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s\d,'.!?-]+[)）]/g, "");
      s = s.replace(/\s*\[[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s\d,'.!?-]+\]/g, "");
      s = s.replace(/\s*[(（][\u1780-\u17FF\s]+[)）]/g, "");
    }
  } else if (lang === "ja") {
    if (/[\u3040-\u30FF\u4E00-\u9FFF]/.test(s)) {
      s = s.replace(/\s*[(（][a-zA-Z\s\d,'.!?-]+[)）]/g, "");
      s = s.replace(/\s*[(（][\u1780-\u17FF\s]+[)）]/g, "");
    }
  } else if (lang === "ko") {
    if (/[\uAC00-\uD7AF]/.test(s)) {
      s = s.replace(/\s*[(（][a-zA-Z\s\d,'.!?-]+[)）]/g, "");
      s = s.replace(/\s*[(（][\u1780-\u17FF\s]+[)）]/g, "");
    }
  } else if (lang === "hi") {
    if (/[\u0900-\u097F]/.test(s)) {
      s = s.replace(/\s*[(（][a-zA-Z\s\d,'.!?-]+[)）]/g, "");
      s = s.replace(/\s*[(（][\u1780-\u17FF\s]+[)）]/g, "");
    }
  } else if (lang === "en" || lang === "fr" || lang === "es" || lang === "de") {
    s = s.replace(/\s*[(（][\u1780-\u17FF\s]+[)）]/g, "");
  }
  return s.replace(/^[«"“'(\[]+|[»"”')\]]+$/g, "").trim();
}

function parseHeaderForeignLine(line: string): { lang: string; content: string } | null {
  const match = line.match(
    /^(?:(🇨🇳|ភាសាចិន\s*[:៖-]|ចិន\s*[:៖-]|Chinese\s*[:៖-]|中文\s*[:៖-])|(🇮🇳|Hindi\s*[:៖-]|ភាសាឥណ្ឌា\s*[:៖-]|ឥណ្ឌា\s*[:៖-]|ហិណ្ឌី\s*[:៖-]|हिन्दी\s*[:៖-])|(🇬🇧|🇺🇸|English(?:\s*(?:Summary|Translation|Explanation|Song\s*Note))?\s*[:៖-]|In English\s*[:៖-]|ភាសាអង់គ្លេស\s*[:៖-]|អង់គ្លេស\s*[:៖-])|(🇫🇷|French\s*[:៖-]|Français\s*[:៖-]|ភាសាបារាំង\s*[:៖-]|បារាំង\s*[:៖-])|(🇯🇵|Japanese\s*[:៖-]|日本語\s*[:៖-]|ភាសាជប៉ុន\s*[:៖-]|ជប៉ុន\s*[:៖-])|(🇰🇷|Korean\s*[:៖-]|한국어\s*[:៖-]|ភាសាកូរ៉េ\s*[:៖-]|កូរ៉េ\s*[:៖-])|(🇹🇭|Thai\s*[:៖-]|ภาษาไทย\s*[:៖-]|ភាសាថៃ\s*[:៖-]|ថៃ\s*[:៖-])|(🇻🇳|Vietnamese\s*[:៖-]|Tiếng Việt\s*[:៖-]|ភាសាវៀតណាម\s*[:៖-]|វៀតណាម\s*[:៖-])|(🇪🇸|Spanish\s*[:៖-]|Español\s*[:៖-]|ភាសាអេស្ប៉ាញ\s*[:៖-]|អេស្ប៉ាញ\s*[:៖-])|(🇩🇪|German\s*[:៖-]|Deutsch\s*[:៖-]|ភាសាអាល្លឺម៉ង់\s*[:៖-]|អាល្លឺម៉ង់\s*[:៖-])|(🇷🇺|Russian\s*[:៖-]|Русский\s*[:៖-]|ភាសារុស្ស៊ី\s*[:៖-]|រុស្ស៊ី\s*[:៖-]))\s*([\s\S]+)$/i
  );
  if (!match) return null;
  let lang = "en";
  if (match[1]) lang = "zh";
  else if (match[2]) lang = "hi";
  else if (match[3]) lang = "en";
  else if (match[4]) lang = "fr";
  else if (match[5]) lang = "ja";
  else if (match[6]) lang = "ko";
  else if (match[7]) lang = "th";
  else if (match[8]) lang = "vi";
  else if (match[9]) lang = "es";
  else if (match[10]) lang = "de";
  else if (match[11]) lang = "ru";
  const content = (match[12] || "").trim();
  return { lang, content };
}

/**
 * Segment input text into language chunks so each segment is synthesized
 * with its native voice and accurate pronunciation.
 */
export function segmentTextByLanguage(
  rawText: string,
  isMaleVoice = false
): SpeechSegment[] {
  const clean = cleanTextForSpeech(rawText);
  if (!clean) return [];

  const confKm = SUPPORTED_NATIVE_VOICES.km;

  // If text contains NO Khmer characters at all, treat as 100% native foreign language
  if (!/[\u1780-\u17FF\u19E0-\u19FF]/.test(clean)) {
    const lang = detectSpeechLanguage(clean);
    const conf = SUPPORTED_NATIVE_VOICES[lang] || SUPPORTED_NATIVE_VOICES.en;
    const cleanedText = cleanTextForSpeech(clean, lang);
    return [
      {
        text: cleanedText.slice(0, 500),
        lang,
        isKhmer: false,
        edgeVoice: isMaleVoice ? conf.maleEdge : conf.femaleEdge,
        googleLang: conf.googleLang,
        voiceLabel: conf.label,
      },
    ];
  }

  const lines = clean.split(/\n+/);
  const rawSegments: SpeechSegment[] = [];

  for (const line of lines) {
    let trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check explicit foreign language line headers
    const headerMatch = parseHeaderForeignLine(trimmedLine);
    if (headerMatch) {
      if (!/[\u1780-\u17FF\u19E0-\u19FF]/.test(headerMatch.content)) {
        const confForeign = SUPPORTED_NATIVE_VOICES[headerMatch.lang] || SUPPORTED_NATIVE_VOICES.en;
        const cleanedForeign = cleanTextForSpeech(headerMatch.content, headerMatch.lang);
        if (cleanedForeign) {
          rawSegments.push({
            text: cleanedForeign.slice(0, 320),
            lang: headerMatch.lang,
            isKhmer: false,
            edgeVoice: isMaleVoice ? confForeign.maleEdge : confForeign.femaleEdge,
            googleLang: confForeign.googleLang,
            voiceLabel: confForeign.label,
          });
          continue;
        }
      }
    }

    const hasKhmer = /[\u1780-\u17FF\u19E0-\u19FF]/.test(trimmedLine);
    if (!hasKhmer) {
      const fLang = detectSpeechLanguage(trimmedLine);
      const confForeign = SUPPORTED_NATIVE_VOICES[fLang] || SUPPORTED_NATIVE_VOICES.en;
      const cleaned = cleanTextForSpeech(trimmedLine, fLang);
      if (cleaned) {
        rawSegments.push({
          text: cleaned.slice(0, 320),
          lang: fLang,
          isKhmer: false,
          edgeVoice: isMaleVoice ? confForeign.maleEdge : confForeign.femaleEdge,
          googleLang: confForeign.googleLang,
          voiceLabel: confForeign.label,
        });
      }
      continue;
    }

    // Pre-clean inline phonetic annotations for mixed lines (e.g. 你好 (Nǐ hǎo) -> 你好, नमस्ते (Namaste) -> नमस्ते)
    trimmedLine = trimmedLine
      .replace(/([\u4E00-\u9FFF])\s*[(（][a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s\d,'.!?-]+[)）]/g, "$1")
      .replace(/([\u3040-\u30FF])\s*[(（][a-zA-Z\s\d,'.!?-]+[)）]/g, "$1")
      .replace(/([\uAC00-\uD7AF])\s*[(（][a-zA-Z\s\d,'.!?-]+[)）]/g, "$1")
      .replace(/([\u0900-\u097F])\s*[(（][a-zA-Z\s\d,'.!?-]+[)）]/g, "$1")
      .replace(/([a-zA-Z])\s*[(（][\u1780-\u17FF\s]+[)）]/g, "$1");

    // Mixed line: split by foreign tokens (Chinese Hanzi, Japanese, Korean, Hindi, Thai, Russian, or Latin)
    const tokenRegex =
      /([\u4E00-\u9FFF]+(?:[\s，。！？、：；“”‘’]*[\u4E00-\u9FFF]+)*|[\u3040-\u30FF]+|[\uAC00-\uD7AF]+|[\u0900-\u097F]+|[\u0E00-\u0E7F]+|[\u0400-\u04FF]+|[«"“][a-zA-Z\u00C0-\u024F\s,!?.:;'’$-]{1,120}[»"”]|[a-zA-Z\u00C0-\u024F]+(?:['’][a-zA-Z]+)?(?:[,!?.:;\-']+)?(?:\s+[a-zA-Z\u00C0-\u024F0-9,!?.:;'’$-]+)*)/g;

    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(trimmedLine)) !== null) {
      if (match.index > lastIdx) {
        const kmChunk = trimmedLine.slice(lastIdx, match.index).replace(/^[«"“'(\[]+|[»"”')\]]+$/g, "").trim();
        if (kmChunk && !/^[.,;:!?\-—_()[\]{}«»"”'’\s]+$/.test(kmChunk)) {
          rawSegments.push({
            text: kmChunk,
            lang: "km",
            isKhmer: true,
            edgeVoice: isMaleVoice ? confKm.maleEdge : confKm.femaleEdge,
            googleLang: "km",
            voiceLabel: confKm.label,
          });
        }
      }
      const foreignChunk = match[1].trim();
      const foreignLang = detectSpeechLanguage(foreignChunk);
      const confForeign = SUPPORTED_NATIVE_VOICES[foreignLang] || SUPPORTED_NATIVE_VOICES.en;
      const cleanedForeign = cleanTextForSpeech(foreignChunk, foreignLang);
      if (cleanedForeign) {
        rawSegments.push({
          text: cleanedForeign,
          lang: foreignLang,
          isKhmer: false,
          edgeVoice: isMaleVoice ? confForeign.maleEdge : confForeign.femaleEdge,
          googleLang: confForeign.googleLang,
          voiceLabel: confForeign.label,
        });
      }
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < trimmedLine.length) {
      const kmRemaining = trimmedLine.slice(lastIdx).replace(/^[«"“'(\[]+|[»"”')\]]+$/g, "").trim();
      if (kmRemaining && !/^[.,;:!?\-—_()[\]{}«»"”'’\s]+$/.test(kmRemaining)) {
        rawSegments.push({
          text: kmRemaining,
          lang: "km",
          isKhmer: true,
          edgeVoice: isMaleVoice ? confKm.maleEdge : confKm.femaleEdge,
          googleLang: "km",
          voiceLabel: confKm.label,
        });
      }
    }
  }

  // Merge contiguous segments of the same language
  const merged: SpeechSegment[] = [];
  for (const seg of rawSegments) {
    const cleanText = seg.text.trim();
    if (!cleanText) continue;
    if (merged.length > 0 && merged[merged.length - 1].lang === seg.lang) {
      merged[merged.length - 1].text += " " + cleanText;
    } else {
      merged.push({ ...seg, text: cleanText });
    }
  }

  return merged.length > 0
    ? merged.slice(0, 10)
    : [
        {
          text: clean.slice(0, 400),
          lang: "km",
          isKhmer: true,
          edgeVoice: isMaleVoice
            ? SUPPORTED_NATIVE_VOICES.km.maleEdge
            : SUPPORTED_NATIVE_VOICES.km.femaleEdge,
          googleLang: "km",
          voiceLabel: SUPPORTED_NATIVE_VOICES.km.label,
        },
      ];
}
