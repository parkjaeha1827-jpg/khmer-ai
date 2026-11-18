function detectSpeechLanguageServer(clean) {
  if (/^(?:🇨🇳|\bchinese\b|\b中文\b|ភាសាចិន|ចិន|汉语|普通话)/i.test(clean)) return "zh-CN";
  if (/^(?:🇬🇧|🇺🇸|\benglish\b|\bin english\b|ភាសាអង់គ្លេស|អង់គ្លេស)/i.test(clean)) return "en";
  if (/^(?:🇫🇷|\bfrench\b|\bfrançais\b|ភាសាបារាំង|បារាំង)/i.test(clean)) return "fr";
  if (/^(?:🇯🇵|\bjapanese\b|\b日本語\b|ភាសាជប៉ុន|ជប៉ុន)/i.test(clean)) return "ja";
  if (/^(?:🇹🇭|\bthai\b|\bภาษาไทย\b|ភាសាថៃ|ថៃ)/i.test(clean)) return "th";
  if (/^(?:🇻🇳|\bvietnamese\b|\btiếng việt\b|ភាសាវៀតណាម|វៀតណាម)/i.test(clean)) return "vi";
  if (/^(?:🇰🇷|\bkorean\b|\b한국어\b|ភាសាកូរ៉េ|កូរ៉េ)/i.test(clean)) return "ko";
  if (/[\u4E00-\u9FFF]/.test(clean)) return "zh-CN";
  if (/[\u3040-\u30FF]/.test(clean)) return "ja";
  if (/[\uAC00-\uD7AF]/.test(clean)) return "ko";
  if (/[\u0E00-\u0E7F]/.test(clean)) return "th";
  if (/[a-zA-Z]/.test(clean)) return "en";
  return "km";
}

function cleanPinyinAndPhoneticsForSpeech(text, lang) {
  let s = String(text || "").trim();
  if (!s) return "";
  s = s.replace(/[*_~`#]/g, "");
  if (lang === "zh-CN" || lang === "zh") {
    if (/[\u4E00-\u9FFF]/.test(s)) {
      s = s.replace(/\s*\([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s\d,'.!?-]+\)/g, "");
    }
  } else if (lang === "ja") {
    if (/[\u3040-\u30FF\u4E00-\u9FFF]/.test(s)) {
      s = s.replace(/\s*\([a-zA-Z\s\d,'.!?-]+\)/g, "");
    }
  } else if (lang === "ko") {
    if (/[\uAC00-\uD7AF]/.test(s)) {
      s = s.replace(/\s*\([a-zA-Z\s\d,'.!?-]+\)/g, "");
    }
  }
  return s.replace(/^[«"“'(\[]+|[»"”')\]]+$/g, "").trim();
}

const test1 = "ពាក្យសួស្តីជាភាសាចិនគឺ «你好» ហើយជាភាសាអង់គ្លេសគឺ «Hello, how are you?»";
const tokenRegex = /([\u4E00-\u9FFF]+(?:[\s，。！？、：；“”‘’]*[\u4E00-\u9FFF]+)*|[\u3040-\u30FF]+|[\uAC00-\uD7AF]+|[\u0E00-\u0E7F]+|[«"“][a-zA-Z\u00C0-\u024F\s,!?.-]{2,120}[»"”]|[a-zA-Z\u00C0-\u024F]{2,}(?:\s+[a-zA-Z\u00C0-\u024F0-9,!?.-]+)+)/g;

let lastIdx = 0;
const segs = [];
let m;
while ((m = tokenRegex.exec(test1)) !== null) {
  if (matchStart(m) > lastIdx) {
    const km = test1.slice(lastIdx, m.index).replace(/^[«"“'(\[]+|[»"”')\]]+$/g, "").trim();
    if (km) segs.push({ text: km, lang: "km", isKhmer: true });
  }
  const fText = m[1].trim();
  const fLang = detectSpeechLanguageServer(fText);
  segs.push({ text: cleanPinyinAndPhoneticsForSpeech(fText, fLang), lang: fLang, isKhmer: false });
  lastIdx = m.index + m[0].length;
}
function matchStart(m) { return m.index; }
console.log(JSON.stringify(segs, null, 2));
