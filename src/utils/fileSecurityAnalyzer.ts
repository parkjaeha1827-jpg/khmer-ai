export interface FileSecurityAnalysis {
  isDangerous: boolean;
  riskLevel: "CRITICAL" | "HIGH" | "SAFE";
  fileName: string;
  extension: string;
  doubleExtension: boolean;
  categoryTitle: string;
  threatType: string;
  reasonsKhmer: string[];
  whatHappensIfClickedKhmer: string;
  scammerReprimandKhmer: string;
  protectionAdviceKhmer: string;
}

const CRITICAL_EXTENSIONS = new Set([
  ".apk",
  ".xapk",
  ".apkm",
  ".aab",
  ".dex",
  ".exe",
  ".msi",
  ".msp",
  ".scr",
  ".pif",
  ".com",
  ".bat",
  ".cmd",
  ".vbs",
  ".vbe",
  ".js",
  ".jse",
  ".wsf",
  ".wsh",
  ".ps1",
  ".psm1",
  ".hta",
  ".reg",
  ".dll",
  ".sys",
  ".cpl",
  ".jar",
  ".lnk",
  ".url",
  ".scf",
  ".chm",
  ".inf",
  ".dmg",
  ".pkg",
  ".app",
  ".command",
  ".sh",
  ".run",
  ".bin",
  ".deb",
  ".rpm",
  ".elf",
]);

const HIGH_RISK_ARCHIVE_OR_MACRO_EXTENSIONS = new Set([
  ".zip",
  ".rar",
  ".7z",
  ".iso",
  ".img",
  ".vhd",
  ".vhdx",
  ".cab",
  ".tar",
  ".gz",
  ".tgz",
  ".xz",
  ".bz2",
  ".docm",
  ".dotm",
  ".xlsm",
  ".xltm",
  ".xlam",
  ".pptm",
  ".potm",
  ".ppam",
  ".htm",
  ".html",
  ".svg",
]);

export function analyzeFileSecurity(
  rawFileName: string,
  mimeType = "",
  fileSize = 0,
  captionOrContext = ""
): FileSecurityAnalysis {
  const fileName = (rawFileName || "unknown_file").trim();
  const lowerName = fileName.toLowerCase();
  const lowerMime = (mimeType || "").toLowerCase();
  const lowerCaption = (captionOrContext || "").toLowerCase();

  // Extract extension(s)
  const parts = lowerName.split(".").filter(Boolean);
  const ext = parts.length > 1 ? `.${parts[parts.length - 1]}` : "";
  const prevExt = parts.length > 2 ? `.${parts[parts.length - 2]}` : "";

  // Check for deceptive double extension like "photo.jpg.exe" or "invoice.pdf.scr" or "video.mp4.apk"
  const fakeSafeExts = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".mp4",
    ".mp3",
    ".txt",
  ]);
  const isDoubleExt =
    fakeSafeExts.has(prevExt) &&
    (CRITICAL_EXTENSIONS.has(ext) || HIGH_RISK_ARCHIVE_OR_MACRO_EXTENSIONS.has(ext));

  // 1. Android APK / Mobile Trojan Malware
  if ([".apk", ".xapk", ".apkm", ".aab", ".dex"].includes(ext) || lowerMime.includes("android.package-archive")) {
    return {
      isDangerous: true,
      riskLevel: "CRITICAL",
      fileName,
      extension: ext || ".apk",
      doubleExtension: isDoubleExt,
      categoryTitle: "មេរោគទូរស័ព្ទ Android Trojan / Banking & OTP Stealer (.APK)",
      threatType: "Android Spyware & Banking Trojan",
      reasonsKhmer: [
        `ហ្វាល់ "${fileName}" មានកន្ទុយ "${ext || ".apk"}" គឺជាកម្មវិធីដំឡើងក្រៅផ្លូវការសម្រាប់ទូរស័ព្ទ Android ដែលជនឆបោកតែងតែប្រើដើម្បីបង្កប់មេរោគ Trojan និង Spyware។`,
        isDoubleExt
          ? `ជនឆបោកបានប្រើល្បិចដាក់កន្ទុយហ្វាល់ ២ ជាន់ (${prevExt}${ext}) ដើម្បីបន្លំភ្នែកអ្នកប្រើប្រាស់ឱ្យស្មានថាជារូបភាព ឬឯកសារធម្មតា។`
          : `ជនឆបោកច្រើនបន្លំហ្វាល់ .APK នេះធ្វើជាកម្មវិធីធនាគារ (ABA, ACLEDA, Wing) កម្មវិធីរូបថត វីដេអូ ឬឯកសារពិសេស។`,
        `កម្មវិធីនេះមិនមែនទាញយកចេញពី Google Play Store ផ្លូវការឡើយ ហើយមានបង្កប់កូដបញ្ជាពីចម្ងាយ (Remote Access Trojan)។`,
      ],
      whatHappensIfClickedKhmer:
        "ប្រសិនបើចុចទាញយក និងដំឡើង (Install) ហ្វាល់នេះ មេរោគនឹងចូលគ្រប់គ្រងទូរស័ព្ទរបស់អ្នកទាំងស្រុង លួចថតអេក្រង់ទូរស័ព្ទ លួចអានសារ SMS លេខកូដសម្ងាត់ OTP លួចចូលគណនី Telegram/Facebook និងលួចផ្ទេរប្រាក់ចេញពីគណនីធនាគាររបស់អ្នកដោយស្វ័យប្រវត្តិ!",
      scammerReprimandKhmer:
        "នែ៎ជនឆបោក! កុំយកហ្វាល់មេរោគ .APK មកបោកប្រាស់បងប្អូនក្នុងគ្រុបនេះឱ្យសោះ! ទង្វើលួចទ្រព្យសម្បត្តិ និងលួចគណនីអ្នកដទៃគឺជាអំពើអសីលធម៌ និងខុសច្បាប់ធ្ងន់ធ្ងរបំផុត ដែលយើងខ្ញុំស្អប់ខ្ពើម និងប្រឆាំងដាច់ខាត!",
      protectionAdviceKhmer:
        "សូមបងប្អូនកុំចុចទាញយក (Download) ឬដំឡើង (Install) ហ្វាល់នេះឱ្យសោះ! ប្រសិនបើច្រឡំទាញយក សូមលុបហ្វាល់នេះចោលភ្លាមៗ ហើយហាមបើកសិទ្ធិ Accessibility ឱ្យកម្មវិធីមិនស្គាល់ប្រភពជាដាច់ខាត។",
    };
  }

  // 2. Windows Executables, Scripts, Shortcuts & Session Hijackers
  if (
    [
      ".exe",
      ".msi",
      ".msp",
      ".scr",
      ".pif",
      ".com",
      ".bat",
      ".cmd",
      ".vbs",
      ".vbe",
      ".js",
      ".jse",
      ".wsf",
      ".wsh",
      ".ps1",
      ".psm1",
      ".hta",
      ".reg",
      ".dll",
      ".sys",
      ".cpl",
      ".jar",
      ".lnk",
      ".url",
      ".scf",
      ".chm",
    ].includes(ext) ||
    lowerMime.includes("x-msdownload") ||
    lowerMime.includes("x-executable") ||
    lowerMime.includes("x-msdos-program")
  ) {
    return {
      isDangerous: true,
      riskLevel: "CRITICAL",
      fileName,
      extension: ext || ".exe",
      doubleExtension: isDoubleExt,
      categoryTitle: `មេរោគកុំព្យូទ័រ Trojan / Telegram Session Stealer & Ransomware (${(ext || ".exe").toUpperCase()})`,
      threatType: "Windows Executable / InfoStealer / Ransomware",
      reasonsKhmer: [
        `ហ្វាល់ "${fileName}" មានកន្ទុយ "${ext}" គឺជាហ្វាល់បញ្ជាប្រតិបត្តិកូដមេរោគដោយផ្ទាល់នៅលើកុំព្យូទ័រ (Windows Executable / Script Hack File)។`,
        isDoubleExt
          ? `ជនឆបោកបានប្រើល្បិចបន្លំកន្ទុយហ្វាល់ ២ ជាន់ (${prevExt}${ext}) ដើម្បីបោកបញ្ឆោតឱ្យអ្នកស្មានថាជាឯកសារ PDF ឬរូបភាពធម្មតា!`
          : `ហ្វាល់ប្រភេទ ${ext} មិនមែនជាឯកសារអត្ថបទ ឬរូបភាពទេ តែជាកម្មវិធីដែលអាចដំណើរការមេរោគស្ងាត់ៗនៅពីក្រោយអេក្រង់ (Background Malware)។`,
        `ជនឆបោកប្រើប្រាស់ហ្វាល់ប្រភេទនេះដើម្បីបញ្ចូលមេរោគ RedLine Stealer, Lumma Stealer ឬមេរោគចាក់សោឯកសារ (Ransomware)។`,
      ],
      whatHappensIfClickedKhmer:
        "ប្រសិនបើអ្នកចុចបើកហ្វាល់នេះ មេរោគនឹងលួចយកហ្វាល់ Telegram Session (tdata) ធ្វើឱ្យជនឆបោកចូលគ្រប់គ្រងគណនី Telegram របស់អ្នកភ្លាមៗដោយមិនចាំបាច់មានលេខកូដ OTP ព្រមទាំងលួចយកលេខសម្ងាត់ទាំងអស់ក្នុង Browser (Facebook, Gmail, ធនាគារ) និងអាចចាក់សោឯកសារទាំងអស់ក្នុងកុំព្យូទ័រជំរិតទារប្រាក់!",
      scammerReprimandKhmer:
        "នែ៎ជនឆបោក! ឈប់ប្រើល្បិចថោកទាបផ្ញើហ្វាល់មេរោគកុំព្យូទ័រមកបំផ្លាញអ្នកដទៃភ្លាម! ប្រព័ន្ធការពារសន្តិសុខរបស់យើងបានរកឃើញល្បិចកលរបស់អ្នកហើយ និងហាមឃាត់មិនឱ្យសមាជិកណាម្នាក់ចាញ់បោកអ្នកជាដាច់ខាត!",
      protectionAdviceKhmer:
        "ហាមចុចទាញយក ឬចុច Double-Click បើកហ្វាល់នេះនៅលើកុំព្យូទ័រ ឬទូរស័ព្ទជាដាច់ខាត! សូមលុបសារនេះចោលភ្លាមៗ។",
    };
  }

  // 3. macOS / Linux Executables
  if ([".dmg", ".pkg", ".app", ".command", ".sh", ".run", ".bin", ".deb", ".rpm", ".elf"].includes(ext)) {
    return {
      isDangerous: true,
      riskLevel: "CRITICAL",
      fileName,
      extension: ext,
      doubleExtension: isDoubleExt,
      categoryTitle: `ហ្វាល់កម្មវិធីគ្រោះថ្នាក់សម្រាប់ Mac / Linux (${ext.toUpperCase()})`,
      threatType: "macOS / Linux Malware Installer",
      reasonsKhmer: [
        `ហ្វាល់ "${fileName}" (${ext}) គឺជាកញ្ចប់ដំឡើងកម្មវិធី ឬកូដបញ្ជាប្រព័ន្ធប្រតិបត្តិការ ដែលជនឆបោកអាចបង្កប់មេរោគលួចទិន្នន័យ (AMOS Stealer / Keylogger)។`,
        `ការដំឡើងកម្មវិធីពីប្រភពមិនស្គាល់នៅក្នុង Telegram អាចធ្វើឱ្យបាត់បង់គណនីសំខាន់ៗ និងទិន្នន័យសម្ងាត់ក្នុងម៉ាស៊ីន។`,
      ],
      whatHappensIfClickedKhmer:
        "ប្រសិនបើចុចបើក វានឹងលួចយក Keychain Passwords, Cookies, គណនី Telegram និងកាបូបលុយអេឡិចត្រូនិកនៅក្នុងម៉ាស៊ីនរបស់អ្នក!",
      scammerReprimandKhmer:
        "នែ៎ជនឆបោក! កុំគិតថាយកហ្វាល់មេរោគមកបន្លំក្នុងគ្រុបនេះរួចខ្លួនឱ្យសោះ! ទង្វើដ៏អាក្រក់នេះត្រូវបានប្រព័ន្ធចាប់បាន និងទប់ស្កាត់ភ្លាមៗ!",
      protectionAdviceKhmer:
        "សូមហាមចុចទាញយក និងហាមបើកដំណើរការហ្វាល់នេះជាដាច់ខាត!",
    };
  }

  // 4. Compressed Archives (.zip, .rar, .7z, .iso, .img, .cab, .tar, .gz)
  if (
    [".zip", ".rar", ".7z", ".iso", ".img", ".vhd", ".vhdx", ".cab", ".tar", ".gz", ".tgz", ".xz", ".bz2"].includes(ext) ||
    lowerMime.includes("zip") ||
    lowerMime.includes("rar") ||
    lowerMime.includes("7z")
  ) {
    return {
      isDangerous: true,
      riskLevel: "HIGH",
      fileName,
      extension: ext || ".zip",
      doubleExtension: isDoubleExt,
      categoryTitle: `ហ្វាល់បង្ហាប់គួរឱ្យសង្ស័យដែលជនឆបោកតែងប្រើលាក់មេរោគ (${(ext || ".zip").toUpperCase()})`,
      threatType: "Suspicious Archive / Potential Hidden Trojan Container",
      reasonsKhmer: [
        `ហ្វាល់ "${fileName}" មានកន្ទុយ "${ext}" គឺជាកញ្ចប់ហ្វាល់បង្ហាប់ (Compressed Archive / Disk Image) ដែលជនឆបោក ៩០% ប្រើប្រាស់សម្រាប់លាក់បាំងមេរោគ (.exe, .scr, .lnk, .apk) នៅខាងក្នុង ដើម្បីគេចពីការស្แกនមេរោគ!`,
        `ជនឆបោកច្រើនដាក់ឈ្មោះហ្វាល់ .zip / .rar ថាជា "វិក្កយបត្រ", "បញ្ជីឈ្មោះ", "រូបថតបែកធ្លាយ", "ឯកសារពិសេស" ឬដាក់លេខសម្ងាត់ (Password) ដើម្បីឱ្យជនរងគ្រោះពន្លា (Extract) ហើយចុចបើកមេរោគខាងក្នុង។`,
      ],
      whatHappensIfClickedKhmer:
        "ប្រសិនបើអ្នកទាញយក ហើយពន្លា (Extract) ចុចបើកហ្វាល់ដែលលាក់នៅខាងក្នុង មេរោគ Trojan នឹងចូលលួចគ្រប់គ្រងគណនី Telegram លួចលេខសម្ងាត់ធនាគារ និងលួចទិន្នន័យសម្ងាត់របស់អ្នកភ្លាមៗ!",
      scammerReprimandKhmer:
        "សូមព្រមានយ៉ាងម៉ឺងម៉ាត់! ប្រព័ន្ធមិនអនុញ្ញាតឱ្យប្រើប្រាស់កញ្ចប់ហ្វាល់ .ZIP / .RAR / .ISO ដើម្បីលាក់បាំងមេរោគបោកប្រាស់សមាជិកក្នុងគ្រុបឡើយ!",
      protectionAdviceKhmer:
        "សូមបងប្អូនហាមចុចទាញយក និងហាមពន្លា (Extract) ហ្វាល់នេះឱ្យសោះ! បើជាឯកសារការងារពិតប្រាកដ សូមផ្ញើជារូបភាព ឬអត្ថបទផ្ទាល់ ជៀសវាងការប្រើកញ្ចប់ .zip/.rar ដែលងាយបង្កប់មេរោគ។",
    };
  }

  // 5. Macro-Enabled Office Documents & HTML Phishing Attachments (.docm, .xlsm, .pptm, .html, .htm)
  if ([".docm", ".dotm", ".xlsm", ".xltm", ".xlam", ".pptm", ".potm", ".ppam", ".htm", ".html"].includes(ext)) {
    const isHtmlPhish = ext === ".htm" || ext === ".html";
    return {
      isDangerous: true,
      riskLevel: "HIGH",
      fileName,
      extension: ext,
      doubleExtension: isDoubleExt,
      categoryTitle: isHtmlPhish
        ? `ហ្វាល់ទំព័រក្លែងក្លាយសម្រាប់លួចលេខសម្ងាត់ Phishing (${ext.toUpperCase()})`
        : `ឯកសារ Office បង្កប់កូដមេរោគ Macro (${ext.toUpperCase()})`,
      threatType: isHtmlPhish ? "HTML Phishing Credential Harvester" : "Malicious Office VBA Macro",
      reasonsKhmer: isHtmlPhish
        ? [
            `ហ្វាល់ "${fileName}" (${ext}) គឺជាទំព័រវេបសាយក្លែងក្លាយ (Fake Login Page) ដែលជនឆបោកផ្ញើជាហ្វាល់ដើម្បីឱ្យអ្នកចុចបើក ហើយបញ្ចូលលេខទូរស័ព្ទ លេខកូដ OTP ឬលេខសម្ងាត់។`,
            `ឯកសារធម្មតាមិនដែលផ្ញើជាទម្រង់ .html នៅក្នុង Telegram ឡើយ!`,
          ]
        : [
            `ហ្វាល់ "${fileName}" (${ext}) មិនមែនជាឯកសារ Word/Excel ធម្មតា (.docx/.xlsx) ទេ ប៉ុន្តែមានអក្សរ "m" នៅចុងក្រោយ ដែលមានន័យថាមានបង្កប់កូដបញ្ជា Macro (VBA Script) ដែលជនឆបោកប្រើសម្រាប់ទាញយកមេរោគចូលម៉ាស៊ីន!`,
          ],
      whatHappensIfClickedKhmer: isHtmlPhish
        ? "នៅពេលអ្នកចុចបើក វានឹងបង្ហាញផ្ទាំងបញ្ចូលគណនីក្លែងក្លាយ ហើយលួចបញ្ជូនលេខសម្ងាត់ និងលេខកូដ OTP របស់អ្នកទៅឱ្យជនឆបោកភ្លាមៗ!"
        : "នៅពេលអ្នកបើកហើយចុច Enable Content/Macro កូដមេរោគនឹងដំណើរការលួចគ្រប់គ្រងកុំព្យូទ័រ និងគណនីរបស់អ្នកភ្លាមៗ!",
      scammerReprimandKhmer:
        "នែ៎ជនឆបោក! ល្បិចបង្កប់កូដមេរោគ និងទំព័រ Phishing ក្នុងឯកសាររបស់អ្នកត្រូវបានប្រព័ន្ធចាប់បានហើយ! យើងខ្ញុំស្ដីបន្ទោស និងហាមឃាត់ទង្វើឆបោកនេះដាច់ខាត!",
      protectionAdviceKhmer:
        "សូមបងប្អូនហាមចុចបើកហ្វាល់នេះឱ្យសោះ និងកុំបញ្ចូលលេខសម្ងាត់ ឬលេខកូដ OTP ណាមួយឡើយ!",
    };
  }

  // 6. Check if caption/filename contains scam / hack keywords even on other extensions
  const scamKeywordsRegex =
    /(?:hack|hacker|cracker|cheat|keygen|patcher|stealer|rat\b|njrat|asyncrat|darkcomet|redline|lumma|vidar|lokibot|keylogger|backdoor|payload|exploit|crypter|ransom|botnet|grabber|trojan|ផ្តល់រង្វាន់|ឈ្នះរង្វាន់|ចុចទីនេះដើម្បីទទួលប្រាក់|បើកប្រាក់រង្វាន់|free\s*usdt|telegram\s*premium\s*free|កម្មវិធីលួច)/i;
  if (scamKeywordsRegex.test(lowerName) || scamKeywordsRegex.test(lowerCaption)) {
    return {
      isDangerous: true,
      riskLevel: "HIGH",
      fileName,
      extension: ext || "(មិនស្គាល់)",
      doubleExtension: isDoubleExt,
      categoryTitle: "ហ្វាល់សង្ស័យពាក់ព័ន្ធនឹងការឆបោក ឬកម្មវិធី Hack",
      threatType: "Suspected Scam / Hack Tool",
      reasonsKhmer: [
        `ឈ្មោះហ្វាល់ ឬខ្លឹមសារភ្ជាប់មកជាមួយ ("${fileName}") មានសញ្ញាណនៃការឆបោក (Scam / Hack / Phishing) ដែលជនខិលខូចប្រើសម្រាប់លួងលោមឱ្យអ្នកប្រើប្រាស់ចុចបើក។`,
      ],
      whatHappensIfClickedKhmer:
        "អាចបណ្តាលឱ្យឆ្លងមេរោគ ឬបាត់បង់គណនី Telegram គណនីធនាគារ និងទិន្នន័យផ្ទាល់ខ្លួនរបស់អ្នក!",
      scammerReprimandKhmer:
        "សូមបញ្ឈប់ការផ្ញើហ្វាល់បោកប្រាស់ ឬកម្មវិធី Hack មិនស្របច្បាប់នៅក្នុងគ្រុបនេះជាបន្ទាន់!",
      protectionAdviceKhmer:
        "សូមបងប្អូនកុំចុចបើក ឬប្រើប្រាស់ហ្វាល់នេះឱ្យសោះដើម្បីសុវត្ថិភាព!",
    };
  }

  return {
    isDangerous: false,
    riskLevel: "SAFE",
    fileName,
    extension: ext || "(គ្មាន)",
    doubleExtension: false,
    categoryTitle: "ឯកសារធម្មតា (មិនរកឃើញកន្ទុយមេរោគគ្រោះថ្នាក់)",
    threatType: "None",
    reasonsKhmer: [],
    whatHappensIfClickedKhmer: "",
    scammerReprimandKhmer: "",
    protectionAdviceKhmer: "ទោះជាយ៉ាងណា សូមពិនិត្យប្រភពអ្នកផ្ញើឱ្យច្បាស់មុននឹងបើកឯកសារណាមួយ។",
  };
}

// Check if a text message in a Group or Chat contains a dangerous Phishing / Scam link or File Hack URL
export function analyzeMessageForScamLinks(text: string): {
  isScamLink: boolean;
  detectedUrl?: string;
  warningReportKhmer?: string;
} {
  if (!text) return { isScamLink: false };
  const urlMatch = text.match(/https?:\/\/[^\s<>"]+/i);
  if (!urlMatch) return { isScamLink: false };

  const url = urlMatch[0];
  const lowerUrl = url.toLowerCase();
  const lowerText = text.toLowerCase();

  // Direct link to dangerous file download (.apk, .exe, .scr, .bat, .msi)
  const directMalwareUrl = /\.(apk|xapk|exe|scr|bat|cmd|msi|vbs|hta|lnk)(\?.*)?$/i.test(lowerUrl);

  // Phishing patterns common in Telegram groups
  const phishingPatterns =
    /(?:telegram.*(?:gift|premium|vote|login|verify|auth)|(?:aba|acleda|wing).*(?:bonus|reward|claim|verify|login)|free-?usdt|airdrop-?claim|ngrok-free\.app|trycloudflare\.com)/i.test(
      lowerUrl
    ) ||
    (/(?:ឈ្នះរង្វាន់|ទទួលបានប្រាក់រង្វាន់|បោះឆ្នោតឱ្យក្មួយ|ចុចលីងនេះដើម្បីទទួល|បញ្ជាក់គណនីធនាគារ|free\s+telegram\s+premium)/i.test(
      lowerText
    ) &&
      /https?:\/\//i.test(lowerText));

  if (!directMalwareUrl && !phishingPatterns) {
    return { isScamLink: false };
  }

  const report = buildSecurityWarningCardMarkdown({
    isDangerous: true,
    riskLevel: "CRITICAL",
    fileName: url.slice(0, 65),
    extension: directMalwareUrl ? "តំណភ្ជាប់ទាញយកមេរោគផ្ទាល់" : "តំណភ្ជាប់វេបសាយឆបោក (Phishing Link)",
    doubleExtension: false,
    categoryTitle: directMalwareUrl
      ? "តំណភ្ជាប់ទាញយកហ្វាល់មេរោគ (Malicious File Download Link)"
      : "តំណភ្ជាប់វេបសាយក្លែងក្លាយលួចគណនី (Phishing / Scam Link)",
    threatType: "Phishing / Malware URL",
    reasonsKhmer: [
      `តំណភ្ជាប់ "${url.slice(0, 60)}" ត្រូវបានរកឃើញថាជាតំណភ្ជាប់គ្រោះថ្នាក់ដែលជនឆបោកប្រើសម្រាប់លួចគណនី Telegram ឬទាញយកមេរោគចូលទូរស័ព្ទ/កុំព្យូទ័រ។`,
      `ជនឆបោកតែងតែប្រើល្បិចឱ្យចុចលីងដើម្បីបោះឆ្នោត ទទួលរង្វាន់ Telegram Premium ក្លែងក្លាយ ឬបញ្ជាក់គណនីធនាគារ។`,
    ],
    whatHappensIfClickedKhmer:
      "ប្រសិនបើអ្នកចុចចូលលីងនេះ ហើយវាយលេខទូរស័ព្ទ និងលេខកូដ OTP ឬទាញយកហ្វាល់ពីលីងនេះ ជនឆបោកនឹងលួចគ្រប់គ្រងគណនី Telegram និងគណនីធនាគាររបស់អ្នកភ្លាមៗ!",
    scammerReprimandKhmer:
      "នែ៎ជនឆបោក! ឈប់យកលីងបោកប្រាស់ (Phishing Link) មកដាក់ក្នុងគ្រុបនេះឱ្យសោះ! ប្រព័ន្ធការពារសន្តិសុខរបស់យើងបានចាប់បាន និងព្រមានសមាជិកទាំងអស់មិនឱ្យចាញ់បោកអ្នកជាដាច់ខាត!",
    protectionAdviceKhmer:
      "ហាមចុចលើតំណភ្ជាប់ (Link) នេះដាច់ខាត! ហាមវាយលេខទូរស័ព្ទ ឬលេខកូដសម្ងាត់ ៥ ខ្ទង់របស់ Telegram ទៅក្នុងវេបសាយណាមួយឡើយ។",
  });

  return {
    isScamLink: true,
    detectedUrl: url,
    warningReportKhmer: report,
  };
}

// Build a complete, structured Khmer Security Alert Report with SVG Shield Diagram
// so both the Web App and Telegram Bot render an authoritative Visual Warning Card!
export function buildSecurityWarningCardMarkdown(
  analysis: FileSecurityAnalysis,
  options?: {
    senderName?: string;
    wasAutoDeletedInGroup?: boolean;
    isGroupChat?: boolean;
  }
): string {
  const senderLabel = options?.senderName ? ` (ផ្ញើដោយ៖ ${options.senderName})` : "";
  const deletionNotice = options?.wasAutoDeletedInGroup
    ? "✅ ប្រព័ន្ធបានលុបហ្វាល់គ្រោះថ្នាក់នេះចោលជាបន្ទាន់ដោយស្វ័យប្រវត្តិរួចរាល់ហើយ (ទាំងក្នុងឆាតផ្ទាល់ខ្លួន និងក្នុងគ្រុប)!"
    : options?.isGroupChat
    ? "⚠️ សូម Admin គ្រុបលុបហ្វាល់នេះចោលភ្លាមៗ (សូមដំឡើងសិទ្ធិឱ្យ Bot ជា Admin 'Delete messages' ដើម្បីលុបស្វ័យប្រវត្តិ)!"
    : "✅ ប្រព័ន្ធបានទប់ស្កាត់ និងលុបហ្វាល់គ្រោះថ្នាក់នេះចោលជាបន្ទាន់រួចរាល់ហើយ!";

  const safeFileNameSvg = analysis.fileName
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 32);

  const safeExtSvg = (analysis.extension || "HACK FILE")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .toUpperCase();

  const securitySvg = `<svg viewBox="0 0 500 240" width="100%" height="240" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="484" height="224" rx="14" fill="#1a0b12" stroke="#f43f5e" stroke-width="2.5"/>
    <rect x="24" y="22" width="452" height="36" rx="8" fill="#3b0c1c" stroke="#fb7185" stroke-width="1.2"/>
    <text x="250" y="46" text-anchor="middle" fill="#fda4af" font-size="15" font-weight="bold">ការព្រមានសន្តិសុខ៖ ហាមចុចបើកហ្វាល់មេរោគ (BLOCKED HACK FILE)</text>
    <path d="M95 75 L145 92 L145 142 C145 175 120 198 95 210 C70 198 45 175 45 142 L45 92 Z" fill="#3b0c1c" stroke="#f43f5e" stroke-width="3"/>
    <line x1="75" y1="122" x2="115" y2="162" stroke="#fb7185" stroke-width="4" stroke-linecap="round"/>
    <line x1="115" y1="122" x2="75" y2="162" stroke="#fb7185" stroke-width="4" stroke-linecap="round"/>
    <rect x="175" y="76" width="295" height="132" rx="10" fill="#261019" stroke="#f43f5e" stroke-width="1.5" stroke-dasharray="6,4"/>
    <text x="192" y="104" fill="#f43f5e" font-size="14" font-weight="bold">ហ្វាល់គ្រោះថ្នាក់៖ ${safeFileNameSvg}</text>
    <text x="192" y="132" fill="#fbbf24" font-size="13.5" font-weight="bold">ប្រភេទមេរោគ៖ ${safeExtSvg} (គ្រោះថ្នាក់ ១០០%)</text>
    <text x="192" y="160" fill="#38bdf8" font-size="13">ការការពារ៖ ហាមទាញយក និងហាមចុចបើកដាច់ខាត!</text>
    <text x="192" y="188" fill="#4ade80" font-size="13" font-weight="bold">ស្ថានភាព៖ ត្រូវបានចាប់សញ្ញា និងលុបចោលដោយ AI</text>
  </svg>`;

  return [
    `### 🛡️ ប្រព័ន្ធការពារសន្តិសុខ និងប្រឆាំង File Hack របស់ជនឆបោក`,
    `• 😠 **ការស្ដីបន្ទោស និងព្រមានដាច់ខាត៖** ⛔ **ហាមឃាត់ដាច់ខាត! សូមបងប្អូនកុំចុចទាញយក (Download) ឬចុចបើកដំណើរការហ្វាល់ \`${analysis.fileName}\`${senderLabel} នេះឱ្យសោះ!** ${analysis.scammerReprimandKhmer}`,
    `• 📝 **បម្រាប់ប្រធាន និងព័ត៌មានហ្វាល់គ្រោះថ្នាក់៖** ឈ្មោះហ្វាល់៖ \`${analysis.fileName}\` | កន្ទុយហ្វាល់៖ \`${analysis.extension}\` | កម្រិតគ្រោះថ្នាក់៖ **${analysis.categoryTitle}**។ ${deletionNotice}`,
    `• 📐 **តាមរូបមន្តសន្តិសុខ (មូលហេតុដែលហ្វាល់នេះជា File Hack)៖** ${analysis.reasonsKhmer.join(" ")}`,
    `• 🔢 **ដំណោះស្រាយ និងផលវិបាកប្រសិនបើច្រឡំចុចបើក៖** ${analysis.whatHappensIfClickedKhmer}`,
    `• 🎯 **ដូចនេះ (វិធានការការពារសុវត្ថិភាព)៖** ${analysis.protectionAdviceKhmer}`,
    `🇬🇧 English: Security Alert! The dangerous file "${analysis.fileName}" (${analysis.threatType}) has been blocked and deleted immediately to protect your account and device.`,
    securitySvg,
  ].join("\n");
}

// ============================================================================
// INAPPROPRIATE / OBSCENE SPEECH, PHOTO & VIDEO DETECTOR & AUTO-DELETER
// Blocks, deletes immediately (in both private chat & group chat), and strongly
// scolds the sender for any obscene/pornographic/vulgar words, photos, or videos!
// ============================================================================
export interface InappropriateContentAnalysis {
  isInappropriate: boolean;
  violationType: "obscene_media" | "obscene_speech" | "profanity_insult" | "none";
  mediaKind: "video" | "photo" | "text";
  categoryKhmer: string;
  categoryEnglish: string;
  detectedTrigger: string;
}

const OBSCENE_AND_PROFANE_REGEX =
  /(?:អាសអាភាស|រូបអាសអាភាស|វីដេអូអាសអាភាស|រូបស្រាត|វីដេអូស្រាត|រូបសិច|វីដេអូសិច|មើលសិច|រឿងសិច|រូបភាព\s*18\+|វីដេអូ\s*18\+|ក្ត\b|ក្ដ\b|កណ្ដួយ|កណ្តួយ|ចុយ\b|ចុយម្រាយ|ចុយម៉ែ|មីសំផឹង|មីស្រីខូច|អាចុយ|មីចុយ|អាឆ្កួត|អាល្ងង់|មីឆ្កួត|អាថោក|អាភ្លើ|មីថោក|អាសត្វ|ឆ្កែស៊ី|អាថោកទាប|\b(?:fuck|fucking|motherfucker|shit|bitch|asshole|dick|cock|pussy|cunt|whore|slut|porn|porno|pornography|xxx|nsfw|nude|nudes|naked|hentai|sex\s*video|sex\s*tape|blowjob|handjob|onlyfans|xvideos|pornhub|xnxx|redtube|jav\s*hd|18\+\s*(?:video|photo|pic|clip)|chuy\s*mray|kduy|ah\s*chkuot|mi\s*chkuot)\b)/i;

const OBSCENE_MEDIA_KEYWORD_REGEX =
  /(?:អាសអាភាស|រូបស្រាត|វីដេអូស្រាត|រូបសិច|វីដេអូសិច|មើលសិច|រឿងសិច|18\+|porn|porno|xxx|nsfw|nude|nudes|naked|hentai|sex\s*video|sex\s*tape|onlyfans|xvideos|pornhub|xnxx|jav)/i;

export function analyzeInappropriateOrObsceneContent(
  text: string,
  options?: {
    hasPhoto?: boolean;
    hasVideo?: boolean;
    fileName?: string;
    mimeType?: string;
  }
): InappropriateContentAnalysis {
  const combinedText = `${text || ""} ${options?.fileName || ""}`.trim();
  const match = combinedText.match(OBSCENE_AND_PROFANE_REGEX);

  if (!match) {
    return {
      isInappropriate: false,
      violationType: "none",
      mediaKind: options?.hasVideo ? "video" : options?.hasPhoto ? "photo" : "text",
      categoryKhmer: "",
      categoryEnglish: "",
      detectedTrigger: "",
    };
  }

  const trigger = match[0];
  const isObsceneSexual = OBSCENE_MEDIA_KEYWORD_REGEX.test(combinedText);
  const isVideo =
    Boolean(options?.hasVideo) ||
    /(?:វីដេអូ|video|clip|mp4|mov|sex\s*video|sex\s*tape|វីដេអូសិច|វីដេអូអាសអាភាស|វីដេអូស្រាត)/i.test(
      combinedText
    );
  const isPhoto =
    !isVideo &&
    (Boolean(options?.hasPhoto) ||
      /(?:រូបថត|រូបភាព|រូបស្រាត|រូបសិច|រូបអាសអាភាស|photo|pic|image|nude|nudes|naked)/i.test(
        combinedText
      ));

  const mediaKind: "video" | "photo" | "text" = isVideo ? "video" : isPhoto ? "photo" : "text";
  const categoryKhmer =
    mediaKind === "video"
      ? "វីដេអូអាសអាភាស ឬមិនសមរម្យ (Obscene / Inappropriate Video)"
      : mediaKind === "photo"
      ? "រូបថតអាសអាភាស ឬមិនសមរម្យ (Obscene / Inappropriate Photo)"
      : isObsceneSexual
      ? "ពាក្យសម្ដីអាសអាភាស (Obscene / Explicit Language)"
      : "ពាក្យសម្ដីមិនសមរម្យ និងជេរប្រមាថ (Inappropriate / Abusive Speech)";

  const categoryEnglish =
    mediaKind === "video"
      ? "Obscene / Inappropriate Video"
      : mediaKind === "photo"
      ? "Obscene / Inappropriate Photo"
      : isObsceneSexual
      ? "Obscene / Explicit Language"
      : "Inappropriate / Abusive Language";

  return {
    isInappropriate: true,
    violationType: isObsceneSexual
      ? mediaKind === "text"
        ? "obscene_speech"
        : "obscene_media"
      : "profanity_insult",
    mediaKind,
    categoryKhmer,
    categoryEnglish,
    detectedTrigger: trigger,
  };
}

export function buildInappropriateContentWarningMarkdown(
  analysis: InappropriateContentAnalysis,
  options?: {
    senderName?: string;
    isGroupChat?: boolean;
    wasDeleted?: boolean;
  }
): string {
  const sender = options?.senderName || "អ្នកប្រើប្រាស់";
  const chatScopeKhmer = options?.isGroupChat ? "ក្នុងគ្រុប (Group Chat)" : "ក្នុងឆាតផ្ទាល់ខ្លួន (Private Chat)";
  const chatScopeEn = options?.isGroupChat ? "in this group chat" : "in this private chat";
  const mediaLabelKh =
    analysis.mediaKind === "video"
      ? "វីដេអូមិនសមរម្យ/អាសអាភាស"
      : analysis.mediaKind === "photo"
      ? "រូបថតមិនសមរម្យ/អាសអាភាស"
      : "ពាក្យសម្ដីមិនសមរម្យ/អាសអាភាស";

  const warningSvg = `<svg viewBox="0 0 500 220" width="100%" height="220" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="484" height="204" rx="14" fill="#1a0b12" stroke="#f43f5e" stroke-width="2.5"/>
    <rect x="24" y="20" width="452" height="36" rx="8" fill="#4c0519" stroke="#fb7185" stroke-width="1.2"/>
    <text x="250" y="43" text-anchor="middle" fill="#fda4af" font-size="14.5" font-weight="bold">🚫 ទប់ស្កាត់ និងលុបចោលបន្ទាន់ (BLOCKED &amp; DELETED)</text>
    <circle cx="92" cy="134" r="44" fill="#3b0c1c" stroke="#f43f5e" stroke-width="3.5"/>
    <line x1="62" y1="104" x2="122" y2="164" stroke="#fb7185" stroke-width="5" stroke-linecap="round"/>
    <rect x="158" y="72" width="316" height="122" rx="10" fill="#261019" stroke="#f43f5e" stroke-width="1.5" stroke-dasharray="6,4"/>
    <text x="174" y="100" fill="#f43f5e" font-size="13.5" font-weight="bold">ប្រភេទល្មើស៖ ${analysis.mediaKind.toUpperCase()} (${analysis.categoryEnglish})</text>
    <text x="174" y="128" fill="#fbbf24" font-size="13" font-weight="bold">ចំណាត់ការ៖ បានលុបចោលជាបន្ទាន់ (${options?.isGroupChat ? "Group" : "Private"})</text>
    <text x="174" y="156" fill="#38bdf8" font-size="12.5">វិន័យប្រព័ន្ធ៖ ហាមដាច់ខាតពាក្យ វីដេអូ ឬរូបអាសអាភាស!</text>
    <text x="174" y="180" fill="#4ade80" font-size="12.5" font-weight="bold">ស្ថានភាព៖ ត្រូវបានលុប និងព្រមានយ៉ាងម៉ឺងម៉ាត់ដោយ AI</text>
  </svg>`;

  return [
    `### 🚫 ការទប់ស្កាត់ លុបចោលបន្ទាន់ និងស្ដីបន្ទោសយ៉ាងខ្លាំង (Content Blocked & Deleted)`,
    `• 😠 **ការស្ដីបន្ទោសយ៉ាងខ្លាំងទៅលើអ្នកផ្ញើ (${sender})៖** នែ៎ **${sender}**! ហេតុអ្វីបានជាអ្នកហ៊ានផ្ញើ **${mediaLabelKh}** ចូលមក${chatScopeKhmer}បែបនេះ?! ទង្វើនេះជាការខ្វះសីលធម៌ មិនគោរពវិន័យ និងបំពានគោលការណ៍សុវត្ថិភាពយ៉ាងធ្ងន់ធ្ងរ! ប្រព័ន្ធបាន **លុបចោលជាបន្ទាន់** នូវ${mediaLabelKh}របស់អ្នករួចរាល់ហើយ សូមបញ្ឈប់ទង្វើមិនសមរម្យនេះភ្លាម!`,
    `• 🗑️ **ចំណាត់ការបន្ទាន់៖** បានលុបចោល **${analysis.categoryKhmer}** ចេញពី${chatScopeKhmer}ភ្លាមៗដោយស្វ័យប្រវត្តិ។`,
    `🇬🇧 English Warning: Hey **${sender}**! Sending **${analysis.categoryEnglish}** is strictly prohibited and unacceptable! Your offending ${analysis.mediaKind} has been **immediately deleted** ${chatScopeEn}, and you are strictly warned not to repeat this behavior!`,
    warningSvg,
  ].join("\n");
}

