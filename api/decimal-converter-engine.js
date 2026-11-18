// ============================================================================
// 24/7 SERVERLESS DECIMAL NUMBER & WORDS CONVERTER ENGINE FOR TELEGRAM & API
// Handles:
// 1. Base-10 Decimal Numbers -> Spelled-out Khmer & English Words
// 2. Spelled-out Khmer & English Words -> Base-10 Decimal Numbers
// 3. Text Characters -> Base-10 Decimal ASCII/Unicode Codes
// 4. Base-10 Decimal Codes -> Text Characters
// ============================================================================

const KHMER_DIGITS_LIST = ["សូន្យ", "មួយ", "ពីរ", "បី", "បួន", "ប្រាំ", "ប្រាំមួយ", "ប្រាំពីរ", "ប្រាំបី", "ប្រាំបួន"];
const KHMER_TENS_LIST = ["", "ដប់", "ម្ភៃ", "សាមសិប", "សែសិប", "ហាសិប", "ហុកសិប", "ចិតសិប", "ប៉ែតសិប", "កៅសិប"];
const ARABIC_TO_KHMER_DIGIT_MAP = {
  "0": "០", "1": "១", "2": "២", "3": "៣", "4": "៤",
  "5": "៥", "6": "៦", "7": "៧", "8": "៨", "9": "៩",
};
const KHMER_TO_ARABIC_DIGIT_MAP = {
  "០": "0", "១": "1", "២": "2", "៣": "3", "៤": "4",
  "៥": "5", "៦": "6", "៧": "7", "៨": "8", "៩": "9",
};

export function toKhmerDigits(str) {
  return String(str || "").replace(/[0-9]/g, (d) => ARABIC_TO_KHMER_DIGIT_MAP[d] || d);
}

export function toArabicDigits(str) {
  return String(str || "").replace(/[០-៩]/g, (d) => KHMER_TO_ARABIC_DIGIT_MAP[d] || d);
}

/**
 * Convert Base-10 Decimal Number to Spelled-out Khmer Words
 */
export function decimalToKhmerWords(val) {
  const cleanStr = toArabicDigits(String(val ?? "")).trim().replace(/,/g, "");
  if (!cleanStr || !/^-?\d+(\.\d+)?$/.test(cleanStr)) {
    return "";
  }

  const isNegative = cleanStr.startsWith("-");
  const absStr = isNegative ? cleanStr.slice(1) : cleanStr;
  const [intPart, decPart] = absStr.split(".");

  function convertUnderThousand(num) {
    if (num === 0) return "";
    let res = "";
    const h = Math.floor(num / 100);
    const rem = num % 100;
    if (h > 0) {
      res += KHMER_DIGITS_LIST[h] + "រយ";
    }
    if (rem > 0) {
      if (rem < 10) {
        res += KHMER_DIGITS_LIST[rem];
      } else if (rem === 10) {
        res += "ដប់";
      } else if (rem < 20) {
        res += "ដប់" + (rem % 10 > 0 ? KHMER_DIGITS_LIST[rem % 10] : "");
      } else {
        const t = Math.floor(rem / 10);
        const u = rem % 10;
        res += KHMER_TENS_LIST[t] + (u > 0 ? KHMER_DIGITS_LIST[u] : "");
      }
    }
    return res;
  }

  function convertBigIntInteger(bigStr) {
    let big = BigInt(bigStr);
    if (big === 0n) return "សូន្យ";

    const scales = [
      { name: "កោដិ", val: 10000000n },
      { name: "លាន", val: 1000000n },
      { name: "សែន", val: 100000n },
      { name: "ម៉ឺន", val: 10000n },
      { name: "ពាន់", val: 1000n },
      { name: "រយ", val: 100n },
    ];

    let out = "";
    for (const sc of scales) {
      if (big >= sc.val) {
        const q = big / sc.val;
        big = big % sc.val;
        const qWord = q < 1000n ? convertUnderThousand(Number(q)) : convertBigIntInteger(q.toString());
        out += qWord + sc.name;
      }
    }
    if (big > 0n) {
      out += convertUnderThousand(Number(big));
    }
    return out;
  }

  let words = (isNegative ? "ដក " : "") + convertBigIntInteger(intPart);
  if (decPart && decPart.length > 0) {
    words += " ក្បៀស " + decPart.split("").map((d) => KHMER_DIGITS_LIST[parseInt(d, 10)]).join("");
  }

  return words;
}

/**
 * Convert Base-10 Decimal Number to Spelled-out English Words
 */
export function decimalToEnglishWords(val) {
  const cleanStr = toArabicDigits(String(val ?? "")).trim().replace(/,/g, "");
  if (!cleanStr || !/^-?\d+(\.\d+)?$/.test(cleanStr)) {
    return "";
  }

  const isNegative = cleanStr.startsWith("-");
  const absStr = isNegative ? cleanStr.slice(1) : cleanStr;
  const [intPart, decPart] = absStr.split(".");

  const ones = [
    "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen",
  ];
  const tens = [
    "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
  ];

  function convertTriplet(n) {
    let s = "";
    if (n >= 100) {
      s += ones[Math.floor(n / 100)] + " hundred ";
      n %= 100;
    }
    if (n >= 20) {
      s += tens[Math.floor(n / 10)] + (n % 10 > 0 ? "-" + ones[n % 10] : "") + " ";
    } else if (n > 0) {
      s += ones[n] + " ";
    }
    return s.trim();
  }

  function convertBigIntEnglish(bigStr) {
    let big = BigInt(bigStr);
    if (big === 0n) return "zero";

    const scales = [
      { name: "trillion", val: 1000000000000n },
      { name: "billion", val: 1000000000n },
      { name: "million", val: 1000000n },
      { name: "thousand", val: 1000n },
    ];

    const parts = [];
    for (const sc of scales) {
      if (big >= sc.val) {
        const q = big / sc.val;
        big = big % sc.val;
        const qWord = q < 1000n ? convertTriplet(Number(q)) : convertBigIntEnglish(q.toString());
        parts.push(qWord + " " + sc.name);
      }
    }
    if (big > 0n) {
      parts.push(convertTriplet(Number(big)));
    }
    return parts.join(" ").trim();
  }

  let words = (isNegative ? "negative " : "") + convertBigIntEnglish(intPart);
  if (decPart && decPart.length > 0) {
    const decWords = decPart
      .split("")
      .map((d) => (d === "0" ? "zero" : ones[parseInt(d, 10)]))
      .join(" ");
    words += " point " + decWords;
  }

  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "";
}

/**
 * Convert Spelled-out Khmer Words to Base-10 Decimal Number
 */
export function khmerWordsToDecimal(text) {
  let s = String(text || "").trim();
  if (!s) return { decimal: 0, formatted: "0", isValid: false };

  let isNegative = false;
  if (/^ដក\s*/.test(s)) {
    isNegative = true;
    s = s.replace(/^ដក\s*/, "");
  }

  const arabicStr = toArabicDigits(s).replace(/[,\s]/g, "");
  if (/^-?\d+(\.\d+)?$/.test(arabicStr)) {
    const num = isNegative ? -Number(arabicStr) : Number(arabicStr);
    return { decimal: num, formatted: num.toLocaleString(), isValid: true };
  }

  const [intPart, decPart] = s.split(/(?:ក្បៀស|ចុច)/);

  const digitMap = {
    "សូន្យ": 0, "មួយ": 1, "ពីរ": 2, "បី": 3, "បួន": 4,
    "ប្រាំ": 5, "ប្រាំមួយ": 6, "ប្រាំពីរ": 7, "ប្រាំបី": 8, "ប្រាំបួន": 9,
  };
  const tensMap = {
    "ដប់": 10, "ម្ភៃ": 20, "សាមសិប": 30, "សែសិប": 40,
    "ហាសិប": 50, "ហុកសិប": 60, "ចិតសិប": 70, "ប៉ែតសិប": 80, "កៅសិប": 90,
  };
  const scaleUnits = [
    { name: "កោដិ", val: 10000000 },
    { name: "លាន", val: 1000000 },
    { name: "សែន", val: 100000 },
    { name: "ម៉ឺន", val: 10000 },
    { name: "ពាន់", val: 1000 },
    { name: "រយ", val: 100 },
  ];

  function parseUnder100(chunk) {
    chunk = chunk.trim();
    if (!chunk) return 0;
    if (digitMap[chunk] !== undefined) return digitMap[chunk];
    if (tensMap[chunk] !== undefined) return tensMap[chunk];

    for (const [tWord, tVal] of Object.entries(tensMap)) {
      if (chunk.startsWith(tWord)) {
        const rem = chunk.slice(tWord.length).trim();
        if (!rem) return tVal;
        if (digitMap[rem] !== undefined) return tVal + digitMap[rem];
      }
    }
    return 0;
  }

  function parseChunk(chunk) {
    chunk = chunk.trim();
    if (!chunk) return 0;

    for (const sc of scaleUnits) {
      const idx = chunk.indexOf(sc.name);
      if (idx !== -1) {
        const left = chunk.slice(0, idx).trim();
        const right = chunk.slice(idx + sc.name.length).trim();
        const leftVal = left ? parseChunk(left) : 1;
        return leftVal * sc.val + parseChunk(right);
      }
    }
    return parseUnder100(chunk);
  }

  const intVal = parseChunk(intPart || "");
  let finalVal = intVal;

  if (decPart) {
    let rem = decPart.trim();
    let decDigits = "";
    while (rem.length > 0) {
      let matched = false;
      for (const [w, v] of Object.entries(digitMap)) {
        if (rem.startsWith(w)) {
          decDigits += String(v);
          rem = rem.slice(w.length).trim();
          matched = true;
          break;
        }
      }
      if (!matched) {
        const sub = parseUnder100(rem);
        if (sub > 0) decDigits += String(sub);
        break;
      }
    }
    if (decDigits) {
      finalVal = Number(String(intVal) + "." + decDigits);
    }
  }

  const result = isNegative ? -finalVal : finalVal;
  return {
    decimal: result,
    formatted: result.toLocaleString(),
    isValid: !isNaN(result),
  };
}

/**
 * Convert Spelled-out English Words to Base-10 Decimal Number
 */
export function englishWordsToDecimal(text) {
  let s = String(text || "").toLowerCase().trim();
  if (!s) return { decimal: 0, isValid: false };

  let isNegative = false;
  if (/^(?:negative|minus)\s+/.test(s)) {
    isNegative = true;
    s = s.replace(/^(?:negative|minus)\s+/, "");
  }

  const wordsMap = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
    seventeen: 17, eighteen: 18, nineteen: 19,
    twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  };
  const scales = {
    hundred: 100,
    thousand: 1000,
    million: 1000000,
    billion: 1000000000,
    trillion: 1000000000000,
  };

  const [intStr, decStr] = s.split(/\s+(?:point|dot)\s+/);
  const tokens = intStr.replace(/-/g, " ").replace(/\band\b/g, "").split(/\s+/).filter(Boolean);

  let current = 0;
  let total = 0;

  for (const tok of tokens) {
    if (wordsMap[tok] !== undefined) {
      current += wordsMap[tok];
    } else if (scales[tok] !== undefined) {
      if (tok === "hundred") {
        current = (current || 1) * 100;
      } else {
        total += (current || 1) * scales[tok];
        current = 0;
      }
    }
  }
  total += current;

  if (decStr) {
    const decTokens = decStr.split(/\s+/).filter(Boolean);
    let decDigits = "";
    for (const dt of decTokens) {
      if (wordsMap[dt] !== undefined) {
        decDigits += String(wordsMap[dt]);
      }
    }
    if (decDigits) {
      total = Number(String(total) + "." + decDigits);
    }
  }

  return {
    decimal: isNegative ? -total : total,
    isValid: !isNaN(total),
  };
}

/**
 * Convert Text Characters to Base-10 Decimal Unicode/ASCII Codes
 */
export function textToDecimalCodes(text, separator = " ") {
  return Array.from(String(text || ""))
    .map((c) => c.codePointAt(0) || 0)
    .join(separator);
}

/**
 * Convert Base-10 Decimal Unicode/ASCII Codes back to Text Characters
 */
export function decimalCodesToText(decStr) {
  const parts = String(decStr || "").trim().split(/[\s,;]+/);
  return parts
    .map((p) => {
      const code = parseInt(p, 10);
      if (isNaN(code) || code <= 0) return "";
      try {
        return String.fromCodePoint(code);
      } catch {
        return "";
      }
    })
    .join("");
}

/**
 * Comprehensive Multi-Directional Conversion Result
 */
export function comprehensiveDecimalConversion(input) {
  const raw = String(input || "").trim();

  let inputType = "mixed";
  let decNum = 0;
  let decStr = "0";

  // Case 1: Sequence of decimal character code points (e.g. "72 101 108 108 111" or "6047 6077 6047")
  if (/^\d{1,6}(?:[\s,;]+\d{1,6})+$/.test(raw)) {
    inputType = "decimal_codes_to_text";
    const text = decimalCodesToText(raw);
    const codes = raw.split(/[\s,;]+/);
    const breakdown = codes
      .slice(0, 10)
      .map((code) => {
        const cp = parseInt(code, 10);
        let ch = "";
        try { ch = String.fromCodePoint(cp); } catch {}
        return `• គោលដប់: <b>${code}</b> ➔ «<b>${ch}</b>» (Hex: <code>0x${cp.toString(16).toUpperCase()}</code>)`;
      })
      .join("\n");

    return {
      inputType,
      originalInput: raw,
      decimalValue: raw,
      khmerDigits: toKhmerDigits(raw),
      arabicDigits: raw,
      khmerWords: text,
      englishWords: text,
      khmerCurrencyRiel: "",
      khmerCurrencyDollar: "",
      decimalCodes: raw,
      hexCodes: codes
        .map((n) => "0x" + parseInt(n, 10).toString(16).toUpperCase())
        .join(" "),
      binaryCodes: codes
        .map((n) => parseInt(n, 10).toString(2))
        .join(" "),
      reconstructedText: text,
      explanationHtml:
        `🔢 <b>បម្លែងពីលេខកូដប្រព័ន្ធគោលដប់ (Base-10) ➔ អក្សរ (Text)៖</b>\n` +
        `• លេខកូដគោលដប់៖ <code>${raw}</code>\n` +
        `• អក្សរដែលទទួលបាន៖ <b>«${text}»</b>\n\n` +
        `<b>តារាងបំប្លែងកូដនីមួយៗ៖</b>\n${breakdown}` +
        (codes.length > 10 ? `\n... និង ${codes.length - 10} តួអក្សរទៀត` : "") +
        `\n\n🇬🇧 English: Decoded decimal code points "${raw}" into text "${text}".`,
      voiceScript: `លេខកូដប្រព័ន្ធគោលដប់ ${raw} បម្លែងមកជាអក្សរគឺ៖ ${text}។`,
    };
  }

  const arabicStr = toArabicDigits(raw).replace(/[,\s]/g, "");

  // Case 2: Pure number (e.g. 125, 2026, 12.75)
  if (/^-?\d+(\.\d+)?$/.test(arabicStr)) {
    inputType = "number_to_words";
    decNum = Number(arabicStr);
    decStr = arabicStr;
  }
  // Case 3: Spelled-out Khmer words
  else if (/(?:សូន្យ|មួយ|ពីរ|បី|បួន|ប្រាំ|ដប់|ម្ភៃ|សាមសិប|សែសិប|ហាសិប|ហុកសិប|ចិតសិប|ប៉ែតសិប|កៅសិប|រយ|ពាន់|ម៉ឺន|សែន|លាន|កោដិ)/.test(raw)) {
    const parsed = khmerWordsToDecimal(raw);
    if (parsed.isValid && parsed.decimal !== 0) {
      inputType = "words_to_number";
      decNum = parsed.decimal;
      decStr = String(parsed.decimal);
    }
  }
  // Case 4: Spelled-out English words
  else if (/(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|hundred|thousand|million|billion)/i.test(raw)) {
    const parsedEng = englishWordsToDecimal(raw);
    if (parsedEng.isValid && parsedEng.decimal !== 0) {
      inputType = "words_to_number";
      decNum = parsedEng.decimal;
      decStr = String(parsedEng.decimal);
    }
  }

  // If number <-> words conversion
  if (inputType === "number_to_words" || inputType === "words_to_number") {
    const kmWords = decimalToKhmerWords(decStr);
    const enWords = decimalToEnglishWords(decStr);
    const kmDigits = toKhmerDigits(decStr);
    const intDec = Math.floor(Math.abs(decNum));

    return {
      inputType,
      originalInput: raw,
      decimalValue: decStr,
      khmerDigits: kmDigits,
      arabicDigits: decStr,
      khmerWords: kmWords,
      englishWords: enWords,
      khmerCurrencyRiel: kmWords + "រៀល",
      khmerCurrencyDollar: kmWords + "ដុល្លារ",
      decimalCodes: textToDecimalCodes(decStr),
      hexCodes: "0x" + intDec.toString(16).toUpperCase(),
      binaryCodes: intDec.toString(2),
      reconstructedText: kmWords,
      explanationHtml:
        `🔢 <b>ប្រព័ន្ធគោលដប់ (Base-10 Decimal):</b> <code>${decStr}</code> (${kmDigits})\n` +
        `🇰🇭 <b>អក្សរខ្មែរ (Khmer Words):</b> «${kmWords}»\n` +
        `🇬🇧 <b>អក្សរអង់គ្លេស (English Words):</b> "${enWords}"\n` +
        `💵 <b>ជាប្រាក់រៀល:</b> ${kmWords}រៀល\n` +
        `🪙 <b>កូដគោលពីរ (Binary):</b> <code>${intDec.toString(2)}</code> | <b>Hex:</b> <code>0x${intDec.toString(16).toUpperCase()}</code>`,
      voiceScript: `លេខក្នុងប្រព័ន្ធគោលដប់ ${kmDigits} អានជាអក្សរគឺ៖ ${kmWords}។ English: ${enWords}។`,
    };
  }

  // Case 5: Text to Base-10 Decimal Codes
  inputType = "text_to_decimal_codes";
  const decCodes = textToDecimalCodes(raw);
  const chars = Array.from(raw);
  const breakdown = chars
    .slice(0, 10)
    .map((c) => `• «${c}» ➔ គោលដប់: <b>${c.codePointAt(0)}</b> (Hex: <code>0x${(c.codePointAt(0) || 0).toString(16).toUpperCase()}</code>)`)
    .join("\n");

  return {
    inputType,
    originalInput: raw,
    decimalValue: decCodes,
    khmerDigits: toKhmerDigits(decCodes),
    arabicDigits: decCodes,
    khmerWords: raw,
    englishWords: raw,
    khmerCurrencyRiel: "",
    khmerCurrencyDollar: "",
    decimalCodes: decCodes,
    hexCodes: chars.map((c) => "0x" + (c.codePointAt(0) || 0).toString(16).toUpperCase()).join(" "),
    binaryCodes: chars.map((c) => (c.codePointAt(0) || 0).toString(2)).join(" "),
    reconstructedText: raw,
    explanationHtml:
      `🔤 <b>អក្សរដើម (Text):</b> «${raw}»\n` +
      `🔢 <b>លេខកូដប្រព័ន្ធគោលដប់ (Base-10 Decimal Codes):</b>\n<code>${decCodes}</code>\n\n` +
      `<b>តារាងបំប្លែងតួអក្សរនីមួយៗ៖</b>\n${breakdown}` +
      (chars.length > 10 ? `\n... និង ${chars.length - 10} តួអក្សរទៀត` : ""),
    voiceScript: `អក្សរ «${raw}» ប្ដូរទៅជាលេខកូដប្រព័ន្ធគោលដប់ គឺ៖ ${decCodes}។`,
  };
}

/**
 * Check if a user message is requesting Decimal / Word conversion
 */
export function isDecimalWordConversionQuery(text) {
  const clean = String(text || "").trim();
  if (!clean) return false;

  // Command check
  if (/^\/(?:num2word|word2num|text2dec|dec2text|decimal|base10|numtoword|wordtonum)\b/i.test(clean)) {
    return true;
  }

  // Natural language Khmer triggers
  const hasConversionIntent =
    /(?:ប្ដូរ|ប្តូរ|បម្លែង|បំលែង|ប្រែ|សរសេរ|គិត|អាន)\s*(?:ពី)?[\s\S]*(?:ជាអក្សរ|ជាលេខ|ទៅជាអក្សរ|ទៅជាលេខ|ប្រព័ន្ធគោលដប់|គោលដប់|គោល\s*១០|base\s*10|decimal)/i.test(
      clean
    ) ||
    /(?:អក្សរទៅជាលេខ|លេខទៅជាអក្សរ|លេខជាអក្សរ|អក្សរជាលេខ)/i.test(clean) ||
    /(?:តើ[\s\S]+(?:សរសេរជាអក្សរ|សរសេរជាលេខ|ជាលេខគោលដប់|ជាប្រព័ន្ធគោលដប់|យ៉ាងដូចម្ដេច|ដូចម្ដេច|យ៉ាងម៉េច))/i.test(
      clean
    );

  const hasNumberOrWordKeyword =
    /(?:ប្រព័ន្ធគោលដប់|គោលដប់|base\s*10|decimal|លេខ|អក្សរ|មួយរយ|មួយពាន់|មួយលាន|[០-៩]{1,18}|[0-9]{1,18})/i.test(
      clean
    );

  return hasConversionIntent && hasNumberOrWordKeyword;
}

/**
 * Extract Target Payload or detect pure mode selection
 */
export function extractTargetFromDecimalPrompt(text) {
  const clean = String(text || "").trim();
  let s = clean.replace(/^\/(?:num2word|word2num|text2dec|dec2text|decimal|base10|numtoword|wordtonum)\s*/i, "").trim();

  // 1. Quoted string e.g. "មួយលាន", '2026', «Hello»
  const q = s.match(/[«"“\x27]([^«"”\x27]+)["”\x27»]/);
  if (q && q[1]) return { target: q[1].trim(), isSelectionOnly: false };

  // 2. Pure selection / activation without specific payload
  if (
    /^(?:បន្ថែម[\s\S]*?)?ប្ដូរអក្សរទៅជាលេខប្រព័ន្ធគោលដប់(?:និង|\s*&|\s*និង\s*)?ប្ដូរពីលេខក្នុងប្រព័ន្ធគោលដប់ទៅជាអក្សរវិញ/i.test(s) ||
    /^(?:មុខងារ|ចំនុច|ចំណុច)?\s*ប្ដូរ(?:អក្សរទៅជាលេខប្រព័ន្ធគោលដប់|ពីលេខក្នុងប្រព័ន្ធគោលដប់ទៅជាអក្សរវិញ|លេខប្រព័ន្ធគោលដប់ទៅជាអក្សរ|អក្សរទៅជាលេខគោលដប់|លេខគោលដប់ទៅជាអក្សរ|លេខ\s*⇄\s*អក្សរ)$/i.test(s) ||
    !s
  ) {
    return { target: "", isSelectionOnly: true };
  }

  // 3. Decimal code sequence e.g. "72 101 108 108 111"
  const decCodeSeq = s.match(/\b\d{1,6}(?:[\s,;]+\d{1,6})+\b/);
  if (decCodeSeq) return { target: decCodeSeq[0].trim(), isSelectionOnly: false };

  // 4. Numbers (Arabic or Khmer digits)
  const numMatch = s.match(/(?:-?\s*(?:[0-9]+[0-9,.]*|[០-៩]+[០-៩,.]*))/);
  if (numMatch) return { target: numMatch[0].trim(), isSelectionOnly: false };

  // 5. Explicit "ប្ដូរអក្សរ <X> ទៅជា..."
  const textPattern = s.match(/(?:ប្ដូរ|ប្តូរ|បម្លែង|បំលែង)?\s*(?:អក្សរ|ពាក្យ|text|word)\s+([^\s]+)\s*(?:ទៅជា|ជា)?\s*(?:កូដ|លេខ|ប្រព័ន្ធគោលដប់|គោលដប់|decimal)/i);
  if (textPattern && textPattern[1]) {
    return { target: textPattern[1].trim(), isSelectionOnly: false };
  }

  // 6. Khmer number words (excluding standalone "គោលដប់")
  const cleanedForKmNum = s.replace(/ប្រព័ន្ធគោលដប់|លេខគោលដប់|កូដគោលដប់|គោលដប់/g, "");
  const kmWordMatch = cleanedForKmNum.match(/(?:សូន្យ|មួយ|ពីរ|បី|បួន|ប្រាំ|ដប់|ម្ភៃ|សាមសិប|សែសិប|ហាសិប|ហុកសិប|ចិតសិប|ប៉ែតសិប|កៅសិប|រយ|ពាន់|ម៉ឺន|សែន|លាន|កោដិ)+(?:[\s\u200B]*(?:សូន្យ|មួយ|ពីរ|បី|បួន|ប្រាំ|ដប់|ម្ភៃ|សាមសិប|សែសិប|ហាសិប|ហុកសិប|ចិតសិប|ប៉ែតសិប|កៅសិប|រយ|ពាន់|ម៉ឺន|សែន|លាន|កោដិ))*/);
  if (kmWordMatch && kmWordMatch[0].trim().length >= 2) return { target: kmWordMatch[0].trim(), isSelectionOnly: false };

  // 7. English number words
  const enWordMatch = s.match(/(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion)+(?:[\s-]*(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion))*/i);
  if (enWordMatch) return { target: enWordMatch[0].trim(), isSelectionOnly: false };

  // 8. Residual target after cleaning prefix/suffix
  const residual = s
    .replace(/^(?:សូម|ជួយ)?\s*(?:ប្ដូរ|ប្តូរ|បម្លែង|បំលែង|សរសេរ|ប្រាប់|គិត)\s*(?:ពី)?/i, "")
    .replace(/(?:ទៅជា|ជា)?\s*(?:លេខប្រព័ន្ធគោលដប់|ប្រព័ន្ធគោលដប់|លេខគោលដប់|លេខ|អក្សរ|words|decimal)[\s\S]*$/i, "")
    .trim();

  return { target: residual || s, isSelectionOnly: false };
}

/**
 * Execute Decimal Word Conversion on user prompt
 */
export function executeDecimalWordConversion(userPrompt) {
  const { target } = extractTargetFromDecimalPrompt(userPrompt);
  const finalInput = target || "2026";
  const result = comprehensiveDecimalConversion(finalInput);
  return result;
}

/**
 * Build inline keyboard for Telegram
 */
export function buildDecimalConverterInlineKeyboard(currentInput = "2026") {
  return {
    inline_keyboard: [
      [
        { text: "🔢 ២០២៦ ជាអក្សរ", callback_data: "dec_demo_2026" },
        { text: "💵 ១,៥០០,០០០ ជាអក្សរ", callback_data: "dec_demo_1500000" },
      ],
      [
        { text: "✍️ «មួយលាន» ➔ លេខ", callback_data: "dec_demo_words" },
        { text: "🔤 «Hello» ➔ គោលដប់", callback_data: "dec_demo_ascii" },
      ],
      [
        { text: "🔊 ស្តាប់សំឡេងអាន", callback_data: `dec_speak:${encodeURIComponent(currentInput.slice(0, 30))}` },
        { text: "📋 ជំនួយ", callback_data: "dec_help" },
      ],
      [
        { text: "🛑 ចាកចេញពីមុខងារនេះ", callback_data: "dec_exit" },
      ],
    ],
  };
}

function escapeXmlLocal(str = "") {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generate Visual SVG Card for Decimal & Words Conversion
 */
export function createDecimalConverterSvgCard(res) {
  const isCode = res.inputType === "text_to_decimal_codes" || res.inputType === "decimal_codes_to_text";
  const title = isCode
    ? "🔢 ប្ដូរអក្សរ ⇄ លេខកូដប្រព័ន្ធគោលដប់ (Base-10 ASCII/Unicode)"
    : "🔢 ប្ដូរអក្សរ ⇄ លេខប្រព័ន្ធគោលដប់ (Base-10 Number & Words)";

  const inputLabel = isCode
    ? (res.inputType === "text_to_decimal_codes" ? "🔤 អក្សរដើម (Input Text)" : "🔢 លេខកូដគោលដប់ដើម (Input Decimal Codes)")
    : (res.inputType === "words_to_number" ? "✍️ អក្សរខ្មែរដើម (Input Words)" : "🔢 លេខគោលដប់ដើម (Input Number)");

  const inputVal = escapeXmlLocal(String(res.originalInput || "").slice(0, 50));
  const decVal = escapeXmlLocal(String(res.decimalValue || "").slice(0, 50));
  const kmWordsVal = escapeXmlLocal(String(res.khmerWords || "").slice(0, 60));
  const enWordsVal = escapeXmlLocal(String(res.englishWords || "").slice(0, 60));
  const hexVal = escapeXmlLocal(String(res.hexCodes || "").slice(0, 40));
  const binVal = escapeXmlLocal(String(res.binaryCodes || "").slice(0, 40));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 440" width="800" height="440">
    <defs>
      <linearGradient id="decBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="50%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="800" height="440" rx="26" fill="url(#decBg)" stroke="#818cf8" stroke-width="2" stroke-opacity="0.6"/>
    
    <!-- Header -->
    <text x="40" y="52" fill="#38bdf8" font-family="Noto Sans Khmer, sans-serif" font-size="22" font-weight="bold">${escapeXmlLocal(title)}</text>
    
    <!-- Top Box: Input -->
    <rect x="40" y="74" width="720" height="90" rx="16" fill="#1e293b" fill-opacity="0.8" stroke="#38bdf8" stroke-width="1.2" stroke-opacity="0.4"/>
    <text x="60" y="104" fill="#94a3b8" font-family="Noto Sans Khmer, sans-serif" font-size="15">${inputLabel}៖</text>
    <text x="60" y="142" fill="#f8fafc" font-family="Noto Sans Khmer, sans-serif" font-size="24" font-weight="bold">${inputVal}</text>
    
    <!-- Bottom Box: Output / Breakdown -->
    <rect x="40" y="180" width="720" height="230" rx="18" fill="#0f172a" fill-opacity="0.9" stroke="#6366f1" stroke-width="1.8"/>
    
    <text x="60" y="216" fill="#818cf8" font-family="Noto Sans Khmer, sans-serif" font-size="16" font-weight="bold">🎯 លទ្ធផលបម្លែង (Converted Output)៖</text>
    
    <text x="60" y="254" fill="#fbbf24" font-family="Noto Sans Khmer, sans-serif" font-size="17">🔢 គោលដប់ (Base-10):</text>
    <text x="260" y="254" fill="#ffffff" font-family="Noto Sans Khmer, sans-serif" font-size="20" font-weight="bold">${decVal}</text>
    
    <text x="60" y="294" fill="#34d399" font-family="Noto Sans Khmer, sans-serif" font-size="17">🇰🇭 អក្សរខ្មែរ (Khmer):</text>
    <text x="260" y="294" fill="#ffffff" font-family="Noto Sans Khmer, sans-serif" font-size="20" font-weight="bold">${kmWordsVal}</text>
    
    <text x="60" y="334" fill="#60a5fa" font-family="Noto Sans Khmer, sans-serif" font-size="17">🇬🇧 អង់គ្លេស (English):</text>
    <text x="260" y="334" fill="#e2e8f0" font-family="Noto Sans Khmer, sans-serif" font-size="18">${enWordsVal}</text>
    
    <line x1="60" y1="356" x2="720" y2="356" stroke="#334155" stroke-width="1"/>
    
    <text x="60" y="386" fill="#94a3b8" font-family="Noto Sans Khmer, sans-serif" font-size="14">🪙 Hex: <tspan fill="#c084fc">${hexVal}</tspan> | Binary (គោលពីរ): <tspan fill="#38bdf8">${binVal}</tspan></text>
  </svg>`;
}

/**
 * Send Decimal Conversion Result to Telegram Chat
 */
export async function sendTelegramDecimalConversionResult(token, chatId, replyToMessageId, { query, currentInput, session } = {}) {
  const { getConfiguredBotToken, sendTelegramHtml, sendSingleKhmerVoice } = await import("./telegram-webhook.js");
  const { sendTelegramSvgPhotoServer } = await import("./telegram-id-chat.js");

  const effectiveToken = getConfiguredBotToken(token);
  const rawTarget = query || currentInput || "2026";
  const { target, isSelectionOnly } = extractTargetFromDecimalPrompt(rawTarget);

  if (session) {
    session.activeToolMode = "decimal";
  }

  const finalInput = target || "2026";
  const result = comprehensiveDecimalConversion(finalInput);

  const svgCard = createDecimalConverterSvgCard(result);
  const keyboard = buildDecimalConverterInlineKeyboard(result.originalInput || "2026");

  let introHeader = "";
  if (isSelectionOnly) {
    introHeader =
      `🔢✨ <b>ប្រព័ន្ធប្ដូរអក្សរ ⇄ លេខប្រព័ន្ធគោលដប់ (Base-10 Decimal Engine)</b>\n` +
      `✅ <b>អ្នកបានជ្រើសរើសមុខងារប្ដូរអក្សរ ⇄ លេខប្រព័ន្ធគោលដប់!</b>\n` +
      `<i>(Bot នឹងបម្លែងលេខ និងអក្សរជូនអ្នកដោយផ្ទាល់ ១០០% ដោយមិនឆ្លើយផ្ដេសផ្ដាសឡើយ)</i>\n\n` +
      `💡 <b>របៀបប្រើប្រាស់៖</b>\n` +
      `• <b>វាយលេខ (Number ➔ Words):</b> ឧ. <code>2026</code>, <code>1500000</code>, <code>12.75</code>\n` +
      `• <b>វាយអក្សរ (Words ➔ Number):</b> ឧ. <code>មួយលានប្រាំសែន</code>, <code>ពីរពាន់ម្ភៃប្រាំមួយ</code>\n` +
      `• <b>វាយពាក្យ (Text ➔ Decimal Codes):</b> ឧ. <code>Hello</code>, <code>សួស្តី</code>\n` +
      `• <b>វាយកូដ (Decimal Codes ➔ Text):</b> ឧ. <code>72 101 108 108 111</code>\n\n` +
      `👇 <b>ខាងក្រោមនេះគឺជាឧទាហរណ៍គំរូនៃលេខ ២០២៦៖</b>\n\n`;
  }

  const caption =
    (isSelectionOnly ? `🔢✅ <b>បានជ្រើសរើសមុខងារប្ដូរអក្សរ ⇄ លេខគោលដប់</b>\n` : `🔢 <b>ប្រព័ន្ធប្ដូរអក្សរ ⇄ លេខប្រព័ន្ធគោលដប់ (Base-10)</b>\n`) +
    `• បញ្ចូល៖ <code>${escapeXmlLocal(result.originalInput)}</code>\n` +
    `• គោលដប់៖ <b>${escapeXmlLocal(result.decimalValue)}</b> (${escapeXmlLocal(result.khmerDigits)})\n` +
    `• ជាអក្សរ៖ <b>«${escapeXmlLocal(result.khmerWords)}»</b>`;

  await Promise.all([
    sendTelegramSvgPhotoServer(
      effectiveToken,
      chatId,
      svgCard,
      caption,
      null,
      replyToMessageId
    ).catch(() => {}),
    sendTelegramHtml(effectiveToken, chatId, introHeader + result.explanationHtml, keyboard).catch(() => {}),
    sendSingleKhmerVoice(effectiveToken, chatId, result.voiceScript || `លេខគោលដប់ ${result.khmerDigits} ជាអក្សរគឺ ${result.khmerWords}។`).catch(() => {}),
  ]);

  return { ok: true, result };
}


