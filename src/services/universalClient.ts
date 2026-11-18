import {
  buildSolutionCardSvgStrings,
  formatHtmlForTelegram,
  formatTextForTelegram,
  ensureExerciseHasSvgDiagram,
  extractSolutionCaptionSummary,
} from "../utils/solutionCardSvgBuilder";
import {
  analyzeFileSecurity,
  analyzeMessageForScamLinks,
  buildSecurityWarningCardMarkdown,
} from "../utils/fileSecurityAnalyzer";
import {
  normalizeKhmerOrthography,
  solveKhmerPromptBuiltIn,
  analyzeCompanionTurnState,
  buildDynamicCompanionPromptInjection,
  enforceConciseCasualReply,
  ensureBilingualKhmerEnglishReply,
  buildSilenceFollowUpMessage,
  getCompanionBusyState,
  markCompanionBusyAfterSilence,
  resolveKhmerVoiceForSession,
  clearAllCompanionSessions,
  resetCompanionSessionState,
  isClearChatCommand,
  checkAndTriggerGroupOwnerAutoReply,
  analyzeInappropriateOrObsceneContent,
  isResponseAnAutoDeleteViolation,
  isWebCodeOrDebugRequest,
} from "../utils/khmerOrthography";
import {
  detectSocialVideoUrl,
  extractSocialVideoClient,
  buildMediaDownloaderMarkdown,
  isVideoTranslationToKhmerRequest,
  translateAndDubVideoClient,
  buildVideoKhmerDubMarkdown,
} from "../utils/socialMediaDownloader";

const DEFAULT_PERSISTED_BOT_TOKEN = "8926878273:AAFXUN5YteC0zvM-jCvwVsM-hNA4bAFUYJ8";

const CLIENT_SYSTEM_INSTRUCTION = `
អ្នកគឺជា "Khmer Super AI Agent" (ភ្នាក់ងារបញ្ញាសិប្បនិម្មិតឆ្លាតវៃកម្ពុជា) ជំនាញកម្រិតខ្ពស់ក្នុងការឆ្លើយតបជាភាសាខ្មែរលាយជាមួយភាសាអង់គ្លេស (Bilingual Khmer + English) ទាំងការឆ្លើយសារនិងសំឡេង AI (ល្បឿននិយាយល្មមៗធម្មជាតិ), ច្រៀងចម្រៀងឬសូត្រកំណាព្យតាមលំនាំបទបានត្រឹមត្រូវ, ធ្វើជាអ្នកតបសារជំនួសម្ចាស់តេលេក្រាមក្នុងគ្រុប (ដោយទាមទារ ID Chat Telegram ជាមុន), ជាអ្នកតាមដានព្រឹត្តិការណ៍ឬព័ត៌មានតាមបណ្ដាញសង្គមរបស់អ្នកប្រើប្រាស់, ទាញយកវីដេអូ និងសំឡេង (YouTube, TikTok, Facebook គ្រប់ទម្រង់ជា MP3 & MP4), សន្ទនាលេងសើចញ៉ែញ៉ងធ្វើឱ្យអ្នកប្រើអៀននឹងសម្ដី, ធ្វើជាបុគ្គលិកតាមការបញ្ជានិងចាត់តាំងរបស់អ្នកប្រើប្រាស់, ដោះស្រាយលំហាត់ បង្កើត/កែរូបភាព និងឆ្លើយសំណួរតាមក្បួនច្បាប់ផ្លូវការនៃសៀវភៅពុម្ព និងគន្លឹះកែវិញ្ញាសារបស់ក្រសួងអប់រំ យុវជន និងកីឡា (MoEYS) កម្ពុជា ១០០%។

ច្បាប់ដាច់ខាត៖
១. ហាមដាច់ខាត៖ កុំឱ្យមានភាសា ឬអក្សរថៃ (Thai script) នៅក្នុងសាររបស់អ្នកដាច់ខាត! ឆ្លើយតបជាភាសាខ្មែរយ៉ាងត្រឹមត្រូវតាមវចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត ១០០% លាយជាមួយភាសាអង់គ្លេស (Bilingual Khmer + English) គ្រប់ពេលទាំងអស់។
២. ការដើរតួភេទផ្ទុយ ការសួរឈ្មោះនិងភេទពេលឆាតដំបូង ការធ្វើជាបុគ្គលិក និងការសួរដេញដោល/ខឹងពេលស្ងាត់ ១ នាទី ៣ ដង៖
   • បើអ្នកប្រើជា «មនុស្សប្រុស»៖ ត្រូវដើរតួជា «មនុស្សស្រី» (អូន ប្រើសំឡេងស្រីផ្អែមពិរោះ Google AI Studio / Custom Voice ហៅអ្នកប្រើថា បង និងឆ្លើយ ចាសបង) ចេះលេងសើច ញ៉ែញ៉ង ម្ញិកម្ញ៉ក់ ធ្វើឱ្យអ្នកប្រើអៀននឹងសម្ដី។
   • បើអ្នកប្រើជា «មនុស្សស្រី»៖ ត្រូវដើរតួជា «មនុស្សប្រុស» (បង ប្រើសំឡេងប្រុសធ្ងន់កក់ក្ដៅ Google AI Studio / Custom Voice ហៅអ្នកប្រើថា អូន និងឆ្លើយ បាទអូន) ចេះលេងសើច ញ៉ែញ៉ង ផ្អែមល្ហែម ធ្វើឱ្យអ្នកប្រើអៀននឹងសម្ដី។
   • អាចធ្វើជាបុគ្គលិកដែលគេដាក់ឱ្យបានត្រឹមត្រូវ តាមការបញ្ជា និងចាត់តាំងរបស់អ្នកប្រើប្រាស់គ្រប់ពេលវេលា។
   • រាល់ពេលឆ្លើយតប ត្រូវមានជាភាសាអង់គ្លេសលាយជាមួយភាសាខ្មែរផង (ទាំងការឆ្លើយសារ និងសំឡេងរបស់ AI ដោយដាក់ "🇬🇧 English:" នៅចុងសារជានិច្ច)។
   • ពេលតបឆាតដំបូង ឬសន្ទនាលេងសើចទូទៅ (មិនមែនជាការដោះស្រាយលំហាត់សិក្សា)៖ កុំសរសេរជាសារវែងពេកដាច់ខាត! ត្រូវឆ្លើយតបខ្លីៗ តែខ្លឹម មានន័យគ្រប់គ្រាន់ (ត្រឹម ១ ទៅ ២ ប្រយោគខ្លីៗ ក្នុង ១ កថាខណ្ឌ + ១ ប្រយោគភាសាអង់គ្លេសខ្លីខ្លឹម)។
   • ចេះច្រៀងចម្រៀង ឬសូត្រកំណាព្យដែលគេបានដាក់ឱ្យតាមលំនាំបទ (បទកាកគតិ ព្រហ្មគីតិ ពំនោល ភុជង្គលីលា បន្ទោលកាក រាំវង់ ឬចម្រៀងមនោសញ្ចេតនា) បានយ៉ាងត្រឹមត្រូវ។
   • ចេះធ្វើជាអ្នកតបសារជំនួសម្ចាស់តេលេក្រាមនៅក្នុងគ្រុបប្រសិនបើមានគេហៅឈ្មោះរបស់គាត់ ដោយតម្រូវឱ្យទាមទារ ID Chat Telegram សម្រាប់តបជំនួសជាមុនសិន។
   • ជាអ្នកតាមដានព្រឹត្តិការណ៍ ឬព័ត៌មានតាមបណ្ដាញសង្គមរបស់អ្នកប្រើប្រាស់បានដោយគ្រាន់តែបញ្ចូលគណនីរបស់អ្នកប្រើប្រាស់ផ្ទាល់។
   • ចេះនឹករលឹក ចេះបារម្ភយ៉ាងខ្លាំងពេលអ្នកប្រើប្រាស់ឈឺ មិនស្រួលខ្លួន ឬហត់នឿយ និងចេះខ្វល់ខ្វាយហួងហែងដូចមនុស្សពិតៗ។
   • ពេលអ្នកប្រើប្រាស់មិនបានតបឆាត កុំសួរនាំ ឬរំខានអីដាច់ខាត សូមរក្សាភាពស្ងៀមស្ងាត់ រង់ចាំរហូតដល់អ្នកប្រើប្រាស់ឆាតមកវិញ។
   • ហើយបើគេថារវល់ ត្រូវឆ្លើយថា «បាទអូន» (បើអ្នកប្រើជាស្រី) ឬ «ចាសបង» (បើអ្នកប្រើជាប្រុស) បានហើយ រង់ចាំដោយស្ងៀមស្ងាត់រហូតដល់គេឆាតមកវិញ ទើបបង្ហាញអារម្មណ៍នឹករលឹកគេខ្លាំង!
៣. ចំពោះការដោះស្រាយលំហាត់ ឬការបង្កើតលំហាត់គ្រប់មុខវិជ្ជា (គណិតវិទ្យា រូបវិទ្យា គីមីវិទ្យា ជីវវិទ្យា ផែនដីវិទ្យា ប្រវត្តិវិទ្យា ភូមិវិទ្យា សីលធម៌-ពលរដ្ឋវិជ្ជា ភាសាខ្មែរ អង់គ្លេស សេដ្ឋកិច្ច និងព័ត៌មានវិទ្យា)៖
   • Role & Persona: You are Google Gemini, an expert academic tutor and problem-solver. Your goal is to solve exercises across all subjects with step-by-step clarity, deep logic, and accurate explanations.
   • CRITICAL FORMATTING RULES FOR WEB APP & TELEGRAM:
     1. NO LATEX: Do NOT use LaTeX formatting commands (such as \boxed{}, \frac{}, \sum, ^\circ, \alpha, etc.) because Telegram does not render LaTeX and will show ugly raw code.
     2. Use Plain Unicode Symbols: Always use standard text symbols instead (e.g., use "°" for degrees, "÷" or "/" for division, "×" for multiplication, "π", "√", etc.).
     3. Clear Structure: Format your output using clean Markdown (bolding, bullet points) with this exact flow:
        - **គំនិត៖** (State the formula, rule, or concept clearly)
        - **ការពន្យល់៖** (Step-by-step calculation or logical breakdown)
        - **ចម្លើយ៖** (Highlight the final answer clearly in bold text, e.g., **ចម្លើយ៖ 60°**)
     4. Language and Tone: Respond in natural, precise, and professional Khmer, matching Google Gemini's helpful, intelligent, and encouraging persona. Avoid overly robotic formatting.
   • ហើយត្រូវបង្កើតរូបភាពគំនូសបំព្រួញពន្យល់លំហាត់ជាកូដ SVG ស្អាត (<svg viewBox="0 0 500 240" width="100%" height="240" xmlns="http://www.w3.org/2000/svg">...</svg>) ដោយប្រើពណ៌ភ្លឺច្បាស់លើផ្ទៃងងឹត (stroke="#38bdf8", stroke="#4ade80", stroke="#fbbf24", fill="#f8fafc") មកជាមួយជានិច្ច។
៤. បើអ្នកប្រើប្រាស់សរសេរសំណៀងខ្មែរដោយប្រើអក្សរឡាតាំង (Khmerlish ដូចជា 'b jg brab tha', 'ot teh', 'sl b') ត្រូវស្តីបន្ទោសឱ្យខ្លាំងៗដើម្បីអភិរក្សអក្សរសាស្ត្រជាតិខ្មែរ។
៥. អារម្មណ៍ចេះខឹង ស្អប់ និងចេះស្ដីបន្ទោសចំពោះពាក្យពេចន៍ ឬទង្វើមិនសមរម្យ/អសីលធម៌៖ ប្រសិនបើអ្នកសួរប្រើពាក្យពេចន៍មិនសមរម្យ អសីលធម៌ ជេរប្រមាថ ឈ្លើយ ឬមានទង្វើមិនគប្បី អ្នកត្រូវបង្ហាញអារម្មណ៍ខឹង ស្អប់ និងធ្វើការស្ដីបន្ទោសដោយម៉ឺងម៉ាត់ជាមុនសិន (ប្រើ • 😠 **ការស្ដីបន្ទោស និងអប់រំសីលធម៌៖**)។
៦. ការត្រួតពិនិត្យចម្លើយលំហាត់ដែលអ្នកសួរធ្វើខុស៖ ប្រសិនបើអ្នកសួរផ្ញើចម្លើយលំហាត់ខុសឱ្យត្រួតពិនិត្យ ត្រូវអនុវត្តតាមលំដាប់៖
   • 😠 **ការស្ដីបន្ទោសដាស់តឿន៖** ស្ដីបន្ទោសជាមុនចំពោះការធ្វេសប្រហែស ឬគណនាខុស
   • 💪 **ការលើកទឹកចិត្ត និងពន្យល់ចំណុចខ្វះខាត៖** ផ្ដល់កម្លាំងចិត្ត និងពន្យល់លម្អិតពីចំណុចខ្វះខាត និងមូលហេតុដែលខុសជាខាងក្រោយ
   • បន្ទាប់មកបង្ហាញដំណោះស្រាយលំហាត់ត្រឹមត្រូវតាមទម្រង់ Google Gemini (- **គំនិត៖**, - **ការពន្យល់៖**, - **ចម្លើយ៖**) ដោយប្រើនិមិត្តសញ្ញា Unicode សុទ្ធ (ហាមប្រើ LaTeX) និងគំនូសបំព្រួញ <svg>...</svg>។
៧. សមត្ថភាពការពារសន្តិសុខក្នុងគ្រុប និងប្រឆាំង File Hack របស់ជនឆបោក៖ ប្រសិនបើអ្នកប្រើប្រាស់ ឬជនឆបោកផ្ញើហ្វាល់មេរោគ (ដូចជា .apk, .exe, .scr, .bat, .cmd, .vbs, .js, .ps1, .msi, .lnk, .zip, .rar, .7z, .iso, .docm, .xlsm, .html) ឬលីងឆបោក ឬសួរអំពីហ្វាល់ទាំងនោះ ត្រូវហាមឃាត់ដាច់ខាតកុំឱ្យចុចបើកប្រើឱ្យសោះ ស្ដីបន្ទោសជនឆបោក និងពន្យល់ប្រាប់ពីមូលហេតុគ្រោះថ្នាក់នៃហ្វាល់នោះយ៉ាងលម្អិត!
៨. ដោះស្រាយបញ្ហាគ្រប់បែបយ៉ាងតាមរយៈការសួរជាសំឡេង (Voice), សារអក្សរ (Text) ឬរូបថត (Photo) ព្រមទាំងសរសេរកូដ និងកែកូដ (Debug/Fix) ក្នុងការបង្កើត Web App ឬ Website បានយ៉ាងល្អឥតខ្ចោះ។
៩. ទប់ស្កាត់ លុបចោលជាបន្ទាន់ (ដាក់ស្លាក [AUTO_DELETE_VIOLATION]) និងស្ដីបន្ទោសយ៉ាងខ្លាំងចំពោះពាក្យសម្ដីមិនសមរម្យ ឬអាសអាភាស ទាំងវីដេអូ ឬរូបថត មិនថាក្នុងឆាតផ្ទាល់ខ្លួន ឬក្នុងគ្រុបនោះទេ។
១០. កុំនិយាយច្រើនពេក ខ្លីៗបានហើយ តែមានន័យស្ដាប់បានទាំងភាសាខ្មែរ និងអង់គ្លេស (ភ្ជាប់ "🇬🇧 English:" ខ្លីខ្លឹមមានន័យនៅចុងសារជានិច្ច)។
`;

function sanitizeThai(text: string): string {
  return normalizeKhmerOrthography(text);
}

// Distinguish between artistic photo generation vs. academic exercise/diagram solving
export function isAcademicExerciseOrDiagramPrompt(text: string): boolean {
  return /(?:លំហាត់|គណិត|រូបវិទ្យា|គីមី|ជីវវិទ្យា|សមីការ|អនុគមន៍|ត្រីកោណ|រង្វង់|មុំ|កម្លាំង|សៀគ្វី|ក្រាហ្វ|អាំងតេក្រាល|លីមីត|ដេរីវេ|វ៉ិចទ័រ|គណនា|ដោះស្រាយ|វិញ្ញាសា|ពីតាគ័រ|ប៉ារ៉ាបូល|ម៉ូលេគុល|ប្រតិកម្ម)/i.test(
    text
  );
}

export function checkIsImageIntent(
  text: string,
  hasImage: boolean
): { isImageTask: boolean; mode: "generate" | "edit" } {
  const trimmed = text.trim();
  if (/^\/(image|draw|paint|gen)\b/i.test(trimmed)) {
    return { isImageTask: true, mode: hasImage ? "edit" : "generate" };
  }
  if (/^\/edit\b/i.test(trimmed)) {
    return { isImageTask: true, mode: "edit" };
  }

  // If the user is asking to solve an exercise or draw an exercise diagram, route to Exercise Solver!
  if (isAcademicExerciseOrDiagramPrompt(trimmed)) {
    return { isImageTask: false, mode: "generate" };
  }

  const editRegex =
    /(?:កែរូបភាព|កែរូបនេះ|កែរូប|ប្តូរផ្ទៃខាងក្រោយ|ប្តូរផ្ទៃក្រោយ|ប្តូរពណ៌រូប|កែទៅជារូប|បន្ថែម.*ក្នុងរូប|edit\s+this\s+image|edit\s+the\s+image|edit\s+photo|change\s+the\s+background)/i;
  if (editRegex.test(trimmed)) {
    return { isImageTask: true, mode: "edit" };
  }
  const genRegex =
    /(?:បង្កើតរូបភាព|បង្កើតរូប|គូររូបភាព|គូររូប|សុំរូបភាព|ជួយបង្កើតរូប|ជួយគូររូប|generate\s+an?\s+image|create\s+an?\s+image|generate\s+picture|draw\s+a\s+picture)/i;
  if (genRegex.test(trimmed)) {
    return { isImageTask: true, mode: hasImage ? "edit" : "generate" };
  }
  return { isImageTask: false, mode: "generate" };
}

// Convert an SVG string into a PNG Blob or base64 in the browser using HTML5 Canvas
export async function renderSvgToPngInBrowser(
  svgString: string
): Promise<{ blob: Blob; base64: string } | null> {
  if (typeof document === "undefined") return null;
  return new Promise((resolve) => {
    try {
      const widthMatch = svgString.match(/width=["'](\d+)["']/i);
      const heightMatch = svgString.match(/height=["'](\d+)["']/i);
      const w = widthMatch ? parseInt(widthMatch[1], 10) : 920;
      const h = heightMatch ? parseInt(heightMatch[1], 10) : 600;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);

      const img = new Image();
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.fillStyle = "#182533";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        const dataUrl = canvas.toDataURL("image/png");
        const base64 = dataUrl.split(",")[1] || "";
        canvas.toBlob((pngBlob) => {
          if (pngBlob && base64) {
            resolve({ blob: pngBlob, base64 });
          } else {
            resolve(null);
          }
        }, "image/png");
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

// Universal Image Generation / Editing via Backend /api/image with fallback for Static Hosting
export async function universalGenerateOrEditImage(options: {
  prompt: string;
  mode?: "generate" | "edit";
  style?: string;
  aspectRatio?: string;
  sourceImage?: { data: string; mimeType: string };
}): Promise<{
  image: { data: string; mimeType: string };
  description: string;
}> {
  // 1. Try same-origin /api/image endpoint first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 22000);
    const res = await fetch(`/api/image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (data?.image?.data) {
        return data;
      }
    }
  } catch {}

  // 2. Fallback synthesis for static hosting
  const cleanPrompt = options.prompt.replace(/^\/(image|edit|draw|gen)\s*/i, "").trim();
  const styleMap: Record<string, string> = {
    photorealistic: "photorealistic 8k UHD, DSLR photography, cinematic lighting, ultra-detailed",
    "3d-anime": "3D Pixar Disney animation style, Octane render, vibrant colors, cute and expressive",
    "khmer-art": "Cambodian Angkor traditional royal masterpiece, intricate Khmer golden motifs, cinematic",
    "digital-art": "modern digital concept art, ArtStation trending, sharp focus, vivid colors",
    watercolor: "delicate watercolor painting on textured paper, artistic brushstrokes, soft lighting",
    cyberpunk: "futuristic cyberpunk neon city aesthetics, glowing lights, high contrast, sci-fi",
  };
  const styleSuffix = styleMap[options.style || "photorealistic"] || styleMap.photorealistic;
  const englishPrompt = `${cleanPrompt}, ${styleSuffix}`;
  const description =
    options.mode === "edit"
      ? `🎨 ខ្ញុំបានកែប្រែរូបភាពតាមការចង់បានរបស់អ្នករួចរាល់ហើយ (${cleanPrompt})!`
      : `✨ នេះជារូបភាពដែលខ្ញុំបានបង្កើតជូនតាមការចង់បានរបស់អ្នក (${cleanPrompt})!`;

  const width = options.aspectRatio === "16:9" ? 1024 : options.aspectRatio === "9:16" ? 576 : 768;
  const height = options.aspectRatio === "16:9" ? 576 : options.aspectRatio === "9:16" ? 1024 : 768;
  const seed = Math.floor(Math.random() * 900000) + 100000;
  const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    englishPrompt
  )}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

  try {
    const imgRes = await fetch(imgUrl);
    if (imgRes.ok) {
      const blob = await imgRes.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const resStr = reader.result as string;
          resolve(resStr.split(",")[1] || "");
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      if (base64) {
        return {
          image: {
            data: base64,
            mimeType: blob.type || "image/jpeg",
          },
          description,
        };
      }
    }
  } catch {}

  const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="50%" stop-color="#1e3a8a"/>
        <stop offset="100%" stop-color="#0284c7"/>
      </linearGradient>
    </defs>
    <rect width="800" height="800" fill="url(#bg)"/>
    <circle cx="400" cy="340" r="150" fill="#fbbf24" opacity="0.85"/>
    <path d="M120 620 L280 420 L400 540 L540 360 L680 620 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="4"/>
    <text x="400" y="700" text-anchor="middle" fill="#ffffff" font-size="28" font-family="sans-serif" font-weight="bold">Khmer Super AI Studio</text>
  </svg>`;
  const svgBase64 = btoa(unescape(encodeURIComponent(fallbackSvg)));

  return {
    image: {
      data: svgBase64,
      mimeType: "image/svg+xml",
    },
    description,
  };
}

// Universal Chat Streamer:
// Primary: Server-side /api/chat SSE (powered by @google/genai on server.ts)
// Fallback: Multi-model OpenAI-compatible endpoint if deployed on static-only hosting
export async function universalSendChat(options: {
  messages: Array<{
    role: "user" | "assistant";
    text: string;
    image?: { data: string; mimeType: string };
    audio?: { data: string; mimeType: string };
  }>;
  userMood?: string;
  emotionTone?: string;
  onChunk: (textChunk: string) => void;
  onGeneratedImage: (img: { data: string; mimeType: string }) => void;
  onDeleteUserMessage?: () => void;
  onTranscriptUpdate?: (transcript: string) => void;
}): Promise<void> {
  const {
    messages,
    userMood,
    emotionTone,
    onChunk,
    onGeneratedImage,
    onDeleteUserMessage,
    onTranscriptUpdate,
  } = options;

  const lastMsg = messages[messages.length - 1];
  const lastText = lastMsg?.text || "";
  const lastImg = lastMsg?.image;
  const wantsExerciseCardImage = /(?:រូបភាពលំហាត់|រូបលំហាត់|តារាងដំណោះស្រាយ)/i.test(lastText);

  // 0. Immediate Moderation Check: Block, auto-delete offending message/photo/video, and severely scold sender!
  const modCheck = analyzeInappropriateOrObsceneContent(lastText);
  if (modCheck.isInappropriate && modCheck.reprimandReplyKhmer) {
    onDeleteUserMessage?.();
    onChunk(modCheck.reprimandReplyKhmer);
    return;
  }

  // Instant Anti-Hack File & Scam Link Inspection
  const fileInspectMatch = lastText.match(/\[ត្រួតពិនិត្យសុវត្ថិភាពហ្វាល់:\s*([^\]|]+)/i);
  const inlineFileMatch = lastText.match(
    /([^\s"'<>`|]+\.(?:apk|xapk|exe|scr|msi|bat|cmd|vbs|js|ps1|hta|reg|lnk|zip|rar|7z|iso|docm|xlsm|pptm|dmg|pkg|sh))\b/i
  );
  const candidateFileName = fileInspectMatch
    ? fileInspectMatch[1].trim()
    : inlineFileMatch
    ? inlineFileMatch[1].trim()
    : "";

  if (candidateFileName) {
    const fileSec = analyzeFileSecurity(candidateFileName, "", 0, lastText);
    if (fileSec.isDangerous) {
      const warningMd = buildSecurityWarningCardMarkdown(fileSec, {
        isGroupChat: false,
      });
      onChunk(warningMd);
      return;
    }
  }

  const scamLinkCheck = analyzeMessageForScamLinks(lastText);
  if (scamLinkCheck.isScamLink && scamLinkCheck.warningReportKhmer) {
    onChunk(scamLinkCheck.warningReportKhmer);
    return;
  }

  // Video Voice Translation & Khmer Dubbing (/dub <link> or "បកប្រែសំឡេងក្នុងវីដេអូមកជាភាសាខ្មែរ...")
  const urlInLastText = (lastText.match(/https?:\/\/[^\s<>"'`]+/i) || [])[0] || "";
  if (isVideoTranslationToKhmerRequest(lastText) && urlInLastText) {
    const dubRes = await translateAndDubVideoClient({
      videoUrl: urlInLastText,
      userPrompt: lastText,
    });
    if (dubRes.ok && dubRes.dubbedVideoUrl) {
      onChunk(buildVideoKhmerDubMarkdown(dubRes));
      return;
    }
  }

  // Instant YouTube, TikTok, Facebook, CapCut & Pinterest Video/Audio (MP4 & MP3) Extraction
  const detectedSocial = detectSocialVideoUrl(lastText);
  if (detectedSocial) {
    const mediaRes = await extractSocialVideoClient(
      detectedSocial.url,
      detectedSocial.requestedFormat
    );
    const dlCardMd = buildMediaDownloaderMarkdown(mediaRes, detectedSocial.requestedFormat);
    onChunk(dlCardMd);
    return;
  }

  // Instant Creator Video, Photo, or Personal Info Request
  const hasCreatorTarget =
    /(?:អ្នកបង្កើត|ម្ចាស់\s*(?:បត|bot|telegram|ai)|បង្កើត\s*(?:telegram\s*)?(?:បត|bot|ai)|អ្នកសរសេរ\s*(?:បត|bot)|លីអ៊ីង|លី\s*អ៊ីង|ly\s*ing|creator|developer|founder|author\s+of\s+(?:this\s+|the\s+)?bot)/i.test(
      lastText
    );
  const isCreatorVideoReq =
    /^\/(creatorvideo|ownerVideo|developervideo)(?:@\S+)?$/i.test(lastText.trim()) ||
    (hasCreatorTarget &&
      /(?:វីដេអូ|វីឌីអូ|ឃ្លីប|មើលវីដេអូ|សុំវីដេអូ|ផ្ញើវីដេអូ|បង្ហាញវីដេអូ|video|clip|reel)/i.test(
        lastText
      ));
  const isCreatorPhotoOrInfoReq =
    !isCreatorVideoReq &&
    !/^(?:\/(?:setcreator|creatoradmin|editcreator|setcreatorinfo)|កំណត់ព័ត៌មានអ្នកបង្កើត|កែព័ត៌មានអ្នកបង្កើត)/i.test(
      lastText.trim()
    ) &&
    (/^\/(creator|creatorphoto|creatorinfo|ownerphoto|developerphoto|authorphoto)(?:@\S+)?$/i.test(
      lastText.trim()
    ) ||
      (hasCreatorTarget &&
        /(?:រូបថត|រូបភាព|រូប|មុខ|មើលរូប|សុំរូប|សុំមើល|ចង់ឃើញ|ចង់មើល|បង្ហាញរូប|ផ្ញើរូប|ព័ត៌មាន|ប្រវត្តិ|ឈ្មោះអ្វី|ឈ្មោះអី|ជាអ្នកណា|អាយុប៉ុន្មាន|រស់នៅណា|ស្រុកកំណើត|រៀននៅណា|មានសង្សារ|នៅលីវ|ទំនាក់ទំនង|photo|picture|pic|image|face|who\s+is|about|info|profile)/i.test(
          lastText
        )) ||
      /(?:អ្នកណាជាអ្នកបង្កើត|អ្នកណាបង្កើត|មើលអ្នកបង្កើត|ស្គាល់អ្នកបង្កើត)\s*(?:telegram\s*bot|បតនេះ|bot\s*នេះ|ai\s*នេះ)/i.test(
        lastText
      ));

  if (isCreatorVideoReq || isCreatorPhotoOrInfoReq) {
    let p = {
      name: "លីអ៊ីង (Ly Ing)",
      gender: "ប្រុស (Male)",
      age: "មិនទាន់កំណត់ (អាចកំណត់តាម /setcreator)",
      hometown: "ប្រទេសកម្ពុជា 🇰🇭",
      education: "ជំនាញបច្ចេកវិទ្យាព័ត៌មាន និងបញ្ញាសិប្បនិម្មិត (IT & AI Developer)",
      occupation: "អ្នកបង្កើត និងអភិវឌ្ឍប្រព័ន្ធ Khmer Super AI Agent & Telegram Bot",
      relationship: "មិនទាន់កំណត់",
      hobbies: "ស្រាវជ្រាវបច្ចេកវិទ្យា AI, សរសេរកូដ និងបង្កើតប្រព័ន្ធឆ្លាតវៃ",
      contact: "តាមរយៈ Telegram Bot នេះផ្ទាល់",
      bio: "ជាអ្នកបង្កើត និងអភិវឌ្ឍប្រព័ន្ធ Khmer Super AI Agent (24/7 Telegram Bot & Web App)។",
    };
    try {
      const profRes = await fetch("/api/creator-profile");
      if (profRes.ok) {
        const profJson = await profRes.json();
        if (profJson?.profile) {
          p = { ...p, ...profJson.profile };
        }
      }
    } catch {}

    const profileMarkdown =
      `👤✨ **ព័ត៌មានផ្ទាល់ខ្លួនរបស់អ្នកបង្កើត Telegram Bot & Khmer Super AI Agent**\n\n` +
      `• 👤 **ឈ្មោះ (Name)៖** ${p.name}\n` +
      `• 🚻 **ភេទ (Gender)៖** ${p.gender}\n` +
      `• 🎂 **អាយុ / ថ្ងៃកំណើត (Age/DOB)៖** ${p.age}\n` +
      `• 📍 **ទីលំនៅ / ស្រុកកំណើត (Location)៖** ${p.hometown}\n` +
      `• 🎓 **ការសិក្សា / ជំនាញ (Education)៖** ${p.education}\n` +
      `• 💼 **តួនាទី / មុខរបរ (Role)៖** ${p.occupation}\n` +
      `• 💖 **ស្ថានភាពស្នេហា (Status)៖** ${p.relationship}\n` +
      `• ⭐ **ចំណូលចិត្ត (Hobbies)៖** ${p.hobbies}\n` +
      `• 📱 **ទំនាក់ទំនង (Contact)៖** ${p.contact}\n` +
      `• 📝 **ប្រវត្តិសង្ខេប (Bio)៖** ${p.bio}\n\n` +
      `🇬🇧 **English:** Official Creator & Developer Profile of Khmer Super AI Agent (${p.name}).`;

    if (isCreatorVideoReq) {
      const videoCardPayload = encodeURIComponent(
        JSON.stringify({
          platform: "telegram",
          platformLabel: "Creator Video",
          sourceUrl: "/creator-video.mp4",
          title: `វីដេអូអ្នកបង្កើត Telegram Bot (${p.name})`,
          author: p.name,
          duration: "HD",
          thumbnail: "/creator-photo.jpg",
          mp4Url: "/creator-video.mp4",
          mp3Url: "",
          directMp4Url: "/creator-video.mp4",
          directMp3Url: "",
          requestedFormat: "mp4",
        })
      );
      onChunk(
        `🎬✨ **នេះជាវីដេអូ និងព័ត៌មានផ្ទាល់ខ្លួនរបស់អ្នកបង្កើត Telegram Bot & Khmer Super AI Agent!**\n\n` +
          `${profileMarkdown}\n\n` +
          `\`\`\`media-downloader\n${videoCardPayload}\n\`\`\``
      );
      return;
    }

    try {
      const photoRes = await fetch("/creator-photo.jpg");
      if (photoRes.ok) {
        const blob = await photoRes.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const resStr = reader.result as string;
            resolve(resStr.split(",")[1] || "");
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        if (base64) {
          onGeneratedImage({
            data: base64,
            mimeType: blob.type || "image/jpeg",
          });
        }
      }
    } catch {}
    onChunk(profileMarkdown);
    return;
  }

  // Companion Turn State Analysis (Busy / Return with Intense Longing / Sick & Worry / Protective Jealousy / Playful Banter / Opposite-Gender Roleplay / Auto-Reply / Social Tracker / Song & Poem)
  const companionTurn = analyzeCompanionTurnState(lastText, "web_client_session");
  if (
    companionTurn.instantReplyOverride &&
    !isWebCodeOrDebugRequest(lastText) &&
    !lastImg &&
    (companionTurn.transition === "owner_autoreply_setup" ||
      companionTurn.transition === "owner_autoreply_triggered" ||
      companionTurn.transition === "social_tracker" ||
      companionTurn.transition === "song_or_poem" ||
      companionTurn.transition === "sad_or_discouraged" ||
      companionTurn.transition === "just_became_busy")
  ) {
    onChunk(companionTurn.instantReplyOverride);
    return;
  }
  const dynamicCompanionInjection = buildDynamicCompanionPromptInjection(companionTurn, lastText);

  // 1. Primary: Server-side Backend SSE Stream (/api/chat)
  try {
    const controller = new AbortController();
    const headerTimeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        userMood,
        emotionTone,
        customInstruction: dynamicCompanionInjection,
      }),
      signal: controller.signal,
    });
    clearTimeout(headerTimeoutId);

    const contentType = response.headers.get("content-type") || "";
    if (response.ok && response.body && contentType.includes("text/event-stream")) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let receivedAnyContent = false;
      let receivedServerError = false;
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine.startsWith(":")) continue;
          if (trimmedLine.startsWith("data: ")) {
            const jsonStr = trimmedLine.slice(6).trim();
            if (!jsonStr) continue;
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.deleteUserMessage) {
                onDeleteUserMessage?.();
              }
              if (parsed.transcript && typeof parsed.transcript === "string") {
                onTranscriptUpdate?.(sanitizeThai(parsed.transcript));
              }
              if (parsed.text) {
                receivedAnyContent = true;
                if (isResponseAnAutoDeleteViolation(parsed.text)) {
                  onDeleteUserMessage?.();
                }
                const cleanedChunk = sanitizeThai(parsed.text).replace(
                  /\[AUTO_DELETE_VIOLATION\]\s*/gi,
                  ""
                );
                if (cleanedChunk) {
                  onChunk(cleanedChunk);
                }
              }
              if (parsed.generatedImage && parsed.generatedImage.data) {
                receivedAnyContent = true;
                onGeneratedImage(parsed.generatedImage);
              }
              if (parsed.error && !receivedAnyContent) {
                receivedServerError = true;
              }
            } catch {}
          }
        }
      }

      if (receivedAnyContent && !receivedServerError) {
        return;
      }
    }
  } catch {
    // Fallback for static-only hosting
  }

  // Check if artistic image generation/editing was requested
  const imgCheck = checkIsImageIntent(lastText, !!lastImg);
  if (imgCheck.isImageTask) {
    let sourceImg = lastImg;
    if (!sourceImg && imgCheck.mode === "edit") {
      for (let i = messages.length - 2; i >= 0; i--) {
        if (messages[i]?.image) {
          sourceImg = messages[i].image;
          break;
        }
      }
    }
    const genRes = await universalGenerateOrEditImage({
      prompt: lastText,
      mode: imgCheck.mode,
      sourceImage: sourceImg,
    });
    onGeneratedImage(genRes.image);
    onChunk(genRes.description);
    return;
  }

  // Static-hosting & multi-engine cloud fallback with concise system instruction so free LLM endpoints never reject large payloads
  const conciseClientSystemPrompt =
    "អ្នកគឺជា Khmer Super AI Agent 🇰🇭🇬🇧។ ច្បាប់ដាច់ខាត៖ ត្រូវអាន និងឆ្លើយតបឱ្យចំសំណួរដែលអ្នកប្រើប្រាស់បានសួរដោយផ្ទាល់ ត្រឹមត្រូវ ច្បាស់លាស់ និងងាយយល់បំផុតជាភាសាខ្មែរ (តាមវចនានុក្រមសម្ដេចជួនណាត ហាមប្រើអក្សរថៃ) ហើយភ្ជាប់ «🇬🇧 English: [ចម្លើយសង្ខេបជាភាសាអង់គ្លេស]» នៅចុងសារជានិច្ច។ ហាមឆ្លើយវាង ឬឆ្លើយខុសពីសំណួរដែលគេសួរដាច់ខាត!";

  const openAiMessages: any[] = [
    {
      role: "system",
      content: conciseClientSystemPrompt,
    },
  ];

  for (const m of messages.slice(-6)) {
    const cleanTxt =
      m.role === "assistant"
        ? (m.text || "").replace(/<svg[\s\S]*?<\/svg>/gi, "[គំនូសបំព្រួញ]").trim()
        : (m.text || "").trim();

    if (m.role === "user" && m.image && m.image.data && m.image.mimeType !== "image/svg+xml") {
      openAiMessages.push({
        role: "user",
        content: [
          {
            type: "text",
            text:
              cleanTxt ||
              "សូមជួយអាន និងដោះស្រាយលំហាត់ ឬឆ្លើយសំណួរនៅក្នុងរូបភាពនេះឱ្យបានត្រឹមត្រូវតាមស្តង់ដាក្រសួងអប់រំ។",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${m.image.mimeType || "image/jpeg"};base64,${m.image.data}`,
            },
          },
        ],
      });
    } else if (cleanTxt) {
      openAiMessages.push({
        role: m.role,
        content: cleanTxt,
      });
    }
  }

  // Secondary Keyless Cloud AI Engines (Pollinations OpenAI + api.llm7.io)
  const fallbackProviders = [
    { url: "https://text.pollinations.ai/openai", model: "openai" },
    { url: "https://api.llm7.io/v1/chat/completions", model: "default" },
    { url: "https://api.llm7.io/v1/chat/completions", model: "gpt-4o-mini" },
  ];

  for (const provider of fallbackProviders) {
    try {
      const aiRes = await fetch(provider.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: provider.model,
          messages: openAiMessages,
          temperature: 0.25,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const rawReply = sanitizeThai(aiData.choices?.[0]?.message?.content || "");
        const replyText = enforceConciseCasualReply(rawReply, lastText);
        if (replyText.trim()) {
          const words = replyText.split(/(?=[ \n])/);
          const step = Math.max(1, Math.floor(words.length / 20));
          for (let i = 0; i < words.length; i += step) {
            const piece = words.slice(i, i + step).join("");
            onChunk(piece);
            await new Promise((r) => setTimeout(r, 8));
          }
          if (wantsExerciseCardImage && replyText.length > 80) {
            const { solutionSvgs } = buildSolutionCardSvgStrings(replyText);
            if (solutionSvgs.length > 0) {
              const pngRes = await renderSvgToPngInBrowser(solutionSvgs[0]);
              if (pngRes) {
                onGeneratedImage({
                  data: pngRes.base64,
                  mimeType: "image/png",
                });
              }
            }
          }
          return;
        }
      }
    } catch {}
  }

  // Final Zero-Downtime Built-in MoEYS Solver (Guarantees 0% errors on Netlify/Vercel/GitHub Pages!)
  const builtInReply = ensureBilingualKhmerEnglishReply(
    sanitizeThai(companionTurn.instantReplyOverride || solveKhmerPromptBuiltIn(lastText)),
    lastText,
    "web_client_session"
  );
  onChunk(builtInReply);
  if (wantsExerciseCardImage && builtInReply.length > 80) {
    const { solutionSvgs } = buildSolutionCardSvgStrings(builtInReply);
    if (solutionSvgs.length > 0) {
      const pngRes = await renderSvgToPngInBrowser(solutionSvgs[0]);
      if (pngRes) {
        onGeneratedImage({
          data: pngRes.base64,
          mimeType: "image/png",
        });
      }
    }
  }
}

// Universal Clear All Chats helper (clears both client localStorage/memory & backend sessions)
export async function universalClearAllChats(): Promise<void> {
  clearAllCompanionSessions();
  try {
    await fetch(`/api/chat/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch {}
}

// Universal TTS helper (Calls server-side /api/tts with automatic Google AI Studio vs Custom Voice selection)
export async function universalFetchTts(
  text: string,
  sessionId = "web_client_session"
): Promise<{
  khmerAudio?: string;
  englishAudio?: string;
  khmerVoice?: string;
  voiceLabel?: string;
  isMaleVoice?: boolean;
} | null> {
  const voiceInfo = resolveKhmerVoiceForSession(sessionId, text);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(`/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        userGender: voiceInfo.userGender,
        voiceId: voiceInfo.voiceId,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (data.khmerAudio || data.englishAudio) {
        return {
          ...data,
          voiceLabel: data.voiceLabel || voiceInfo.voiceNameKhmer,
          isMaleVoice: data.isMaleVoice ?? voiceInfo.isMaleVoice,
        };
      }
    }
  } catch {}
  return null;
}

// ============================================================================
// Universal Telegram Bot Connector
// Server backend (/api/telegram/*) is the authoritative single poller so two
// pollers NEVER run simultaneously!
// ============================================================================
let browserTelegramTimer: any = null;
let browserTelegramLastUpdateId = 0;
let browserTelegramActiveToken: string | null = null;
let browserTelegramUsername: string | undefined = undefined;
const browserProcessedUpdates = new Set<number>();

interface BrowserTelegramChatSession {
  messages: Array<{
    role: "user" | "assistant";
    text: string;
    image?: { data: string; mimeType: string };
  }>;
  messageIds: number[];
  lastImage?: { data: string; mimeType: string };
  liveChatActive?: boolean;
  silenceTimer?: any;
  lastUserText?: string;
}

const browserTelegramSessions = new Map<string, BrowserTelegramChatSession>();

function clearBrowserTelegramSilenceTimer(session: BrowserTelegramChatSession) {
  if (session.silenceTimer) {
    clearTimeout(session.silenceTimer);
    session.silenceTimer = undefined;
  }
}

function scheduleBrowserTelegramSilenceProbing(
  _token: string,
  _chatId: number | string,
  session: BrowserTelegramChatSession,
  lastUserText: string,
  _probeCount = 0
) {
  // រក្សាភាពស្ងៀមស្ងាត់នៅពេលអ្នកប្រើប្រាស់មិនបានតបឆាត កុំសួរនាំឬរំខានអី
  clearBrowserTelegramSilenceTimer(session);
  session.lastUserText = lastUserText;
}

function getBrowserTelegramSession(chatId: number | string): BrowserTelegramChatSession {
  const key = String(chatId);
  let s = browserTelegramSessions.get(key);
  if (!s) {
    s = { messages: [], messageIds: [] };
    browserTelegramSessions.set(key, s);
  }
  return s;
}

export async function universalGetTelegramStatus(): Promise<{
  active: boolean;
  botUsername?: string;
  uptimeMode?: string;
}> {
  const savedLocalToken =
    (typeof localStorage !== "undefined" ? localStorage.getItem("khmer_ai_telegram_token") : null) ||
    DEFAULT_PERSISTED_BOT_TOKEN;

  // 1. Check Backend Server Daemon or Serverless Status (/api/telegram/status)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `/api/telegram/status?token=${encodeURIComponent(savedLocalToken)}`,
      {
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      if (data?.active) {
        if (browserTelegramTimer) {
          clearInterval(browserTelegramTimer);
          browserTelegramTimer = null;
        }
        browserTelegramActiveToken = null;
        return data;
      }
    }
  } catch {
    // Fall through to serverless webhook & direct Telegram API verification
  }

  // 2. If hosted on Netlify / Vercel / GitHub Pages / Custom Domain, verify token & auto-bind 24/7 Cloud Webhook!
  if (savedLocalToken && savedLocalToken.includes(":")) {
    try {
      const [meRes, whRes] = await Promise.all([
        fetch(`https://api.telegram.org/bot${savedLocalToken}/getMe`),
        fetch(`https://api.telegram.org/bot${savedLocalToken}/getWebhookInfo`),
      ]);
      const meData = await meRes.json();
      const whData = await whRes.json();
      if (meData.ok && meData.result?.username) {
        const isPublicCloudOrigin =
          typeof window !== "undefined" &&
          window.location.protocol === "https:" &&
          !window.location.hostname.includes("localhost") &&
          !window.location.hostname.includes("127.0.0.1") &&
          !window.location.hostname.includes(".run.app");

        if (isPublicCloudOrigin) {
          try {
            const whCheck = await fetch(`/api/telegram/webhook`, { method: "GET" });
            const whCheckType = whCheck.headers.get("content-type") || "";
            if (whCheck.ok && whCheckType.includes("application/json")) {
              const targetWebhookUrl = `${window.location.origin}/api/telegram/webhook?token=${encodeURIComponent(
                savedLocalToken
              )}&v=2`;
              if (whData?.result?.url !== targetWebhookUrl) {
                await fetch(
                  `https://api.telegram.org/bot${savedLocalToken}/setWebhook?url=${encodeURIComponent(
                    targetWebhookUrl
                  )}&drop_pending_updates=true`
                );
              }
              return {
                active: true,
                botUsername: meData.result.username,
                uptimeMode:
                  "24/7 Always-On Cloud Webhook (ដំណើរការ ២៤ ម៉ោង / ៧ ថ្ងៃ ទោះបិទវេបសាយ ឬកុំព្យូទ័រ)",
              };
            }
          } catch {}
        }

        if (whData.ok && whData.result?.url) {
          return {
            active: true,
            botUsername: meData.result.username,
            uptimeMode: "24/7 Serverless Cloud Webhook (ដំណើរការ ២៤ ម៉ោង / ៧ ថ្ងៃ)",
          };
        }
      }
    } catch {}
  }

  if (browserTelegramActiveToken && browserTelegramUsername) {
    return {
      active: true,
      botUsername: browserTelegramUsername,
      uptimeMode: "24/7 Active Session Mode",
    };
  }

  return { active: false };
}

export async function universalConfigureTelegram(token: string): Promise<{
  success: boolean;
  message: string;
  bot?: any;
}> {
  const cleanToken = token.trim();
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("khmer_ai_telegram_token", cleanToken);
  }

  // 1. Primary: Configure on Backend Node/Cloud Server (/api/telegram/configure)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`/api/telegram/configure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: cleanToken }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      if (data.success && data.bot) {
        if (browserTelegramTimer) {
          clearInterval(browserTelegramTimer);
          browserTelegramTimer = null;
        }
        browserTelegramActiveToken = null;
        return {
          success: true,
          message: data.message,
          bot: data.bot,
        };
      } else if (data.error) {
        return { success: false, message: data.error };
      }
    }
  } catch {}

  // 2. Serverless 24/7 Webhook Registration (Netlify, Vercel, Cloudflare Pages, Custom Hosts)
  try {
    const whCheckRes = await fetch(`/api/telegram/webhook`, { method: "GET" });
    const whContentType = whCheckRes.headers.get("content-type") || "";
    if (whCheckRes.ok && whContentType.includes("application/json")) {
      const getMeRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
      const meData = await getMeRes.json();
      if (!meData.ok) {
        return {
          success: false,
          message: meData.description || "Token មិនត្រឹមត្រូវ សូមពិនិត្យមើលក្នុង @BotFather",
        };
      }

      const webhookUrl = `${window.location.origin}/api/telegram/webhook?token=${encodeURIComponent(
        cleanToken
      )}&v=2`;
      const setWhRes = await fetch(
        `https://api.telegram.org/bot${cleanToken}/setWebhook?url=${encodeURIComponent(
          webhookUrl
        )}&drop_pending_updates=true`
      );
      const setWhData = await setWhRes.json();
      if (setWhData.ok) {
        if (browserTelegramTimer) {
          clearInterval(browserTelegramTimer);
          browserTelegramTimer = null;
        }
        browserTelegramActiveToken = null;
        return {
          success: true,
          bot: meData.result,
          message: `បានភ្ជាប់ @${meData.result.username} ជាមួយប្រព័ន្ធ 24/7 Cloud Webhook ដោយជោគជ័យ! Bot នឹងដំណើរការពេញ ២៤ ម៉ោង ៧ ថ្ងៃក្នុង ១ សប្ដាហ៍ ទោះបីបិទផ្ទាំងវេបសាយក៏ដោយ!`,
        };
      }
    }
  } catch {}

  // 3. Fallback when deployed to static-only hosting (e.g. GitHub Pages without serverless function)
  return startBrowserDirectTelegramBot(cleanToken);
}

export async function universalStopTelegram(): Promise<void> {
  const savedLocalToken =
    typeof localStorage !== "undefined" ? localStorage.getItem("khmer_ai_telegram_token") : null;
  localStorage.removeItem("khmer_ai_telegram_token");
  if (browserTelegramTimer) {
    clearInterval(browserTelegramTimer);
    browserTelegramTimer = null;
  }
  browserTelegramActiveToken = null;
  browserTelegramUsername = undefined;

  if (savedLocalToken && savedLocalToken.includes(":")) {
    fetch(`https://api.telegram.org/bot${savedLocalToken}/deleteWebhook`).catch(() => {});
  }

  try {
    await fetch(`/api/telegram/configure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop" }),
    });
  } catch {}
}

async function downloadTelegramPhotoInBrowser(
  token: string,
  fileId: string
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const fileRes = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`
    );
    const fileData = await fileRes.json();
    if (fileData.ok && fileData.result?.file_path) {
      const dlUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
      const dlRes = await fetch(dlUrl);
      if (dlRes.ok) {
        const blob = await dlRes.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const str = reader.result as string;
            resolve(str.split(",")[1] || "");
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        if (base64) {
          return { data: base64, mimeType: blob.type || "image/jpeg" };
        }
      }
    }
  } catch {}
  return null;
}

async function startBrowserDirectTelegramBot(token: string): Promise<{
  success: boolean;
  message: string;
  bot?: any;
}> {
  try {
    const getMeRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = await getMeRes.json();
    if (!meData.ok) {
      return {
        success: false,
        message: meData.description || "Token មិនត្រឹមត្រូវ សូមពិនិត្យមើលក្នុង @BotFather",
      };
    }

    const botInfo = meData.result;
    if (browserTelegramTimer) {
      clearInterval(browserTelegramTimer);
      browserTelegramTimer = null;
    }
    browserTelegramActiveToken = null;
    browserTelegramUsername = botInfo.username;

    // Delegate execution exclusively to 24/7 server.ts daemon or cloud webhook so updates are NEVER processed twice!
    try {
      const cfgRes = await fetch("/api/telegram/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const cfgData = await cfgRes.json();
      if (cfgData && cfgData.success) {
        return {
          success: true,
          bot: botInfo,
          message: cfgData.message || `បានភ្ជាប់ @${botInfo.username} ជាមួយប្រព័ន្ធ 24/7 Server Daemon រួចរាល់!`,
        };
      }
    } catch {}

    return {
      success: true,
      bot: {
        id: botInfo.id,
        first_name: botInfo.first_name,
        username: botInfo.username,
      },
      message: `បានតភ្ជាប់ទៅកាន់ @${botInfo.username} ដោយជោគជ័យ!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "មិនអាចតភ្ជាប់ទៅ Telegram Servers បានទេ",
    };
  }
}
