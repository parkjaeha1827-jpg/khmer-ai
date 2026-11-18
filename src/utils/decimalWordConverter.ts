// ============================================================================
// DECIMAL NUMBER & WORDS CONVERTER (ប្ដូរអក្សរ ⇄ លេខប្រព័ន្ធគោលដប់)
// Full-featured bidirectional conversion:
// 1. Base-10 Decimal Numbers -> Spelled-out Khmer & English Words
// 2. Spelled-out Khmer & English Words -> Base-10 Decimal Numbers
// 3. Text Characters -> Base-10 Decimal Unicode/ASCII Codes
// 4. Base-10 Decimal Codes -> Text Characters
// 5. Multi-Base (Binary Base 2, Octal Base 8, Hex Base 16, Roman) <-> Base-10 Decimal
// ============================================================================

export interface DecimalConversionResult {
  inputType: "number_to_words" | "words_to_number" | "text_to_decimal_codes" | "decimal_codes_to_text" | "mixed";
  originalInput: string;
  decimalValue: string;
  khmerDigits: string;
  arabicDigits: string;
  khmerWords: string;
  englishWords: string;
  khmerCurrencyRiel: string;
  khmerCurrencyDollar: string;
  decimalCodes: string;
  hexCodes: string;
  binaryCodes: string;
  reconstructedText: string;
  charBreakdown: Array<{
    char: string;
    decimal: number;
    hex: string;
    binary: string;
  }>;
  explanationHtml: string;
}

const KHMER_DIGITS_LIST = ["សូន្យ", "មួយ", "ពីរ", "បី", "បួន", "ប្រាំ", "ប្រាំមួយ", "ប្រាំពីរ", "ប្រាំបី", "ប្រាំបួន"];
const KHMER_TENS_LIST = ["", "ដប់", "ម្ភៃ", "សាមសិប", "សែសិប", "ហាសិប", "ហុកសិប", "ចិតសិប", "ប៉ែតសិប", "កៅសិប"];
const ARABIC_TO_KHMER_DIGIT_MAP: Record<string, string> = {
  "0": "០", "1": "១", "2": "២", "3": "៣", "4": "៤",
  "5": "៥", "6": "៦", "7": "៧", "8": "៨", "9": "៩",
};
const KHMER_TO_ARABIC_DIGIT_MAP: Record<string, string> = {
  "០": "0", "១": "1", "២": "2", "៣": "3", "៤": "4",
  "៥": "5", "៦": "6", "៧": "7", "៨": "8", "៩": "9",
};

/**
 * Convert Arabic digits to Khmer digits (e.g. 2026 -> ២០២៦)
 */
export function toKhmerDigits(str: string | number): string {
  return String(str).replace(/[0-9]/g, (d) => ARABIC_TO_KHMER_DIGIT_MAP[d] || d);
}

/**
 * Convert Khmer digits to Arabic digits (e.g. ២០២៦ -> 2026)
 */
export function toArabicDigits(str: string | number): string {
  return String(str).replace(/[០-៩]/g, (d) => KHMER_TO_ARABIC_DIGIT_MAP[d] || d);
}

/**
 * Convert Base-10 Decimal Number to Spelled-out Khmer Words
 * Handles integers up to hundreds of trillions, negative numbers, and decimals (ក្បៀស)
 */
export function decimalToKhmerWords(val: number | string): string {
  const cleanStr = toArabicDigits(String(val ?? "")).trim().replace(/,/g, "");
  if (!cleanStr || !/^-?\d+(\.\d+)?$/.test(cleanStr)) {
    return "";
  }

  const isNegative = cleanStr.startsWith("-");
  const absStr = isNegative ? cleanStr.slice(1) : cleanStr;
  const [intPart, decPart] = absStr.split(".");

  function convertUnderThousand(num: number): string {
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

  function convertBigIntInteger(bigStr: string): string {
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
export function decimalToEnglishWords(val: number | string): string {
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

  function convertTriplet(n: number): string {
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

  function convertBigIntEnglish(bigStr: string): string {
    let big = BigInt(bigStr);
    if (big === 0n) return "zero";

    const scales = [
      { name: "trillion", val: 1000000000000n },
      { name: "billion", val: 1000000000n },
      { name: "million", val: 1000000n },
      { name: "thousand", val: 1000n },
    ];

    const parts: string[] = [];
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

  // Capitalize first letter
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "";
}

/**
 * Convert Spelled-out Khmer Words to Base-10 Decimal Number
 */
export function khmerWordsToDecimal(text: string): { decimal: number; formatted: string; isValid: boolean } {
  let s = String(text || "").trim();
  if (!s) return { decimal: 0, formatted: "0", isValid: false };

  let isNegative = false;
  if (/^ដក\s*/.test(s)) {
    isNegative = true;
    s = s.replace(/^ដក\s*/, "");
  }

  // If already pure digits (Khmer or Arabic)
  const arabicStr = toArabicDigits(s).replace(/[,\s]/g, "");
  if (/^-?\d+(\.\d+)?$/.test(arabicStr)) {
    const num = isNegative ? -Number(arabicStr) : Number(arabicStr);
    return { decimal: num, formatted: num.toLocaleString(), isValid: true };
  }

  const [intPart, decPart] = s.split(/(?:ក្បៀស|ចុច)/);

  const digitMap: Record<string, number> = {
    "សូន្យ": 0, "មួយ": 1, "ពីរ": 2, "បី": 3, "បួន": 4,
    "ប្រាំ": 5, "ប្រាំមួយ": 6, "ប្រាំពីរ": 7, "ប្រាំបី": 8, "ប្រាំបួន": 9,
  };
  const tensMap: Record<string, number> = {
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

  function parseUnder100(chunk: string): number {
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

  function parseChunk(chunk: string): number {
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
export function englishWordsToDecimal(text: string): { decimal: number; isValid: boolean } {
  let s = String(text || "").toLowerCase().trim();
  if (!s) return { decimal: 0, isValid: false };

  let isNegative = false;
  if (/^(?:negative|minus)\s+/.test(s)) {
    isNegative = true;
    s = s.replace(/^(?:negative|minus)\s+/, "");
  }

  const wordsMap: Record<string, number> = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
    seventeen: 17, eighteen: 18, nineteen: 19,
    twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  };
  const scales: Record<string, number> = {
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
 * E.g. "Hello" -> "72 101 108 108 111", "ក" -> "6016"
 */
export function textToDecimalCodes(text: string, separator = " "): string {
  return Array.from(String(text || ""))
    .map((c) => c.codePointAt(0) || 0)
    .join(separator);
}

/**
 * Convert Base-10 Decimal Unicode/ASCII Codes back to Text Characters
 * E.g. "72 101 108 108 111" -> "Hello"
 */
export function decimalCodesToText(decStr: string): string {
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
 * Comprehensive Multi-Directional Decimal Conversion
 * Inspects user input and automatically computes all formats:
 * - Number <-> Words
 * - Characters <-> Decimal codes
 * - Formatted Riel and Dollar
 */
export function comprehensiveDecimalConversion(input: string): DecimalConversionResult {
  const raw = String(input || "").trim();
  let inputType: DecimalConversionResult["inputType"] = "mixed";

  // Check if input is a sequence of decimal character codes (e.g. "72 101 108 108 111" or "6047 6077")
  if (/^\d{1,6}(?:[\s,;]+\d{1,6})+$/.test(raw)) {
    inputType = "decimal_codes_to_text";
    const text = decimalCodesToText(raw);
    const codes = raw.split(/[\s,;]+/);
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
      hexCodes: raw
        .split(/[\s,;]+/)
        .map((n) => "0x" + parseInt(n, 10).toString(16).toUpperCase())
        .join(" "),
      binaryCodes: raw
        .split(/[\s,;]+/)
        .map((n) => parseInt(n, 10).toString(2))
        .join(" "),
      reconstructedText: text,
      charBreakdown: Array.from(text).map((c) => {
        const cp = c.codePointAt(0) || 0;
        return {
          char: c,
          decimal: cp,
          hex: "0x" + cp.toString(16).toUpperCase(),
          binary: cp.toString(2),
        };
      }),
      explanationHtml:
        `🔢 <b>បម្លែងពីលេខកូដប្រព័ន្ធគោលដប់ (Base-10) ➔ អក្សរ (Text)៖</b>\n` +
        `• លេខកូដគោលដប់៖ <code>${raw}</code>\n` +
        `• អក្សរដែលទទួលបាន៖ <b>«${text}»</b>\n\n` +
        `🇬🇧 English: Decoded decimal code points "${raw}" into text "${text}".`,
    };
  }

  const arabicStr = toArabicDigits(raw).replace(/[,\s]/g, "");
  let decNum = 0;
  let decStr = "0";

  // Check if input is a pure number (e.g. 125, 2026, 12.75, or -50)
  if (/^-?\d+(\.\d+)?$/.test(arabicStr)) {
    inputType = "number_to_words";
    decNum = Number(arabicStr);
    decStr = arabicStr;
  }
  // Check if input is spelled-out Khmer words (contains Khmer scale words like រយ, ពាន់, ម៉ឺន, សែន, លាន, etc.)
  else if (/(?:សូន្យ|មួយ|ពីរ|បី|បួន|ប្រាំ|ដប់|ម្ភៃ|សាមសិប|សែសិប|ហាសិប|ហុកសិប|ចិតសិប|ប៉ែតសិប|កៅសិប|រយ|ពាន់|ម៉ឺន|សែន|លាន|កោដិ)/.test(raw)) {
    const parsed = khmerWordsToDecimal(raw);
    if (parsed.isValid && parsed.decimal !== 0) {
      inputType = "words_to_number";
      decNum = parsed.decimal;
      decStr = String(parsed.decimal);
    }
  }
  // Check if input is spelled-out English words
  else if (/(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|hundred|thousand|million|billion)/i.test(raw)) {
    const parsedEng = englishWordsToDecimal(raw);
    if (parsedEng.isValid && parsedEng.decimal !== 0) {
      inputType = "words_to_number";
      decNum = parsedEng.decimal;
      decStr = String(parsedEng.decimal);
    }
  }

  // If determined to be number/words conversion:
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
      charBreakdown: Array.from(decStr).map((c) => {
        const cp = c.codePointAt(0) || 0;
        return {
          char: c,
          decimal: cp,
          hex: "0x" + cp.toString(16).toUpperCase(),
          binary: cp.toString(2),
        };
      }),
      explanationHtml:
        `🔢 <b>ប្រព័ន្ធគោលដប់ (Base-10 Decimal)៖</b> <code>${decStr}</code> (${kmDigits})\n` +
        `🇰🇭 <b>អក្សរខ្មែរ (Khmer Words)៖</b> «${kmWords}»\n` +
        `🇬🇧 <b>អក្សរអង់គ្លេស (English Words)៖</b> "${enWords}"\n` +
        `💵 <b>ជាប្រាក់រៀល៖</b> ${kmWords}រៀល\n` +
        `🪙 <b>លេខកូដគោលពីរ (Binary):</b> <code>${intDec.toString(2)}</code> | <b>Hex:</b> <code>0x${intDec.toString(16).toUpperCase()}</code>`,
    };
  }

  // Otherwise, treat as Text to Base-10 Decimal character code conversion!
  inputType = "text_to_decimal_codes";
  const decCodes = textToDecimalCodes(raw);
  const chars = Array.from(raw).map((c) => {
    const cp = c.codePointAt(0) || 0;
    return {
      char: c,
      decimal: cp,
      hex: "0x" + cp.toString(16).toUpperCase(),
      binary: cp.toString(2),
    };
  });

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
    hexCodes: chars.map((c) => c.hex).join(" "),
    binaryCodes: chars.map((c) => c.binary).join(" "),
    reconstructedText: raw,
    charBreakdown: chars,
    explanationHtml:
      `🔤 <b>អក្សរដើម (Text):</b> «${raw}»\n` +
      `🔢 <b>លេខកូដប្រព័ន្ធគោលដប់ (Base-10 Decimal Codes)៖</b>\n<code>${decCodes}</code>\n\n` +
      `<b>តារាងបំប្លែងតួអក្សរនីមួយៗ៖</b>\n` +
      chars
        .slice(0, 15)
        .map((c) => `• «${c.char}» ➔ គោលដប់: <b>${c.decimal}</b> | Hex: <code>${c.hex}</code>`)
        .join("\n") +
      (chars.length > 15 ? `\n... និង ${chars.length - 15} តួអក្សរទៀត` : ""),
  };
}
