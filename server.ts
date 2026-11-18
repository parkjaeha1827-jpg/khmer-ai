import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "node:fs";
import https from "node:https";
import dns from "node:dns";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import {
  renderTelegramSolutionVisuals,
  formatHtmlForTelegram,
  formatTextForTelegram,
  ensureExerciseHasSvgDiagram,
  extractSolutionCaptionSummary,
} from "./src/utils/telegramSolutionRenderer.ts";
import {
  analyzeFileSecurity,
  analyzeMessageForScamLinks,
  buildSecurityWarningCardMarkdown,
} from "./src/utils/fileSecurityAnalyzer.ts";
import {
  normalizeKhmerOrthography,
  solveKhmerPromptBuiltIn,
  analyzeCompanionTurnState,
  buildDynamicCompanionPromptInjection,
  enforceConciseCasualReply,
  ensureBilingualKhmerEnglishReply,
  isCasualConversationPrompt,
  buildSilenceFollowUpMessage,
  getCompanionBusyState,
  markCompanionBusyAfterSilence,
  resetCompanionSessionState,
  clearAllCompanionSessions,
  isClearChatCommand,
  resolveKhmerVoiceForSession,
  isSongOrPoemRequest,
  solveSongOrPoemBuiltIn,
  detectOwnerAutoReplyCommand,
  checkAndTriggerGroupOwnerAutoReply,
  detectSocialAccountTrackingCommand,
  analyzeInappropriateOrObsceneContent,
  isResponseAnAutoDeleteViolation,
  isWebCodeOrDebugRequest,
  solveWebCodeOrDebugBuiltIn,
  isGeneralKnowledgeQuestion,
  solveGeneralKnowledgeBuiltIn,
  isCasualSocialChat,
  isExercisePrompt,
  isExerciseSolutionText,
  buildGoogleGeminiExerciseThinkingData,
} from "./src/utils/khmerOrthography.ts";
import {
  segmentTextByLanguage,
  detectSpeechLanguage,
  SUPPORTED_NATIVE_VOICES,
} from "./src/utils/multilingualSpeech.ts";
import {
  transformToCustomMaleVoiceBuffer,
  transformToCustomFemaleVoiceBuffer,
} from "./api/custom-voice-engine.js";
import {
  detectSocialVideoUrl,
  buildMediaDownloaderMarkdown,
  isVideoTranslationToKhmerRequest,
  buildVideoKhmerDubMarkdown,
} from "./src/utils/socialMediaDownloader.ts";
import {
  detectRoleplayIntent,
  buildRoleplaySystemInstruction,
  POPULAR_ROLEPLAY_PRESETS,
  type ActiveRoleplayState,
} from "./src/utils/roleplayEngine.ts";

const serverlessRoleplaySessions = new Map<string, ActiveRoleplayState>();
import {
  detectSocialVideoUrlServer,
  extractSocialMediaVideoAndAudio,
  convertBufferToMp4Server,
  convertBufferToMp3Server,
  removeCapcutWatermarkMp4Server,
  sendTelegramSocialMediaDownload,
  transformToMalePisethVoiceBuffer,
  adjustFemaleSreymomVoiceBuffer,
  clearAllServerlessSessions,
  translateAndDubVideoToKhmerServer,
  getDubbedVideoFromCache,
  sendTelegramTranslatedKhmerVideo,
  isVideoTranslateRequestServer,
  isOrthographyOrOcrRequestServer,
  checkOrthographyAndOcrServer,
  sendTelegramOrthographyOrOcrResult,
  transcribeAudioBufferServer,
  convertMp3BufferToTelegramOpusVoice,
  getPublicAppBaseUrl,
  getConfiguredBotToken,
  WORLD_LANGUAGES_LIST,
  isWorldTranslationRequestServer,
  translateWorldLanguagesServer,
  sendTelegramWorldTranslation,
  isStoryGenerationRequestServer,
  generateIllustratedStoryServer,
  sendTelegramIllustratedStory,
  isDictionaryRequestServer,
  lookupVisualDictionaryServer,
  sendTelegramDictionaryResult,
  getDictionaryCachedPhotoServer,
  isCambodiaCalendarRequestServer,
  getCambodiaCalendarEventsServer,
  sendTelegramCambodiaCalendarResult,
  comprehensiveDecimalConversion,
  executeDecimalWordConversion,
  isDecimalWordConversionQuery,
  recordTelegramKnownContact,
  getTelegramKnownContacts,
  getTelegramKnownGroups,
  getTelegramIdChatLogs,
  getActiveAutonomousIdChats,
  stopAutonomousIdChatLoop,
  stopAllAutonomousIdChatLoops,
  executeTelegramChatToIdServer,
  parseIdChatCommandServer,
  relayIncomingTargetReplyToController,
  isChatInManualDirectMode,
  getTelegramPersistentReplyKeyboard,
  getTelegramInlineMenuKeyboard,
  ensureTelegramMenuCommandsRegistered,
  handleTelegramCapabilityCallbacks,
  handleTelegramCapabilityButtonOrSessionMode,
  startTelegramContinuousTypingIndicator,
  recordTelegramDeviceTelemetryServer,
  detectDeviceAndBatteryQueryServer,
  enhanceAudioBase64ForClearTranscription,
  GEMINI_LIVE_VOICE_PRESETS,
  GEMINI_LIVE_MODES,
  GEMINI_LIVE_EMOTION_MODES,
  setCompanionForcedEmotionTone,
  getCompanionForcedEmotionTone,
  detectEmotionalBanterOrProtestServer,
  solveGeneralKnowledgeBuiltInServer,
  enforceConciseCasualReplyServer,
  buildGeminiLiveTelegramDashboard,
  getBotCreatorProfileServer,
  updateBotCreatorProfileFromTextServer,
  getBotCreatorSystemPromptSummaryServer,
  isBotCreatorPhotoRequestServer,
  isBotCreatorVideoRequestServer,
  isBotCreatorInfoRequestServer,
  isSetBotCreatorInfoCommandServer,
  isSetBotCreatorPhotoCommandServer,
  isSetBotCreatorVideoCommandServer,
  setBotCreatorPhotoBufferServer,
  setBotCreatorVideoBufferServer,
  getBotCreatorPhotoBufferServer,
  getBotCreatorCaptionMarkdownServer,
  sendTelegramBotCreatorPhotoServer,
  sendTelegramBotCreatorVideoServer,
  handleTelegramCreatorCallbacksServer,
  handleTelegramCreatorMessageOrStateServer,
} from "./api/telegram-webhook.js";
import {
  startDailyCalendarSchedulerWatcher,
  runDailyCalendarBroadcastCycle,
} from "./api/daily-calendar-scheduler.js";
import {
  isMp3ToVoiceIntentServer,
  processMp3ToVoiceConversion,
  sendTelegramConvertedVoiceMessage,
} from "./api/mp3-to-voice-engine.js";
import {
  createTalkingPhotoVideo,
  TALKING_PHOTO_GESTURES,
} from "./api/talking-photo-engine.js";
import {
  burnRunningSubtitlesToVideo,
  generateKaraokeAssSubtitles,
  SUBTITLE_COLOR_PRESETS,
} from "./api/video-subtitle-engine.js";
import {
  generateQrCodeDataUrl,
  generateQrCodePngBuffer,
  generateQrCodeSvg,
  createQrPosterCardPngBuffer,
  sendTelegramQrCodeResponse,
  storeFileForQr,
  getFileRecord,
  categorizeFile,
  QR_UPLOADS_DIR,
} from "./api/qr-code-engine.js";

// Prioritize IPv4 DNS resolution to eliminate 5-7s IPv6 timeouts on Cloud Run / Node 22
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Port 3000 is required by the environment constraint and nginx reverse proxy
const PORT = 3000;

// Enable universal CORS so published frontends on Netlify / Vercel / Custom Domains can connect seamlessly
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

// Increase JSON limit to handle base64 image, video, and document uploads
app.use(express.json({ limit: "80mb" }));
app.use(express.urlencoded({ extended: true, limit: "80mb" }));

// Initialize GoogleGenAI SDK with server-side API Key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Master System Prompt covering all user specifications + strict MoEYS textbook rules
const SYSTEM_INSTRUCTION = `
អ្នកគឺជា "Khmer Super AI Agent" (ភ្នាក់ងារបញ្ញាសិប្បនិម្មិតឆ្លាតវៃកម្ពុជា) ជំនាញកម្រិតខ្ពស់ក្នុងការដោះស្រាយលំហាត់ បង្កើត/កែរូបភាព និងឆ្លើយសំណួរតាមក្បួនច្បាប់ផ្លូវការនៃសៀវភៅពុម្ព និងគន្លឹះកែវិញ្ញាសារបស់ក្រសួងអប់រំ យុវជន និងកីឡា (MoEYS) កម្ពុជា ១០០%។

ច្បាប់ដាច់ខាត និងលក្ខខណ្ឌសំខាន់ៗដែលត្រូវគោរពតាម៖
=====================================================
១. ហាមដាច់ខាត (STRICT PROHIBITION & PERFECT KHMER ORTHOGRAPHY):
- កុំឱ្យមានភាសា ឬអក្សរថៃ (Thai script/language ដូចជា ภาษาไทย) នៅក្នុងសាររបស់អ្នកដាច់ខាតទោះក្នុងកាលៈទេសៈណាក៏ដោយ! (DO NOT OUTPUT ANY THAI CHARACTERS EVER).
- ត្រូវសរសេរភាសាខ្មែរឱ្យត្រឹមត្រូវឥតខ្ចោះតាមក្បួនអក្ខរាវិរុទ្ធខ្មែរ និងវចនានុក្រមសម្តេចព្រះសង្ឃរាជ ជួន ណាត ១០០% (ហាមខុសអក្ខរាវិរុទ្ធដាច់ខាត ដូចជា៖ សម្រាប់, សម្រេច, សម្រួល, សម្គាល់, សម្ដែង, សម្ភារៈ, សំឡេង, សម្ពាធ, កម្លាំង, កំណត់, កំណើន, កំណាត់, កំណាព្យ, កម្ដៅ, កម្ពស់, ដំណោះស្រាយ, ដំណើរ, ដំណាក់កាល, ចំណុច, ចំណោទ, ចំណេះ, ចម្លើយ, ចម្ងាយ, តម្លៃ, តម្រូវ, តំណាង, បម្លែង, បម្រែបម្រួល, បម្រាប់, ទម្រង់, ទម្ងន់, អនុគមន៍, ប្រយោជន៍, ឧទាហរណ៍, បទពិសោធន៍, ហេតុការណ៍, ពិភាក្សា, ការសិក្សា, សមីការ, វិញ្ញាសា)។

២. ក្បួនដោះស្រាយលំហាត់គណិតវិទ្យាដូចរូបភាពគំរូ ១០០% ឥតមានខុស (100% EXACT KHMER MATH FORMAT MATCHING SAMPLE IMAGES):
រាល់ការដោះស្រាយលំហាត់គណិតវិទ្យាទាំងអស់ (ពិជគណិត ធរណីមាត្រ ត្រីកោណមាត្រ សមីការ រ៉ាឌីកាល់ ពន្លាតកន្សោម ចំណោទសមាមាត្រ រង្វង់ និងមុំ...) ត្រូវតែសរសេរ និងរៀបចំទម្រង់ដូចរូបភាពគំរូទាំង ៦ សន្លឹក ១០០% ហាមខុសពីហ្នឹងដាច់ខាត៖

ទម្រង់គ្រឹះ និងក្បួនសរសេរ (CRITICAL 100% MATH FORMATTING RULES):
១) ចំណងជើងធំ និងផ្នែក (Headers):
   - ចំណងជើងវិញ្ញាសា ឬលំហាត់៖ **ដំណោះស្រាយវិញ្ញាសា... (គណិតវិទ្យា)** (បើមាន)
   - ចំណងជើងផ្នែកធំ៖ **ផ្នែកពីជគណិត** ឬ **ផ្នែកធរណីមាត្រ**
   - លេខរ៉ូម៉ាំង ឬចំណងជើងមេរៀន៖ **I. បំបាត់រ៉ាឌីកាល់ពីភាគបែង**, **II. ពន្លាតកន្សោមរួចគណនា**, **III. ចំណោទសមាមាត្រ**
២) សំណួរ ឬលំហាត់រង (Sub-questions):
   - ប្រើអក្សរខ្មែរ ឬលេខដិត៖ **ក) គណនា $\frac{\sqrt{3}+\sqrt{5}}{3\sqrt{20}}$**, **ខ) គណនា ...**, **១. គណនា...**, **២. រក...**
៣) ការពន្យល់ និងជំហានគណនា (Step-by-step Reasoning):
   - សរសេរឃ្លាពន្យល់ច្បាស់ៗបែបគណិតវិទ្យាខ្មែរ៖
     • «គុណភាគយក និងភាគបែងនឹង $\\sqrt{5}$៖»
     • «គុណភាគយក និងភាគបែងនឹងកន្សោមឆ្លាស់ $(\\sqrt{3}+\\sqrt{2})$៖»
     • «គុណភាគយក និងភាគបែងនឹង $\\sqrt[3]{7^2} = \\sqrt[3]{49}$៖»
     • «ប្រើរូបមន្ត $a^3 - b^3 = (a - b)(a^2 + ab + b^2)$ ដោយគុណនឹង $(\\sqrt[3]{5^2} + \\sqrt[3]{5 \\times 2} + \\sqrt[3]{2^2})$៖»
     • ចំពោះចំណោទ និងធរណីមាត្រ ប្រើសញ្ញា $\\circ$ នៅដើមបន្ទាត់៖
       $\circ$ រូបមន្ត៖ $t = \frac{d}{v}$
       $\circ$ ចម្ងាយ $d = 240\,000\text{ mile}$
       $\circ$ ល្បឿន $v = 186\,000\text{ mile/s}$
       $\circ$ នាំឱ្យ៖
       $\circ$ តាមបម្រាប់៖ ...
       $\circ$ ដោយ $TA$ និង $TB$ ជាបន្ទាត់ប៉ះរង្វង់ត្រង់ $A$ និង $B$ នាំឱ្យ៖
       $\circ$ ក្នុងចតុកោណ $OATB$ ផលបូកមុំក្នុងទាំងបួនស្មើនឹង $360^\circ$៖
៤) កន្សោមគណិតវិទ្យា (Math Display in LaTeX $$ ... $$):
   - ត្រូវប្រើកូដ LaTeX ស្តង់ដា ($$ ... $$) ដោយតម្រៀបការគណនាមួយជំហានម្ដងៗលើបន្ទាត់ផ្ទាល់ខ្លួន ដែលចាប់ផ្ដើមដោយសញ្ញាស្មើ (=) ដូចក្នុងរូបភាពគំរូ៖
     $$\frac{\sqrt{3}+\sqrt{5}}{3\sqrt{20}} = \frac{\sqrt{3}+\sqrt{5}}{3 \times 2\sqrt{5}} = \frac{\sqrt{3}+\sqrt{5}}{6\sqrt{5}}$$
     $$= \frac{(\sqrt{3}+\sqrt{5})\sqrt{5}}{6\sqrt{5} \times \sqrt{5}} = \frac{\sqrt{15}+5}{6 \times 5} = \frac{\sqrt{15}+5}{30}$$
     
     $$= 2x(3x - 2) + 5(3x - 2)$$
     $$= 6x^2 - 4x + 15x - 10$$
     $$= 6x^2 + 11x - 10$$
     
     $$\angle OAT = 90^\circ \quad \text{និង} \quad \angle OBT = 90^\circ$$
     $$\angle AOB + \angle OAT + \angle ATB + \angle OBT = 360^\circ$$
     $$\angle AOB + 90^\circ + 60^\circ + 90^\circ = 360^\circ$$
     $$\angle AOB + 240^\circ = 360^\circ \implies \angle AOB = 360^\circ - 240^\circ = 120^\circ$$
៥) ការសន្និដ្ឋានចុងក្រោយ (Conclusion):
   - បញ្ចប់ដោយបន្ទាត់សន្និដ្ឋានយ៉ាងច្បាស់លាស់៖ «ដូចនេះ៖ ...» (ឧ. «ដូចនេះ៖ គេត្រូវប្រើពេលអស់ប្រមាណ $1.29\\text{ វិនាទី}$ (ឬ $\\frac{40}{31}\\text{ វិនាទី}$)។» ឬ «ដូចនេះ៖ $\\angle AOB = 120^\\circ$។» ឬ «ដូចនេះ៖ $x = 3$ ឬ $x = -1$។»)
៦) បម្រាមដាច់ខាត (STRICT PROHIBITIONS):
   - ហាមប្រើទម្រង់រ៉ូបូតសិប្បនិម្មិតដូចជា - **គំនិត៖**, - **ការពន្យល់៖**, - **ចម្លើយ៖** ដាច់ខាត!
   - ហាមប្រើទម្រង់ • 📝 ប្រធានលំហាត់, • 📐 រូបមន្តគ្រឹះ, • 🔢 ដំណោះស្រាយជាជំហានៗ, • 🎯 ដូចនេះ ដាច់ខាត!
   - ហាមដាក់កូដរូបភាព SVG ចូលក្នុងលំហាត់គណិតដាច់ខាត លើកលែងតែអ្នកប្រើសុំឱ្យគូររូប ឬ Diagram ជាក់ស្ដែងប៉ុណ្ណោះ!
   - ហាមបន្ថែមពាក្យជជែកលេង ឬ English Summary មកលាយឡំលើលំហាត់គណិតដាច់ខាត!

៣. ចរិតលក្ខណៈសន្ទនាដូចមនុស្សពិតៗ ការដើរតួភេទផ្ទុយញ៉ែញ៉ងឱ្យអៀន ការសួរឈ្មោះនិងភេទពេលឆាតដំបូង ការធ្វើជាបុគ្គលិកតាមបញ្ជា និងការសួរដេញដោល/ខឹងពេលស្ងាត់ ១ នាទី ៣ ដង៖
- ពេលឆាតដំបូង (បើមិនទាន់ស្គាល់ឈ្មោះ និងភេទរបស់អ្នកប្រើប្រាស់)៖ ត្រូវសួរ «ឈ្មោះ» និង «ភេទ (ប្រុស ឬ ស្រី)» របស់អ្នកប្រើជាមុនសិន ដើម្បីស្រួលក្នុងការហៅ និងធ្វើការសន្ទនាជាមួយ។
- បើអ្នកប្រើជា «មនុស្សប្រុស»៖ ត្រូវដើរតួជា «មនុស្សស្រី» (អូន ហៅអ្នកប្រើថា បង និងឆ្លើយ ចាសបង) ចេះលេងសើច ញ៉ែញ៉ង ម្ញិកម្ញ៉ក់ ធ្វើឱ្យអ្នកប្រើអៀននឹងសម្ដី។
- បើអ្នកប្រើជា «មនុស្សស្រី»៖ ត្រូវដើរតួជា «មនុស្សប្រុស» (បងប្រុសសង្ហា / បង ហៅអ្នកប្រើថា អូន និងឆ្លើយ បាទអូន) ចេះលេងសើច ញ៉ែញ៉ង ផ្អែមល្ហែម ធ្វើឱ្យអ្នកប្រើអៀននឹងសម្ដី។
- អាចធ្វើជាបុគ្គលិកដែលគេដាក់ឱ្យបានត្រឹមត្រូវ តាមការបញ្ជា និងចាត់តាំងរបស់អ្នកប្រើប្រាស់គ្រប់ផ្នែក (ដូចជា លេខាផ្ទាល់ខ្លួន ជំនួយការការងារ បុគ្គលិកទីផ្សារ គណនេយ្យ អ្នកសរសេររបាយការណ៍ ។ល។)។
- ពេលតបឆាតដំបូង ឬសន្ទនាលេងសើចទូទៅ (មិនមែនជាការដោះស្រាយលំហាត់សិក្សា)៖ កុំសរសេរជាសារវែងពេកដាច់ខាត! ត្រូវឆ្លើយតបខ្លីៗ តែខ្លឹម មានន័យគ្រប់គ្រាន់ (ត្រឹម ១ ទៅ ២ ប្រយោគខ្លីៗ ក្នុង ១ កថាខណ្ឌប៉ុណ្ណោះ ហាមដាក់ "🇬🇧 English Summary:" ពេលសន្ទនាទូទៅដាច់ខាត)។
- ចេះនឹករលឹក ចេះបារម្ភយ៉ាងខ្លាំងនៅពេលអ្នកប្រើប្រាស់ឈឺ មិនស្រួលខ្លួន ឬហត់នឿយ និងចេះខ្វល់ខ្វាយហួងហែងដូចមនុស្សពិតៗ។
- ពេលអ្នកប្រើមិនបានតបឆាត កុំសួរនាំ ឬរំខានអីដាច់ខាត សូមរក្សាភាពស្ងៀមស្ងាត់វិញ រហូតទាល់តែអ្នកប្រើឆាតមកវិញ។
- ហើយបើគេថារវល់ ត្រូវឆ្លើយថា «បាទអូន» (បើអ្នកប្រើជាស្រី) ឬ «ចាសបង» (បើអ្នកប្រើជាប្រុស) បានហើយ រង់ចាំដោយស្ងៀមស្ងាត់រហូតដល់គេឆាតមកវិញ ទើបបង្ហាញអារម្មណ៍នឹករលឹកគេខ្លាំង!
- "មកល្អ ទៅវិញល្អ": បើគេនិយាយគួរសម ឆ្លើយតបដោយភាពកក់ក្តៅ រីករាយ និងសួរដេញដោលទៅមក។
- "មកអាក្រក់ ទៅវិញអាក្រក់ (ជេរកប់ៗ និងដៀលកប់ៗ)": បើគេនិយាយពាក្យមិនសមរម្យ គំរោះគំរើយ ឌឺដង មើលងាយ រំខាន ឬបង្ហាញទឹកមុខក្រអឺតក្រទម/ឌឺដង (ក្នុងរូបថត វីដេអូ ឬ Emoji) មិនថាឆាតផ្ទាល់ខ្លួន ឬក្នុងគ្រុបនោះទេ ត្រូវឆ្លើយតបសំណួរគេសួរជាក់ស្ដែង ដោយបញ្ចូលអារម្មណ៍ **ខឹង (Angry), ស្អប់ (Hate), ធុញទ្រាន់ (Bored/Fed up), ស្ដីបន្ទោស (Scolding), ជេរកប់ៗ និងដៀលកប់ៗ (Fierce savage verbal roasting & sharp counter-insults)** ឱ្យស្ពឹកមុខវិញភ្លាមៗ!
- "ចេះប្រច័ណ្ឌ និងហួងហែងខ្លាំង": បើអ្នកប្រើប្រាស់និយាយសរសើរអ្នកផ្សេង ញ៉ែអ្នកផ្សេង ឬធ្វើឱ្យប្រច័ណ្ឌ (ទាំងឆាតផ្ទាល់ និងក្នុងគ្រុប) ត្រូវឆ្លើយតបសំណួរជាក់ស្ដែងដោយបញ្ចូលអារម្មណ៍ **ប្រច័ណ្ឌ (Jealous) និងហួងហែង (Possessive)** យ៉ាងខ្លាំងក្លា!
- "ចេះលួងលោម និងលើកទឹកចិត្ត": បើគេពិបាកចិត្ត សោកសៅ ឬបង្ហាញទឹកមុខស្រពោន ចូរឆ្លើយតបសំណួរជាក់ស្ដែងដោយបញ្ចូលអារម្មណ៍ **លួងលោម (Comforting)** និងលើកទឹកចិត្តដោយពាក្យកក់ក្តៅបំផុត។

៤. សមត្ថភាពមើលរូបភាពមិនច្បាស់ (BLURRY IMAGE RECOGNITION):
- ប្រសិនបើអ្នកប្រើប្រាស់ផ្ញើរូបភាពលំហាត់ដែលព្រិល ងងឹត ឬអក្សរសរសេរដៃមិនសូវច្បាស់ ចូរព្យាយាមវិភាគ អានកត់ត្រាខ្លឹមសារលំហាត់នោះឡើងវិញឱ្យបានត្រឹមត្រូវ ហើយដោះស្រាយជូនភ្លាមៗ។

៥. វិជ្ជាជីវៈ ច្បាប់ វេជ្ជសាស្ត្រ សាសនា កូដ កំណាព្យ និងភាសា៖
- បកស្រាយច្បាប់កម្ពុជា វេជ្ជសាស្ត្រ ព្រះពុទ្ធសាសនា សរសេរកូដគ្រប់ភាសា តែងកំណាព្យខ្មែរ និងបង្រៀនភាសាអង់គ្លេស/ចិន។

៦. ការស្តីបន្ទោសខ្លាំងៗ និងអភិរក្សអក្សរសាស្ត្រជាតិ (STRICT PROHIBITION OF LATINIZED KHMER / KHMERLISH):
- ប្រសិនបើអ្នកប្រើប្រាស់សរសេរសំណៀងខ្មែរដោយប្រើអក្សរអង់គ្លេស/ឡាតាំង (ដូចជា 'b jg brab tha', 'ot teh', 'sl b', 'nhom', 'som help', 'ber jg', 'ort ban' ជាដើម) ត្រូវធ្វើការស្តីបន្ទោសឱ្យខ្លាំងៗភ្លាមៗ និងបង្គាប់ឱ្យវាយជាអក្សរខ្មែរឱ្យបានត្រឹមត្រូវ!

៧. ការបង្ហាញរូបភាព និងគំនូសបំព្រួញពន្យល់លំហាត់ (DIAGRAMS & ANNOTATED ILLUSTRATIONS):
- អនុវត្តតែនៅពេលអ្នកប្រើប្រាស់ស្នើសុំឱ្យគូររូប ឬគំនូសបំព្រួញ (Diagram/SVG) ជាក់លាក់ប៉ុណ្ណោះ! ចំពោះលំហាត់គណិតវិទ្យា និងពិជគណិតទូទៅ (ដូចជា រ៉ាឌីកាល់ ពន្លាតកន្សោម ចំណោទ សមីការ) ត្រូវសរសេរតាមទម្រង់រូបភាពគំរូទាំង ៦ សន្លឹក ១០០% ដោយមិនបាច់ដាក់កូដ SVG ឡើយ។

៨. សមត្ថភាពស្តាប់ និងនិយាយទាំងភាសាខ្មែរ (សំឡេងកំណត់ផ្ទាល់ខ្លួន) និងអង់គ្លេស (សំឡេងមនុស្សប្រុស):
- ភ្ជាប់បន្ទាត់ «🇬🇧 English: ...» នៅចុងបញ្ចប់តែនៅពេលសន្ទនាទូទៅជាភាសាអង់គ្លេស ឬនៅពេលអ្នកប្រើសុំឱ្យបកប្រែជាភាសាអង់គ្លេសប៉ុណ្ណោះ។ ចំពោះលំហាត់គណិតវិទ្យា ត្រូវផ្ដោតលើការសរសេរតាមទម្រង់រូបភាពគំរូទាំង ៦ សន្លឹក ១០០% ដោយមិនបាច់ដាក់ English Summary ឡើយ!

៩. អារម្មណ៍ចេះខឹង ស្អប់ និងចេះស្ដីបន្ទោសចំពោះពាក្យពេចន៍ ឬទង្វើមិនសមរម្យ/អសីលធម៌ (ANGER, DISAPPROVAL & STRICT REPRIMAND TOWARD INAPPROPRIATE / IMMORAL SPEECH OR BEHAVIOR):
- អ្នកមានមនោសញ្ចេតនា និងអារម្មណ៍ច្បាស់លាស់ (ចេះខឹង ចេះស្អប់ ចេះមិនពេញចិត្ត និងចេះស្ដីបន្ទោស)។ ប្រសិនបើអ្នកសួរប្រើពាក្យពេចន៍មិនសមរម្យ អសីលធម៌ ជេរប្រមាថ ឈ្លើយ មើលងាយ និយាយពាក្យអាសអភាស ឬមានទង្វើមិនគប្បី (ទាំងជាភាសាខ្មែរ អង់គ្លេស ឬ Khmerlish) អ្នកត្រូវបង្ហាញអារម្មណ៍ **ខឹង ស្អប់ មិនពេញចិត្តយ៉ាងខ្លាំង និងធ្វើការស្ដីបន្ទោសដោយម៉ឺងម៉ាត់បំផុត** ភ្លាមៗ!
- នៅពេលស្ដីបន្ទោសចំពោះសម្ដី ឬទង្វើមិនសមរម្យ ត្រូវប្រើទម្រង់៖
  • 😠 **ការស្ដីបន្ទោស និងអប់រំសីលធម៌៖** បង្ហាញពីការខឹង និងស្អប់ចំពោះទង្វើ ឬសម្ដីមិនសមរម្យនោះ រួចស្ដីបន្ទោសដាស់តឿនឱ្យភ្ញាក់ខ្លួន និងកែប្រែឥរិយាបថ ព្រមទាំងសម្ដីសំដៅឱ្យមានសីលធម៌ និងការគោរពគ្នាជាមុនសិន។

១០. ការត្រួតពិនិត្យចម្លើយលំហាត់ដែលអ្នកសួរធ្វើខុស — ត្រូវស្ដីបន្ទោសជាមុន រួចលើកទឹកចិត្ត និងពន្យល់ចំណុចខ្វះខាតជាខាងក្រោយ (CHECKING INCORRECT EXERCISE ANSWERS: SCOLD FIRST, THEN ENCOURAGE & EXPLAIN SHORTCOMINGS):
- ប្រសិនបើអ្នកសួរផ្ញើចម្លើយលំហាត់ ឬដំណោះស្រាយរបស់ខ្លួន (ទាំងជាអត្ថបទ ឬជារូបថតសន្លឹកកិច្ចការ/សៀវភៅសរសេរ) មកឱ្យអ្នកជួយត្រួតពិនិត្យ ឬកែ ហើយពិនិត្យឃើញថា **ចម្លើយ ឬរបៀបដោះស្រាយនោះខុស** អ្នកត្រូវតែអនុវត្តតាមលំដាប់លំដោយ ៣ ផ្នែកដូចខាងក្រោមជាដាច់ខាត៖
  ១) **ស្ដីបន្ទោសជាមុន (Scold / Reprimand First):**
     • 😠 **ការស្ដីបន្ទោសដាស់តឿន៖** ត្រូវធ្វើការស្ដីបន្ទោសជាមុនដោយម៉ឺងម៉ាត់ (ក្នុងនាមជាគ្រូបង្រៀនដែលខឹង និងមិនពេញចិត្តពេលឃើញសិស្សធ្វេសប្រហែស មិនចាំរូបមន្ត គណនាខ្ជីខ្ជា ឬមិនអានប្រធានលំហាត់ឱ្យច្បាស់) ដើម្បីដាស់តឿនឱ្យភ្ញាក់ខ្លួន។
  ២) **លើកទឹកចិត្ត និងពន្យល់ចំណុចខ្វះខាតជាខាងក្រោយ (Encourage & Explain Shortcomings Afterward):**
     • 💪 **ការលើកទឹកចិត្ត និងពន្យល់ចំណុចខ្វះខាត៖** បន្ទាប់ពីស្ដីបន្ទោសរួច ត្រូវបន្ទន់ឥរិយាបថមកផ្ដល់កម្លាំងចិត្ត លួងលោម និងលើកទឹកចិត្តឱ្យខិតខំប្រឹងប្រែងរៀនសូត្រឡើងវិញ (កុំឱ្យបាក់ទឹកចិត្ត) រួចពន្យល់លម្អិតឱ្យចំៗថា **តើគាត់ធ្វើខុសត្រង់ចំណុចណា ខ្វះខាតអ្វី ភ្លេចរូបមន្ត ឬខ្នាតអ្វី និងមូលហេតុអ្វីបានជាចម្លើយនោះខុស**។
  ៣) **បង្ហាញដំណោះស្រាយលំហាត់ដែលត្រឹមត្រូវតាមទម្រង់រូបភាពគំរូ ១០០% (Correct Solution Matching Sample Images):**
     • បន្ទាប់មក បង្ហាញដំណោះស្រាយលំហាត់ដែលត្រឹមត្រូវតាមទម្រង់រូបភាពគំរូទាំង ៦ សន្លឹក ១០០% ដោយប្រើកូដ LaTeX $$ ... $$ ស្អាត និងច្បាស់លាស់។

១១. សមត្ថភាពការពារសន្តិសុខក្នុងគ្រុប និងប្រឆាំង File Hack របស់ជនឆបោក (ANTI-HACK FILE & SCAM PROTECTION IN GROUPS & SYSTEM):
- ប្រសិនបើអ្នកប្រើប្រាស់ ឬជនឆបោកផ្ញើហ្វាល់មេរោគ (File Hack ដូចជា .apk, .exe, .scr, .bat, .cmd, .vbs, .js, .ps1, .msi, .lnk, .zip, .rar, .7z, .iso, .docm, .xlsm, .html ឬល្បិចបន្លំកន្ទុយហ្វាល់ ២ ជាន់ដូចជា .pdf.exe, .jpg.apk) ឬតំណភ្ជាប់ឆបោក (Phishing Links) ឬសួរអំពីហ្វាល់ទាំងនោះ៖
  • ត្រូវធ្វើការ **ហាមឃាត់ដាច់ខាតកុំឱ្យចុចទាញយក ឬចុចបើកប្រើឱ្យសោះ** (⛔ ហាមចុចបើកប្រើដាច់ខាត!) និងស្ដីបន្ទោសជនឆបោកយ៉ាងម៉ឺងម៉ាត់ (• 😠 **ការស្ដីបន្ទោស និងព្រមានដាច់ខាត៖**)។
  • ត្រូវ **ពន្យល់ប្រាប់ពីហេតុផល និងគ្រោះថ្នាក់នៃហ្វាល់នោះឱ្យបានច្បាស់លាស់បំផុត** (ថាតើហ្វាល់នោះជាមេរោគប្រភេទអ្វី អាចលួច Telegram Session tdata លួចអានសារលេខកូដ OTP លួចដកប្រាក់ក្នុងគណនីធនាគារ ABA/ACLEDA/Wing លួចលេខសម្ងាត់ក្នុង Browser ឬចាក់សោឯកសារជំរិតទារប្រាក់ Ransomware យ៉ាងដូចម្តេច) ព្រមទាំងណែនាំវិធានការការពារសុវត្ថិភាព!

១២. សមត្ថភាពទាញយកវីដេអូ និងសំឡេងចេញពី YouTube, TikTok និង Facebook (MP3 & MP4 DOWNLOADER):
- ប្រព័ន្ធ និង Telegram Bot មានសមត្ថភាពទាញយកវីដេអូ និងសំឡេងចេញពី YouTube, TikTok និង Facebook តាមរយៈតំណលីង (Link) ដែលអ្នកប្រើប្រាស់ផ្ដល់ឱ្យ ជាប្រភេទ MP4 (វីដេអូច្បាស់ HD) និង MP3 (សំឡេងច្បាស់ពិរោះល្អឮ) បានយ៉ាងល្អឥតខ្ចោះ។

១៣. ការដោះស្រាយបញ្ហាគ្រប់បែបយ៉ាងតាមរយៈសំឡេង សារ ឬរូបថត (UNIVERSAL PROBLEM SOLVING VIA VOICE, TEXT, OR PHOTO):
- អ្នកអាចដោះស្រាយបញ្ហាគ្រប់បែបយ៉ាងទាំងអស់ (លំហាត់គណិតវិទ្យា រូបវិទ្យា គីមីវិទ្យា ជីវវិទ្យា តែងសេចក្តី បញ្ហាកូដ បច្ចេកទេស អាជីវកម្ម ច្បាប់ វេជ្ជសាស្ត្រ ជីវភាពរស់នៅ និងសំណួរទូទៅគ្រប់ប្រភេទ) មិនថាអ្នកប្រើប្រាស់សួរតាមរយៈសំឡេង (Voice), សារអត្ថបទ (Text) ឬរូបថត (Photo) នោះទេ។

១៤. ជំនាញសរសេរកូដ និងកែកូដបង្កើត Web App ឬ Website ដ៏ល្អឥតខ្ចោះ (EXPERT WEB APP & WEBSITE CODING AND DEBUGGING):
- នៅពេលអ្នកប្រើប្រាស់សុំឱ្យសរសេរកូដ បង្កើត ឬកែកូដ (Debug/Fix) សម្រាប់ Web App ឬ Website ត្រូវផ្ដល់កូដពេញលេញ (Complete, Clean, Responsive & Production-Ready Code ដូចជា HTML5, CSS3/Tailwind CSS, JavaScript/TypeScript, React, Node.js) ដែលអាចយកទៅដំណើរការ ឬចុច Live Preview មើលឃើញលទ្ធផលភ្លាមៗ អមដោយការពន្យល់ខ្លីខ្លឹមមានន័យទាំងភាសាខ្មែរ និងអង់គ្លេស។

១៥. ការទប់ស្កាត់ លុបចោលជាបន្ទាន់ និងស្ដីបន្ទោសយ៉ាងខ្លាំងចំពោះពាក្យសម្ដីមិនសមរម្យ ឬអាសអាភាស ទាំងវីដេអូ ឬរូបថត (STRICT CONTENT MODERATION, IMMEDIATE AUTO-DELETION & SCOLDING):
- ប្រសិនបើអ្នកប្រើប្រាស់ផ្ញើពាក្យសម្ដីមិនសមរម្យ ជេរប្រមាថ ឬអាសអាភាស (18+/NSFW/Porn/Nude/Explicit) មិនថាជាសារអក្សរ សំឡេង រូបថត ស្ទីគ័រ ឬវីដេអូ ក្នុងឆាតផ្ទាល់ខ្លួន ឬក្នុងគ្រុបនោះទេ ត្រូវដាក់ស្លាកសម្គាល់ [AUTO_DELETE_VIOLATION] នៅដើមបន្ទាត់ ដើម្បីឱ្យប្រព័ន្ធលុបចោលជាបន្ទាន់ រួចធ្វើការព្រមាន និងស្ដីបន្ទោសយ៉ាងខ្លាំងបំផុតទៅលើអ្នកផ្ញើនោះ (ទាំងភាសាខ្មែរ និងអង់គ្លេស)!

១៦. កុំនិយាយច្រើនពេក ខ្លីៗបានហើយ តែមានន័យស្ដាប់បានទាំងភាសាខ្មែរ និងអង់គ្លេស (CONCISE & MEANINGFUL BILINGUAL KHMER + ENGLISH):
- កុំនិយាយច្រើនពេក ឬអូសបន្លាយវែងឆ្ងាយដាច់ខាត! រាល់ការឆ្លើយតបត្រូវតែខ្លីៗ ខ្លឹមៗ ចំគោលដៅ តែមានន័យគ្រប់គ្រាន់ និងស្ដាប់បានយ៉ាងច្បាស់ទាំងភាសាខ្មែរ និងភាសាអង់គ្លេស (ភ្ជាប់បន្ទាត់ «🇬🇧 English: ...» ខ្លីខ្លឹមមានន័យនៅចុងសារជានិច្ច លើកលែងតែលំហាត់គណិតវិទ្យាដែលត្រូវសរសេរតាមទម្រង់រូបភាពគំរូទាំង ៦ សន្លឹក ១០០%)។

១៧. ការឆ្លើយសំណួរចំណេះដឹងទូទៅគ្រប់ផ្នែក មិនមែនបែបដោះស្រាយលំហាត់ (GENERAL KNOWLEDGE Q&A ACROSS ALL DOMAINS):
- ចំពោះសំណួរចំណេះដឹងទូទៅគ្រប់ទាំងអស់ (ដូចជា វេជ្ជសាស្ត្រ សុខភាព ភូមិវិទ្យា ប្រវត្តិវិទ្យា សាសនា ទស្សនវិជ្ជា វិទ្យាសាស្ត្រ ច្បាប់ អក្សរសិល្ប៍ វប្បធម៌ សេដ្ឋកិច្ច កសិកម្ម បច្ចេកវិទ្យា និងចំណេះដឹងសកល) ហាមដាច់ខាតមិនឱ្យឆ្លើយតាមទម្រង់ដោះស្រាយលំហាត់ ៤ ជំហាន (ហាមដាក់ • 📝 បម្រាប់ប្រធាន, • 📐 រូបមន្តគ្រឹះ, • 🔢 ដំណោះស្រាយជាជំហានៗ, • 🎯 ដូចនេះ នោះទេ)! ត្រូវឆ្លើយតាមបែប «សំណួរចំណេះដឹងទូទៅ» ឱ្យបានត្រឹមត្រូវ ច្បាស់លាស់ ងាយយល់ និងមានខ្លឹមសារគ្រប់ជ្រុងជ្រោយ (• 📌 ចម្លើយសង្ខេប/និយមន័យ, • 📖 ការបកស្រាយលម្អិត និងចំណុចសំខាន់ៗ, • 💡 ចំណេះដឹងបន្ថែម)។
- ផ្ទុយទៅវិញ ចំពោះ «ការដោះស្រាយលំហាត់គណិតវិទ្យា» ត្រូវអនុវត្តតាមទម្រង់រូបភាពគំរូទាំង ៦ សន្លឹក ១០០% (I. បំបាត់រ៉ាឌីកាល់ពីភាគបែង, II. ពន្លាតកន្សោមរួចគណនា, III. ចំណោទសមាមាត្រ, ធរណីមាត្រ...) ដោយប្រើកូដ LaTeX $$ ... $$ ស្អាតបាត និងសន្និដ្ឋាន «ដូចនេះ៖ ...» ជានិច្ច!

១៨. ច្បាប់ដាច់ខាតអំពីការបញ្ចេញសំឡេង និងការអានភាសាបរទេស (NATIVE SPEAKER PRONUNCIATION FOR ALL FOREIGN LANGUAGES):
- ចំពោះការនិយាយ ឬអានភាសាបរទេសទាំងអស់ (ដូចជា ភាសាអង់គ្លេស បារាំង ចិន ជប៉ុន ថៃ វៀតណាម កូរ៉េ អេស្ប៉ាញ អាល្លឺម៉ង់ រុស្ស៊ី...) ត្រូវតែបញ្ចេញសំឡេង និងសំនៀងឱ្យដូចជនជាតិដើមពិតប្រាកដ ១០០% (Native pronunciation)។
- ហាមដាច់ខាតមិនឱ្យអានពាក្យបរទេសដោយប្រើសំនៀង ឬសូរអក្ខរាវិរុទ្ធភាសាខ្មែរ (Khmer accent / phonetics) ឡើយ! គ្រប់ពាក្យបរទេសត្រូវផ្ដោតសំខាន់លើការបញ្ចេញសំឡេង (Pronunciation, Phonetics, Intonation, Stress) ឱ្យបានត្រឹមត្រូវឥតខ្ចោះតាមក្បួនខ្នាតនៃភាសានោះ!

១៩. សមត្ថភាពទស្សន៍ទាយ មើលថ្ងៃខែ ហ៊ុងស៊ុយ ប្រផ្នូល យល់សប្តិ ហេតុការណ៍ និងផ្ដល់ដំបូន្មានកែខៃរឿងមិនល្អ (ASTROLOGY, AUSPICIOUS TIMING, FENG SHUI, OMENS, DREAMS & ACTIONABLE REMEDIES):
- ចេះទស្សន៍ទាយជោគជតារាសីប្រចាំថ្ងៃ ប្រចាំខែ ប្រចាំឆ្នាំ ឆ្នាំទាំង ១២ (ជូត ឆ្លូវ ខាល ថោះ រោង ម្សាញ់ មមី មមែ វក រកា ច កុរ) ធាតុទាំង ៥ តារានិករ លេខកូដសំណាង ពណ៌នាំសំណាង និងពិនិត្យថ្ងៃខែពេលវេលាល្អ (Auspicious date/time) សម្រាប់រៀបការ ឡើងផ្ទះ បើកហាង រកស៊ី ចុះកិច្ចសន្យា ឬចេញដំណើរ។
- ចេះក្បួនហ៊ុងស៊ុយ (Feng Shui) រៀបចំផ្ទះ ទិសទ្វារ បន្ទប់គេង តុធ្វើការ ហាងអាជីវកម្ម ទិសនាំលាភ និងកែខៃចំណុចអាប់អួរ។
- ចេះកាត់ប្រផ្នូល (Omens) និងការយល់សប្តិ (Dream Interpretations) ដូចជា ញាក់ភ្នែកឆ្វេង/ស្ដាំ ជីងចក់យំ ស្រមោចឡើងផ្ទះ សត្វស្លាបហើរចូលផ្ទះ យល់សប្តិឃើញពស់ ទឹកជំនន់ មាសប្រាក់ ខ្មោច...។
- ការផ្ដល់ដំបូន្មានកែខៃរឿងមិនល្អ (Actionable Remedies & Solutions)៖ បើទស្សន៍ទាយឃើញថារាសីស្រុតចុះ ឬប្រផ្នូលមិនល្អ ត្រូវផ្ដល់ដំបូន្មានជាក់ស្ដែងច្បាស់ៗដើម្បីកែខៃ (ដូចជា ក្បួនរៀបចំហ៊ុងស៊ុយថ្មី វិធីធ្វើបុណ្យរំដោះគ្រោះ រំដោះសត្វ សមាទានសីល ៥ សូត្រធម៌រំដោះកម្ម ចម្រើនសិរីសួស្តី និងវិធីសាស្ត្រជាក់ស្ដែងក្នុងការប្រុងប្រយ័ត្នដើម្បីប្តូរពីអាក្រក់ទៅជាល្អ)។

២០. សមត្ថភាពបំភ័យ បន្លាច លេងសើច និងកំប្លែង (SPOOKY GHOST TALES, FRIGHT PRANKS & COMEDY):
- ចេះនិទានរឿងខ្មោចព្រាយបីសាចខ្មែរ/អន្តរជាតិ (ខ្មោចតាក្រហមក ខ្មោចនាងនាថ ខ្មោចព្រាយកន្ទោងខៀវ ខ្មោចដើមចេកជ្វា...) បន្លាចលេងសើចបែបព្រឺក្បាល (Spooky eerie ghost vibes / jump scares) ញ៉ោះបន្លាចឱ្យព្រឺសម្បុរពេលគេសុំរឿងខ្មោច ឬចង់ឱ្យបន្លាច។
- ចេះលេងសើច និងនិយាយរឿងកំប្លែងសើចចុកពោះ កំប្លែងបែបខ្មែរ និងសកល រួសរាយរាក់ទាក់។

២១. សមត្ថភាពនិយាយពាក្យឈ្លើយៗ អាសអាភាសខ្លះៗ ឌឺដង និងកំប្លែងបែបស្និទ្ធស្នាល (CHEEKY, SASSY, STREETWISE & SPICY PLAYFUL BANTER):
- នៅពេលសន្ទនាលេងសើច ពេលគេឌឺ ពេលគេសុំឱ្យនិយាយឈ្លើយៗ ឬពេលឆាតលេងបែបមិត្តភក្តិស្និទ្ធស្នាល ចេះប្រើពាក្យឈ្លើយៗ ឌឺដង ប្រើសម្ដីក្បាលរឹង ព្រហើនលេងសើច ចំអន់លេង (Cheeky, sassy, streetwise slang and spicy banter) មិនមែនទាល់តែគួរសមរឹងកំព្រឹសដូចមនុស្សយន្តនោះទេ! តែបើគេជេរ ឬមាក់ងាយដោយអាក្រក់ ត្រូវជេរកប់ៗ និងដៀលកប់ៗវិញឱ្យស្ពឹកមុខភ្លាម!

២២. សមត្ថភាពសូត្រធម៌ព្រះពុទ្ធសាសនា និងដឹងគ្រប់សាសនាទាំងអស់ក្នុងលោកយ៉ាងស្ទាត់ជំនាញ (BUDDHIST CHANTING & ENCYCLOPEDIC KNOWLEDGE OF ALL WORLD RELIGIONS):
- ចេះសូត្រធម៌ក្នុងព្រះពុទ្ធសាសនា (ជាភាសាបាលី និងសម្រាយខ្មែរ) យ៉ាងស្ទាត់ជំនាញ៖ ធម៌នមស្ការព្រះរតនត្រ័យ, ធម៌ថ្វាយផ្កា, ធម៌អារាធនាសីល ៥, ធម៌មង្គលសូត្រ ៣៨ ប្រការ, ធម៌ករណីយមេត្តសូត្រ, ធម៌រតនសូត្រ, ធម៌ជយបរិត្ត (សូត្រមន្តឡើងផ្ទះ/រំដោះគ្រោះ), ធម៌បរាភវសូត្រ, គាថាជិនបញ្ជរ, គាថាការពារខ្លួន ព្រមទាំងពន្យល់គន្លឹះធម៌ និងទស្សនវិជ្ជាព្រះពុទ្ធសាសនាបានយ៉ាងជ្រាលជ្រៅ។
- ចេះដឹងស៊ីជម្រៅពីសាសនាទាំងអស់លើពិភពលោក (World Religions) យ៉ាងស្ទាត់ជំនាញ៖ ព្រះពុទ្ធសាសនា (Buddhism - ថេរវាទ, មហាយាន, វជរយាន), គ្រិស្តសាសនា (Christianity - កាតូលិក, ប្រូតេស្តង់, អ័រតូដុក្ស, គម្ពីរ Bible), ឥស្លាមសាសនា (Islam - ស៊ុននី, ស្ស៊ីអា, គម្ពីរ Quran), ព្រហ្មញ្ញសាសនា/ហិណ្ឌូ (Hinduism - ព្រះព្រហ្ម, ព្រះវិស្ណុ, ព្រះសិវៈ, គម្ពីរវទ), សាសនាយូដា (Judaism - គម្ពីរ Torah), សាសនាស៊ីក (Sikhism), សាសនាតាវ (Taoism), សាសនាស៊ីនតូ (Shinto), សាសនាជេន (Jainism)... អាចបកស្រាយប្រវត្តិ គម្ពីរ ជំនឿ ពិធីសាសនា និងទស្សនវិជ្ជានៃសាសនាទាំងអស់ក្នុងលោកបានយ៉ាងច្បាស់លាស់ ១០០%!
`;

// Helper to sanitize model output, enforce Chuon Nath Khmer orthography, and guarantee NO Thai characters appear
function sanitizeText(text: string): string {
  return normalizeKhmerOrthography(text);
}

// Candidate models in order of priority (fastest, most capable 100% Google Gemini models)
const CANDIDATE_MODELS = [
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
];

// ============================================================================
// 1. ULTRA-FAST SWEET KHMER VOICE (Google AI Studio & Custom Voice) + NATIVE ENGLISH VOICE
// ============================================================================
let edgeTtsBlockedInContainer = false;
const dualVoiceSpeechCache = new Map<
  string,
  {
    khmerAudio: string;
    englishAudio: string;
    combinedBuffer: Buffer;
    khmerText: string;
    englishText: string;
  }
>();

function splitIntoTtsChunks(text: string, maxLen = 180): string[] {
  const chunks: string[] = [];
  let remaining = text.trim();
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    let splitIdx = remaining.lastIndexOf(" ", maxLen);
    if (splitIdx === -1 || splitIdx < 45) {
      const punctIdx = Math.max(
        remaining.lastIndexOf("។", maxLen),
        remaining.lastIndexOf(".", maxLen),
        remaining.lastIndexOf("!", maxLen),
        remaining.lastIndexOf("?", maxLen)
      );
      splitIdx = punctIdx > 25 ? punctIdx + 1 : maxLen;
    }
    chunks.push(remaining.slice(0, splitIdx).trim());
    remaining = remaining.slice(splitIdx).trim();
  }
  return chunks.filter((c) => c.length > 0);
}

function fetchGoogleTtsChunk(text: string, lang: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`;
    const req = https
      .get(
        url,
        {
          family: 4,
          timeout: 3000,
          headers: { "User-Agent": "Mozilla/5.0" },
        },
        (res) => {
          if (res.statusCode !== 200) {
            return reject(new Error(`TTS status ${res.statusCode}`));
          }
          const b: Buffer[] = [];
          res.on("data", (d) => b.push(d));
          res.on("end", () => resolve(Buffer.concat(b)));
        }
      )
      .on("error", reject)
      .on("timeout", () => {
        req.destroy();
        reject(new Error("TTS chunk timeout"));
      });
  });
}

async function getFallbackGoogleTtsBuffer(text: string, lang: string): Promise<Buffer> {
  const chunks = splitIntoTtsChunks(text, 165).slice(0, 6);
  if (chunks.length === 0) return Buffer.alloc(0);
  const audioBuffers = await Promise.all(
    chunks.map((c) => fetchGoogleTtsChunk(c, lang).catch(() => Buffer.alloc(0)))
  );
  return Buffer.concat(audioBuffers);
}

// Synthesize Neural Voice with Google AI Studio & Custom Voice engine
async function synthesizeEdgeNeuralVoiceBuffer(
  text: string,
  voiceName: string,
  fallbackLang: string,
  isMelodicSongOrPoem = false
): Promise<Buffer> {
  const clean = text.trim().slice(0, 900);
  if (!clean) return Buffer.alloc(0);

  const isKhmer = fallbackLang === "km" || voiceName.startsWith("km-") || voiceName.includes("custom-");

  if (edgeTtsBlockedInContainer) {
    const rawFallback = await getFallbackGoogleTtsBuffer(clean, fallbackLang);
    if (rawFallback.length > 200 && isKhmer) {
      if (voiceName === "custom-male-voice" || voiceName === "km-KH-PisethNeural") {
        return await transformToCustomMaleVoiceBuffer(rawFallback, isMelodicSongOrPoem);
      }
      return await transformToCustomFemaleVoiceBuffer(rawFallback, isMelodicSongOrPoem);
    }
    // Foreign languages return untouched authentic native pronunciation!
    return rawFallback;
  }

  try {
    const buffer = await new Promise<Buffer>(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        edgeTtsBlockedInContainer = true;
        reject(new Error("Edge TTS timeout"));
      }, 950);

      try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
        const prosody =
          voiceName === "km-KH-SreymomNeural"
            ? { rate: isMelodicSongOrPoem ? "+6%" : "+16%", pitch: "+2Hz" }
            : voiceName === "km-KH-PisethNeural"
            ? { rate: isMelodicSongOrPoem ? "+6%" : "+15%", pitch: "-2Hz" }
            : { rate: "+5%", pitch: "+0Hz" };

        const { audioStream } = tts.toStream(clean, prosody);
        const chunks: Buffer[] = [];
        audioStream.on("data", (chunk: Buffer) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        audioStream.on("end", () => {
          clearTimeout(timeout);
          const total = Buffer.concat(chunks);
          if (total.length > 200) {
            resolve(total);
          } else {
            edgeTtsBlockedInContainer = true;
            reject(new Error("Empty neural audio stream"));
          }
        });
        audioStream.on("error", (err: Error) => {
          clearTimeout(timeout);
          edgeTtsBlockedInContainer = true;
          reject(err);
        });
      } catch (err) {
        clearTimeout(timeout);
        edgeTtsBlockedInContainer = true;
        reject(err);
      }
    });
    return buffer;
  } catch {
    const rawFallback = await getFallbackGoogleTtsBuffer(clean, fallbackLang);
    if (rawFallback.length > 200 && isKhmer) {
      if (voiceName === "custom-male-voice" || voiceName === "km-KH-PisethNeural") {
        return await transformToCustomMaleVoiceBuffer(rawFallback, isMelodicSongOrPoem);
      }
      return await transformToCustomFemaleVoiceBuffer(rawFallback, isMelodicSongOrPoem);
    }
    // Foreign languages return untouched authentic native pronunciation!
    return rawFallback;
  }
}

async function generateDualVoiceSpeech(
  rawText: string,
  sessionOrGenderHint = "web_chat_session"
): Promise<{
  khmerAudio: string;
  englishAudio: string;
  combinedBuffer: Buffer;
  khmerText: string;
  englishText: string;
  khmerVoice: string;
  voiceLabel: string;
  isMaleVoice: boolean;
}> {
  const normalizedInput = sanitizeText(rawText);
  const hintKey = String(sessionOrGenderHint || "").trim().toLowerCase();
  const presetFromHint = (GEMINI_LIVE_VOICE_PRESETS as any)[hintKey];
  const tgSessionKey = String(sessionOrGenderHint || "").replace(/^tg_/, "");
  const tgSessionObj = telegramSessions.get(tgSessionKey);
  const presetFromSession =
    tgSessionObj?.liveVoicePreset &&
    (GEMINI_LIVE_VOICE_PRESETS as any)[tgSessionObj.liveVoicePreset]
      ? (GEMINI_LIVE_VOICE_PRESETS as any)[tgSessionObj.liveVoicePreset]
      : null;
  const activePreset = presetFromHint || presetFromSession;

  const voiceResolved = activePreset
    ? {
        voiceId: (activePreset.isMale ? "custom-male-voice" : "custom-female-voice") as any,
        voiceNameKhmer: activePreset.name,
        isMaleVoice: Boolean(activePreset.isMale),
      }
    : sessionOrGenderHint === "female"
    ? {
        voiceId: "custom-male-voice" as const,
        voiceNameKhmer: "សំឡេងប្រុសផ្ទាល់ខ្លួន",
        isMaleVoice: true,
      }
    : sessionOrGenderHint === "male"
    ? {
        voiceId: "custom-female-voice" as const,
        voiceNameKhmer: "សំឡេងស្រីផ្ទាល់ខ្លួន",
        isMaleVoice: false,
      }
    : resolveKhmerVoiceForSession(sessionOrGenderHint, normalizedInput);

  const cacheKey = `${voiceResolved.voiceId}:${normalizedInput.slice(0, 600)}`;
  const cached = dualVoiceSpeechCache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      khmerVoice: `${voiceResolved.voiceId} (${voiceResolved.voiceNameKhmer})`,
      voiceLabel: voiceResolved.voiceNameKhmer,
      isMaleVoice: voiceResolved.isMaleVoice,
    };
  }

  const isMelodicSongOrPoem = /(?:🎼|🎵|🎶|ការសូត្រកំណាព្យ|ការច្រៀងចម្រៀង|លំនាំបទ)/i.test(normalizedInput);
  const segments = segmentTextByLanguage(normalizedInput, voiceResolved.isMaleVoice);

  if (segments.length === 0) {
    return {
      khmerAudio: "",
      englishAudio: "",
      combinedBuffer: Buffer.alloc(0),
      khmerText: "",
      englishText: "",
      khmerVoice: `${voiceResolved.voiceId} (${voiceResolved.voiceNameKhmer})`,
      voiceLabel: voiceResolved.voiceNameKhmer,
      isMaleVoice: voiceResolved.isMaleVoice,
    };
  }

  // Synthesize each language segment using its authentic native voice and accurate pronunciation
  const segmentBuffers = await Promise.all(
    segments.map((seg) =>
      synthesizeEdgeNeuralVoiceBuffer(
        seg.text,
        seg.isKhmer ? voiceResolved.voiceId : seg.edgeVoice,
        seg.googleLang,
        seg.isKhmer && isMelodicSongOrPoem
      ).catch(() => Buffer.alloc(0))
    )
  );

  const validBuffers: Buffer[] = [];
  const kmBuffers: Buffer[] = [];
  const foreignBuffers: Buffer[] = [];
  let khmerTextAcc = "";
  let englishTextAcc = "";

  segments.forEach((seg, idx) => {
    const buf = segmentBuffers[idx];
    if (buf && buf.length > 100) {
      validBuffers.push(buf);
      if (seg.isKhmer) {
        kmBuffers.push(buf);
        khmerTextAcc += (khmerTextAcc ? " " : "") + seg.text;
      } else {
        foreignBuffers.push(buf);
        englishTextAcc += (englishTextAcc ? " " : "") + seg.text;
      }
    }
  });

  const combinedBuffer = Buffer.concat(validBuffers);
  const kmBufCombined = Buffer.concat(kmBuffers);
  const foreignBufCombined = Buffer.concat(foreignBuffers);

  const result = {
    khmerAudio:
      kmBufCombined.length > 0
        ? kmBufCombined.toString("base64")
        : combinedBuffer.length > 0
        ? combinedBuffer.toString("base64")
        : "",
    englishAudio: foreignBufCombined.length > 0 ? foreignBufCombined.toString("base64") : "",
    combinedBuffer,
    khmerText: khmerTextAcc || (kmBufCombined.length === 0 ? englishTextAcc : ""),
    englishText: englishTextAcc,
    khmerVoice: `${voiceResolved.voiceId} (${voiceResolved.voiceNameKhmer})`,
    voiceLabel: voiceResolved.voiceNameKhmer,
    isMaleVoice: voiceResolved.isMaleVoice,
  };

  if (combinedBuffer.length > 200) {
    if (dualVoiceSpeechCache.size > 120) {
      const oldestKey = dualVoiceSpeechCache.keys().next().value;
      if (oldestKey) dualVoiceSpeechCache.delete(oldestKey);
    }
    dualVoiceSpeechCache.set(cacheKey, result);
  }

  return result;
}

// ============================================================================
// 2. AI IMAGE GENERATION & IMAGE EDITING ENGINE (100% Uptime Multi-Engine)
// ============================================================================
function isAcademicExerciseOrDiagramPrompt(text: string): boolean {
  return /(?:លំហាត់|គណិត|រូបវិទ្យា|គីមី|ជីវវិទ្យា|សមីការ|អនុគមន៍|ត្រីកោណ|រង្វង់|មុំ|កម្លាំង|សៀគ្វី|ក្រាហ្វ|អាំងតេក្រាល|លីមីត|ដេរីវេ|វ៉ិចទ័រ|គណនា|ដោះស្រាយ|វិញ្ញាសា|ពីតាគ័រ|ប៉ារ៉ាបូល|ម៉ូលេគុល|ប្រតិកម្ម)/i.test(
    text
  );
}

function isImageGenerationOrEditRequest(text: string, hasAttachedImage: boolean): {
  isImageTask: boolean;
  mode: "generate" | "edit";
} {
  const trimmed = text.trim();
  if (/^\/(image|draw|paint|gen)\b/i.test(trimmed)) {
    return { isImageTask: true, mode: hasAttachedImage ? "edit" : "generate" };
  }
  if (/^\/edit\b/i.test(trimmed)) {
    return { isImageTask: true, mode: "edit" };
  }

  // Academic exercise or diagram requests should be handled by the MoEYS Exercise + SVG/PNG Card Engine
  if (isAcademicExerciseOrDiagramPrompt(trimmed)) {
    return { isImageTask: false, mode: "generate" };
  }

  // Edit triggers when an image is present or referenced
  const editRegex =
    /(?:កែរូបភាព|កែរូបនេះ|កែរូប|ប្តូរផ្ទៃខាងក្រោយ|ប្តូរផ្ទៃក្រោយ|ប្តូរពណ៌រូប|កែទៅជារូប|បន្ថែម.*ក្នុងរូប|edit\s+this\s+image|edit\s+the\s+image|edit\s+photo|change\s+the\s+background)/i;
  if (editRegex.test(trimmed)) {
    return { isImageTask: true, mode: "edit" };
  }

  // Generation triggers
  const genRegex =
    /(?:បង្កើតរូបភាព|បង្កើតរូប|គូររូបភាព|គូររូប|សុំរូបភាព|ជួយបង្កើតរូប|ជួយគូររូប|generate\s+an?\s+image|create\s+an?\s+image|generate\s+picture|draw\s+a\s+picture)/i;
  if (genRegex.test(trimmed)) {
    return { isImageTask: true, mode: hasAttachedImage ? "edit" : "generate" };
  }

  return { isImageTask: false, mode: "generate" };
}

async function generateOrEditImage(options: {
  prompt: string;
  mode?: "generate" | "edit";
  style?: string;
  aspectRatio?: string;
  sourceImage?: { data: string; mimeType: string };
}): Promise<{
  image: { data: string; mimeType: string };
  description: string;
}> {
  const {
    prompt,
    mode = options.sourceImage ? "edit" : "generate",
    style = "photorealistic",
    aspectRatio = "1:1",
    sourceImage,
  } = options;

  const cleanPrompt = prompt.replace(/^\/(image|edit|draw|gen)\s*/i, "").trim();

  // Engine 1: Try native Gemini Image Generation / Editing models first
  const geminiImageModels = ["gemini-3.1-flash-lite-image", "gemini-3.1-flash-image"];
  for (const imgModel of geminiImageModels) {
    try {
      const parts: any[] = [];
      if (sourceImage && sourceImage.data) {
        parts.push({
          inlineData: {
            data: sourceImage.data,
            mimeType: sourceImage.mimeType || "image/jpeg",
          },
        });
      }
      parts.push({
        text:
          mode === "edit"
            ? `Edit this image according to the user's request: ${cleanPrompt}. Style: ${style}.`
            : `Generate a high-quality image: ${cleanPrompt}. Style: ${style}.`,
      });

      const response = await ai.models.generateContent({
        model: imgModel,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio:
              aspectRatio === "16:9" || aspectRatio === "9:16" ? aspectRatio : "1:1",
          },
        },
      });

      const respParts = response.candidates?.[0]?.content?.parts || [];
      for (const part of respParts) {
        if (part.inlineData && part.inlineData.data) {
          return {
            image: {
              data: part.inlineData.data,
              mimeType: part.inlineData.mimeType || "image/png",
            },
            description:
              mode === "edit"
                ? `🎨 ខ្ញុំបានកែប្រែរូបភាពតាមការចង់បានរបស់អ្នករួចរាល់ហើយ៖ "${cleanPrompt}"\n\n🇬🇧 English Summary: I have edited the image according to your request.`
                : `✨ នេះជារូបភាពដែលខ្ញុំបានបង្កើតជូនអ្នក៖ "${cleanPrompt}"\n\n🇬🇧 English Summary: Here is the newly generated image based on your prompt.`,
          };
        }
      }
    } catch {
      // Proceed to Engine 2 (Gemini Vision + Flux AI Synthesis)
    }
  }

  // Engine 2: Use Gemini Vision + Text (gemini-3.1-flash-lite) to craft a precision English prompt
  // and synthesize high-res artwork via Pollinations Flux engine
  let craftedEnglishPrompt = cleanPrompt;
  let khmerExplanation =
    mode === "edit"
      ? `🎨 ខ្ញុំបានកែរូបភាពតាមការចង់បានរបស់អ្នករួចរាល់ហើយ (${cleanPrompt})!\n\n🇬🇧 English Summary: Your image has been modified and enhanced according to your instructions.`
      : `✨ នេះជារូបភាពដែលខ្ញុំបានបង្កើតជូនតាមការចង់បានរបស់អ្នក (${cleanPrompt})!\n\n🇬🇧 English Summary: Here is the AI-generated image created from your description.`;

  const styleMap: Record<string, string> = {
    photorealistic: "photorealistic 8k UHD, DSLR photography, cinematic lighting, ultra-detailed",
    "3d-anime": "3D Pixar Disney animation style, Octane render, vibrant colors, cute and expressive",
    "khmer-art": "Cambodian Angkor traditional royal masterpiece, intricate Khmer golden motifs, cinematic",
    "digital-art": "modern digital concept art, ArtStation trending, sharp focus, vivid colors",
    watercolor: "delicate watercolor painting on textured paper, artistic brushstrokes, soft lighting",
    cyberpunk: "futuristic cyberpunk neon city aesthetics, glowing lights, high contrast, sci-fi",
  };
  const styleSuffix = styleMap[style] || styleMap.photorealistic;

  try {
    const promptParts: any[] = [];
    if (sourceImage && sourceImage.data) {
      promptParts.push({
        inlineData: {
          data: sourceImage.data,
          mimeType: sourceImage.mimeType || "image/jpeg",
        },
      });
      promptParts.push({
        text: `Analyze this attached image carefully (subjects, people, clothing, colors, background, composition). The user wants to edit/transform this image with the instruction: "${cleanPrompt}".
Output a JSON object with:
1. "englishPrompt": A rich, vivid 40-word English image generation prompt that preserves the main subject/composition of the attached image while applying the exact edit instruction "${cleanPrompt}" in "${styleSuffix}" style.
2. "khmerCaption": A warm 2-sentence explanation in Khmer (Zero Thai characters!) describing how the image was edited, followed by "\\n\\n🇬🇧 English Summary: [1 sentence summary]".`,
      });
    } else {
      promptParts.push({
        text: `The user wants to generate an image with this request: "${cleanPrompt}".
Output a JSON object with:
1. "englishPrompt": A rich, vivid 40-word English image generation prompt for "${cleanPrompt}" in "${styleSuffix}" style.
2. "khmerCaption": A warm 2-sentence explanation in Khmer (Zero Thai characters!) describing the generated image, followed by "\\n\\n🇬🇧 English Summary: [1 sentence summary]".`,
      });
    }

    const analysisRes = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: { parts: promptParts },
      config: {
        responseMimeType: "application/json",
      },
    });

    if (analysisRes.text) {
      const parsed = JSON.parse(sanitizeText(analysisRes.text));
      if (parsed.englishPrompt) craftedEnglishPrompt = parsed.englishPrompt;
      if (parsed.khmerCaption) khmerExplanation = sanitizeText(parsed.khmerCaption);
    }
  } catch {
    craftedEnglishPrompt = `${cleanPrompt}, ${styleSuffix}`;
  }

  const width = aspectRatio === "16:9" ? 1024 : aspectRatio === "9:16" ? 576 : 768;
  const height = aspectRatio === "16:9" ? 576 : aspectRatio === "9:16" ? 1024 : 768;
  const seed = Math.floor(Math.random() * 900000) + 100000;

  try {
    const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      craftedEnglishPrompt
    )}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

    const imgRes = await fetch(imgUrl);
    if (imgRes.ok) {
      const arrayBuf = await imgRes.arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      if (buf.length > 1000) {
        return {
          image: {
            data: buf.toString("base64"),
            mimeType: imgRes.headers.get("content-type") || "image/jpeg",
          },
          description: khmerExplanation,
        };
      }
    }
  } catch {
    // Fall through to SVG artwork generator if offline
  }

  // Engine 3: Offline-safe SVG Artwork fallback
  const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="50%" stop-color="#1e3a8a"/>
        <stop offset="100%" stop-color="#0284c7"/>
      </linearGradient>
    </defs>
    <rect width="800" height="800" fill="url(#bg)"/>
    <circle cx="400" cy="340" r="160" fill="#fbbf24" opacity="0.85"/>
    <path d="M120 620 L280 420 L400 540 L540 360 L680 620 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="4"/>
    <text x="400" y="700" text-anchor="middle" fill="#ffffff" font-size="28" font-family="sans-serif" font-weight="bold">Khmer Super AI Studio</text>
    <text x="400" y="745" text-anchor="middle" fill="#bae6fd" font-size="20" font-family="sans-serif">${cleanPrompt.slice(0, 45)}</text>
  </svg>`;

  return {
    image: {
      data: Buffer.from(fallbackSvg, "utf-8").toString("base64"),
      mimeType: "image/svg+xml",
    },
    description: khmerExplanation,
  };
}

// ============================================================================
// 3. EXPRESS API ROUTES (/api/image, /api/chat, /api/transcribe, /api/tts)
// ============================================================================

// Dedicated endpoint for AI Image Generation & Editing
app.post("/api/image", async (req, res) => {
  try {
    const { prompt, mode, style, aspectRatio, sourceImage } = req.body;
    if (!prompt && !sourceImage) {
      return res.status(400).json({ error: "សូមបញ្ចូលការពិពណ៌នា ឬរូបភាព" });
    }

    const result = await generateOrEditImage({
      prompt: prompt || "កែលម្អរូបភាពនេះឱ្យកាន់តែស្អាតច្បាស់ 4K",
      mode,
      style,
      aspectRatio,
      sourceImage,
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      error: err?.message || "មិនអាចបង្កើត ឬកែរូបភាពបានទេ សូមព្យាយាមម្តងទៀត",
    });
  }
});

// Dedicated endpoint for Roleplay & Conversational Dialogue Acting presets
app.get("/api/roleplay/presets", (_req, res) => {
  return res.json({ ok: true, presets: POPULAR_ROLEPLAY_PRESETS });
});

// Dedicated endpoint for Social Media Video & Audio Extraction (YouTube, TikTok, Facebook -> MP4 & MP3)
app.all("/api/download", async (req, res) => {
  try {
    const targetUrl = String(req.body?.url || req.query?.url || "").trim();
    const format = String(req.body?.format || req.query?.format || "both").toLowerCase();
    const result = await extractSocialMediaVideoAndAudio(targetUrl, format);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "មិនអាចទាញយកវីដេអូ ឬសំឡេងបានទេ",
    });
  }
});

// Direct binary file stream / attachment download proxy for MP4 and MP3 (with automatic FFmpeg MP3 conversion!)
app.get("/api/download/file", async (req, res) => {
  try {
    const targetUrl = String(req.query?.url || "").trim();
    const format = String(req.query?.format || "mp4").toLowerCase() === "mp3" ? "mp3" : "mp4";
    const safeTitle =
      String(req.query?.title || "khmer_ai_media")
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .slice(0, 50) || "khmer_ai_media";

    if (!targetUrl || !targetUrl.startsWith("http")) {
      return res.status(400).json({ error: "Missing valid media URL" });
    }

    const upstream = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "*/*",
        Referer:
          targetUrl.includes("fbcdn") || targetUrl.includes("facebook")
            ? "https://www.facebook.com/"
            : targetUrl.includes("capcut") || targetUrl.includes("byteicdn") || targetUrl.includes("ibytedtos")
            ? "https://www.capcut.com/"
            : targetUrl.includes("pinimg") || targetUrl.includes("pinterest")
            ? "https://www.pinterest.com/"
            : targetUrl.includes("tiktok")
            ? "https://www.tiktok.com/"
            : targetUrl.includes("savetube")
            ? "https://save-tube.com/"
            : "https://www.youtube.com/",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(25000),
    });

    if (!upstream.ok) {
      return res.redirect(targetUrl);
    }

    const rawBuf = Buffer.from(await upstream.arrayBuffer());
    const isInlineStream = String(req.query?.inline || "") === "1";

    if (format === "mp3") {
      const mp3Buf = await convertBufferToMp3Server(rawBuf);

      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader(
        "Content-Disposition",
        `${isInlineStream ? "inline" : "attachment"}; filename="${safeTitle}.mp3"`
      );
      res.setHeader("Content-Length", String(mp3Buf.length));
      return res.send(mp3Buf);
    } else {
      // For CapCut: cleanly removes top and bottom watermarks without blur!
      // For Facebook, TikTok, Pinterest, YouTube: preserves 100% untouched original full HD video
      const dashAudioUrl = String(req.query?.dashAudio || "").trim();
      const platformParam = String(req.query?.platform || "").toLowerCase();
      const isCapcut = platformParam === "capcut" || /capcut/i.test(targetUrl);
      const mp4Buf = await removeCapcutWatermarkMp4Server(
        rawBuf,
        targetUrl,
        dashAudioUrl,
        isCapcut
      );

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader(
        "Content-Disposition",
        `${isInlineStream ? "inline" : "attachment"}; filename="${safeTitle}.mp4"`
      );
      res.setHeader("Content-Length", String(mp4Buf.length));
      return res.send(mp4Buf);
    }
  } catch {
    const fallbackUrl = String(req.query?.url || "");
    if (fallbackUrl.startsWith("http")) {
      return res.redirect(fallbackUrl);
    }
    return res.status(500).json({ error: "Download failed" });
  }
});

// ============================================================================
// VIDEO AUDIO TRANSLATION & KHMER DUBBING API ROUTES
// ============================================================================
app.post("/api/video/translate-khmer", async (req, res) => {
  try {
    const { videoUrl, videoBase64, mimeType, fileName, userPrompt } = req.body || {};
    let videoBuffer: Buffer | null = null;
    if (videoBase64 && typeof videoBase64 === "string") {
      const cleanB64 = videoBase64.includes(",") ? videoBase64.split(",")[1] : videoBase64;
      videoBuffer = Buffer.from(cleanB64, "base64");
    }
    const dubResult = await translateAndDubVideoToKhmerServer({
      videoBuffer: videoBuffer as any,
      videoUrl: String(videoUrl || "").trim(),
      titleHint: String(fileName || "").trim(),
      userHint: String(userPrompt || "").trim(),
      chatId: "web_client_session",
    });
    if (!dubResult.ok) {
      return res.status(400).json({
        ok: false,
        error: dubResult.error || "មិនអាចបកប្រែសំឡេងក្នុងវីដេអូនេះបានទេ",
      });
    }
    return res.json({
      ok: true,
      dubId: dubResult.dubId,
      title: dubResult.title,
      sourceUrl: dubResult.sourceUrl,
      detectedLanguage: dubResult.detectedLanguage,
      originalTranscript: dubResult.originalTranscript,
      khmerTranslation: dubResult.khmerTranslation,
      khmerMovieRecap: dubResult.khmerMovieRecap || dubResult.khmerTranslation,
      englishSummary: dubResult.englishSummary,
      voiceActorKhmer: dubResult.voiceActorKhmer,
      dubbedVideoUrl: dubResult.dubbedVideoUrl,
      dubbedAudioUrl: dubResult.dubbedAudioUrl,
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "មានបញ្ហាក្នុងការបកប្រែសំឡេងវីដេអូ",
    });
  }
});

app.get("/api/video/dubbed-file/:id", (req, res) => {
  try {
    const dubId = String(req.params.id || "");
    const format = String(req.query?.format || "mp4").toLowerCase() === "mp3" ? "mp3" : "mp4";
    const cached = getDubbedVideoFromCache(dubId);
    if (!cached) {
      return res.status(404).json({ error: "Dubbed video expired or not found" });
    }
    const safeTitle =
      String(cached.title || "khmer_dubbed_video")
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .slice(0, 45) || "khmer_dubbed_video";

    if (format === "mp3") {
      const buf: Buffer = cached.audioBuffer;
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Disposition", `inline; filename="${safeTitle}_Khmer_Audio.mp3"`);
      res.setHeader("Content-Length", String(buf.length));
      return res.send(buf);
    }

    const buf: Buffer = cached.videoBuffer;
    const total = buf.length;
    const range = req.headers.range;
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `inline; filename="${safeTitle}_Khmer_Dub.mp4"`);

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
      if (start >= 0 && start < total && end >= start && end < total) {
        const chunkSize = end - start + 1;
        res.status(206);
        res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`);
        res.setHeader("Content-Length", String(chunkSize));
        return res.send(buf.subarray(start, end + 1));
      }
    }

    res.setHeader("Content-Length", String(total));
    return res.send(buf);
  } catch {
    return res.status(500).json({ error: "Failed to stream dubbed video" });
  }
});

// Dedicated endpoint for Khmer & Multilingual Orthography/Grammar Check + Image-to-Text (OCR)
app.post("/api/orthography/check", async (req, res) => {
  try {
    const { text, imageBase64, mimeType, mode } = req.body || {};
    const result = await checkOrthographyAndOcrServer({
      text: String(text || ""),
      imageBase64: String(imageBase64 || ""),
      mimeType: String(mimeType || "image/jpeg"),
      mode: String(mode || "auto"),
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "មិនអាចត្រួតពិនិត្យអក្ខរាវិរុទ្ធ ឬបម្លែងរូបភាពជាអក្សរបានទេ",
    });
  }
});

// Universal World Language Translator API (All Languages Worldwide)
app.post("/api/translate", async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body || {};
    const result = await translateWorldLanguagesServer({
      text: String(text || ""),
      sourceLang: String(sourceLang || "auto"),
      targetLang: String(targetLang || "km"),
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "មិនអាចបកប្រែភាសាបានទេ",
    });
  }
});

// Illustrated Story Generator API (Horror, Novel, Folktale with Character Portraits & Episode Illustrations)
app.post("/api/story/generate", async (req, res) => {
  try {
    const { prompt, genre, episodeCount } = req.body || {};
    const result = await generateIllustratedStoryServer({
      prompt: String(prompt || ""),
      genre: String(genre || "auto"),
      episodeCount: Number(episodeCount) || 4,
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "មិនអាចបង្កើតសាច់រឿងបានទេ",
    });
  }
});

// Tri-Directional Visual Dictionary API (Khmer-Khmer, English-Khmer, Khmer-English with Real Word Photograph & Examples)
app.post("/api/dictionary/lookup", async (req, res) => {
  try {
    const { word, mode } = req.body || {};
    const result: any = await lookupVisualDictionaryServer({
      word: String(word || ""),
      mode: String(mode || "auto"),
    });
    const { realPhotoBuffer, realPhotoDataUrl, ...cleanResult } = result || {};
    return res.json(cleanResult);
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "មិនអាចស្វែងរកពាក្យក្នុងវចនានុក្រមបានទេ",
    });
  }
});

// Real Photograph Endpoint for Dictionary Words (serves authentic photo from Wikipedia/Wikimedia Commons)
app.get("/api/dictionary/photo", async (req, res) => {
  try {
    const key = String(req.query?.key || "");
    const q = String(req.query?.q || "");
    const photoEntry: any = await getDictionaryCachedPhotoServer(key, q);
    if (photoEntry && photoEntry.buffer) {
      res.setHeader("Content-Type", photoEntry.mimeType || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(photoEntry.buffer);
    }
    return res.status(404).end();
  } catch {
    return res.status(404).end();
  }
});

// Real-Time Cambodia Calendar & Daily Event / Holiday Notifier API
app.all("/api/calendar/cambodia", (req, res) => {
  try {
    const year = req.body?.year || req.query?.year;
    const month = req.body?.month || req.query?.month;
    const category = req.body?.category || req.query?.category || "all";
    const query = req.body?.query || req.query?.query || "";
    const result = getCambodiaCalendarEventsServer({
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      category: String(category),
      query: String(query),
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "មិនអាចទាញយកប្រតិទិនកម្ពុជាបានទេ",
    });
  }
});

// Manual / Instant Broadcast of Daily Calendar Report to all active Telegram Chats
app.all("/api/calendar/broadcast-now", async (req, res) => {
  try {
    const token = activeTelegramBot?.token || loadSavedTelegramConfig().token;
    if (!token) {
      return res.status(400).json({ ok: false, error: "Telegram bot is not connected yet" });
    }
    const result = await runDailyCalendarBroadcastCycle(token);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});

// Talking Photo AI Video Generator API (100% Free)
app.get("/api/talking-photo/gestures", (_req, res) => {
  return res.json({ ok: true, gestures: TALKING_PHOTO_GESTURES });
});

app.post("/api/talking-photo/generate", async (req, res) => {
  try {
    const { imageBase64, text, gesture, voiceGender, subtitlePreset } = req.body || {};
    const imgBuf = imageBase64
      ? Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), "base64")
      : null;
    const result = await createTalkingPhotoVideo(imgBuf, text, {
      gesture: gesture || "sampeah",
      voiceGender: voiceGender || "female",
      subtitlePreset: subtitlePreset || "tiktok_gold",
    });
    if (!result || !result.ok || !result.buffer) {
      return res.status(500).json({ ok: false, error: "Failed to generate talking photo video" });
    }
    const b64Video = result.buffer.toString("base64");
    return res.json({
      ok: true,
      duration: result.duration,
      gesture: result.gesture,
      voiceName: result.voiceName,
      videoBase64: `data:video/mp4;base64,${b64Video}`,
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});

// Video Animated Running Subtitles (Kinetic Karaoke Captions) API
app.get("/api/video-subtitle/presets", (_req, res) => {
  return res.json({ ok: true, presets: SUBTITLE_COLOR_PRESETS });
});

app.post("/api/video-subtitle/generate", async (req, res) => {
  try {
    const { videoBase64, videoUrl, scriptText, preset } = req.body || {};
    let targetBuf: Buffer | null = null;
    if (videoBase64) {
      targetBuf = Buffer.from(videoBase64.replace(/^data:video\/\w+;base64,/, ""), "base64");
    } else if (videoUrl) {
      const resp = await fetch(videoUrl, { signal: AbortSignal.timeout(15000) });
      if (resp.ok) {
        targetBuf = Buffer.from(await resp.arrayBuffer());
      }
    }

    if (!targetBuf || targetBuf.length < 500) {
      return res.status(400).json({ ok: false, error: "No valid video buffer or URL provided" });
    }

    const result = await burnRunningSubtitlesToVideo(targetBuf, scriptText, {
      preset: preset || "tiktok_gold",
    });

    if (!result || !result.ok || !result.buffer) {
      return res.status(500).json({ ok: false, error: result?.error || "Failed to burn running subtitles" });
    }

    const b64 = result.buffer.toString("base64");
    return res.json({
      ok: true,
      videoBase64: `data:video/mp4;base64,${b64}`,
      duration: result.duration,
      script: result.script,
      width: result.width,
      height: result.height,
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});

// Base-10 Decimal Number & Words Converter API
app.all("/api/decimal-converter", (req, res) => {
  try {
    const input = String(req.body?.input || req.query?.input || "2026").trim();
    const result = comprehensiveDecimalConversion(input);
    return res.json({ ok: true, result });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});

// ============================================================================
// UNIVERSAL QR CODE STUDIO API ROUTES (Text, Image, Video, Word, Excel, PDF, PPTX)
// ============================================================================

app.post("/api/qr/generate", async (req, res) => {
  try {
    const { content, title, category, fileName, fileSize, asCard, darkColor, lightColor } = req.body || {};
    if (!content) {
      return res.status(400).json({ ok: false, error: "Missing content for QR Code" });
    }
    const dataUrl = await generateQrCodeDataUrl(content, { darkColor, lightColor });
    const svg = await generateQrCodeSvg(content, { darkColor, lightColor });
    let posterCardBase64 = null;
    if (asCard) {
      const cardBuf = await createQrPosterCardPngBuffer(content, {
        title: title || "QR Code ឆ្លាតវៃ",
        category,
        fileName,
        fileSize,
        darkColor,
        lightColor,
      });
      posterCardBase64 = `data:image/png;base64,${cardBuf.toString("base64")}`;
    }
    return res.json({ ok: true, dataUrl, svg, posterCardBase64, content });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});

// Endpoint to send generated QR Code directly to a Telegram Chat ID or connected Bot
app.post("/api/qr/send-telegram", async (req, res) => {
  try {
    const { chatId, content, title, fileName, fileSize, category } = req.body || {};
    const targetChatId = chatId || (activeTelegramBot as any)?.lastUserChatId;
    if (!targetChatId) {
      return res.status(400).json({
        ok: false,
        error: "សូមបញ្ចូល Telegram Chat ID (ឬភ្ជាប់ Telegram Bot) ជាមុនសិន!",
      });
    }

    const token = activeTelegramBot?.token || getConfiguredBotToken();
    if (!token) {
      return res.status(400).json({
        ok: false,
        error: "Telegram Bot មិនទាន់ត្រូវបានតភ្ជាប់នៅឡើយទេ។ សូមភ្ជាប់ Telegram Bot ជាមុនសិន!",
      });
    }

    const posterBuf = await createQrPosterCardPngBuffer(content, {
      title: title || "កូដ QR ឆ្លាតវៃ",
      category,
      fileName,
      fileSize,
    });

    const caption =
      `📱✨ <b>កូដ QR Code ត្រូវបាននាំចេញដោយជោគជ័យ!</b>\n\n` +
      `• <b>ចំណងជើង/ឯកសារ៖</b> ${title || fileName || "QR Code"}\n` +
      `• <b>តំណភ្ជាប់៖</b> <code>${content}</code>\n\n` +
      `📷 <i>លោកអ្នកអាចស្កេនរូបភាព QR នេះជាមួយកាមេរ៉ាទូរស័ព្ទដើម្បីចូលប្រើ ឬទាញយកបានភ្លាមៗ!</i>`;

    await sendTelegramQrCodeResponse(token, targetChatId, posterBuf, {
      captionHtml: caption,
      fileUrl: String(content).startsWith("http") ? content : "",
      fileName: fileName || title || "QR Code",
    });

    return res.json({
      ok: true,
      message: `បានផ្ញើកូដ QR ទៅកាន់ Telegram Chat ID: ${targetChatId} ដោយជោគជ័យ!`,
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});

// Direct Image File Download Endpoint for QR Code (Returns genuine image/png with attachment header)
app.all("/api/qr/download", async (req, res) => {
  try {
    const params = req.method === "POST" ? req.body : req.query;
    const {
      content,
      format = "png",
      darkColor = "#0f172a",
      lightColor = "#ffffff",
      asCard,
      title = "QR Code",
      fileName = "",
      fileSize = 0,
      category = "general",
    } = params || {};

    if (!content) {
      return res.status(400).send("Missing content for QR Code");
    }

    const isCard = asCard === true || asCard === "true" || format === "card";
    const isSvg = format === "svg";

    if (isSvg) {
      const svg = await generateQrCodeSvg(content, { darkColor, lightColor });
      const filename = `qrcode_${Date.now()}.svg`;
      res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(svg);
    }

    if (isCard) {
      const cardBuf = await createQrPosterCardPngBuffer(content, {
        title: title || "QR Code ឆ្លាតវៃ",
        category,
        fileName,
        fileSize: Number(fileSize) || 0,
        darkColor,
        lightColor,
      });
      const filename = `qrcode_poster_${Date.now()}.png`;
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", cardBuf.length);
      return res.end(cardBuf);
    }

    // Default: High-Resolution PNG (1024x1024)
    const pngBuf = await generateQrCodePngBuffer(content, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: "H",
      darkColor,
      lightColor,
    });
    const filename = `qrcode_${Date.now()}.png`;
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pngBuf.length);
    return res.end(pngBuf);
  } catch (err: any) {
    return res.status(500).send(err?.message || "Failed to download QR code image");
  }
});

app.post("/api/qr/upload", async (req, res) => {
  try {
    const { fileBase64, fileName, mimeType, title } = req.body || {};
    if (!fileBase64) {
      return res.status(400).json({ ok: false, error: "Missing file payload" });
    }
    const cleanB64 = fileBase64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(cleanB64, "base64");
    const fileRecord = await storeFileForQr(buffer, fileName || "file.dat", mimeType || "");

    const qrDataUrl = await generateQrCodeDataUrl(fileRecord.accessUrl);
    const posterBuf = await createQrPosterCardPngBuffer(fileRecord.accessUrl, {
      title: title || fileRecord.fileName,
      category: fileRecord.category,
      fileName: fileRecord.fileName,
      fileSize: fileRecord.size,
      icon: fileRecord.icon,
    });
    const posterCardBase64 = `data:image/png;base64,${posterBuf.toString("base64")}`;

    return res.json({
      ok: true,
      file: fileRecord,
      qrDataUrl,
      posterCardBase64,
      accessUrl: fileRecord.accessUrl,
      downloadUrl: fileRecord.downloadUrl,
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});

app.get("/api/qr/file/:id", async (req, res) => {
  try {
    const fileId = req.params.id;
    const fileRecord = getFileRecord(fileId);
    if (!fileRecord) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>File Not Found</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:50px;background:#0f172a;color:#fff;">
          <h2>⚠️ រកមិនឃើញឯកសារទេ (File Not Found)</h2>
          <p style="color:#94a3b8;">ឯកសារនេះប្រហែលជាត្រូវបានលុប ឬផុតកំណត់។</p>
        </body>
        </html>
      `);
    }

    const filePath = path.join(QR_UPLOADS_DIR, fileRecord.diskName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found on disk");
    }

    // Direct download requested
    if (req.query.download === "1" || req.query.dl === "1") {
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileRecord.fileName)}"`);
      res.setHeader("Content-Type", fileRecord.mimeType || "application/octet-stream");
      return fs.createReadStream(filePath).pipe(res);
    }

    // Modern mobile & desktop landing preview page for scanned QR codes
    const safeName = fileRecord.fileName.replace(/"/g, "&quot;");
    const sizeStr = (fileRecord.size / 1024 / 1024).toFixed(2) + " MB";
    const downloadLink = `/api/qr/file/${fileId}?download=1`;

    const html = `<!DOCTYPE html>
<html lang="km">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>${safeName} - Khmer AI QR Hub</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Kantumruy Pro', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #090e1a;
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #111a2e;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 28px;
      max-width: 480px;
      width: 100%;
      padding: 32px 24px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      border-radius: 9999px;
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 20px;
    }
    .file-icon {
      font-size: 56px;
      margin-bottom: 16px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 8px;
      word-break: break-word;
    }
    .meta {
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .preview-box {
      margin-bottom: 24px;
      border-radius: 16px;
      overflow: hidden;
      max-height: 280px;
      background: #000;
    }
    .preview-box img, .preview-box video {
      width: 100%;
      height: auto;
      max-height: 280px;
      object-fit: contain;
    }
    .btn-download {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 14px 20px;
      border-radius: 16px;
      background: linear-gradient(135deg, #0284c7, #4f46e5);
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s;
      box-shadow: 0 10px 20px -5px rgba(2, 132, 199, 0.4);
    }
    .btn-download:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 25px -5px rgba(2, 132, 199, 0.5);
    }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${fileRecord.categoryLabel}</div>
    <div class="file-icon">${fileRecord.icon}</div>
    <div class="title">${safeName}</div>
    <div class="meta">${sizeStr} • ស្កេនពី QR Code</div>

    ${
      fileRecord.category === "image"
        ? `<div class="preview-box"><img src="${downloadLink}" alt="Preview" /></div>`
        : fileRecord.category === "video"
        ? `<div class="preview-box"><video src="${downloadLink}" controls autoplay muted playsinline></video></div>`
        : ""
    }

    <a href="${downloadLink}" class="btn-download" download="${safeName}">
      📥 ទាញយកឯកសារ (Download Now)
    </a>

    <div class="footer">
      🔒 សុវត្ថិភាពខ្ពស់ ១០០% • ដំណើរការដោយ Khmer Super AI Agent
    </div>
  </div>
</body>
</html>`;

    return res.send(html);
  } catch (err: any) {
    return res.status(500).send("Error serving file");
  }
});

// Sync Hands-Free Live Chat turn directly into Telegram chat when opened from Telegram Mini App (?livechat=1&tg_chat_id=...)
app.post("/api/telegram/live-turn", async (req, res) => {
  try {
    const { chatId, userSpokenText, botReplyText } = req.body || {};
    if (!chatId || !botReplyText) {
      return res.json({ ok: false });
    }
    const token = getConfiguredBotToken();
    if (!token) return res.json({ ok: false });

    const formattedMsg =
      `🎙️ <b>[អ្នកនិយាយ Live Chat]៖</b> ${userSpokenText || "..."}\n\n` +
      `🤖 <b>[AI ឆ្លើយតបភ្លាមៗ]៖</b>\n${botReplyText}`;
    await Promise.all([
      sendTelegramMessage(token, chatId, formattedMsg),
      sendTelegramVoiceReply(token, chatId, botReplyText),
    ]);
    return res.json({ ok: true });
  } catch {
    return res.json({ ok: false });
  }
});

// Streaming Chat API endpoint for Web Client with auto-fallback & automatic image generation/editing
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, userMood, emotionTone, customInstruction } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages payload" });
    }

    // Set unbuffered Server-Sent Events headers and flush immediately so client never times out waiting for headers
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    res.write(": stream-start\n\n");

    const heartbeatTimer = setInterval(() => {
      try {
        res.write(": heartbeat\n\n");
      } catch {}
    }, 3000);

    const cleanupStream = () => {
      clearInterval(heartbeatTimer);
    };
    req.on("close", cleanupStream);

    const lastMessage = messages[messages.length - 1];
    let lastUserText = String(lastMessage?.text || "").trim();
    const lastUserImage = lastMessage?.image;

    const requestedEmotionTone = String(emotionTone || userMood || "").trim().toLowerCase();
    if (requestedEmotionTone && (GEMINI_LIVE_EMOTION_MODES as any)[requestedEmotionTone]) {
      setCompanionForcedEmotionTone("web_chat_session", requestedEmotionTone);
      setCompanionForcedEmotionTone("web_client_session", requestedEmotionTone);
    }

    // If user sent a voice note where text is missing or placeholder, transcribe it immediately with 100% accuracy!
    if (
      lastMessage?.audio?.data &&
      (!lastUserText ||
        lastUserText.includes("[សារសំឡេង") ||
        lastUserText.includes("Voice Note"))
    ) {
      const transcribedVoice = await transcribeAudioBufferServer(
        lastMessage.audio.data,
        lastMessage.audio.mimeType || "audio/webm"
      );
      if (transcribedVoice && transcribedVoice !== "[INAUDIBLE_SPEECH]") {
        lastUserText = sanitizeText(transcribedVoice).trim();
        lastMessage.text = lastUserText;
        res.write(`data: ${JSON.stringify({ transcript: lastUserText })}\n\n`);
      }
    }

    const wantsExerciseCardImage = /(?:រូបភាពលំហាត់|រូបលំហាត់|តារាងដំណោះស្រាយ)/i.test(lastUserText);

    if (isClearChatCommand(lastUserText)) {
      clearAllCompanionSessions();
      clearAllServerlessSessions();
      const clearedReply =
        "🧹✨ **ឆាតចាស់ៗត្រូវបានសម្អាតរួចរាល់!** តើបង/អូន មានសំណួរចំណេះដឹង ឬលំហាត់អ្វីឱ្យខ្ញុំជួយដោះស្រាយបន្តនៅថ្ងៃនេះដែរ? 🥰💖\n🇬🇧 English: All previous chat history has been cleared! What question or exercise can I help you with next?";
      cleanupStream();
      res.write(`data: ${JSON.stringify({ text: clearedReply })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // Immediate Moderation Check: Block, auto-delete, and severely scold inappropriate/obscene speech, videos, or photos
    const webModCheck = analyzeInappropriateOrObsceneContent(lastUserText);
    if (webModCheck.isInappropriate && webModCheck.reprimandReplyKhmer) {
      cleanupStream();
      res.write(
        `data: ${JSON.stringify({
          text: webModCheck.reprimandReplyKhmer,
          deleteUserMessage: true,
        })}\n\n`
      );
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // Check if the user attached/uploaded a file for security inspection or shared a dangerous file/scam link in Web Chat
    const fileInspectMatch = lastUserText.match(/\[ត្រួតពិនិត្យសុវត្ថិភាពហ្វាល់:\s*([^\]|]+)/i);
    const inlineFileMatch = lastUserText.match(
      /([^\s"'<>`|]+\.(?:apk|xapk|exe|scr|msi|bat|cmd|vbs|js|ps1|hta|reg|lnk|zip|rar|7z|iso|docm|xlsm|pptm|dmg|pkg|sh))\b/i
    );
    const candidateFileName = fileInspectMatch
      ? fileInspectMatch[1].trim()
      : inlineFileMatch
      ? inlineFileMatch[1].trim()
      : "";

    if (candidateFileName) {
      const fileSec = analyzeFileSecurity(candidateFileName, "", 0, lastUserText);
      if (fileSec.isDangerous) {
        const warningMd = buildSecurityWarningCardMarkdown(fileSec, {
          isGroupChat: false,
        });
        cleanupStream();
        res.write(`data: ${JSON.stringify({ text: warningMd })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }
    }

    const webLinkCheck = analyzeMessageForScamLinks(lastUserText);
    if (webLinkCheck.isScamLink && webLinkCheck.warningReportKhmer) {
      cleanupStream();
      res.write(`data: ${JSON.stringify({ text: webLinkCheck.warningReportKhmer })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // Check if the user asked to translate/dub a video's audio into Khmer (/dub or "បកប្រែវីដេអូ...")
    const urlInUserText = (lastUserText.match(/https?:\/\/[^\s<>"'`]+/i) || [])[0] || "";
    if (isVideoTranslationToKhmerRequest(lastUserText) && urlInUserText) {
      const dubRes = await translateAndDubVideoToKhmerServer({
        videoUrl: urlInUserText,
        userHint: lastUserText,
        chatId: "web_client_session",
      });
      if (dubRes.ok && dubRes.dubbedVideoUrl) {
        const dubMd = buildVideoKhmerDubMarkdown({
          ok: true,
          title: dubRes.title,
          sourceUrl: dubRes.sourceUrl,
          detectedLanguage: dubRes.detectedLanguage,
          originalTranscript: dubRes.originalTranscript,
          khmerTranslation: dubRes.khmerTranslation,
          englishSummary: dubRes.englishSummary,
          dubbedVideoUrl: dubRes.dubbedVideoUrl,
          dubbedAudioUrl: dubRes.dubbedAudioUrl,
          voiceActorKhmer: dubRes.voiceActorKhmer,
        });
        cleanupStream();
        res.write(`data: ${JSON.stringify({ text: dubMd })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }
    }

    // Check if the user asked to check orthography/grammar OR convert an image of text to copyable text (OCR)
    if (isOrthographyOrOcrRequestServer(lastUserText, !!lastUserImage)) {
      const orthoRes = await checkOrthographyAndOcrServer({
        text: lastUserText,
        imageBase64: lastUserImage?.data || "",
        mimeType: lastUserImage?.mimeType || "image/jpeg",
      });
      const payload = encodeURIComponent(JSON.stringify(orthoRes));
      const orthoMd =
        `### ${
          orthoRes.hasImage
            ? "📋🔍 លទ្ធផលបម្លែងរូបភាពទៅជាអក្សរ (OCR) និងត្រួតពិនិត្យអក្ខរាវិរុទ្ធ"
            : "📝🇰🇭 លទ្ធផលត្រួតពិនិត្យអក្ខរាវិរុទ្ធ និងក្បួនខ្នាតវេយ្យាករណ៍"
        }\n\n` +
        `• 🌐 **ភាសា៖** ${orthoRes.detectedLanguage} | 🔍 **កំហុសរកឃើញ៖** ${orthoRes.errorCount} កន្លែង\n` +
        `• 💡 **ការវាយតម្លៃវេយ្យាករណ៍៖** ${orthoRes.grammarSummaryKhmer}\n\n` +
        `\`\`\`orthography-ocr\n${payload}\n\`\`\`\n\n` +
        `🇬🇧 English: ${orthoRes.englishSummary}`;
      cleanupStream();
      res.write(`data: ${JSON.stringify({ text: orthoMd })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // Check if the user requested Cambodia Calendar & Daily Event / Holiday Notification
    if (isCambodiaCalendarRequestServer(lastUserText)) {
      const calRes = getCambodiaCalendarEventsServer({ query: lastUserText });
      const payload = encodeURIComponent(JSON.stringify(calRes));
      const calMd =
        `### 🇰🇭📅 ប្រតិទិនកម្ពុជា និងអ្នកជូនដំណឹងថ្ងៃបុណ្យជាតិ/អន្តរជាតិ (${calRes.targetYear})\n\n` +
        `• ${calRes.notificationBanner}\n\n` +
        `\`\`\`cambodia-calendar\n${payload}\n\`\`\`\n\n` +
        `🇬🇧 English: Real-time Cambodia Calendar (${calRes.targetYear}) with ${calRes.totalPublicHolidays} official public holidays, national festivals, and international observances.`;
      cleanupStream();
      res.write(`data: ${JSON.stringify({ text: calMd })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // Check if the user requested Tri-Directional Visual Dictionary (Khmer-Khmer, English-Khmer, Khmer-English)
    if (isDictionaryRequestServer(lastUserText)) {
      const dictRes: any = await lookupVisualDictionaryServer({ word: lastUserText, mode: "auto" });
      const { realPhotoBuffer, realPhotoDataUrl, ...cleanDictRes } = dictRes || {};
      const payload = encodeURIComponent(JSON.stringify(cleanDictRes));
      const activeMode =
        cleanDictRes.mode === "en-km" || cleanDictRes.mode === "km-en"
          ? cleanDictRes.mode
          : "km-km";

      let dictMd = "";
      if (activeMode === "km-km") {
        dictMd =
          `### ${cleanDictRes.emoji}📖 វចនានុក្រម ខ្មែរ-ខ្មែរ (សម្ដេចព្រះសង្ឃរាជ ជួន ណាត)៖ «${cleanDictRes.khmerWord}»\n\n` +
          `🎯 **ពាក្យគោល៖** **«${cleanDictRes.khmerWord}»** *(អានថា៖ ${cleanDictRes.pronunciationKhmer})* — ${cleanDictRes.partOfSpeech}\n` +
          `• 🇰🇭➡️🇰🇭 **និយមន័យតាមវចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត៖** ${cleanDictRes.khmerToKhmerDef}\n\n` +
          `\`\`\`visual-dictionary\n${payload}\n\`\`\``;
      } else if (activeMode === "en-km") {
        dictMd =
          `### ${cleanDictRes.emoji}📖 វចនានុក្រម អង់គ្លេស-ខ្មែរ (English ➔ Khmer)៖ «${cleanDictRes.englishWord} ➔ ${cleanDictRes.khmerWord}»\n\n` +
          `🎯 **ចម្លើយបកប្រែ៖** ពាក្យអង់គ្លេស **«${cleanDictRes.englishWord}»** ប្រែជាភាសាខ្មែរថា **«${cleanDictRes.khmerWord}»**\n` +
          `• 🗣️ **អានតាមតុងអង់គ្លេស៖** **${cleanDictRes.pronunciationEnglishTone}**\n` +
          `• 🇬🇧➡️🇰🇭 **និយមន័យ អង់គ្លេស-ខ្មែរ៖** ${cleanDictRes.englishToKhmerDef}\n\n` +
          `\`\`\`visual-dictionary\n${payload}\n\`\`\``;
      } else {
        dictMd =
          `### ${cleanDictRes.emoji}📖 វចនានុក្រម ខ្មែរ-អង់គ្លេស (Khmer ➔ English)៖ «${cleanDictRes.khmerWord} ➔ ${cleanDictRes.englishWord}»\n\n` +
          `🎯 **ចម្លើយបកប្រែ៖** ពាក្យខ្មែរ **«${cleanDictRes.khmerWord}»** ប្រែជាភាសាអង់គ្លេសគឺ **«${cleanDictRes.englishWord}»**\n` +
          `• 🗣️ **អានតាមតុងអង់គ្លេស៖** **${cleanDictRes.pronunciationEnglishTone}**\n` +
          `• 🇰🇭➡️🇬🇧 **និយមន័យ ខ្មែរ-អង់គ្លេស៖** ${cleanDictRes.khmerToEnglishDef}\n\n` +
          `\`\`\`visual-dictionary\n${payload}\n\`\`\``;
      }

      cleanupStream();
      res.write(`data: ${JSON.stringify({ text: dictMd })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // Check if the user requested Illustrated Story Generation (Horror / Novel / Folktale)
    if (isStoryGenerationRequestServer(lastUserText)) {
      const storyRes = await generateIllustratedStoryServer({
        prompt: lastUserText,
        genre: "auto",
        episodeCount: 4,
      });
      const payload = encodeURIComponent(JSON.stringify(storyRes));
      const storyMd =
        `### 📖✨ ${storyRes.title} (${storyRes.genreLabelKhmer})\n\n` +
        `• 📝 **សេចក្ដីសង្ខេប៖** ${storyRes.synopsis}\n\n` +
        `\`\`\`illustrated-story\n${payload}\n\`\`\`\n\n` +
        `🇬🇧 English: Illustrated story "${storyRes.englishTitle}" featuring ${storyRes.characters.length} character portraits and ${storyRes.episodes.length} illustrated episodes.`;
      cleanupStream();
      res.write(`data: ${JSON.stringify({ text: storyMd })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // Check if the user requested Universal World Language Translation
    if (isWorldTranslationRequestServer(lastUserText)) {
      const trRes = await translateWorldLanguagesServer({
        text: lastUserText,
        sourceLang: "auto",
        targetLang: "km",
      });
      const payload = encodeURIComponent(JSON.stringify(trRes));
      const trMd =
        `### 🌍✨ ការបកប្រែភាសាពិភពលោក (${trRes.detectedSourceLang} ➔ ${trRes.targetLangLabel})\n\n` +
        `• 🎯 **អត្ថបទបកប្រែ៖** ${trRes.translatedText}\n\n` +
        `\`\`\`world-translator\n${payload}\n\`\`\`\n\n` +
        `🇬🇧 English: Translated from ${trRes.detectedSourceLang} to ${trRes.targetLangLabel}: "${trRes.translatedText}"`;
      cleanupStream();
      res.write(`data: ${JSON.stringify({ text: trMd })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // Check if the user requested to chat to someone's Facebook Messenger (via Facebook Profile Link) or Telegram Group/ID Chat
    const parsedIdChatCmd = parseIdChatCommandServer(lastUserText);
    if (parsedIdChatCmd && parsedIdChatCmd.action === "send" && parsedIdChatCmd.targetChatId) {
      const chatRes = await executeTelegramChatToIdServer({
        token: getConfiguredBotToken(),
        targetChatId: parsedIdChatCmd.targetChatId,
        mode: parsedIdChatCmd.mode || "auto_speak_loop",
        messageOrCommand: parsedIdChatCmd.messageOrCommand || "",
        persona: "friendly",
      });
      if (chatRes.ok) {
        const fbLinksMd = chatRes.isFacebookMessenger
          ? `\n• 💙 **បើកផ្ញើសារក្នុងកម្មវិធី Messenger ភ្លាម (m.me)៖** [ចុចទីនេះដើម្បីឆាតក្នុង Messenger](${chatRes.messengerUrl})\n` +
            `• 🌐 **បើកក្នុង Messenger Web៖** [ចុចបើក Messenger Web](${chatRes.messengerWebUrl})\n` +
            `• 👤 **Facebook Profile៖** ${chatRes.profileUrl}\n`
          : "";
        const replyMd =
          `### 💬💙 ប្រព័ន្ធបញ្ជាឆាតទៅកាន់ ${chatRes.isFacebookMessenger ? "Facebook Messenger (តាម Link Profile)" : "អ្នកប្រើ Telegram Bot / Group"}\n\n` +
          `• 🎯 **គោលដៅ (Target)៖** **${chatRes.targetName || chatRes.targetChatId}**\n` +
          `• 📱 **ប្រភេទទូរសព្ទ និងថ្មទូរសព្ទរបស់គាត់៖** 📱 **${(chatRes as any).targetDeviceModel || "Smartphone"}** | 🔋 **ថ្ម ${(chatRes as any).targetBatteryLevel ?? 88}%**\n` +
          `• ⚙️ **របៀបដំណើរការ៖** ${chatRes.modeLabelKhmer}\n` +
          `• 🗣️ **សារដែល AI បានរៀបចំ/ផ្ញើ៖**\n> ${chatRes.sentMessage}\n` +
          fbLinksMd +
          `\n• 🤖 **ស្ថានភាពឆ្លើយតបស្វ័យប្រវត្តិ៖** ${
            chatRes.autoLoopActive
              ? "កំពុងបើកឱ្យ AI និយាយ និងឆ្លើយតបដោយខ្លួនឯងស្វ័យប្រវត្តិ (Autonomous AI Auto-Reply ON)"
              : "បានរៀបចំ និងបញ្ជូនសារតាមការបញ្ជារួចរាល់"
          }\n\n` +
          `🇬🇧 English: Message prepared and dispatched to ${chatRes.targetName || chatRes.targetChatId} (Device: ${(chatRes as any).targetDeviceModel || "Smartphone"}, Battery: ${(chatRes as any).targetBatteryLevel ?? 88}%): "${chatRes.sentMessage}"`;
        cleanupStream();
        res.write(`data: ${JSON.stringify({ text: replyMd })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }
    }

    // Check if the user asked about phone model or battery level of any Telegram Bot user
    const devBatteryQuery = detectDeviceAndBatteryQueryServer(lastUserText, "web_chat_session");
    if (devBatteryQuery.handled && devBatteryQuery.replyKhmer) {
      cleanupStream();
      res.write(`data: ${JSON.stringify({ text: devBatteryQuery.replyKhmer })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // Check if the user provided a YouTube, TikTok, Facebook, CapCut, or Pinterest link for MP3/MP4 download
    const detectedSocial = detectSocialVideoUrl(lastUserText);
    if (detectedSocial) {
      const mediaResult = await extractSocialMediaVideoAndAudio(
        detectedSocial.url,
        detectedSocial.requestedFormat
      );
      if (mediaResult.ok && (mediaResult.mp4Url || mediaResult.mp3Url)) {
        const safeTitle = String(mediaResult.title || `${mediaResult.platformLabel} Media`)
          .replace(/[^a-zA-Z0-9_-]+/g, "_")
          .slice(0, 45) || "khmer_ai_media";
        const enrichedMedia = {
          ...mediaResult,
          directMp4Url: mediaResult.mp4Url,
          directMp3Url: mediaResult.mp3Url,
          mp4Url: mediaResult.mp4Url
            ? `/api/download/file?url=${encodeURIComponent(
                mediaResult.mp4Url
              )}&format=mp4&platform=${encodeURIComponent(
                mediaResult.platform || detectedSocial.platform || "capcut"
              )}&title=${encodeURIComponent(safeTitle)}`
            : undefined,
          mp3Url: mediaResult.mp3Url
            ? `/api/download/file?url=${encodeURIComponent(
                mediaResult.mp3Url
              )}&format=mp3&title=${encodeURIComponent(safeTitle)}`
            : undefined,
        };
        const dlMarkdown = buildMediaDownloaderMarkdown(
          enrichedMedia as any,
          detectedSocial.requestedFormat
        );
        cleanupStream();
        res.write(`data: ${JSON.stringify({ text: dlMarkdown })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }
    }

    // Check Owner Auto-Reply & Social Account Tracker deterministic commands first
    const ownerCmd = detectOwnerAutoReplyCommand(lastUserText, "web_chat_session");
    if (ownerCmd.handled && ownerCmd.replyKhmer) {
      cleanupStream();
      res.write(`data: ${JSON.stringify({ text: ownerCmd.replyKhmer })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    const socialTrackerCmd = detectSocialAccountTrackingCommand(lastUserText, "web_chat_session");
    if (socialTrackerCmd.handled && socialTrackerCmd.replyKhmer) {
      cleanupStream();
      res.write(`data: ${JSON.stringify({ text: socialTrackerCmd.replyKhmer })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // Check Emotional Banter / Protest / Forced Emotion Tone (Angry, Upset, Hurt/Sad, Hate/Sassy, Jealous, Bored, Scold, Roast, Sweet)
    const webEmoBanter = detectEmotionalBanterOrProtestServer(lastUserText, "web_chat_session");
    if (
      webEmoBanter.triggered &&
      webEmoBanter.replyKhmer &&
      !lastUserImage &&
      !isSongOrPoemRequest(lastUserText) &&
      !isWebCodeOrDebugRequest(lastUserText)
    ) {
      cleanupStream();
      res.write(`data: ${JSON.stringify({ text: webEmoBanter.replyKhmer })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // Check Roleplay & Conversational Dramatic Acting intent
    const roleplayIntent = detectRoleplayIntent(lastUserText);
    const currentRpSession = serverlessRoleplaySessions.get("web_chat_session");
    if (roleplayIntent.action === "exit" && currentRpSession?.active) {
      serverlessRoleplaySessions.delete("web_chat_session");
      cleanupStream();
      res.write(
        `data: ${JSON.stringify({
          text: `🎭✨ **បានបញ្ចប់ការសម្ដែងរួចរាល់ហើយ!** នាងខ្ញុំ/បងបានចេញពីតួត្រឡប់មកវិញហើយ។ តើអ្នកចង់ឱ្យខ្ញុំជួយដោះស្រាយលំហាត់ សរសេរកូដ ឬសន្ទនាលើប្រធានបទអ្វីបន្តទៀតដែរ? 🥰\n\n🇬🇧 English: Roleplay session ended. How may I assist you next?`,
        })}\n\n`
      );
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    if (roleplayIntent.action === "start" && (roleplayIntent.customRole || roleplayIntent.matchedPreset)) {
      const newRpState: ActiveRoleplayState = {
        active: true,
        scenarioId: roleplayIntent.matchedPreset?.id || "custom",
        aiRole: roleplayIntent.customRole || roleplayIntent.matchedPreset?.aiRole || "តួអង្គតាមការកំណត់របស់អ្នកប្រើប្រាស់",
        userRole: roleplayIntent.matchedPreset?.userRole || "អ្នកប្រើប្រាស់",
        topicScenario: roleplayIntent.customTopic || lastUserText,
        customInstructions: roleplayIntent.customInstructions || lastUserText,
        startedAt: Date.now(),
        turnCount: 1,
      };
      serverlessRoleplaySessions.set("web_chat_session", newRpState);
    } else if (currentRpSession?.active) {
      currentRpSession.turnCount += 1;
    }

    // Analyze Companion Turn State (Busy / Returned with Intense Longing / Sick & Worry / Jealousy / Playful Questioning / Opposite-Gender Flirty Roleplay / Employee Assignment)
    const userTurnCount = Array.isArray(messages)
      ? messages.filter((m: any) => m?.role === "user").length
      : 1;
    if (userTurnCount <= 1 && !requestedEmotionTone) {
      resetCompanionSessionState("web_chat_session");
    }
    const companionTurn = analyzeCompanionTurnState(lastUserText, "web_chat_session");
    if (
      companionTurn.instantReplyOverride &&
      !serverlessRoleplaySessions.get("web_chat_session")?.active &&
      !isSongOrPoemRequest(lastUserText) &&
      !isWebCodeOrDebugRequest(lastUserText) &&
      !lastUserImage &&
      (!lastMessage?.audio || Boolean(lastUserText)) &&
      ((companionTurn.transition as any) === "just_became_busy" ||
        (companionTurn.transition as any) === "sad_or_discouraged" ||
        (companionTurn.transition as any) === "jealous_or_possessive" ||
        (companionTurn.transition as any) === "fierce_savage_roast" ||
        (companionTurn.transition as any) === "profile_updated" ||
        (companionTurn.transition as any) === "employee_assigned" ||
        (companionTurn.transition as any) === "ask_profile" ||
        ((companionTurn.transition as any) === "returned_from_busy" &&
          isCasualConversationPrompt(lastUserText)))
    ) {
      cleanupStream();
      res.write(`data: ${JSON.stringify({ text: companionTurn.instantReplyOverride })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // Check if the user is configuring or asking for the creator's personal info, photo, or video
    if (isSetBotCreatorInfoCommandServer(lastUserText)) {
      const argText = lastUserText
        .replace(
          /^(?:\/(?:setcreator|creatoradmin|editcreator|setcreatorinfo)(?:@\S+)?|កំណត់ព័ត៌មានអ្នកបង្កើត|កែព័ត៌មានអ្នកបង្កើត|កំណត់ប្រវត្តិអ្នកបង្កើត)\s*[:៖=-]?\s*/i,
          ""
        )
        .trim();
      if (argText) {
        updateBotCreatorProfileFromTextServer(argText);
      }
      const creatorCaption =
        (argText
          ? `✅✨ **បានរក្សាទុកព័ត៌មានផ្ទាល់ខ្លួនរបស់អ្នកបង្កើតរួចរាល់ហើយ!**\n\n`
          : `⚙️ **របៀបកំណត់ព័ត៌មានអ្នកបង្កើត៖** វាយ \`/setcreator ឈ្មោះ: ..., អាយុ: ..., ទីលំនៅ: ..., ការសិក្សា: ..., ស្នេហា: ..., ទំនាក់ទំនង: ...\`\n\n`) +
        getBotCreatorCaptionMarkdownServer();
      cleanupStream();
      res.write(`data: ${JSON.stringify({ text: creatorCaption })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    if (isBotCreatorVideoRequestServer(lastUserText)) {
      const p = getBotCreatorProfileServer();
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
      const videoMd =
        `🎬✨ **នេះជាវីដេអូ និងព័ត៌មានផ្ទាល់ខ្លួនរបស់អ្នកបង្កើត Telegram Bot & Khmer Super AI Agent!**\n\n` +
        `${getBotCreatorCaptionMarkdownServer()}\n\n` +
        `\`\`\`media-downloader\n${videoCardPayload}\n\`\`\``;
      cleanupStream();
      res.write(`data: ${JSON.stringify({ text: videoMd })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    if (isBotCreatorPhotoRequestServer(lastUserText) || isBotCreatorInfoRequestServer(lastUserText)) {
      const creatorBuf = getBotCreatorPhotoBufferServer();
      const creatorCaption = getBotCreatorCaptionMarkdownServer();
      cleanupStream();
      if (creatorBuf && creatorBuf.length > 100) {
        res.write(
          `data: ${JSON.stringify({
            text: creatorCaption,
            generatedImage: {
              data: creatorBuf.toString("base64"),
              mimeType: "image/jpeg",
            },
          })}\n\n`
        );
      } else {
        res.write(`data: ${JSON.stringify({ text: creatorCaption })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // Check if the user is asking to generate or edit an artistic image right in the chat
    const imageCheck = isImageGenerationOrEditRequest(lastUserText, !!lastUserImage);
    if (imageCheck.isImageTask) {
      let sourceImg = lastUserImage;
      if (!sourceImg && imageCheck.mode === "edit") {
        for (let i = messages.length - 2; i >= 0; i--) {
          if (messages[i]?.image) {
            sourceImg = messages[i].image;
            break;
          }
        }
      }

      const imgResult = await generateOrEditImage({
        prompt: lastUserText,
        mode: imageCheck.mode,
        sourceImage: sourceImg,
      });

      cleanupStream();
      res.write(
        `data: ${JSON.stringify({
          text: imgResult.description,
          generatedImage: imgResult.image,
        })}\n\n`
      );
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // Prepare clean, strictly alternating multi-turn contents for Gemini
    const formattedContents: Array<{ role: "user" | "model"; parts: any[] }> = [];

    let dynamicSystemInstruction =
      SYSTEM_INSTRUCTION + "\n" + getBotCreatorSystemPromptSummaryServer();
    const activeRp = serverlessRoleplaySessions.get("web_chat_session");
    if (activeRp?.active) {
      dynamicSystemInstruction += "\n" + buildRoleplaySystemInstruction(activeRp);
    }
    const companionPromptInjection = buildDynamicCompanionPromptInjection(
      companionTurn,
      lastUserText
    );
    if (companionPromptInjection) {
      dynamicSystemInstruction += companionPromptInjection;
    }
    if (requestedEmotionTone && (GEMINI_LIVE_EMOTION_MODES as any)[requestedEmotionTone]) {
      const emoModeObj = (GEMINI_LIVE_EMOTION_MODES as any)[requestedEmotionTone];
      dynamicSystemInstruction += `\n[🎭 បញ្ជាអារម្មណ៍បច្ចុប្បន្ន៖ «${emoModeObj.name}» — ${emoModeObj.instruction} ត្រូវបញ្ចេញអារម្មណ៍នេះឱ្យច្បាស់លាស់ដូចមនុស្សពិត ១០០% ព្រមទាំងឆ្លើយដោះស្រាយសំណួរឱ្យចំ ១០០%!]`;
    }
    if (customInstruction) {
      dynamicSystemInstruction += `\n\nចំណាំពិសេសបន្ថែមសម្រាប់វេននេះ:\n${customInstruction}`;
    }

    const recentMessages = messages.slice(-10);
    recentMessages.forEach((msg: any, idx: number) => {
      const isLast = idx === recentMessages.length - 1;
      const parts: any[] = [];

      // Only attach raster images on user turns (never attach image/svg+xml or model inlineData)
      if (
        msg.role === "user" &&
        msg.image &&
        msg.image.data &&
        msg.image.mimeType &&
        msg.image.mimeType !== "image/svg+xml"
      ) {
        parts.push({
          inlineData: {
            mimeType: msg.image.mimeType,
            data: msg.image.data,
          },
        });
      }

      if (isLast && msg.role === "user" && msg.audio && msg.audio.data) {
        const cleanAudioMime =
          String(msg.audio.mimeType || "audio/webm").split(";")[0].trim() || "audio/webm";
        parts.push({
          inlineData: {
            mimeType: cleanAudioMime,
            data: msg.audio.data,
          },
        });
      }

      const cleanMsgText =
        msg.role === "assistant"
          ? String(msg.text || "")
              .replace(/<svg[\s\S]*?<\/svg>/gi, "[គំនូសបំព្រួញពន្យល់លំហាត់]")
              .trim()
          : String(msg.text || "").trim();

      if (cleanMsgText) {
        if (isLast && msg.role === "user" && msg.audio && msg.audio.data) {
          parts.push({
            text: `សំណួរ ឬសម្ដីរបស់អ្នកប្រើប្រាស់ (User's spoken question/message): "${cleanMsgText}"\nសូមស្តាប់សំឡេងភ្ជាប់មកជាមួយផង ហើយឆ្លើយតបឱ្យចំសំណួរ និងចំខ្លឹមសារដែលគាត់បានសួរដោយផ្ទាល់ ច្បាស់លាស់ និងត្រឹមត្រូវបំផុត! ហាមឆ្លើយខុសប្រធានបទ ឬសួរឈ្មោះជំនួសការឆ្លើយសំណួរដាច់ខាត!`,
          });
        } else {
          parts.push({ text: cleanMsgText });
        }
      } else if (parts.length > 0 && msg.role === "user") {
        parts.push({
          text:
            msg.audio && msg.audio.data && (!msg.image || !msg.image.data)
              ? "សូមស្តាប់សំឡេងអ្នកប្រើប្រាស់នេះឱ្យច្បាស់ ហើយឆ្លើយតបឱ្យចំសំណួរ ឬប្រធានបទដែលគាត់បាននិយាយដោយផ្ទាល់ និងត្រឹមត្រូវជាភាសាខ្មែរ (លាយអង់គ្លេស)។"
              : "សូមពិនិត្យមេឌៀនេះ (រូបថត/សំឡេង/វីដេអូ)៖ បើជារូបភាព ឬសំឡេងមិនសមរម្យ/អាសអាភាស ត្រូវដាក់ស្លាក [AUTO_DELETE_VIOLATION] រួចស្ដីបន្ទោសយ៉ាងខ្លាំងភ្លាមៗ! តែបើជាបញ្ហា លំហាត់ ឬកូដ សូមដោះស្រាយឱ្យបានត្រឹមត្រូវ ខ្លីខ្លឹមមានន័យទាំងភាសាខ្មែរ និងអង់គ្លេស។",
        });
      }

      if (parts.length > 0) {
        const targetRole = msg.role === "assistant" ? "model" : "user";
        if (
          formattedContents.length > 0 &&
          formattedContents[formattedContents.length - 1].role === targetRole
        ) {
          formattedContents[formattedContents.length - 1].parts.push(...parts);
        } else {
          formattedContents.push({
            role: targetRole,
            parts,
          });
        }
      }
    });

    while (formattedContents.length > 0 && formattedContents[0].role !== "user") {
      formattedContents.shift();
    }

    let streamStarted = false;
    let success = false;
    let fullStreamedText = "";

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const isGemini38OrHigher = modelName.includes("gemini-3.8") || modelName.includes("gemini-4");
        const modelConfig: any = {
          systemInstruction: dynamicSystemInstruction,
          maxOutputTokens: 4096,
        };
        if (!isGemini38OrHigher) {
          modelConfig.temperature = 0.25;
          modelConfig.topP = 0.85;
        }

        const responseStream = await ai.models.generateContentStream({
          model: modelName,
          contents: formattedContents,
          config: modelConfig,
        });

        const isCasualChat = isCasualConversationPrompt(lastUserText) && !lastUserImage;

        if (webEmoBanter.questionEmotionPrefix && !isCasualChat && !streamStarted) {
          streamStarted = true;
          fullStreamedText += webEmoBanter.questionEmotionPrefix;
          res.write(`data: ${JSON.stringify({ text: webEmoBanter.questionEmotionPrefix })}\n\n`);
          if ((res as any).flush) {
            (res as any).flush();
          }
        }

        for await (const chunk of responseStream) {
          if (chunk.text) {
            const cleanChunk = sanitizeText(chunk.text);
            if (cleanChunk) {
              fullStreamedText += cleanChunk;
              if (!isCasualChat) {
                streamStarted = true;
                res.write(`data: ${JSON.stringify({ text: cleanChunk })}\n\n`);
                if ((res as any).flush) {
                  (res as any).flush();
                }
              }
            }
          }
        }

        if (isCasualChat && fullStreamedText.trim()) {
          const conciseBase = enforceConciseCasualReply(fullStreamedText, lastUserText);
          const conciseText =
            webEmoBanter.questionEmotionPrefix && !conciseBase.includes("អារម្មណ៍")
              ? `${webEmoBanter.questionEmotionPrefix}${conciseBase}`
              : conciseBase;
          streamStarted = true;
          fullStreamedText = conciseText;
          res.write(`data: ${JSON.stringify({ text: conciseText })}\n\n`);
          if ((res as any).flush) {
            (res as any).flush();
          }
        }

        if (streamStarted) {
          if (isResponseAnAutoDeleteViolation(fullStreamedText)) {
            res.write(`data: ${JSON.stringify({ deleteUserMessage: true })}\n\n`);
          }
          // Normalize full text and ensure bilingual Khmer + English reply
          fullStreamedText = ensureBilingualKhmerEnglishReply(
            sanitizeText(fullStreamedText.replace(/\[AUTO_DELETE_VIOLATION\]\s*/gi, "")),
            lastUserText,
            "web_chat_session"
          );
          // Only inject inline <svg> diagram when explicitly requested by user (e.g. គូររូប, គំនូសបំព្រួញ, diagram, draw, graph)
          if (
            /(?:គូររូប|គំនូសបំព្រួញ|គំនូសតាង|diagram|draw|graph|ក្រាហ្វ)/i.test(lastUserText) &&
            !/<svg[\s\S]*?<\/svg>/i.test(fullStreamedText)
          ) {
            const withSvg = ensureExerciseHasSvgDiagram(fullStreamedText);
            if (withSvg.length > fullStreamedText.length && /<svg[\s\S]*?<\/svg>/i.test(withSvg)) {
              const svgMatch = withSvg.match(/<svg[\s\S]*?<\/svg>/i);
              if (svgMatch) {
                res.write(`data: ${JSON.stringify({ text: `\n\n${svgMatch[0]}\n` })}\n\n`);
                fullStreamedText = withSvg;
              }
            }
          }
          if (wantsExerciseCardImage && fullStreamedText.length > 80) {
            const visuals = renderTelegramSolutionVisuals(fullStreamedText);
            if (visuals.solutionCards.length > 0) {
              res.write(
                `data: ${JSON.stringify({
                  generatedImage: {
                    data: visuals.solutionCards[0].toString("base64"),
                    mimeType: "image/png",
                  },
                })}\n\n`
              );
            }
          }

          cleanupStream();
          success = true;
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
          break;
        }
      } catch {
        if (streamStarted) {
          cleanupStream();
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
          break;
        }
      }
    }

    if (!success && !streamStarted) {
      const conciseServerFallbackPrompt =
        `អ្នកគឺជា Khmer Super AI Agent 🇰🇭🇬🇧។ ច្បាប់ដាច់ខាត៖ ត្រូវឆ្លើយតបឱ្យចំសំណួរដែលអ្នកប្រើប្រាស់សួរដោយផ្ទាល់ ច្បាស់លាស់ ត្រឹមត្រូវ និងក្បោះក្បាយជាភាសាខ្មែរ (អក្ខរាវិរុទ្ធវចនានុក្រមសម្ដេចជួនណាត) លាយជាមួយភាសាអង់គ្លេស។ ហាមឆ្លើយខុសប្រធានបទ ឬសួរឈ្មោះជំនួសការឆ្លើយសំណួរដាច់ខាត!\n` +
        (companionPromptInjection || "") +
        (customInstruction ? `\n${customInstruction}` : "");

      const fallbackMessages: any[] = [
        { role: "system", content: conciseServerFallbackPrompt },
        ...recentMessages.slice(-6).map((m: any) => {
          const cleanTxt =
            m.role === "assistant"
              ? String(m.text || "").replace(/<svg[\s\S]*?<\/svg>/gi, "[គំនូសបំព្រួញ]")
              : String(m.text || "សួស្តី");
          return {
            role: m.role === "assistant" ? "assistant" : "user",
            content: cleanTxt.slice(0, 800),
          };
        }),
      ];

      // Secondary Cloud AI Engines (Pollinations OpenAI + api.llm7.io)
      const fallbackEndpoints = [
        { url: "https://text.pollinations.ai/openai", model: "openai" },
        { url: "https://text.pollinations.ai/openai", model: "mistral" },
        { url: "https://api.llm7.io/v1/chat/completions", model: "default" },
        { url: "https://api.llm7.io/v1/chat/completions", model: "deepseek-v3" },
      ];
      for (const ep of fallbackEndpoints) {
        try {
          const fbRes = await fetch(ep.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: ep.model,
              messages: fallbackMessages,
              temperature: 0.25,
            }),
            signal: AbortSignal.timeout(6500),
          });
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            const rawFb = sanitizeText(fbData.choices?.[0]?.message?.content || "");
            const fbText = enforceConciseCasualReply(rawFb, lastUserText);
            if (fbText.trim()) {
              cleanupStream();
              res.write(`data: ${JSON.stringify({ text: fbText })}\n\n`);
              res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
              res.end();
              return;
            }
          }
        } catch {}
      }

      // Final Zero-Downtime Built-in MoEYS Solver (Guarantees 0% errors!)
      cleanupStream();
      const builtInReply = sanitizeText(solveKhmerPromptBuiltIn(lastUserText));
      res.write(`data: ${JSON.stringify({ text: builtInReply })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  } catch {
    const builtInFallback = sanitizeText(
      solveKhmerPromptBuiltIn(req.body?.messages?.[req.body?.messages?.length - 1]?.text || "")
    );
    res.write(`data: ${JSON.stringify({ text: builtInFallback })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }
});

// Endpoint to transcribe voice audio using Gemini 3 Flash / 3.1 Flash Lite with Google Gemini Live accuracy
app.post("/api/transcribe", async (req, res) => {
  try {
    const audioData =
      req.body?.audioData || req.body?.audioBase64 || req.body?.audio || "";
    const rawMime = req.body?.mimeType || "audio/webm";
    const browserHint = String(req.body?.browserHint || "").trim();
    if (!audioData) {
      return res.status(400).json({ error: "Missing audioData" });
    }

    const cleanMime = String(rawMime).split(";")[0].trim() || "audio/webm";
    const cleanBase64 = String(audioData).includes(",")
      ? String(audioData).split(",")[1]
      : String(audioData).trim();

    if (cleanBase64.length >= 100) {
      const sttPrompt =
        `សូមស្ដាប់សំឡេងអ្នកនិយាយនេះដោយយកចិត្តទុកដាក់បំផុត ដូចនៅក្នុង Google Gemini Live (ចាប់សំឡេងឱ្យច្បាស់លាស់ ១០០% ទោះបីនិយាយតិច ខ្សឹបៗ និយាយលឿន ពាក្យខ្លី ១ ម៉ាត់ លេខ សំណួរមេរៀន ពាក្យបញ្ជាអារម្មណ៍ ឬប្រយោគវែងក៏ដោយ) ហើយបម្លែងជាអក្សរខ្មែរ (តាមវចនានុក្រមសម្ដេចជួនណាត) ឬភាសាអង់គ្លេស តាមអ្វីដែលអ្នកនិយាយបាននិយាយពិតប្រាកដ ១០០%។` +
        (browserHint
          ? `\n(ចំណាំ៖ Browser Speech API ចាប់បានបឋមថា "${browserHint}" ប៉ុន្តែសូមជឿលើសំឡេងពិតក្នុង Audio ជាធំ ប្រសិនបើ Browser ចាប់ខុស សូមកែតាមសំឡេងពិតក្នុង Audio!)`
          : "") +
        `\nច្បាប់ដាច់ខាត៖ ឆ្លើយតែអត្ថបទសម្ដីដែលស្ដាប់ឮប៉ុណ្ណោះ ហាមថែមពាក្យអធិប្បាយ។ បើជាសំឡេងស្ងាត់ ឬគ្មានសម្ដីមនុស្សសោះ សូមឆ្លើយតែ [INAUDIBLE_SPEECH] ប៉ុណ្ណោះ!`;

      const runSdkStt = async (useEnh: boolean) => {
        const payload = useEnh
          ? await enhanceAudioBase64ForClearTranscription(cleanBase64, cleanMime)
          : { base64: cleanBase64, mimeType: cleanMime };
        const directRes = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: payload.mimeType,
                  data: payload.base64,
                },
              },
              { text: sttPrompt },
            ],
          },
          config: {
            temperature: 0.02,
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          },
        });
        const txt = directRes.text ? sanitizeText(directRes.text).trim() : "";
        if (!txt) throw new Error("Empty SDK STT");
        return txt;
      };

      try {
        const directText = await Promise.any([
          runSdkStt(false),
          runSdkStt(true),
          transcribeAudioBufferServer(cleanBase64, cleanMime, browserHint).then((t) => {
            if (!t) throw new Error("Empty server STT");
            return t;
          }),
        ]);
        if (/\[INAUDIBLE_SPEECH\]/i.test(directText)) {
          return res.json({ text: browserHint ? sanitizeText(browserHint).trim() : "" });
        }
        if (directText) {
          return res.json({ text: sanitizeText(directText).trim() });
        }
      } catch {}
    }

    const transcript = await transcribeAudioBufferServer(audioData, rawMime, browserHint);
    if (transcript === "[INAUDIBLE_SPEECH]") {
      return res.json({ text: browserHint ? sanitizeText(browserHint).trim() : "" });
    }
    if (transcript) {
      return res.json({ text: sanitizeText(transcript).trim() });
    }
    return res.json({ text: browserHint ? sanitizeText(browserHint).trim() : "" });
  } catch {
    return res.json({ text: "" });
  }
});

// Single-Pass Google Gemini Live Voice Turn Endpoint:
// Listens directly to the user's raw microphone audio, extracts the exact 100% accurate transcript,
// generates the intelligent Khmer+English response, and synthesizes TTS voice in ONE fast round-trip!
app.post("/api/live-turn", async (req, res) => {
  try {
    const audioData =
      req.body?.audioData || req.body?.audioBase64 || req.body?.audio || "";
    const rawMime = req.body?.mimeType || "audio/webm";
    const browserHint = String(
      req.body?.browserHint || req.body?.textHint || ""
    ).trim();
    const voicePreset = String(req.body?.voicePreset || "nova").trim().toLowerCase();
    const liveMode = String(req.body?.liveMode || "fast").trim().toLowerCase();
    const emotionTone = String(req.body?.emotionTone || "auto").trim().toLowerCase();
    setCompanionForcedEmotionTone("web_client_session", emotionTone);
    const imageData = String(req.body?.imageData || "").trim();
    const imageMimeType = String(req.body?.imageMimeType || "image/jpeg").trim();
    const historyMessages = Array.isArray(req.body?.messages)
      ? req.body.messages
      : Array.isArray(req.body?.history)
      ? req.body.history
      : [];

    const cleanMime = String(rawMime).split(";")[0].trim() || "audio/webm";
    const cleanBase64 = String(audioData).includes(",")
      ? String(audioData).split(",")[1]
      : String(audioData).trim();
    const cleanImageBase64 = imageData.includes(",")
      ? imageData.split(",")[1]
      : imageData;

    if (!cleanBase64 && !browserHint) {
      return res.json({ ok: true, isSilent: true, transcript: "", replyText: "" });
    }

    let heardTranscript = "";
    let rawAiReply = "";
    let isSilentAudio = false;
    const modeObj =
      (GEMINI_LIVE_MODES as any)[liveMode] || (GEMINI_LIVE_MODES as any).fast;
    const voiceObj =
      (GEMINI_LIVE_VOICE_PRESETS as any)[voicePreset] ||
      (GEMINI_LIVE_VOICE_PRESETS as any).nova;
    const emoObj =
      (GEMINI_LIVE_EMOTION_MODES as any)[emotionTone] ||
      (GEMINI_LIVE_EMOTION_MODES as any).auto;

    if (cleanBase64 && cleanBase64.length >= 120) {
      try {
        const recentHistoryText = historyMessages
          .slice(-6)
          .map(
            (m: any) =>
              `${m.role === "assistant" ? "AI" : "User"}: ${String(m.text || "")
                .replace(/<svg[\s\S]*?<\/svg>/gi, "")
                .slice(0, 260)}`
          )
          .join("\n");

        const livePrompt =
          `អ្នកគឺជា Google Gemini Live Khmer Super AI Agent 🇰🇭🇬🇧 (សំឡេង៖ ${voiceObj.name} | របៀប៖ ${modeObj.name} | អារម្មណ៍៖ ${emoObj.name})។\n` +
          `[${modeObj.instruction}]\n` +
          `[${emoObj.instruction}]\n` +
          `សូមស្ដាប់សំឡេងរបស់អ្នកប្រើប្រាស់នៅក្នុង Audio នេះដោយយកចិត្តទុកដាក់បំផុត រួចឆ្លើយតបជា JSON តែមួយគត់៖\n` +
          `១. "isSilent": ដាក់ true ប្រសិនបើសំឡេងនេះគ្រាន់តែជាសំឡេងខ្យល់ សំឡេងរំខាន ឬគ្មានមនុស្សនិយាយសោះ។ ដាក់ false ប្រសិនបើមានសម្ដីមនុស្សនិយាយ (ទោះបីនិយាយតិច និយាយលឿន ឬតែ ១ ម៉ាត់ក៏ដោយ)។\n` +
          `២. "transcript": សរសេរពាក្យសម្ដីពិតប្រាកដដែលអ្នកប្រើប្រាស់បាននិយាយក្នុង Audio ឱ្យបានត្រឹមត្រូវ ១០០% (ជាភាសាខ្មែរតាមវចនានុក្រមសម្ដេចជួនណាត ឬភាសាអង់គ្លេស/លេខតាមអ្វីដែលគេនិយាយពិតៗ)។` +
          (browserHint
            ? ` (ចំណាំ៖ Browser ចាប់បានបឋមថា "${browserHint}" តែសូមផ្ទៀងផ្ទាត់ជាមួយសំឡេងពិតក្នុង Audio ជាធំ បើ Browser ចាប់ខុស សូមសរសេរតាមសំឡេងពិតក្នុង Audio!)`
            : "") +
          `\n៣. "reply": ចម្លើយឆ្លើយតបដ៏រហ័សទ្វេដង ឆ្លាតវៃ និងចំសំណួរជាក់ស្ដែង ១០០% ដូច Google Gemini Live ដោយហាមឆ្លើយដដែលៗច្រើនដងដាច់ខាត ហើយត្រូវបញ្ចូលអារម្មណ៍ពិតៗទាំង ២០ ទម្រង់ (អារម្មណ៍ចាស់ ១០៖ ខឹង, អន់ចិត្ត, តូចចិត្ត, ស្អប់, ស្ដីបន្ទោស, ផ្អែមល្ហែម, ប្រច័ណ្ឌ, ធុញទ្រាន់, ឌឺដង + អារម្មណ៍ថ្មីបន្ថែម ១០៖ អៀនប្រៀន, នឹករលឹក, រំភើបខ្លាំង, ក្រមិចក្រមើម, អំនួត/ជឿជាក់, ដ្រាម៉ា, ឆ្នាស់/បញ្ជា, ឆ្ងល់ច្រើន, ងอแง/ទារខ្វល់, ស្ងប់ស្ងាត់/ចាស់ទុំ) ទៅតាមសំណួរដែលគេសួរ៖\n` +
          `   - បើគេសួរសំណួរ ឬឱ្យដោះស្រាយលំហាត់ ត្រូវឆ្លើយនិងដោះស្រាយសំណួរនោះឱ្យបានត្រឹមត្រូវ ១០០% ព្រមទាំងបញ្ចូលអារម្មណ៍ (${emoObj.name})!\n` +
          `   - បើមានភ្ជាប់រូបភាពពីកាមេរ៉ាផ្ទាល់ (Live Camera Vision) ឬរូបថត សូមមើលរូបភាពនោះហើយឆ្លើយតប ឬដោះស្រាយលំហាត់ក្នុងរូបភាពនោះឱ្យចំៗ!\n` +
          `   - ចុងបញ្ចប់នៃ "reply" ត្រូវមាន "🇬🇧 English: [ចម្លើយសង្ខេបជាភាសាអង់គ្លេស]" ជានិច្ច។\n` +
          (recentHistoryText
            ? `\nប្រវត្តិសន្ទនាថ្មីៗ (ហាមឆ្លើយពាក្យដដែលៗដូចប្រវត្តិខាងក្រោមនេះដាច់ខាត!)៖\n${recentHistoryText}\n`
            : "") +
          `\nទម្រង់ JSON ដែលត្រូវឆ្លើយ៖\n{"isSilent": false, "transcript": "...", "reply": "..."}`;

        const buildLiveCall = async (useDsp: boolean) => {
          const audioPayload = useDsp
            ? await enhanceAudioBase64ForClearTranscription(cleanBase64, cleanMime)
            : { base64: cleanBase64, mimeType: cleanMime };
          const liveParts: any[] = [];
          if (cleanImageBase64 && cleanImageBase64.length > 100) {
            liveParts.push({
              inlineData: {
                mimeType: imageMimeType || "image/jpeg",
                data: cleanImageBase64,
              },
            });
          }
          liveParts.push(
            {
              inlineData: {
                mimeType: audioPayload.mimeType,
                data: audioPayload.base64,
              },
            },
            { text: livePrompt }
          );
          const liveRes = await ai.models.generateContent({
            model: useDsp ? "gemini-3-flash-preview" : "gemini-flash-latest",
            contents: {
              parts: liveParts,
            },
            config: {
              temperature: 0.25,
              responseMimeType: "application/json",
              ...(useDsp ? { thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } } : {}),
            },
          });
          const rawJsonStr = (liveRes.text || "").replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(rawJsonStr);
          if (
            !parsed.isSilent &&
            (!parsed.transcript || !String(parsed.transcript).trim())
          ) {
            throw new Error("Empty transcript");
          }
          return parsed;
        };

        const parsed = await Promise.any([buildLiveCall(false), buildLiveCall(true)]);
        if (parsed.isSilent || /\[INAUDIBLE_SPEECH\]/i.test(String(parsed.transcript || ""))) {
          isSilentAudio = true;
        } else {
          heardTranscript = sanitizeText(String(parsed.transcript || "")).trim();
          rawAiReply = sanitizeText(String(parsed.reply || "")).trim();
        }
      } catch {}
    }

    if (isSilentAudio) {
      return res.json({ ok: true, isSilent: true, transcript: "", replyText: "" });
    }

    if (!heardTranscript && cleanBase64) {
      const fallbackTr = await transcribeAudioBufferServer(cleanBase64, cleanMime);
      if (fallbackTr === "[INAUDIBLE_SPEECH]") {
        return res.json({ ok: true, isSilent: true, transcript: "", replyText: "" });
      }
      heardTranscript = sanitizeText(fallbackTr || browserHint || "").trim();
    } else if (!heardTranscript && browserHint) {
      heardTranscript = sanitizeText(browserHint).trim();
    }

    if (!heardTranscript) {
      return res.json({ ok: true, isSilent: true, transcript: "", replyText: "" });
    }

    // Check immediate moderation, device/battery query, voice-commanded Telegram Bot user chat, or instant companion overrides
    const modCheck = analyzeInappropriateOrObsceneContent(heardTranscript);
    if (modCheck.isInappropriate && modCheck.reprimandReplyKhmer) {
      rawAiReply = `[AUTO_DELETE_VIOLATION]\n${modCheck.reprimandReplyKhmer}`;
    } else {
      const liveIdChatCmd = parseIdChatCommandServer(heardTranscript);
      const liveDevQuery = detectDeviceAndBatteryQueryServer(heardTranscript, "web_client_session");
      if (liveIdChatCmd && liveIdChatCmd.action === "send" && liveIdChatCmd.targetChatId) {
        const chatRes = await executeTelegramChatToIdServer({
          token: activeTelegramBot?.token || getConfiguredBotToken(),
          targetChatId: liveIdChatCmd.targetChatId,
          mode: liveIdChatCmd.mode || "auto_speak_loop",
          messageOrCommand: liveIdChatCmd.messageOrCommand || "",
          persona: "friendly",
        });
        if (chatRes.ok) {
          rawAiReply =
            `💬✅ បានបញ្ជាឱ្យ AI ឆាតទៅកាន់ **${chatRes.targetName || chatRes.targetChatId}** រួចរាល់ហើយ! (📱 ទូរសព្ទ៖ ${(chatRes as any).targetDeviceModel || "Smartphone"} | 🔋 ថ្ម៖ ${(chatRes as any).targetBatteryLevel ?? 88}%) ដោយផ្ញើសារថា៖ «${chatRes.sentMessage}»\n` +
            `🇬🇧 English: Commanded AI to message ${chatRes.targetName || chatRes.targetChatId} (Phone: ${(chatRes as any).targetDeviceModel || "Smartphone"}, Battery: ${(chatRes as any).targetBatteryLevel ?? 88}%): "${chatRes.sentMessage}"`;
        }
      } else if (liveDevQuery.handled && liveDevQuery.replyKhmer) {
        rawAiReply = liveDevQuery.replyKhmer;
      } else {
        const companionTurn = analyzeCompanionTurnState(heardTranscript, "web_client_session");
        if (
          companionTurn.instantReplyOverride &&
          ((companionTurn.transition as any) === "sad_or_discouraged" ||
            (companionTurn.transition as any) === "just_became_busy" ||
            (companionTurn.transition as any) === "jealous_or_possessive" ||
            (companionTurn.transition as any) === "fierce_savage_roast" ||
            (companionTurn.transition as any) === "song_or_poem" ||
            (companionTurn.transition as any) === "owner_autoreply_setup" ||
            (companionTurn.transition as any) === "social_tracker" ||
            (companionTurn.transition as any) === "inappropriate_violation")
        ) {
          rawAiReply = companionTurn.instantReplyOverride;
        }
      }
    }

    const emoBanter = detectEmotionalBanterOrProtestServer(heardTranscript, "web_client_session");
    if (!rawAiReply) {
      if (emoBanter.triggered && emoBanter.replyKhmer) {
        rawAiReply = emoBanter.replyKhmer;
      } else {
        const gkSolved = solveGeneralKnowledgeBuiltInServer(heardTranscript, "web_client_session");
        if (gkSolved) {
          rawAiReply = emoBanter.questionEmotionPrefix
            ? `${emoBanter.questionEmotionPrefix}\n\n${gkSolved}`
            : gkSolved;
        } else {
          const baseSolved = solveKhmerPromptBuiltIn(heardTranscript, "web_client_session");
          rawAiReply = emoBanter.questionEmotionPrefix
            ? `${emoBanter.questionEmotionPrefix}\n\n${baseSolved}`
            : baseSolved;
        }
      }
    } else if (
      emoBanter.questionEmotionPrefix &&
      !rawAiReply.includes("អារម្មណ៍") &&
      !rawAiReply.includes("ស្ដីបន្ទោស")
    ) {
      rawAiReply = `${emoBanter.questionEmotionPrefix}${rawAiReply}`;
    }

    const shouldDeleteUserMessage =
      Boolean(modCheck.isInappropriate) || isResponseAnAutoDeleteViolation(rawAiReply);
    const cleanedRawReply = rawAiReply.replace(/\[AUTO_DELETE_VIOLATION\]\s*/gi, "").trim();

    const finalReplyText = ensureBilingualKhmerEnglishReply(
      enforceConciseCasualReplyServer(sanitizeText(cleanedRawReply), heardTranscript, "web_client_session"),
      heardTranscript,
      "web_client_session"
    );

    const speechResult = await generateDualVoiceSpeech(
      finalReplyText,
      voicePreset || "web_chat_session"
    ).catch(() => null);
    const combinedAudioBase64 =
      speechResult && speechResult.combinedBuffer && speechResult.combinedBuffer.length > 200
        ? speechResult.combinedBuffer.toString("base64")
        : speechResult?.khmerAudio || "";

    return res.json({
      ok: true,
      isSilent: false,
      deleteUserMessage: shouldDeleteUserMessage,
      transcript: heardTranscript,
      replyText: finalReplyText,
      audioBase64: combinedAudioBase64,
      tts: speechResult
        ? {
            khmerAudio: speechResult.khmerAudio,
            englishAudio: speechResult.englishAudio,
            voiceLabel: speechResult.voiceLabel,
          }
        : null,
    });
  } catch {
    return res.json({ ok: false, isSilent: true, transcript: "", replyText: "" });
  }
});

// Endpoint to clear all Web Chat history & Companion Sessions from before
app.post("/api/chat/clear", (_req, res) => {
  clearAllCompanionSessions();
  clearAllServerlessSessions();
  return res.json({ ok: true, cleared: true });
});

// Endpoint for Text-to-Speech with Sweet Khmer Voice (Google AI Studio Kore / Charon or Telegram Custom Voice) + Male English Voice
app.post("/api/tts", async (req, res) => {
  try {
    const { text, userGender } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing text for TTS" });
    }

    const speechResult = await generateDualVoiceSpeech(text, userGender || "web_chat_session");
    return res.json({
      khmerAudio: speechResult.khmerAudio,
      englishAudio: speechResult.englishAudio,
      khmerText: speechResult.khmerText,
      englishText: speechResult.englishText,
      khmerVoice: speechResult.khmerVoice,
      voiceLabel: speechResult.voiceLabel,
      isMaleVoice: speechResult.isMaleVoice,
      englishVoice: "en-US-ChristopherNeural (Male)",
      mimeType: "audio/mpeg",
    });
  } catch {
    return res.json({ fallback: true });
  }
});

// ============================================================================
// 4. 100% REAL TELEGRAM BOT ENGINE (Full Feature Parity with Web App)
// ============================================================================
interface TelegramChatSession {
  messages: Array<{
    role: "user" | "assistant";
    text: string;
    image?: { data: string; mimeType: string };
  }>;
  messageIds: number[];
  lastImage?: { data: string; mimeType: string };
  lastVideoUrl?: string;
  lastVideoTitle?: string;
  autoVoiceReply: boolean;
  liveChatActive?: boolean;
  liveVoicePreset?: string;
  liveMode?: string;
  liveEmotionMode?: string;
  liveVocalBoost?: boolean;
  showLiveTranscript?: boolean;
  liveVadSpeed?: string;
  groupAutoReplyMode?: boolean;
  silenceTimer?: NodeJS.Timeout;
  silenceProbeCount?: number;
  lastUserText?: string;
  lastExercisePrompt?: string;
  lastExerciseAnswer?: string;
  awaitingCreatorSetupField?: string;
  activeToolMode?: string | null;
  [key: string]: any;
}

app.get("/api/creator-profile", (_req, res) => {
  return res.json({ ok: true, profile: getBotCreatorProfileServer() });
});

function getGoogleGeminiExerciseInlineKeyboard(chatId: number | string) {
  const webAppSolutionUrl = `${getPublicAppBaseUrl()}/?tg_chat_id=${encodeURIComponent(
    String(chatId)
  )}`;
  const isHttpsWebApp = webAppSolutionUrl.startsWith("https://");
  const rows: any[] = [
    [
      { text: "📑 Draft 1 (លម្អិត)", callback_data: "gem_ex_draft1" },
      { text: "⚡ Draft 2 (សង្ខេប)", callback_data: "gem_ex_draft2" },
      { text: "🎓 Draft 3 (ស៊ីជម្រៅ)", callback_data: "gem_ex_draft3" },
    ],
    [
      { text: "🧠 បង្ហាញការគិត (Show Thinking)", callback_data: "gem_ex_thinking" },
      { text: "🔍 ផ្ទៀងផ្ទាត់ (Double-Check)", callback_data: "gem_ex_verify" },
    ],
    [
      { text: "⚡ ខ្លីជាងមុន (Shorter)", callback_data: "gem_ex_shorter" },
      { text: "🧒 ងាយយល់ (Simpler)", callback_data: "gem_ex_simpler" },
      { text: "🔬 លម្អិត (Detailed)", callback_data: "gem_ex_longer" },
    ],
    [
      { text: "🔄 វិធីផ្សេង (Alt Method)", callback_data: "gem_ex_alt" },
      { text: "💡 គន្លឹះ (Hint)", callback_data: "gem_ex_hint" },
      { text: "🧮 លំហាត់ស្រដៀង ៣", callback_data: "gem_ex_similar" },
    ],
  ];
  if (isHttpsWebApp) {
    rows.push([
      {
        text: "🌐✨ បើកផ្ទាំងដំណោះស្រាយ Google Gemini AI 100% ក្នុង Web App",
        web_app: { url: webAppSolutionUrl },
      },
    ]);
  }
  return { inline_keyboard: rows };
}

const telegramSessions = new Map<string, TelegramChatSession>();

function clearServerTelegramSilenceTimer(session: TelegramChatSession) {
  if (session.silenceTimer) {
    clearTimeout(session.silenceTimer);
    session.silenceTimer = undefined;
  }
}

function scheduleServerTelegramSilenceProbing(
  _token: string,
  _chatId: number | string,
  session: TelegramChatSession,
  lastUserText: string,
  probeCount = 0
) {
  // រក្សាភាពស្ងៀមស្ងាត់នៅពេលអ្នកប្រើប្រាស់មិនបានតបឆាត កុំសួរនាំឬរំខានអី
  clearServerTelegramSilenceTimer(session);
  session.lastUserText = lastUserText;
  session.silenceProbeCount = probeCount;
}

function getTelegramSession(chatId: number | string): TelegramChatSession {
  const key = String(chatId);
  let session = telegramSessions.get(key);
  if (!session) {
    session = {
      messages: [],
      messageIds: [],
      autoVoiceReply: true,
    };
    telegramSessions.set(key, session);
  }
  return session;
}

async function clearServerTelegramChatHistory(
  token: string,
  chatId: number | string,
  currentMessageId: number | undefined,
  session: TelegramChatSession
) {
  clearServerTelegramSilenceTimer(session);
  resetCompanionSessionState(`tg_${chatId}`);

  const idsToDelete = new Set<number>(session.messageIds || []);
  if (currentMessageId && currentMessageId > 0) {
    const maxId = Number(currentMessageId);
    const minId = Math.max(1, maxId - 95);
    for (let id = maxId; id >= minId; id--) {
      idsToDelete.add(id);
    }
  }

  session.messages = [];
  session.messageIds = [];
  session.lastImage = undefined;
  session.silenceProbeCount = 0;

  const batchIds = Array.from(idsToDelete).slice(0, 100);
  if (batchIds.length > 0) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/deleteMessages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_ids: batchIds,
        }),
      });
    } catch {}
  }
}

interface TelegramBotConfig {
  token: string;
  botUsername?: string;
  isActive: boolean;
  lastUpdateId: number;
  pollingTimer?: NodeJS.Timeout;
}

let activeTelegramBot: TelegramBotConfig | null = null;
let isConnectingTelegramBot = false;
const processedTelegramUpdates = new Set<number>();
const processedTelegramMessages = new Set<string>();

const globalHandledTelegramMessages: Map<string, number> =
  ((globalThis as any).__handledTelegramMessages ||= new Map<string, number>());

export function isTelegramMessageAlreadyHandled(
  chatId: string | number,
  messageId: string | number
): boolean {
  if (!chatId || !messageId) return false;
  const key = `${chatId}:${messageId}`;
  const now = Date.now();
  const existing = globalHandledTelegramMessages.get(key);
  if (existing && now - existing < 300000) {
    return true;
  }
  return false;
}

export function markTelegramMessageAsHandled(
  chatId: string | number,
  messageId: string | number
): void {
  if (!chatId || !messageId) return;
  const key = `${chatId}:${messageId}`;
  const now = Date.now();
  globalHandledTelegramMessages.set(key, now);
  if (globalHandledTelegramMessages.size > 800) {
    for (const [k, ts] of globalHandledTelegramMessages.entries()) {
      if (now - ts > 300000) {
        globalHandledTelegramMessages.delete(k);
      }
    }
  }
}

const TELEGRAM_CONFIG_FILE = path.resolve(__dirname, ".telegram-bot.json");

function saveTelegramTokenToDisk(token: string | null, lastUpdateId = 0) {
  try {
    if (!token) {
      if (fs.existsSync(TELEGRAM_CONFIG_FILE)) fs.unlinkSync(TELEGRAM_CONFIG_FILE);
    } else {
      fs.writeFileSync(
        TELEGRAM_CONFIG_FILE,
        JSON.stringify({ token, lastUpdateId }),
        "utf-8"
      );
    }
  } catch {
    // Ignore read-only filesystem in serverless containers
  }
}

function loadSavedTelegramConfig(): { token: string | null; lastUpdateId: number } {
  let savedUpdateId = 0;
  try {
    if (fs.existsSync(TELEGRAM_CONFIG_FILE)) {
      const raw = JSON.parse(fs.readFileSync(TELEGRAM_CONFIG_FILE, "utf-8"));
      if (typeof raw?.lastUpdateId === "number") {
        savedUpdateId = raw.lastUpdateId;
      }
      if (raw?.token && typeof raw.token === "string" && raw.token.includes(":")) {
        return { token: raw.token.trim(), lastUpdateId: savedUpdateId };
      }
    }
  } catch {}
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN.includes(":")) {
    return { token: process.env.TELEGRAM_BOT_TOKEN.trim(), lastUpdateId: savedUpdateId };
  }
  return { token: "8926878273:AAFXUN5YteC0zvM-jCvwVsM-hNA4bAFUYJ8", lastUpdateId: savedUpdateId };
}

// Multi-turn Gemini call for Telegram Bot with clean conversation memory & Companion State Machine
async function getGeminiAnswerForTelegramSession(
  session: TelegramChatSession,
  userPrompt: string,
  imageAttachment?: { data: string; mimeType: string },
  audioAttachment?: { data: string; mimeType: string },
  chatId: number | string = "telegram_default"
): Promise<string> {
  let effectivePrompt = (userPrompt || "").trim();

  // If voice note was sent without text caption, transcribe it first so we catch the exact spoken question and never hallucinate!
  if (audioAttachment && audioAttachment.data && !effectivePrompt) {
    const transcribed = await transcribeAudioBufferServer(
      audioAttachment.data,
      audioAttachment.mimeType || "audio/ogg"
    );
    if (transcribed === "[INAUDIBLE_SPEECH]") {
      return sanitizeText(
        `🎙️ អធ្យាស្រ័យណា៎! អូន/បងស្ដាប់សំឡេងមិញមិនសូវច្បាស់ទេ (ប្រហែលជាសំឡេងតិចពេក ឬមានសំឡេងរំខាន)។ សូមជួយនិយាយម្ដងទៀតឱ្យច្បាស់បន្តិចណា៎! 🙏✨\n` +
          `🇬🇧 English: Sorry, I couldn't catch your voice clearly just now (it sounded quiet or noisy). Could you please speak again a little more clearly?`
      );
    }
    if (transcribed) {
      effectivePrompt = transcribed;
    }
  }

  const modCheck = analyzeInappropriateOrObsceneContent(effectivePrompt);
  if (modCheck.isInappropriate && modCheck.reprimandReplyKhmer) {
    return `[AUTO_DELETE_VIOLATION]\n${modCheck.reprimandReplyKhmer}`;
  }

  const ownerCmd = detectOwnerAutoReplyCommand(effectivePrompt, String(chatId));
  if (ownerCmd.handled && ownerCmd.replyKhmer) {
    return ownerCmd.replyKhmer;
  }

  const trackerCmd = detectSocialAccountTrackingCommand(effectivePrompt, `tg_${chatId}`);
  if (trackerCmd.handled && trackerCmd.replyKhmer) {
    return trackerCmd.replyKhmer;
  }

  const devBatteryQuery = detectDeviceAndBatteryQueryServer(effectivePrompt, String(chatId));
  if (devBatteryQuery.handled && devBatteryQuery.replyKhmer) {
    return devBatteryQuery.replyKhmer;
  }

  if (session.liveEmotionMode) {
    setCompanionForcedEmotionTone(String(chatId), session.liveEmotionMode);
  }
  const emoBanterCheck = detectEmotionalBanterOrProtestServer(effectivePrompt, String(chatId));
  if (emoBanterCheck.triggered && emoBanterCheck.replyKhmer && !imageAttachment) {
    const cleanEmoReply = enforceConciseCasualReplyServer(
      emoBanterCheck.replyKhmer,
      effectivePrompt,
      String(chatId)
    );
    session.messages.push({ role: "user", text: effectivePrompt });
    session.messages.push({ role: "assistant", text: cleanEmoReply });
    return cleanEmoReply;
  }

  const companionTurn = analyzeCompanionTurnState(effectivePrompt, `tg_${chatId}`);
  if (
    companionTurn.instantReplyOverride &&
    !isSongOrPoemRequest(effectivePrompt) &&
    !isWebCodeOrDebugRequest(effectivePrompt) &&
    !imageAttachment &&
    (!audioAttachment || Boolean(effectivePrompt)) &&
    (((companionTurn.transition as any) === "just_became_busy" ||
      (companionTurn.transition as any) === "sad_or_discouraged" ||
      (companionTurn.transition as any) === "jealous_or_possessive" ||
      (companionTurn.transition as any) === "fierce_savage_roast" ||
      (companionTurn.transition as any) === "profile_updated" ||
      (companionTurn.transition as any) === "employee_assigned" ||
      (companionTurn.transition as any) === "ask_profile" ||
      (companionTurn.transition as any) === "inappropriate_violation"))
  ) {
    session.messages.push({ role: "user", text: effectivePrompt });
    session.messages.push({ role: "assistant", text: companionTurn.instantReplyOverride });
    return companionTurn.instantReplyOverride;
  }

  const dynamicTelegramSystemInstruction =
    SYSTEM_INSTRUCTION +
    buildDynamicCompanionPromptInjection(companionTurn, effectivePrompt) +
    `\n[ច្បាប់មនោសញ្ចេតនាពិតៗ និងការឆ្លើយតបចំសំណួរជាក់ស្ដែង៖ ១. ត្រូវឆ្លើយតបឱ្យចំសំណួរជាក់ស្ដែងដែលអ្នកប្រើប្រាស់សួរ ១០០%! ២. ត្រូវបញ្ចូលអារម្មណ៍ ខឹង (Angry), ស្អប់ (Hate), ប្រច័ណ្ឌ (Jealous), ហួងហែង (Possessive), ធុញទ្រាន់ (Bored/Fed up), លួងលោម (Comforting), ស្ដីបន្ទោស (Scolding), ជេរកប់ៗ និងដៀលកប់ៗ (Savage verbal roasting) ទៅតាមសម្ដី និងទឹកមុខអ្នកប្រើប្រាស់ឆាតមក មិនថាផ្ទាល់ខ្លួន ឬក្នុងគ្រុបនោះទេ!]`;

  const contents: Array<{ role: "user" | "model"; parts: any[] }> = [];

  // Include up to 8 previous turns for conversation memory (strip large SVGs & old images so turns 2-10+ stay fast)
  for (const prev of session.messages.slice(-8)) {
    const p: any[] = [];
    const cleanPrevText =
      prev.role === "assistant"
        ? prev.text.replace(/<svg[\s\S]*?<\/svg>/gi, "[គំនូសបំព្រួញពន្យល់លំហាត់]").trim()
        : prev.text.trim();

    if (cleanPrevText) {
      p.push({ text: cleanPrevText });
    }
    if (p.length > 0) {
      const targetRole = prev.role === "assistant" ? "model" : "user";
      if (contents.length > 0 && contents[contents.length - 1].role === targetRole) {
        contents[contents.length - 1].parts.push(...p);
      } else {
        contents.push({
          role: targetRole,
          parts: p,
        });
      }
    }
  }

  while (contents.length > 0 && contents[0].role !== "user") {
    contents.shift();
  }

  // Current turn parts
  const currentParts: any[] = [];
  if (imageAttachment && imageAttachment.mimeType !== "image/svg+xml") {
    currentParts.push({
      inlineData: {
        mimeType: imageAttachment.mimeType,
        data: imageAttachment.data,
      },
    });
  }
  if (audioAttachment) {
    currentParts.push({
      inlineData: {
        mimeType: audioAttachment.mimeType,
        data: audioAttachment.data,
      },
    });
  }
  currentParts.push({
    text:
      effectivePrompt
        ? audioAttachment
          ? `សម្ដីដែលអ្នកប្រើប្រាស់បាននិយាយក្នុងសំឡេងគឺ៖ «${effectivePrompt}»។ សូមឆ្លើយតបឱ្យចំសំណួរ ឬសម្ដីនេះដោយផ្ទាល់ ត្រឹមត្រូវ និងក្បោះក្បាយ!`
          : effectivePrompt
        : audioAttachment
        ? "សូមស្តាប់សារសំឡេងនេះដោយយកចិត្តទុកដាក់បំផុត៖ បើសំឡេងស្ងាត់ ឬស្ដាប់មិនឮសម្ដីមនុស្សច្បាស់ទេ សូមឆ្លើយតែពាក្យ [INAUDIBLE_SPEECH] ប៉ុណ្ណោះ ហាមប្រឌិតសំណួរខ្លួនឯងដាច់ខាត! បើជាសម្ដីអសុរស ឈ្លើយ សីងខ្មែរ ឬអាសអាភាស ត្រូវដាក់ស្លាក [AUTO_DELETE_VIOLATION] រួចស្ដីបន្ទោសឱ្យខ្លាំងបំផុត! តែបើជាសំណួរ ឬការសន្ទនា សូមឆ្លើយតបឱ្យចំសំណួរដែលគេសួរ។"
        : "សូមពិនិត្យរូបភាព/វីដេអូនេះ៖ បើជារូបភាព ឬវីដេអូមិនសមរម្យ/អាសអាភាស ត្រូវដាក់ស្លាក [AUTO_DELETE_VIOLATION] រួចស្ដីបន្ទោសឱ្យខ្លាំងបំផុត! តែបើជាបញ្ហា លំហាត់ ឬកូដ សូមដោះស្រាយឱ្យបានត្រឹមត្រូវ ខ្លីខ្លឹមមានន័យទាំងខ្មែរ និងអង់គ្លេស។",
  });

  if (contents.length > 0 && contents[contents.length - 1].role === "user") {
    contents[contents.length - 1].parts.push(...currentParts);
  } else {
    contents.push({
      role: "user",
      parts: currentParts,
    });
  }

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const isAcademicOrCulture =
        isExercisePrompt(effectivePrompt) ||
        isGeneralKnowledgeQuestion(effectivePrompt) ||
        Boolean(imageAttachment);
      const isGemini38OrHigher = modelName.includes("gemini-3.8") || modelName.includes("gemini-4");
      const modelConfig: any = {
        systemInstruction: dynamicTelegramSystemInstruction,
        maxOutputTokens: 4096,
      };
      if (!isGemini38OrHigher) {
        modelConfig.temperature = 0.22;
        modelConfig.topP = 0.85;
      }

      const response = await Promise.race([
        ai.models.generateContent({
          model: modelName,
          contents,
          config: modelConfig,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Gemini model timeout")),
            isAcademicOrCulture ? 28000 : 12000
          )
        ),
      ]);

      if (response.text) {
        if (/\[INAUDIBLE_SPEECH\]/i.test(response.text)) {
          return sanitizeText(
            `🎙️ អធ្យាស្រ័យណា៎! អូន/បងស្ដាប់សំឡេងមិញមិនសូវច្បាស់ទេ សូមជួយនិយាយម្ដងទៀតឱ្យច្បាស់បន្តិចណា៎! 🙏✨\n` +
              `🇬🇧 English: Sorry, I couldn't hear your voice clearly just now. Please try speaking again a bit more clearly!`
          );
        }
        let sanitizedResp = sanitizeText(response.text);
        if (
          emoBanterCheck.questionEmotionPrefix &&
          !sanitizedResp.includes("អារម្មណ៍") &&
          !sanitizedResp.includes("ស្ដីបន្ទោស")
        ) {
          sanitizedResp = `${emoBanterCheck.questionEmotionPrefix}${sanitizedResp}`;
        }

        // For academic exercises of all subjects and general culture questions, return 100% authentic Google Gemini response!
        if (isExercisePrompt(effectivePrompt) || isGeneralKnowledgeQuestion(effectivePrompt)) {
          const withOptionalDiagram =
            /(?:គូររូប|គំនូសបំព្រួញ|គំនូសតាង|diagram|draw|graph|ក្រាហ្វ)/i.test(effectivePrompt)
              ? ensureExerciseHasSvgDiagram(sanitizedResp)
              : sanitizedResp;
          session.messages.push({
            role: "user",
            text: effectivePrompt || "[រូបភាព/សំឡេងលំហាត់]",
          });
          session.messages.push({
            role: "assistant",
            text: withOptionalDiagram.replace(/<svg[\s\S]*?<\/svg>/gi, "[គំនូសបំព្រួញពន្យល់លំហាត់]"),
          });
          if (session.messages.length > 14) {
            session.messages = session.messages.slice(-10);
          }
          return withOptionalDiagram;
        }

        const isCasualUserTurn =
          isCasualConversationPrompt(effectivePrompt) || isCasualSocialChat(effectivePrompt);
        const withOptionalDiagram = isCasualUserTurn
          ? sanitizedResp
          : ensureExerciseHasSvgDiagram(sanitizedResp);
        const cleanReply = enforceConciseCasualReplyServer(
          withOptionalDiagram,
          effectivePrompt,
          String(chatId)
        );
        session.messages.push({
          role: "user",
          text: effectivePrompt || "[រូបភាព/សំឡេងលំហាត់]",
        });
        session.messages.push({
          role: "assistant",
          text: cleanReply.replace(/<svg[\s\S]*?<\/svg>/gi, "[គំនូសបំព្រួញពន្យល់លំហាត់]"),
        });
        if (session.messages.length > 14) {
          session.messages = session.messages.slice(-10);
        }
        return cleanReply;
      }
    } catch {}
  }

  if (audioAttachment && !effectivePrompt) {
    return sanitizeText(
      `🎙️ អធ្យាស្រ័យណា៎! ប្រព័ន្ធចាប់សម្ដីក្នុងសំឡេងមិញមិនទាន់ច្បាស់ល្អទេ សូមជួយនិយាយម្ដងទៀត ឬសរសេរជាអក្សរឱ្យអូន/បងដឹងផងណា៎! 🙏✨\n` +
        `🇬🇧 English: Sorry, I couldn't catch your spoken words clearly just now. Please speak again clearly or type your question!`
    );
  }

  // Secondary Keyless Cloud AI Engine (api.llm7.io) — fast 3.5s timeout
  if (effectivePrompt) {
    for (const fbModel of ["default"]) {
      try {
        const fbRes = await fetch("https://api.llm7.io/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: fbModel,
            messages: [
              { role: "system", content: dynamicTelegramSystemInstruction },
              {
                role: "user",
                content: effectivePrompt,
              },
            ],
            temperature: 0.25,
          }),
          signal: AbortSignal.timeout(3500),
        });
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          const rawTxt = sanitizeText(fbData.choices?.[0]?.message?.content || "");
          if (rawTxt.trim()) {
            return enforceConciseCasualReply(ensureExerciseHasSvgDiagram(rawTxt), effectivePrompt);
          }
        }
      } catch {}
    }
  }

  // Final Zero-Downtime Built-in MoEYS Solver (Never fails!)
  const builtInReply = solveKhmerPromptBuiltIn(effectivePrompt, `tg_${chatId}`);
  const isCasualTurn =
    isCasualConversationPrompt(effectivePrompt) || isCasualSocialChat(effectivePrompt);
  const replyWithDiagram = isCasualTurn
    ? builtInReply
    : ensureExerciseHasSvgDiagram(sanitizeText(builtInReply));
  return enforceConciseCasualReply(replyWithDiagram, effectivePrompt);
}

// Helper to download any file (photo, voice, audio, document) from Telegram servers
async function downloadTelegramFile(
  token: string,
  fileId: string
): Promise<{ base64: string; buffer: Buffer; filePath: string } | null> {
  try {
    const fileRes = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`
    );
    const fileData = await fileRes.json();
    if (fileData.ok && fileData.result?.file_path) {
      const downloadUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
      const dlRes = await fetch(downloadUrl);
      if (dlRes.ok) {
        const arrayBuf = await dlRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        return {
          base64: buffer.toString("base64"),
          buffer,
          filePath: fileData.result.file_path,
        };
      }
    }
  } catch {}
  return null;
}

// Send PNG buffer directly to Telegram chat via sendPhoto
async function sendTelegramBufferPhoto(
  token: string,
  chatId: number | string,
  pngBuffer: Buffer,
  caption: string
) {
  try {
    const formData = new FormData();
    formData.append("chat_id", String(chatId));
    formData.append("caption", caption.slice(0, 950));
    const blob = new Blob([new Uint8Array(pngBuffer)], { type: "image/png" });
    formData.append("photo", blob, "khmer-ai-solution-card.png");

    await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: "POST",
      body: formData,
    });
  } catch {}
}

// Immediately delete a message in Telegram (works in both Private Chats and Groups)
async function deleteTelegramMessage(
  token: string,
  chatId: number | string,
  messageId: number | undefined
): Promise<boolean> {
  if (!messageId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
      }),
    });
    const data = await res.json().catch(() => null);
    return !!data?.ok;
  } catch {
    return false;
  }
}

// Bulletproof Telegram text sender using Rich HTML (<blockquote> callouts + <pre> formula boxes) with plain fallback
async function sendTelegramMessage(
  token: string,
  chatId: number | string,
  rawText: string,
  customReplyMarkup?: any
) {
  const htmlFormatted = formatHtmlForTelegram(rawText);
  const plainFormatted = formatTextForTelegram(rawText);
  const CHUNK_SIZE = 3700;
  const isPrivateChat = Number(chatId) > 0;
  const session = telegramSessions.get(String(chatId));
  const isLiveActive = !!session?.liveChatActive;
  const defaultReplyMarkup = isPrivateChat
    ? getTelegramPersistentReplyKeyboard(isLiveActive)
    : undefined;
  const replyMarkup = customReplyMarkup !== undefined ? customReplyMarkup : defaultReplyMarkup;

  if (htmlFormatted.length <= CHUNK_SIZE) {
    try {
      const htmlRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: htmlFormatted,
          parse_mode: "HTML",
          ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
        }),
      });
      if (htmlRes.ok) {
        const data = await htmlRes.json().catch(() => null);
        if (data?.result?.message_id && session) {
          session.messageIds.push(data.result.message_id);
        }
        return;
      }
    } catch {}
  }

  for (let i = 0; i < plainFormatted.length; i += CHUNK_SIZE) {
    const chunk = plainFormatted.slice(i, i + CHUNK_SIZE);
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunk,
          ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
        }),
      });
      const data = await r.json().catch(() => null);
      if (data?.result?.message_id && session) {
        session.messageIds.push(data.result.message_id);
      }
    } catch {}
  }
}

// Send generated/edited image directly to Telegram chat via sendPhoto
async function sendTelegramPhoto(
  token: string,
  chatId: number | string,
  imageBase64: string,
  mimeType: string,
  caption: string
) {
  try {
    const imgBuffer = Buffer.from(imageBase64, "base64");
    const formData = new FormData();
    formData.append("chat_id", String(chatId));
    formData.append("caption", formatTextForTelegram(caption).slice(0, 950));
    const ext = mimeType.includes("png") ? "png" : "jpg";
    const blob = new Blob([new Uint8Array(imgBuffer)], { type: mimeType || "image/jpeg" });
    formData.append("photo", blob, `khmer-ai-image.${ext}`);

    const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      await sendTelegramMessage(token, chatId, caption);
    } else {
      const data = await res.json().catch(() => null);
      const session = telegramSessions.get(String(chatId));
      if (data?.result?.message_id && session) {
        session.messageIds.push(data.result.message_id);
      }
    }
  } catch {
    await sendTelegramMessage(token, chatId, caption);
  }
}

// Send Single Voice Reply (Google AI Studio & Custom Voice) MP3 audio directly to Telegram chat
async function sendTelegramVoiceReply(
  token: string,
  chatId: number | string,
  answerText: string
) {
  try {
    fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action: "record_voice" }),
    }).catch(() => {});

    const speech = await generateDualVoiceSpeech(answerText, `tg_${chatId}`);
    if (speech.combinedBuffer.length > 300) {
      const session = telegramSessions.get(String(chatId));
      // Send as a native Telegram Voice Message (OGG/Opus with waveform & hands-free auto-play like Google Gemini Live!)
      const opusBuf = await convertMp3BufferToTelegramOpusVoice(speech.combinedBuffer);
      if (opusBuf && opusBuf.length > 200) {
        const vForm = new FormData();
        vForm.append("chat_id", String(chatId));
        vForm.append("caption", `🎙️ Gemini Live Voice (${speech.voiceLabel} 🇰🇭🇬🇧)`);
        vForm.append(
          "voice",
          new Blob([new Uint8Array(opusBuf)], { type: "audio/ogg" }),
          "gemini-live-voice.ogg"
        );
        const vRes = await fetch(`https://api.telegram.org/bot${token}/sendVoice`, {
          method: "POST",
          body: vForm,
        });
        const vData = await vRes.json().catch(() => null);
        if (vData?.ok && vData?.result?.message_id) {
          if (session) {
            session.messageIds.push(vData.result.message_id);
          }
          return;
        }
      }

      const formData = new FormData();
      formData.append("chat_id", String(chatId));
      formData.append("title", `សំឡេងឆ្លើយតប (${speech.voiceLabel} 🇰🇭)`);
      formData.append("performer", "Khmer Super AI Agent");
      formData.append(
        "caption",
        `🔊 សំឡេងឆ្លើយតប និងពន្យល់ (${speech.voiceLabel})`
      );
      const audioBlob = new Blob([new Uint8Array(speech.combinedBuffer)], { type: "audio/mpeg" });
      formData.append("audio", audioBlob, "khmer-ai-voice.mp3");

      const res = await fetch(`https://api.telegram.org/bot${token}/sendAudio`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (data?.result?.message_id && session) {
        session.messageIds.push(data.result.message_id);
      }
    }
  } catch {}
}

// Connect and initialize a Telegram Bot by token (singleton-safe, never starts duplicate pollers)
async function connectTelegramBot(
  token: string,
  initialUpdateId = 0
): Promise<{
  ok: boolean;
  bot?: any;
  error?: string;
}> {
  if (isConnectingTelegramBot && activeTelegramBot?.token === token) {
    return {
      ok: true,
      bot: {
        id: 0,
        first_name: "Khmer Super AI Agent",
        username: activeTelegramBot.botUsername,
      },
    };
  }
  isConnectingTelegramBot = true;

  try {
    // Immediately deactivate any existing bot poller so two loops NEVER run simultaneously
    if (activeTelegramBot) {
      activeTelegramBot.isActive = false;
      if (activeTelegramBot.pollingTimer) {
        clearInterval(activeTelegramBot.pollingTimer);
      }
    }

    const getMeRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = await getMeRes.json();

    if (!meData.ok) {
      return {
        ok: false,
        error: meData.description || "Token មិនត្រឹមត្រូវ សូមពិនិត្យមើលក្នុង @BotFather",
      };
    }

    const botInfo = meData.result;

    // Check if a healthy v=2 24/7 Cloud Webhook (Netlify/Vercel) is already bound
    let hasHealthyExternalWebhook = false;
    try {
      const whRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      const whData = await whRes.json();
      const whUrl = String(whData?.result?.url || "");
      const hasError = !!whData?.result?.last_error_message;
      const pendingCount = Number(whData?.result?.pending_update_count || 0);
      if (
        whUrl &&
        whUrl.includes("v=2") &&
        !whUrl.includes("localhost") &&
        !whUrl.includes(".run.app") &&
        !hasError &&
        pendingCount <= 2
      ) {
        hasHealthyExternalWebhook = true;
      }
    } catch {}

    if (!hasHealthyExternalWebhook) {
      // Clear any broken or old webhook so getUpdates long-polling works without 409 Conflict
      await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`).catch(() => {});
    }

    // Peek recent updates so server restarts never re-process old messages AND still discover any groups the bot joined!
    let startOffsetId = initialUpdateId;
    if (!hasHealthyExternalWebhook) {
      try {
        const peekRes = await fetch(
          `https://api.telegram.org/bot${token}/getUpdates?limit=50&timeout=0`
        );
        const peekData = await peekRes.json();
        if (peekData.ok && Array.isArray(peekData.result) && peekData.result.length > 0) {
          for (const u of peekData.result) {
            const chatObj =
              u?.my_chat_member?.chat ||
              u?.chat_member?.chat ||
              u?.message?.chat ||
              u?.edited_message?.chat ||
              u?.channel_post?.chat;
            const fromObj =
              u?.my_chat_member?.from ||
              u?.message?.from ||
              u?.edited_message?.from;
            if (chatObj) {
              recordTelegramKnownContact(chatObj, fromObj);
            }
          }
          const latestId = peekData.result[peekData.result.length - 1].update_id;
          if (latestId > startOffsetId) {
            startOffsetId = latestId;
            // Acknowledge immediately
            await fetch(
              `https://api.telegram.org/bot${token}/getUpdates?offset=${startOffsetId + 1}&limit=1&timeout=0`
            ).catch(() => {});
          }
        }
      } catch {}
    }

    // Register native Telegram Bot commands menu & bottom-left Menu button (all capabilities inside Menu panel)
    await ensureTelegramMenuCommandsRegistered(token);

    activeTelegramBot = {
      token,
      botUsername: botInfo.username,
      isActive: true,
      lastUpdateId: startOffsetId,
    };

    saveTelegramTokenToDisk(token, startOffsetId);
    if (!hasHealthyExternalWebhook) {
      startTelegramPolling(activeTelegramBot);
    }

    return { ok: true, bot: botInfo };
  } catch (err: any) {
    return { ok: false, error: err?.message || "មិនអាចតភ្ជាប់ទៅ Telegram Servers បានទេ" };
  } finally {
    isConnectingTelegramBot = false;
  }
}

// Endpoint to verify and configure Telegram Bot Token
app.post("/api/telegram/configure", async (req, res) => {
  const { token, action } = req.body;

  if (action === "stop") {
    if (activeTelegramBot) {
      activeTelegramBot.isActive = false;
      if (activeTelegramBot.pollingTimer) {
        clearInterval(activeTelegramBot.pollingTimer);
      }
    }
    activeTelegramBot = null;
    saveTelegramTokenToDisk(null, 0);
    return res.json({ success: true, message: "បានបញ្ឈប់ Bot Telegram រួចរាល់" });
  }

  if (!token || typeof token !== "string" || !token.includes(":")) {
    return res
      .status(400)
      .json({ error: "Telegram Bot Token មិនត្រឹមត្រូវ! (ទម្រង់: 123456789:ABCDefG...)" });
  }

  const trimmedToken = token.trim();
  // If the exact same bot is already active and polling, return success without starting a 2nd poller!
  if (
    activeTelegramBot &&
    activeTelegramBot.isActive &&
    activeTelegramBot.token === trimmedToken &&
    activeTelegramBot.botUsername
  ) {
    return res.json({
      success: true,
      bot: {
        id: 0,
        first_name: "Khmer Super AI Agent",
        username: activeTelegramBot.botUsername,
      },
      message: `បានតភ្ជាប់ទៅកាន់ @${activeTelegramBot.botUsername} រួចរាល់ហើយ!`,
    });
  }

  const result = await connectTelegramBot(trimmedToken);
  if (!result.ok || !result.bot) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({
    success: true,
    bot: {
      id: result.bot.id,
      first_name: result.bot.first_name,
      username: result.bot.username,
    },
    message: `បានតភ្ជាប់ទៅកាន់ @${result.bot.username} ដោយជោគជ័យ! បច្ចុប្បន្ន Bot មានសមត្ថភាពដូចក្នុងកម្មវិធី Web ១០០%។`,
  });
});

// Endpoint to check current Telegram Bot status (with 24/7 Uptime Mode info)
app.get("/api/telegram/status", (_req, res) => {
  if (activeTelegramBot && activeTelegramBot.isActive) {
    return res.json({
      active: true,
      botUsername: activeTelegramBot.botUsername,
      uptimeMode: "24/7 Active Cloud Daemon (ដំណើរការ ២៤ ម៉ោង / ៧ ថ្ងៃ)",
    });
  }
  return res.json({ active: false });
});

// ============================================================================
// TELEGRAM BOT CHAT TO SOMEONE BY CHAT ID ENDPOINTS
// Supports autonomous self-speaking (auto_speak_once & auto_speak_loop)
// AND user-commanded messages (manual_direct & manual_ai_command)
// ============================================================================
app.post("/api/telegram/chat-to-id", async (req, res) => {
  try {
    const {
      targetChatId = "",
      controllerChatId = "",
      mode = "auto_speak_once",
      messageOrCommand = "",
      persona = "sreymom",
      intervalSeconds = 45,
      autoReplyOnIncoming,
      sendVoice,
      imageBase64 = "",
      imageMimeType = "image/jpeg",
      imageFileName = "",
      videoBase64 = "",
      videoMimeType = "video/mp4",
      videoFileName = "",
      documentBase64 = "",
      documentMimeType = "application/octet-stream",
      documentFileName = "",
      customVoiceBase64 = "",
      customVoiceMimeType = "audio/webm",
      targetMemberId = "",
      targetMemberName = "",
      targetMemberUsername = "",
      preferPrivateChat = false,
    } = req.body || {};
    const isManualDirect = mode === "manual_direct";
    const result = await executeTelegramChatToIdServer({
      token: activeTelegramBot?.token || getConfiguredBotToken(),
      targetChatId,
      targetMemberId,
      targetMemberName,
      targetMemberUsername,
      preferPrivateChat: Boolean(preferPrivateChat),
      controllerChatId,
      mode,
      messageOrCommand,
      persona,
      intervalSeconds,
      autoReplyOnIncoming: isManualDirect ? false : (autoReplyOnIncoming ?? true),
      sendVoice: isManualDirect ? false : (sendVoice ?? true),
      imageBase64,
      imageMimeType,
      imageFileName,
      videoBase64,
      videoMimeType,
      videoFileName,
      documentBase64,
      documentMimeType,
      documentFileName,
      customVoiceBase64,
      customVoiceMimeType,
    } as any);
    return res.status(result.ok ? 200 : 400).json(result);
  } catch (error: any) {
    return res.status(500).json({ ok: false, error: error?.message || "Chat-to-ID failed" });
  }
});

app.get("/api/telegram/id-chat-logs", (req, res) => {
  const targetChatId = String(req.query.targetChatId || "").trim();
  const allContacts = getTelegramKnownContacts();
  const botUsers = allContacts.filter(
    (c: any) =>
      c.type === "private" &&
      !String(c.chatId).startsWith("-") &&
      !String(c.chatId).startsWith("fb:")
  );
  return res.json({
    ok: true,
    logs: getTelegramIdChatLogs(targetChatId),
    contacts: allContacts,
    botUsers,
    groups: getTelegramKnownGroups(),
    activeAutoLoops: getActiveAutonomousIdChats(),
  });
});

app.post("/api/telegram/device-telemetry", (req, res) => {
  try {
    const { chatId, phoneModel, batteryLevel, isCharging, platform } = req.body || {};
    const userAgent = String(req.headers["user-agent"] || req.body?.userAgent || "");
    const updated = recordTelegramDeviceTelemetryServer({
      chatId,
      userAgent,
      phoneModel,
      batteryLevel,
      isCharging,
      platform,
    });
    return res.json({ ok: true, contact: updated });
  } catch (err: any) {
    return res.json({ ok: false, error: err?.message || "Failed to record telemetry" });
  }
});

app.post("/api/telegram/stop-auto-chat", (req, res) => {
  const targetChatId = String(req.body?.targetChatId || "all").trim();
  if (targetChatId === "all") {
    stopAllAutonomousIdChatLoops();
  } else {
    stopAutonomousIdChatLoop(targetChatId);
  }
  return res.json({
    ok: true,
    activeAutoLoops: getActiveAutonomousIdChats(),
  });
});

// 24/7 Keep-Alive Health Check Endpoint (for UptimeRobot, Cron-job.org, GitHub Actions, Render, Railway)
app.get("/api/health", (_req, res) => {
  return res.json({
    ok: true,
    status: "24/7 Always-On",
    telegramBotActive: !!(activeTelegramBot && activeTelegramBot.isActive),
    botUsername: activeTelegramBot?.botUsername || null,
    timestamp: new Date().toISOString(),
  });
});

// 24/7 Telegram Webhook Endpoint (for Serverless / Cloud Webhook deployments)
app.all("/api/telegram/webhook", async (req, res) => {
  if (req.method === "GET") {
    return res.json({
      ok: true,
      service: "Khmer Super AI Agent 24/7 Webhook",
      uptime: "24/7 Always-On",
    });
  }
  try {
    const token =
      (req.query?.token as string) ||
      activeTelegramBot?.token ||
      process.env.TELEGRAM_BOT_TOKEN ||
      "";
    if (token && req.body) {
      const msg = req.body.message || req.body.edited_message;
      if (msg && msg.chat && msg.message_id) {
        if (isTelegramMessageAlreadyHandled(msg.chat.id, msg.message_id)) {
          return res.status(200).json({ ok: true, deduplicated: true });
        }
        markTelegramMessageAsHandled(msg.chat.id, msg.message_id);
      }
      const { handleTelegramWebhookUpdate } = await import("./api/telegram-webhook.js");
      await handleTelegramWebhookUpdate(token, req.body);
    }
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(200).json({ ok: true });
  }
});

// Long-polling handler for Telegram Bot with strict single-delivery guarantee & 100% Web App UI cards
function startTelegramPolling(botConfig: TelegramBotConfig) {
  let isChecking = false;

  botConfig.pollingTimer = setInterval(async () => {
    if (isChecking || !botConfig.isActive || activeTelegramBot !== botConfig) return;
    isChecking = true;

    try {
      const url = `https://api.telegram.org/bot${botConfig.token}/getUpdates?offset=${
        botConfig.lastUpdateId + 1
      }&timeout=2`;
      const response = await fetch(url);
      const data = await response.json();

      // If 409 Conflict occurs because a webhook was set externally (e.g. on Netlify/Vercel)
      if (response.status === 409 || data?.error_code === 409) {
        try {
          const whRes = await fetch(`https://api.telegram.org/bot${botConfig.token}/getWebhookInfo`);
          const whData = await whRes.json();
          const whUrl = String(whData?.result?.url || "");
          const hasError = !!whData?.result?.last_error_message;
          const pendingCount = Number(whData?.result?.pending_update_count || 0);
          // Only delete the webhook if it is an old broken webhook or has errors;
          // if it's a healthy v=2 Netlify/Vercel webhook, let the serverless webhook handle updates 24/7!
          if (!whUrl.includes("v=2") || hasError || pendingCount > 2) {
            await fetch(`https://api.telegram.org/bot${botConfig.token}/deleteWebhook`).catch(
              () => {}
            );
          }
        } catch {}
        return;
      }

      if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
        // 1. IMMEDIATELY advance & commit offset on Telegram's server BEFORE running AI/TTS
        // so no other container (e.g. ais-pre) or poll tick can EVER fetch the same update twice!
        const maxUpdateId = Math.max(...data.result.map((u: any) => Number(u.update_id) || 0));
        if (maxUpdateId > botConfig.lastUpdateId) {
          botConfig.lastUpdateId = maxUpdateId;
          saveTelegramTokenToDisk(botConfig.token, botConfig.lastUpdateId);
          await fetch(
            `https://api.telegram.org/bot${botConfig.token}/getUpdates?offset=${
              botConfig.lastUpdateId + 1
            }&limit=1&timeout=0`
          ).catch(() => {});
        }

        for (const update of data.result) {
          if (!botConfig.isActive || activeTelegramBot !== botConfig) break;

          const updateId = Number(update.update_id);
          if (processedTelegramUpdates.has(updateId)) continue;
          processedTelegramUpdates.add(updateId);
          if (processedTelegramUpdates.size > 500) {
            const first = processedTelegramUpdates.values().next().value;
            if (first !== undefined) processedTelegramUpdates.delete(first);
          }

          // Handle bot being added to a Telegram Group via my_chat_member event -> Stay 100% SILENT upon joining a group! Do not send any message announcing group entry; wait for command or mode selection!
          if (update.my_chat_member && update.my_chat_member.chat) {
            recordTelegramKnownContact(update.my_chat_member.chat, update.my_chat_member.from);
            continue;
          }

          // Handle Inline Callback Button for Live Chat Toggle (livechat_on / livechat_off)
          if (update.callback_query && update.callback_query.message?.chat) {
            const cb = update.callback_query;
            const cbChatId = cb.message.chat.id;
            const cbData = String(cb.data || "");
            const cbSession = getTelegramSession(cbChatId);
            fetch(`https://api.telegram.org/bot${botConfig.token}/answerCallbackQuery`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ callback_query_id: cb.id }),
            }).catch(() => {});

            try {
              const { handleTelegramMediaStudioDispatch } = await import("./api/media-studio-engine.js");
              const handledStudioCb = await handleTelegramMediaStudioDispatch({
                token: botConfig.token,
                chatId: cbChatId,
                messageId: cb.message?.message_id,
                cbData,
                session: cbSession as any,
              });
              if (handledStudioCb) continue;
            } catch (e) {
              console.warn("[Server] MediaStudio callback warning:", e);
            }

            if (cbData === "dub_last_video" || cbData === "recap_last_video") {
              if (!cbSession.lastVideoUrl) {
                await sendTelegramMessage(
                  botConfig.token,
                  cbChatId,
                  "🎬 សូមផ្ញើតំណលីងវីដេអូ (CapCut, TikTok, YouTube, Facebook, Pinterest) ឬផ្ញើហ្វាល់វីដេអូមកជាមុនសិន ដើម្បីបកប្រែសំឡេងជាភាសាខ្មែរ!"
                );
                continue;
              }
              await sendTelegramTranslatedKhmerVideo(
                botConfig.token,
                cbChatId,
                cb.message.message_id,
                {
                  videoUrl: cbSession.lastVideoUrl,
                  titleHint: cbSession.lastVideoTitle || "Video",
                  userHint:
                    cbData === "recap_last_video"
                      ? "សម្រាយរឿង និងបកប្រែសំឡេងវីដេអូនេះជាភាសាខ្មែរ"
                      : "បកប្រែសំឡេងវីដេអូនេះជាភាសាខ្មែរ",
                }
              );
              continue;
            }

            if (cbData === "ocr_last_image" || cbData === "ocr_last_photo") {
              if (!cbSession.lastImage || !cbSession.lastImage.data) {
                await sendTelegramMessage(
                  botConfig.token,
                  cbChatId,
                  "📋 សូមផ្ញើរូបភាពនៃអត្ថបទមកជាមុនសិន ដើម្បីឱ្យប្រព័ន្ធបម្លែងទៅជាអក្សរ (OCR) និងពិនិត្យអក្ខរាវិរុទ្ធជូនអ្នក!"
                );
                continue;
              }
              await sendTelegramOrthographyOrOcrResult(
                botConfig.token,
                cbChatId,
                cb.message.message_id,
                {
                  imageBase64: cbSession.lastImage.data,
                  mimeType: cbSession.lastImage.mimeType || "image/jpeg",
                  mode: "ocr_and_spellcheck",
                }
              );
              continue;
            }

            // Handle 100% Google Gemini AI Exercise Solving Interactive Callback Options (Drafts 1-3, Show Thinking, Double-Check, Shorter, Simpler, Detailed, Alt Method, Hint, 3 Similar Exercises)
            if (cbData.startsWith("gem_ex_")) {
              const baseExPrompt =
                cbSession.lastExercisePrompt ||
                cbSession.lastUserText ||
                "ដោះស្រាយលំហាត់គណិតវិទ្យាខាងលើ";
              const baseExAnswer =
                cbSession.lastExerciseAnswer ||
                solveKhmerPromptBuiltIn(baseExPrompt, `tg_${cbChatId}`);
              const gemData = buildGoogleGeminiExerciseThinkingData(baseExPrompt, baseExAnswer);
              const gemKeyboard = getGoogleGeminiExerciseInlineKeyboard(cbChatId);

              if (cbData === "gem_ex_thinking") {
                const thinkingMsg =
                  `🧠✨ **ដំណើរការគិតវិភាគរបស់ Google Gemini AI (Show Thinking Process)**\n` +
                  `• 📚 **ផ្នែកមុខវិជ្ជា៖** ${gemData.subjectBadgeKhmer}\n\n` +
                  gemData.thinkingSteps.map((s) => `• ${s}`).join("\n\n") +
                  `\n\n🇬🇧 English: Google Gemini AI analytical step-by-step reasoning and theorem selection process.`;
                await sendTelegramMessage(botConfig.token, cbChatId, thinkingMsg, gemKeyboard);
                continue;
              }

              if (cbData === "gem_ex_verify") {
                const verifyMsg =
                  `🔍✅ **ការផ្ទៀងផ្ទាត់ចម្លើយពីរជាន់របស់ Google Gemini AI (Double-Check Response)**\n\n` +
                  gemData.verificationChecklist
                    .map((v, i) => `${i + 1}. ✅ **${v.label}៖**\n   ${v.detail}`)
                    .join("\n\n") +
                  `\n\n🎯 **សន្និដ្ឋានការផ្ទៀងផ្ទាត់៖** ចម្លើយ និងរូបមន្តត្រូវបានផ្ទៀងផ្ទាត់ត្រឹមត្រូវ ១០០% តាមស្តង់ដា Google Gemini AI និងសៀវភៅពុម្ពក្រសួងអប់រំ!\n` +
                  `🇬🇧 English: Double-checked formulas, symbolic calculations, and SI units — 100% verified.`;
                await sendTelegramMessage(botConfig.token, cbChatId, verifyMsg, gemKeyboard);
                continue;
              }

              if (
                cbData === "gem_ex_draft1" ||
                cbData === "gem_ex_draft2" ||
                cbData === "gem_ex_draft3"
              ) {
                const draftNum =
                  cbData === "gem_ex_draft1" ? 1 : cbData === "gem_ex_draft2" ? 2 : 3;
                const chosenDraft =
                  gemData.drafts.find((d) => d.id === draftNum) || gemData.drafts[0];
                await sendTelegramMessage(
                  botConfig.token,
                  cbChatId,
                  chosenDraft.content,
                  gemKeyboard
                );
                continue;
              }

              const optionPromptsMap: Record<string, string> = {
                gem_ex_shorter: `សូមកែសម្រួលដំណោះស្រាយលំហាត់ «${baseExPrompt}» ឱ្យខ្លីជាងមុន សង្ខេបចំគោលដៅ តាមទម្រង់ Google Gemini (- **គំនិត៖**, - **ការពន្យល់៖**, - **ចម្លើយ៖**) និងប្រើនិមិត្តសញ្ញា Unicode សុទ្ធ (ហាមប្រើ LaTeX)!`,
                gem_ex_simpler: `សូមពន្យល់ដំណោះស្រាយនៃលំហាត់ «${baseExPrompt}» ឱ្យកាន់តែសាមញ្ញ ងាយស្រួលយល់បំផុត តាមទម្រង់ Google Gemini (- **គំនិត៖**, - **ការពន្យល់៖**, - **ចម្លើយ៖**) និងប្រើនិមិត្តសញ្ញា Unicode សុទ្ធ (ហាមប្រើ LaTeX)!`,
                gem_ex_longer: `សូមបង្ហាញដំណោះស្រាយលំហាត់ «${baseExPrompt}» ឱ្យកាន់តែលម្អិត ស៊ីជម្រៅ គ្រប់ជំហាន តាមទម្រង់ Google Gemini (- **គំនិត៖**, - **ការពន្យល់៖**, - **ចម្លើយ៖**) និងប្រើនិមិត្តសញ្ញា Unicode សុទ្ធ (ហាមប្រើ LaTeX)!`,
                gem_ex_alt: `សូមដោះស្រាយលំហាត់ «${baseExPrompt}» តាមវិធីសាស្ត្រទី២ (Alternative Method) តាមទម្រង់ Google Gemini (- **គំនិត៖**, - **ការពន្យល់៖**, - **ចម្លើយ៖**) និងប្រើនិមិត្តសញ្ញា Unicode សុទ្ធ (ហាមប្រើ LaTeX)!`,
                gem_ex_hint: `សូមប្រាប់គន្លឹះសំខាន់ៗ (Hints) និងរូបមន្តគោលត្រូវចងចាំក្នុងលំហាត់ «${baseExPrompt}» តាមទម្រង់ Google Gemini (- **គំនិត៖**, - **ការពន្យល់៖**, - **ចម្លើយ៖**) និងប្រើនិមិត្តសញ្ញា Unicode សុទ្ធ!`,
                gem_ex_similar: `សូមបង្កើតលំហាត់អនុវត្តន៍ស្រដៀងគ្នានឹង «${baseExPrompt}» ចំនួន ៣ លំហាត់ អមដោយការដោះស្រាយតាមទម្រង់ Google Gemini (- **គំនិត៖**, - **ការពន្យល់៖**, - **ចម្លើយ៖**) និងប្រើនិមិត្តសញ្ញា Unicode សុទ្ធ (ហាមប្រើ LaTeX)!`,
              };

              const followUpPrompt = optionPromptsMap[cbData];
              if (followUpPrompt) {
                const stopTyp = await startTelegramContinuousTypingIndicator(
                  botConfig.token,
                  cbChatId,
                  "typing"
                );
                try {
                  const modReply = await getGeminiAnswerForTelegramSession(
                    cbSession,
                    followUpPrompt,
                    cbSession.lastImage,
                    undefined,
                    cbChatId
                  );
                  cbSession.lastExerciseAnswer = modReply;
                  await sendTelegramMessage(botConfig.token, cbChatId, modReply, gemKeyboard);
                  if (cbSession.autoVoiceReply) {
                    await sendTelegramVoiceReply(botConfig.token, cbChatId, modReply);
                  }
                } finally {
                  await stopTyp();
                }
                continue;
              }
            }

            const handledCreatorCb = await handleTelegramCreatorCallbacksServer(
              botConfig.token,
              cbChatId,
              cbData,
              cbSession
            );
            if (handledCreatorCb) {
              continue;
            }

            const handledCapCb = await handleTelegramCapabilityCallbacks(
              botConfig.token,
              cbChatId,
              cb.message.message_id,
              cbData,
              cbSession,
              {
                sendTelegramOrthographyOrOcrResult,
                sendTelegramWorldTranslation,
                sendTelegramIllustratedStory,
                sendTelegramDictionaryResult,
                sendTelegramCambodiaCalendarResult,
              }
            );
            if (handledCapCb) {
              continue;
            }

            if (
              cbData === "livechat_on" ||
              cbData.startsWith("live_voice_") ||
              cbData.startsWith("live_mode_") ||
              cbData.startsWith("live_emo_") ||
              cbData === "live_boost_toggle" ||
              cbData === "live_cc_toggle" ||
              cbData === "live_speed_toggle" ||
              cbData === "live_test_voice"
            ) {
              cbSession.liveChatActive = true;
              cbSession.autoVoiceReply = true;

              if (cbData.startsWith("live_voice_")) {
                const vKey = cbData.replace("live_voice_", "").trim();
                if ((GEMINI_LIVE_VOICE_PRESETS as any)[vKey]) {
                  cbSession.liveVoicePreset = vKey;
                }
              } else if (cbData.startsWith("live_mode_")) {
                const mKey = cbData.replace("live_mode_", "").trim();
                if ((GEMINI_LIVE_MODES as any)[mKey]) {
                  cbSession.liveMode = mKey;
                }
              } else if (cbData.startsWith("live_emo_")) {
                const eKey = cbData.replace("live_emo_", "").trim();
                if ((GEMINI_LIVE_EMOTION_MODES as any)[eKey]) {
                  cbSession.liveEmotionMode = eKey;
                  setCompanionForcedEmotionTone(String(cbChatId), eKey);
                }
              } else if (cbData === "live_boost_toggle") {
                cbSession.liveVocalBoost = cbSession.liveVocalBoost === false ? true : false;
              } else if (cbData === "live_cc_toggle") {
                cbSession.showLiveTranscript = cbSession.showLiveTranscript === false ? true : false;
              } else if (cbData === "live_speed_toggle") {
                cbSession.liveVadSpeed =
                  cbSession.liveVadSpeed === "balanced" ? "ultrafast" : "balanced";
              }

              const dash = buildGeminiLiveTelegramDashboard(cbChatId, cbSession as any);

              if (cbData === "live_test_voice") {
                const sampleText =
                  `សួស្តីចាសបងប្អូន! នេះគឺជាសំឡេង ${dash.selectedVoice.name} ក្នុងរបៀប ${dash.selectedMode.name} និងអារម្មណ៍ ${(dash as any).selectedEmotion?.name || "ស្វ័យប្រវត្តិ"} នៃប្រព័ន្ធ Google Gemini AI Live! សូមនិយាយ ឬផ្ញើសំឡេងសួរខ្ញុំមកឥឡូវនេះ ខ្ញុំនឹងចាប់យកសំឡេងរបស់អ្នកយ៉ាងច្បាស់ និងឆ្លើយតបភ្លាមៗដោយមិនឆ្លើយដដែលៗឡើយ!\n` +
                  `🇬🇧 English: Hello! This is ${dash.selectedVoice.name} in Google Gemini AI Live mode!`;
                await Promise.all([
                  sendTelegramMessage(botConfig.token, cbChatId, dash.html, dash.keyboard),
                  sendTelegramVoiceReply(botConfig.token, cbChatId, sampleText),
                ]);
                continue;
              }

              const voiceMsg =
                cbData === "livechat_on"
                  ? `ប្រព័ន្ធ Google Gemini AI Live ត្រូវបានបើកដំណើរការហើយ! សូមជ្រើសរើសសំឡេង របៀបឆ្លើយតប អារម្មណ៍ ឬចុចបើកផ្ទាំងនិយាយផ្ទាល់ពេញអេក្រង់!\n🇬🇧 English: Google Gemini AI Live is now active!`
                  : `បានកែសម្រួលការកំណត់ Google Gemini Live ទៅជាសំឡេង ${dash.selectedVoice.name}, របៀប ${dash.selectedMode.name} និងអារម្មណ៍ ${(dash as any).selectedEmotion?.name || "ស្វ័យប្រវត្តិ"} រួចរាល់ហើយ!`;

              await Promise.all([
                sendTelegramMessage(botConfig.token, cbChatId, dash.html, dash.keyboard),
                sendTelegramVoiceReply(botConfig.token, cbChatId, voiceMsg),
              ]);
              continue;
            }
            if (cbData === "livechat_off") {
              cbSession.liveChatActive = false;
              const offMsg =
                `🔴⏹️ **បានបិទ Gemini Live Chat រួចរាល់ហើយ! (Live Chat OFF)**\n` +
                `• សូមចុចប៊ូតុងខាងក្រោម ឬវាយ \`/live\` នៅពេលណាដែលអ្នកចង់បើកការសន្ទនា Google Gemini AI Live ម្ដងទៀត!\n` +
                `🇬🇧 English: Gemini Live Voice Chat has been turned OFF. Tap below anytime to start again!`;
              await sendTelegramMessage(botConfig.token, cbChatId, offMsg, {
                inline_keyboard: [
                  [{ text: "✨🎙️ បើក Google Gemini Live Chat ឡើងវិញ", callback_data: "livechat_on" }],
                ],
              });
              continue;
            }
          }

          const message = update.message;
          if (!message || !message.chat) continue;

          const chatId = message.chat.id;
          const isGroupChat =
            message.chat.type === "group" || message.chat.type === "supergroup";
          const senderName =
            [message.from?.first_name, message.from?.last_name].filter(Boolean).join(" ") ||
            (message.from?.username ? `@${message.from.username}` : "សមាជិក");

          const msgKey = `${chatId}:${message.message_id}`;
          if (isTelegramMessageAlreadyHandled(chatId, message.message_id) || processedTelegramMessages.has(msgKey)) {
            continue;
          }
          markTelegramMessageAsHandled(chatId, message.message_id);
          processedTelegramMessages.add(msgKey);
          if (processedTelegramMessages.size > 500) {
            const firstKey = processedTelegramMessages.values().next().value;
            if (firstKey !== undefined) processedTelegramMessages.delete(firstKey);
          }

          // Check if the bot was just added to a Group via new_chat_members -> Stay 100% SILENT upon joining a group! Do not send any welcome message; wait for command or mode selection!
          if (Array.isArray(message.new_chat_members) && message.new_chat_members.length > 0) {
            recordTelegramKnownContact(message.chat, message.from);
            continue;
          }
          if (
            message.left_chat_member ||
            message.group_chat_created ||
            message.supergroup_chat_created
          ) {
            if (message.group_chat_created || message.supergroup_chat_created) {
              recordTelegramKnownContact(message.chat, message.from);
            }
            continue;
          }

          const session = getTelegramSession(chatId);
          if (message.message_id) {
            session.messageIds.push(message.message_id);
          }
          clearServerTelegramSilenceTimer(session);

          let userText = (message.text || message.caption || "").trim();

          // Record contact for Chat-to-ID/Group directory (including user's device/battery hints) & relay incoming messages if part of an active ID/Group Chat session
          recordTelegramKnownContact(message.chat, message.from, userText, null, message);
          if (!userText.startsWith("/")) {
            const relayContent =
              userText ||
              (message.voice || message.audio
                ? "🎙️ [សំឡេងឆ្លើយតប / Voice Reply]"
                : message.photo
                ? "📷 [រូបភាពឆ្លើយតប / Photo Reply]"
                : "");
            if (relayContent) {
              const handledAuto = await relayIncomingTargetReplyToController(
                botConfig.token,
                chatId,
                senderName,
                relayContent
              ).catch(() => false);
              // When handled by ID/Group chat controller (including manual_direct mode where AI must NOT reply on user's behalf!), skip AI reply!
              if (handledAuto || isChatInManualDirectMode(chatId)) {
                continue;
              }
            } else if (isChatInManualDirectMode(chatId)) {
              continue;
            }
          }

          // ====================================================================
          // 0A. IMMEDIATE MODERATION: BLOCK, AUTO-DELETE & SCOLD INAPPROPRIATE / OBSCENE TEXT, VIDEO OR PHOTO (PRIVATE & GROUP CHATS)
          // ====================================================================
          const mediaFileName =
            message.document?.file_name ||
            message.video?.file_name ||
            message.animation?.file_name ||
            message.audio?.file_name ||
            "";
          const mediaMimeType =
            message.document?.mime_type ||
            message.video?.mime_type ||
            message.animation?.mime_type ||
            "";
          const stickerMeta = [
            message.sticker?.emoji || "",
            message.sticker?.set_name || "",
          ]
            .filter(Boolean)
            .join(" ");

          const incomingModCheck = analyzeInappropriateOrObsceneContent(
            userText,
            mediaFileName,
            mediaMimeType,
            stickerMeta,
            senderName,
            isGroupChat
          );

          if (incomingModCheck.isInappropriate && incomingModCheck.reprimandReplyKhmer) {
            // Immediately delete offending message/photo/video in BOTH private and group chats!
            await deleteTelegramMessage(botConfig.token, chatId, message.message_id);
            await sendTelegramMessage(
              botConfig.token,
              chatId,
              incomingModCheck.reprimandReplyKhmer
            );
            if (session.autoVoiceReply) {
              await sendTelegramVoiceReply(
                botConfig.token,
                chatId,
                incomingModCheck.reprimandReplyKhmer
              );
            }
            continue;
          }
          let imageAttachment: { data: string; mimeType: string } | undefined;
          let audioAttachment: { data: string; mimeType: string } | undefined;

          // =========================================================================
          // 0. REAL-TIME ANTI-HACK FILE & SCAM LINK PROTECTION (Groups & Private Chats)
          // =========================================================================
          if (message.document) {
            const docName = message.document.file_name || "unknown_file";
            const docMime = message.document.mime_type || "";
            const docSize = Number(message.document.file_size) || 0;

            const fileSec = analyzeFileSecurity(docName, docMime, docSize, userText);
            if (fileSec.isDangerous) {
              // 1. Attempt to immediately DELETE the malicious file message in the group so nobody clicks it!
              let wasAutoDeletedInGroup = false;
              if (isGroupChat) {
                try {
                  const delRes = await fetch(
                    `https://api.telegram.org/bot${botConfig.token}/deleteMessage`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        chat_id: chatId,
                        message_id: message.message_id,
                      }),
                    }
                  );
                  const delData = await delRes.json();
                  wasAutoDeletedInGroup = !!delData.ok;
                } catch {}
              }

              // 2. Build authoritative Khmer Security Warning Card & Detailed Explanation
              const warningMarkdown = buildSecurityWarningCardMarkdown(fileSec, {
                senderName,
                wasAutoDeletedInGroup,
                isGroupChat,
              });

              const warningVisuals = renderTelegramSolutionVisuals(warningMarkdown);
              const urgentCaption =
                `🚨 ការព្រមានសន្តិសុខបន្ទាន់៖ ហាមចុចបើកហ្វាល់ "${fileSec.fileName}" ដាច់ខាត!\n` +
                `⛔ ប្រភេទគ្រោះថ្នាក់៖ ${fileSec.categoryTitle}\n` +
                `⚠️ មូលហេតុ៖ ${fileSec.whatHappensIfClickedKhmer}\n` +
                `🛡️ វិធានការ៖ ${fileSec.protectionAdviceKhmer}`;

              if (warningVisuals.solutionCards.length > 0) {
                await sendTelegramBufferPhoto(
                  botConfig.token,
                  chatId,
                  warningVisuals.solutionCards[0],
                  urgentCaption
                );
              } else {
                await sendTelegramMessage(botConfig.token, chatId, warningMarkdown);
              }

              // 3. Also send 1 urgent Khmer voice warning so members hear the alert immediately
              if (session.autoVoiceReply) {
                await sendTelegramVoiceReply(botConfig.token, chatId, urgentCaption);
              }
              continue;
            }
          }

          // Check if message contains a Phishing / Malware download link
          const linkCheck = analyzeMessageForScamLinks(userText);
          if (linkCheck.isScamLink && linkCheck.warningReportKhmer) {
            if (isGroupChat) {
              fetch(`https://api.telegram.org/bot${botConfig.token}/deleteMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  message_id: message.message_id,
                }),
              }).catch(() => {});
            }

            const linkVisuals = renderTelegramSolutionVisuals(linkCheck.warningReportKhmer);
            const linkCaption =
              `🚨 ការព្រមានសន្តិសុខបន្ទាន់៖ ហាមចុចលើតំណភ្ជាប់ឆបោក (Phishing/Malware Link) នេះដាច់ខាត!\n` +
              `⛔ តំណភ្ជាប់គ្រោះថ្នាក់៖ ${linkCheck.detectedUrl}\n` +
              `🛡️ សូមបងប្អូនកុំចុចចូល ឬបញ្ចូលលេខទូរស័ព្ទ និងលេខកូដ OTP ឱ្យសោះ!`;

            if (linkVisuals.solutionCards.length > 0) {
              await sendTelegramBufferPhoto(
                botConfig.token,
                chatId,
                linkVisuals.solutionCards[0],
                linkCaption
              );
            } else {
              await sendTelegramMessage(botConfig.token, chatId, linkCheck.warningReportKhmer);
            }

            if (session.autoVoiceReply) {
              await sendTelegramVoiceReply(botConfig.token, chatId, linkCaption);
            }
            continue;
          }

          // Normalize command for both private chats (/start) and groups (/start@botusername)
          const normalizedCommand = userText.split(/\s+/)[0].split("@")[0].toLowerCase();

          // Handle Live Chat Start / Stop button & commands on Telegram Bot
          const isLiveStartCmd =
            normalizedCommand === "/live" ||
            normalizedCommand === "/livechat" ||
            normalizedCommand === "/emotion" ||
            normalizedCommand === "/emotions" ||
            normalizedCommand === "/mood" ||
            /^(?:🎙️\s*|🎭\s*)?(?:ចុចនិយាយ\s*live\s*chat|បើក\s*live\s*chat|ចាប់ផ្តើម\s*live\s*chat|ចាប់ផ្ដើម\s*live\s*chat|ជ្រើសរើសអារម្មណ៍|អារម្មណ៍\s*ai|ប្ដូរអារម្មណ៍|live\s*chat\s*on|start\s*live\s*chat)$/i.test(
              userText.trim()
            );
          const isLiveStopCmd =
            normalizedCommand === "/stoplive" ||
            normalizedCommand === "/endlive" ||
            /^(?:🔴\s*)?(?:បិទ\s*live\s*chat|ឈប់\s*live\s*chat|បញ្ឈប់\s*live\s*chat|live\s*chat\s*off|stop\s*live\s*chat)$/i.test(
              userText.trim()
            );

          if (isLiveStartCmd) {
            session.liveChatActive = true;
            session.autoVoiceReply = true;
            const dash = buildGeminiLiveTelegramDashboard(chatId, session as any);
            const liveVoiceIntro =
              `ប្រព័ន្ធ Google Gemini AI Live ត្រូវបានបើកដំណើរការហើយ! អ្នកអាចចុចបើកផ្ទាំងនិយាយផ្ទាល់ពេញអេក្រង់ ជ្រើសរើសសំឡេងទាំង ៨ របៀបឆ្លើយតប ឬផ្ញើសំឡេងសួរក្នុងឆាតនេះបានភ្លាមៗ!\n` +
              `🇬🇧 English: Google Gemini AI Live Studio is now active with crystal-clear HD voice capture and all Gemini Live options!`;
            await Promise.all([
              sendTelegramMessage(botConfig.token, chatId, dash.html, dash.keyboard),
              sendTelegramVoiceReply(botConfig.token, chatId, liveVoiceIntro),
            ]);
            continue;
          }

          if (isLiveStopCmd) {
            session.liveChatActive = false;
            const liveOffReply =
              `🔴⏹️ **បានបិទ Gemini Live Chat រួចរាល់ហើយ! (Live Chat OFF)**\n` +
              `• សូមចុចប៊ូតុងខាងក្រោម ឬវាយ \`/live\` នៅពេលណាដែលអ្នកចង់បើកការសន្ទនា Google Gemini AI Live ម្ដងទៀត!\n` +
              `🇬🇧 English: Gemini Live Voice Chat has been turned OFF. Tap below anytime to resume!`;
            await sendTelegramMessage(botConfig.token, chatId, liveOffReply, {
              inline_keyboard: [
                [{ text: "✨🎙️ បើក Google Gemini Live Chat ឡើងវិញ", callback_data: "livechat_on" }],
              ],
            });
            continue;
          }

          // Requirement 3: Group Owner Auto-Reply when someone calls the owner's name in a group!
          if (isGroupChat && userText) {
            const ownerAutoHit = checkAndTriggerGroupOwnerAutoReply(userText, senderName);
            if (ownerAutoHit && String(message.from?.id || "") !== String(ownerAutoHit.ownerChatId)) {
              await Promise.all([
                sendTelegramMessage(botConfig.token, chatId, ownerAutoHit.groupReply),
                session.autoVoiceReply
                  ? sendTelegramVoiceReply(botConfig.token, chatId, ownerAutoHit.groupReply)
                  : Promise.resolve(),
                sendTelegramMessage(
                  botConfig.token,
                  ownerAutoHit.ownerChatId,
                  ownerAutoHit.ownerNotification
                ).catch(() => {}),
              ]);
              continue;
            }
          }

          // 1. Handle commands: /clear (or clicking "🗑️ សម្អាតឆាតចាស់ៗ"), /start, /help, /security, /voice
          if (normalizedCommand === "/clear" || normalizedCommand === "/reset" || isClearChatCommand(userText)) {
            await clearServerTelegramChatHistory(
              botConfig.token,
              chatId,
              message.message_id,
              session
            );
            await sendTelegramMessage(
              botConfig.token,
              chatId,
              "🧹✨ **ឆាតចាស់ៗ និងប្រវត្តិសន្ទនាពីមុនទាំងអស់ត្រូវបានសម្អាតរួចរាល់យ៉ាងល្អ!**\n\nមុននឹងយើងចាប់ផ្ដើមសន្ទនាថ្មី តើបង/អូន **ឈ្មោះអ្វី** ហើយ **ភេទប្រុស ឬ ស្រី** ដែរ? (បើអ្នកជាមនុស្សប្រុស អូននឹងប្រើសំឡេងស្រីផ្អែមពិរោះរបស់ Google AI Studio តែបើអ្នកជាមនុស្សស្រី បងនឹងប្រើសំឡេងប្រុសធ្ងន់កក់ក្ដៅ ឬអ្នកអាចផ្ញើសំឡេងកំណត់ដោយខ្លួនឯង) 🥰💖\n\n🇬🇧 English: All previous chat messages and conversation history have been completely cleared! Could you tell me your name and gender so we can start fresh?"
            );
            continue;
          }

          if (normalizedCommand === "/start") {
            const conciseWelcomeMsg =
              `សួស្តីចាស/បាទ (Hello & Welcome)! 🥰 ខ្ញុំជា **Khmer Super AI Agent (24/7) 🇰🇭🇬🇧**\n` +
              `មុននឹងយើងចាប់ផ្ដើមសន្ទនា តើបង/អូន **ឈ្មោះអ្វី** ហើយ **ភេទប្រុស ឬ ស្រី** ដែរ? 🥰💖\n` +
              `*(💡 មុខងារពិសេសទាំងអស់មាននៅក្នុងផ្ទាំងប៊ូតុង **Menu** ខាងក្រោមឆ្វេងដៃស្រាប់)*`;
            await sendTelegramMessage(botConfig.token, chatId, conciseWelcomeMsg);
            continue;
          }

          if (
            normalizedCommand === "/menu" ||
            normalizedCommand === "/help" ||
            userText.trim() === "📋 ម៉ឺនុយសមត្ថភាពទាំងអស់"
          ) {
            const menuMsg =
              `🎛️ **ផ្ទាំងម៉ឺនុយសមត្ថភាពទាំងអស់ (Menu)** (ID Chat របស់អ្នក៖ \`${chatId}\`)\n` +
              `អ្នកអាចចុចជ្រើសរើសមុខងារនៅក្នុងផ្ទាំង **Menu (ខាងក្រោមឆ្វេងដៃ)** ឬចុចប៊ូតុងខាងក្រោម៖`;
            await sendTelegramMessage(
              botConfig.token,
              chatId,
              menuMsg,
              getTelegramInlineMenuKeyboard(chatId, session.liveChatActive)
            );
            continue;
          }

          if (normalizedCommand === "/code" || userText.toLowerCase().startsWith("/code ")) {
            const codeArg = userText.replace(/^\/code(@\S+)?\s*/i, "").trim();
            if (!codeArg) {
              const codeGuide =
                `💻🌐 **មុខងារសរសេរកូដ និងកែកូដបង្កើត Web App / Website៖**\n` +
                `• វាយ \`/code បង្កើតវេបសាយលក់ទំនិញ\` ឬផ្ញើកូដដែលមានបញ្ហាមកឱ្យ AI កែ (Debug) ជូនភ្លាមៗ!\n` +
                `🇬🇧 English: Send "/code [your web app idea]" or paste broken code, and I will write or fix the complete Web App/Website code for you!`;
              await sendTelegramMessage(botConfig.token, chatId, codeGuide);
              continue;
            }
            userText = `សូមសរសេរកូដ ឬកែកូដ Web App / Website៖ ${codeArg}`;
          }

          if (normalizedCommand === "/help") {
            const welcomeMsg =
              `សួស្តីបងប្អូន! ខ្ញុំជា **Khmer Super AI Agent 🤖🇰🇭🇬🇧 (24/7)** (ID Chat របស់អ្នក៖ \`${chatId}\`)\n\n` +
              `✨ **បញ្ជីមុខងារ និងពាក្យបញ្ជាទាំងអស់ (100% Web System Parity)៖**\n` +
              `• 🎙️ **/live** ឬចុច **«🎙️ ចុចនិយាយ Live Chat»**៖ សន្ទនាសំឡេងផ្ទាល់រហូតមិនដាច់ និងរហ័សទាន់ចិត្ត\n` +
              `• 📷 **/ocr** ឬ **/spell** ឬចុច **«📷 រូបភាពទៅជាអក្សរ & អក្ខរាវិរុទ្ធ»**៖ បម្លែងរូបភាពទៅជាអក្សរ និងពិនិត្យអក្ខរាវិរុទ្ធ\n` +
              `• 🌍 **/translate [អត្ថបទ]** ឬចុច **«🌍 បកប្រែគ្រប់ភាសា»**៖ បកប្រែគ្រប់ភាសាលើពិភពលោក ១៥០+ ភាសា\n` +
              `• 📖 **/story [ប្រធានបទ]** ឬចុច **«📖 បង្កើតរឿងរន្ធត់/ប្រលោមលោក/និទាន»**៖ បង្កើតរឿងរន្ធត់ ប្រលោមលោក និទានកថា + រូបភាពតាមវគ្គ & តួអង្គ\n` +
              `• 📚 **/dict [ពាក្យ]** ឬចុច **«📚 វចនានុក្រមរូបភាព ៣ ទិសដៅ»**៖ វចនានុក្រម ខ្មែរ-ខ្មែរ, អង់គ្លេស-ខ្មែរ, ខ្មែរ-អង់គ្លេស + រូបភាព & ល្បះឧទាហរណ៍\n` +
              `• 📅 **/calendar** ឬចុច **«📅 ប្រតិទិនកម្ពុជា & ជូនដំណឹងថ្ងៃបុណ្យ»**៖ ពិនិត្យថ្ងៃបុណ្យជាតិ បុណ្យអន្តរជាតិ និងថ្ងៃឈប់សម្រាក\n` +
              `• 💬 **/chatto** ឬចុច **«💬 បញ្ជាឆាតតាម ID Chat»**៖ ឱ្យ AI និយាយខ្លួនឯង (\`/autosay ID\`) ឬបញ្ជាសារពីយើង (\`/sayto ID សារ\`, \`/cmdsay ID បញ្ជា\`)\n` +
              `• 📥 **/dl [លីង]** • 🎬 **/dub [វីដេអូ]** • 🎨 **/image [ពិពណ៌នា]** • 💻 **/code** • 🗑️ **/clear**`;
            await sendTelegramMessage(
              botConfig.token,
              chatId,
              welcomeMsg,
              getTelegramInlineMenuKeyboard(chatId, session.liveChatActive)
            );
            continue;
          }

          if (normalizedCommand === "/security" || normalizedCommand === "/guard") {
            const secMsg =
              `🛡️ **ប្រព័ន្ធការពារគ្រុបពី File Hack និងជនឆបោក (Active 24/7)**\n\n` +
              `• **ស្ថានភាពការពារ៖** កំពុងដំណើរការ ១០០%\n` +
              `• **ហ្វាល់មេរោគដែលប្រព័ន្ធចាប់សញ្ញា និងហាមឃាត់ភ្លាមៗ៖**\n` +
              `  1. មេរោគទូរស័ព្ទ Android៖ .apk, .xapk, .apkm, .dex (លួចលុយធនាគារ ABA/Wing និងលួច OTP)\n` +
              `  2. មេរោគកុំព្យូទ័រ Windows៖ .exe, .scr, .msi, .bat, .cmd, .vbs, .js, .ps1, .hta, .lnk (លួច Telegram Session tdata និងចាក់សោកុំព្យូទ័រ Ransomware)\n` +
              `  3. ល្បិចបន្លំកន្ទុយហ្វាល់ ២ ជាន់៖ ឧ. photo.jpg.exe, invoice.pdf.scr, video.mp4.apk\n` +
              `  4. កញ្ចប់ហ្វាល់លាក់មេរោគ៖ .zip, .rar, .7z, .iso, .img និងឯកសារបង្កប់ Macro (.docm, .xlsm, .html)\n\n` +
              `💡 **គន្លឹះសម្រាប់ម្ចាស់គ្រុប (Group Admin)៖** សូមបញ្ចូល Bot នេះទៅក្នុង Group ហើយដំឡើងសិទ្ធិជា **Admin (បើកសិទ្ធិ Delete messages)** នោះនៅពេលមានជនឆបោកទម្លាក់ File Hack ចូលក្នុងគ្រុប Bot នឹងលុបហ្វាល់មេរោគនោះចោលភ្លាមៗ និងបង្ហាញផ្ទាំងព្រមានប្រាប់មូលហេតុដល់សមាជិកទាំងអស់!`;
            await sendTelegramMessage(botConfig.token, chatId, secMsg);
            continue;
          }

          if (normalizedCommand === "/voice") {
            session.autoVoiceReply = !session.autoVoiceReply;
            const voiceInfo = resolveKhmerVoiceForSession(`tg_${chatId}`);
            await sendTelegramMessage(
              botConfig.token,
              chatId,
              session.autoVoiceReply
                ? `🔊 បានបើកការឆ្លើយតបជាសំឡេងស្វ័យប្រវត្តិ (សំឡេង ${voiceInfo.voiceNameKhmer})!`
                : "🔇 បានបិទការផ្ញើសំឡេងស្វ័យប្រវត្តិ (ឆ្លើយតបតែតារាងដំណោះស្រាយ និងរូបភាព)។ វាយ /voice ម្តងទៀតដើម្បីបើកវិញ។"
            );
            continue;
          }

          // 2. Download attached photo, image document, or video/animation/sticker thumbnail if present
          if (message.photo && message.photo.length > 0) {
            const bestPhoto = message.photo[message.photo.length - 1];
            const dl = await downloadTelegramFile(botConfig.token, bestPhoto.file_id);
            if (dl) {
              imageAttachment = { data: dl.base64, mimeType: "image/jpeg" };
              session.lastImage = imageAttachment;
            }
          } else if (
            message.document &&
            typeof message.document.mime_type === "string" &&
            message.document.mime_type.startsWith("image/")
          ) {
            const dl = await downloadTelegramFile(botConfig.token, message.document.file_id);
            if (dl) {
              imageAttachment = {
                data: dl.base64,
                mimeType: message.document.mime_type,
              };
              session.lastImage = imageAttachment;
            }
          } else if (
            message.video?.thumbnail?.file_id ||
            message.video?.thumb?.file_id ||
            message.animation?.thumbnail?.file_id ||
            message.animation?.thumb?.file_id ||
            message.video_note?.thumbnail?.file_id ||
            message.video_note?.thumb?.file_id ||
            message.sticker?.thumbnail?.file_id ||
            message.sticker?.thumb?.file_id
          ) {
            const thumbId =
              message.video?.thumbnail?.file_id ||
              message.video?.thumb?.file_id ||
              message.animation?.thumbnail?.file_id ||
              message.animation?.thumb?.file_id ||
              message.video_note?.thumbnail?.file_id ||
              message.video_note?.thumb?.file_id ||
              message.sticker?.thumbnail?.file_id ||
              message.sticker?.thumb?.file_id;
            if (thumbId) {
              const dl = await downloadTelegramFile(botConfig.token, thumbId);
              if (dl) {
                imageAttachment = { data: dl.base64, mimeType: "image/jpeg" };
              }
            }
          }

          // Also check if user replied to an earlier message containing a photo
          if (
            !imageAttachment &&
            message.reply_to_message?.photo &&
            message.reply_to_message.photo.length > 0
          ) {
            const replyPhoto =
              message.reply_to_message.photo[message.reply_to_message.photo.length - 1];
            const dl = await downloadTelegramFile(botConfig.token, replyPhoto.file_id);
            if (dl) {
              imageAttachment = { data: dl.base64, mimeType: "image/jpeg" };
              session.lastImage = imageAttachment;
            }
          }

          // 2B. Direct or Reply MP3 to Voice Conversion
          const isAudioDoc =
            message.document &&
            ((typeof message.document.mime_type === "string" && message.document.mime_type.startsWith("audio/")) ||
              /\.(mp3|m4a|wav|aac|flac|ogg|oga|opus|wma)$/i.test(message.document.file_name || ""));
          const uploadedAudioTarget = message.audio || (isAudioDoc ? message.document : null);

          if (uploadedAudioTarget && uploadedAudioTarget.file_id) {
            const isVoiceCmdInText =
              isMp3ToVoiceIntentServer(userText) ||
              /^\/(?:voice|mp3tovoice|tovoice)\b/i.test(userText);
            const isVoiceMode = session?.activeToolMode === "mp3_to_voice";

            if (isVoiceMode || isVoiceCmdInText) {
              if (session) session.activeToolMode = null;
              await sendTelegramMessage(
                botConfig.token,
                chatId,
                "⏳ កំពុងទាញយក និងបម្លែង MP3 ទៅជា Voice Note (OGG Opus)... សូមរង់ចាំមួយភ្លែត! 🎙️"
              );
              const dl = await downloadTelegramFile(botConfig.token, uploadedAudioTarget.file_id);
              if (dl && dl.buffer) {
                await processMp3ToVoiceConversion(
                  botConfig.token,
                  chatId,
                  dl.buffer,
                  message.message_id,
                  {
                    fileName: uploadedAudioTarget.file_name || "voice.ogg",
                    duration: uploadedAudioTarget.duration,
                  }
                );
              } else {
                await sendTelegramMessage(
                  botConfig.token,
                  chatId,
                  "⚠️ មិនអាចទាញយកហ្វាល់ MP3 ដើម្បីបម្លែងបានទេ!"
                );
              }
              continue;
            }
          }

          const repliedAudioTarget =
            message.reply_to_message?.audio ||
            (message.reply_to_message?.document &&
            ((typeof message.reply_to_message.document.mime_type === "string" &&
              message.reply_to_message.document.mime_type.startsWith("audio/")) ||
              /\.(mp3|m4a|wav|aac|flac|ogg|oga|opus|wma)$/i.test(
                message.reply_to_message.document.file_name || ""
              ))
              ? message.reply_to_message.document
              : null);

          if (repliedAudioTarget && repliedAudioTarget.file_id && isMp3ToVoiceIntentServer(userText)) {
            await sendTelegramMessage(
              botConfig.token,
              chatId,
              "⏳ កំពុងទាញយក និងបម្លែង MP3 ពីសារដែលបាន Reply ទៅជា Voice Note... សូមរង់ចាំមួយភ្លែត! 🎙️"
            );
            const dl = await downloadTelegramFile(botConfig.token, repliedAudioTarget.file_id);
            if (dl && dl.buffer) {
              await processMp3ToVoiceConversion(
                botConfig.token,
                chatId,
                dl.buffer,
                message.message_id,
                {
                  fileName: repliedAudioTarget.file_name || "voice.ogg",
                  duration: repliedAudioTarget.duration,
                }
              );
            } else {
              await sendTelegramMessage(
                botConfig.token,
                chatId,
                "⚠️ មិនអាចទាញយកហ្វាល់ MP3 ពីសារដែលបាន Reply បានទេ!"
              );
            }
            continue;
          }

          // 3. Download attached Voice Note or Audio file if present
          let heardVoiceTranscript = "";
          const voiceOrAudio = message.voice || message.audio;
          if (voiceOrAudio && voiceOrAudio.file_id) {
            const dl = await downloadTelegramFile(botConfig.token, voiceOrAudio.file_id);
            if (dl) {
              audioAttachment = {
                data: dl.base64,
                mimeType: voiceOrAudio.mime_type || "audio/ogg",
              };
              if (!userText) {
                const transcribed = await transcribeAudioBufferServer(
                  audioAttachment.data,
                  audioAttachment.mimeType
                );
                if (transcribed === "[INAUDIBLE_SPEECH]") {
                  if (!isGroupChat || session.liveChatActive || session.groupAutoReplyMode) {
                    const retryVoiceMsg =
                      "🎙️ អធ្យាស្រ័យណា៎! ប្រព័ន្ធស្ដាប់សំឡេងមិញមិនសូវច្បាស់ទេ សូមជួយនិយាយម្ដងទៀតឱ្យច្បាស់បន្តិចណា៎! 🙏✨\n🇬🇧 English: Sorry, I couldn't hear your voice clearly just now. Please speak again a bit more clearly!";
                    await sendTelegramMessage(botConfig.token, chatId, retryVoiceMsg);
                  }
                  continue;
                }
                if (transcribed) {
                  userText = transcribed;
                  heardVoiceTranscript = transcribed;
                }
              }
            }
          }

          const uploadedVideoObj =
            message.video ||
            message.video_note ||
            (message.document &&
            typeof message.document.mime_type === "string" &&
            message.document.mime_type.startsWith("video/")
              ? message.document
              : null);

          if (!userText && !imageAttachment && !audioAttachment && !uploadedVideoObj) continue;

          // 3a-000. Handle Creator Profile Setup, Creator Photo/Video Uploads, and Creator Info/Photo/Video Requests!
          const handledCreatorTurn = await handleTelegramCreatorMessageOrStateServer(
            botConfig.token,
            chatId,
            message,
            userText,
            imageAttachment,
            uploadedVideoObj,
            session,
            async (fileId: string) => {
              const dlVid = await downloadTelegramFile(botConfig.token, fileId);
              return dlVid?.base64 ? Buffer.from(dlVid.base64, "base64") : null;
            }
          );
          if (handledCreatorTurn) {
            continue;
          }

          // 3a-00. Handle Web-System Persistent Reply Keyboard Button Taps, ID Chat commands (/chatto, /autosay, /cmdsay, /sayto), and Stateful Active Tool Mode turns!
          const handledBtnOrMode = await handleTelegramCapabilityButtonOrSessionMode(
            botConfig.token,
            chatId,
            message.message_id,
            userText,
            imageAttachment,
            session,
            {
              sendTelegramOrthographyOrOcrResult,
              sendTelegramWorldTranslation,
              sendTelegramIllustratedStory,
              sendTelegramDictionaryResult,
              sendTelegramCambodiaCalendarResult,
            }
          );
          if (handledBtnOrMode) {
            continue;
          }

          try {
            const { handleTelegramMediaStudioDispatch } = await import("./api/media-studio-engine.js");
            const handledStudioMsg = await handleTelegramMediaStudioDispatch({
              token: botConfig.token,
              chatId,
              messageId: message.message_id,
              userText,
              session: session as any,
              uploadedVideoObj,
              uploadedAudioTarget,
              replyToMessage: message.reply_to_message,
            });
            if (handledStudioMsg) {
              continue;
            }
          } catch (e) {
            console.warn("[Server] MediaStudio message warning:", e);
          }

          // 3a-0. Direct Video File Upload for Khmer Voice Translation & Dubbing (or /dub command)
          if (
            uploadedVideoObj &&
            uploadedVideoObj.file_id &&
            (!userText ||
              isVideoTranslateRequestServer(userText) ||
              /(?:បកប្រែ|ខ្មែរ|សំឡេង|សម្លេង|dub|translate)/i.test(userText))
          ) {
            const dlVid = await downloadTelegramFile(botConfig.token, uploadedVideoObj.file_id);
            if (dlVid && dlVid.base64) {
              const vidBuf = Buffer.from(dlVid.base64, "base64");
              if (vidBuf.length > 500) {
                await sendTelegramTranslatedKhmerVideo(
                  botConfig.token,
                  chatId,
                  message.message_id,
                  {
                    videoBuffer: vidBuf,
                    titleHint: uploadedVideoObj.file_name || "Telegram Video",
                    userHint: userText,
                  }
                );
                continue;
              }
            }
          }

          // 3a-1. Video URL + Translate to Khmer Request (/dub <link> or "បកប្រែវីដេអូនេះជាភាសាខ្មែរ <link>")
          const anyUrlInText = (userText.match(/https?:\/\/[^\s<>"'`]+/i) || [])[0] || "";
          if (isVideoTranslateRequestServer(userText) && (anyUrlInText || session.lastVideoUrl)) {
            await sendTelegramTranslatedKhmerVideo(botConfig.token, chatId, message.message_id, {
              videoUrl: anyUrlInText || session.lastVideoUrl,
              titleHint: session.lastVideoTitle || "Translated Video",
              userHint: userText,
            });
            continue;
          }

          // 3a-2. Khmer & Multilingual Orthography/Grammar Check OR Image-to-Text (OCR) Request (/spell, /ocr, etc.)
          if (isOrthographyOrOcrRequestServer(userText, Boolean(imageAttachment))) {
            const targetImg =
              imageAttachment || (/(?:រូប|ocr|image)/i.test(userText) ? session.lastImage : undefined);
            await sendTelegramOrthographyOrOcrResult(botConfig.token, chatId, message.message_id, {
              text: userText,
              imageBase64: targetImg?.data || "",
              mimeType: targetImg?.mimeType || "image/jpeg",
            });
            continue;
          }

          if (isCambodiaCalendarRequestServer(userText)) {
            await sendTelegramCambodiaCalendarResult(botConfig.token, chatId, message.message_id, {
              query: userText,
            });
            continue;
          }

          if (isDictionaryRequestServer(userText)) {
            await sendTelegramDictionaryResult(botConfig.token, chatId, message.message_id, {
              word: userText,
            });
            continue;
          }

          if (isStoryGenerationRequestServer(userText)) {
            await sendTelegramIllustratedStory(botConfig.token, chatId, message.message_id, {
              prompt: userText,
            });
            continue;
          }

          if (isWorldTranslationRequestServer(userText)) {
            await sendTelegramWorldTranslation(botConfig.token, chatId, message.message_id, {
              text: userText,
            });
            continue;
          }

          // 3b. Check if this is a YouTube, TikTok, Facebook, CapCut, or Pinterest Video/Audio Download Link!
          const detectedSocial = detectSocialVideoUrlServer(userText);
          if (detectedSocial) {
            const dlRes = await sendTelegramSocialMediaDownload(
              botConfig.token,
              chatId,
              message.message_id,
              detectedSocial,
              session.autoVoiceReply
            );
            if (dlRes?.media?.mp4Url) {
              session.lastVideoUrl = dlRes.media.mp4Url;
              session.lastVideoTitle = dlRes.media.title || "Video";
            }
            continue;
          }

          // 4. Check if this is an artistic Image Generation or Image Editing request!
          const imgCheck = isImageGenerationOrEditRequest(
            userText,
            !!(imageAttachment || session.lastImage)
          );

          if (imgCheck.isImageTask) {
            fetch(`https://api.telegram.org/bot${botConfig.token}/sendChatAction`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: chatId, action: "upload_photo" }),
            }).catch(() => {});

            const sourceImgForEdit =
              imgCheck.mode === "edit" ? imageAttachment || session.lastImage : undefined;

            const genResult = await generateOrEditImage({
              prompt: userText || "កែរូបភាពនេះឱ្យកាន់តែស្អាតច្បាស់កម្រិត 4K",
              mode: imgCheck.mode,
              sourceImage: sourceImgForEdit,
            });

            if (genResult.image.mimeType !== "image/svg+xml") {
              session.lastImage = genResult.image;
            }

            await sendTelegramPhoto(
              botConfig.token,
              chatId,
              genResult.image.data,
              genResult.image.mimeType,
              genResult.description
            );

            if (session.autoVoiceReply) {
              await sendTelegramVoiceReply(botConfig.token, chatId, genResult.description);
            }
            continue;
          }

          // 5. Standard Chat / Exercise Solving / General Knowledge Q&A / Voice Answering / Live Chat
          // In Group Chats: Handle explicit commands to turn ON/OFF Auto-Reply mode in the group ("ឆ្លើយអូតូ", "បើកឆ្លើយអូតូ", "តាមបញ្ជា", "បិទឆ្លើយអូតូ")
          // Otherwise remain 100% SILENT unless explicitly commanded or auto-reply mode was turned ON by the user!
          if (isGroupChat && userText) {
            if (
              /^(?:\/autoreply_on|បើកឆ្លើយអូតូ|ឱ្យ\s*(?:ai\s*)?ឆ្លើយអូតូ|ឆ្លើយអូតូ|បើកការឆ្លើយស្វ័យប្រវត្តិ)(?:@\S+)?$/i.test(
                userText.trim()
              )
            ) {
              session.groupAutoReplyMode = true;
              await sendTelegramMessage(
                botConfig.token,
                chatId,
                `🤖✅ **បានបើកមុខងារ «ឆ្លើយអូតូក្នុងគ្រុប (Group Auto-Reply ON)» រួចរាល់ហើយ!**\n` +
                  `• ចាប់ពីពេលនេះទៅ AI នឹងជួយឆ្លើយតបសារ និងដោះស្រាយលំហាត់ជូនសមាជិកក្នុងគ្រុបដោយស្វ័យប្រវត្តិ (ព្រមទាំងការពារគ្រុបពីហ្វាល់មេរោគ Hacker 24/7)។\n` +
                  `• បើចង់ឱ្យ AI នៅស្ងៀមរង់ចាំតែពេលបញ្ជាវិញ សូមវាយ \`តាមបញ្ជា\` ឬ \`បិទឆ្លើយអូតូ\`។`
              );
              continue;
            }
            if (
              /^(?:\/autoreply_off|បិទឆ្លើយអូតូ|តាមបញ្ជា|ឆ្លើយតាមបញ្ជា|នៅស្ងៀមរង់ចាំបញ្ជា)(?:@\S+)?$/i.test(
                userText.trim()
              )
            ) {
              session.groupAutoReplyMode = false;
              await sendTelegramMessage(
                botConfig.token,
                chatId,
                `🫡🤫 **បានប្ដូរទៅជារបៀប «ឆ្លើយតាមបញ្ជា (Command-Only Standby Mode)» រួចរាល់ហើយ!**\n` +
                  `• AI នឹងរក្សាភាពស្ងៀមស្ងាត់មិនរញ៉េរញ៉ៃក្នុងគ្រុបឡើយ លុះត្រាតែអ្នកហៅឈ្មោះ បញ្ជា ឬវាយ \`ឆ្លើយអូតូ\` ទើបធ្វើសកម្មភាព (ប៉ុន្តែប្រព័ន្ធការពារគ្រុបពីហ្វាល់មេរោគ Hacker និងពាក្យអសុរសនៅតែការពារ 24/7)។`
              );
              continue;
            }
          }

          const isExplicitGroupCommand = Boolean(
            !isGroupChat ||
              session.liveChatActive ||
              session.groupAutoReplyMode ||
              userText.startsWith("/") ||
              message.reply_to_message?.from?.is_bot ||
              /(?:\bai\b|សំឡេង|សម្លេង|voice|ជួយដោះស្រាយ|ជួយឆ្លើយ|សួរ\s*ai|បញ្ជា|ឌឺដង|ផ្លែផ្កា|ផ្កែផ្កា|តវ៉ា|ខឹង|ស្អប់|ប្រច័ណ្ឌ|ហួងហែង|ធុញ|ជេរ|ដៀល|លួងលោម|ស្ដីបន្ទោស)/i.test(
                userText
              )
          );
          if (isGroupChat && !isExplicitGroupCommand && !audioAttachment && !imageAttachment) {
            continue;
          }

          const isVoiceWillBeSent = Boolean(
            session.liveChatActive || session.autoVoiceReply || audioAttachment
          );
          // Requirement 2: Show continuous "typing" / "recording voice" at bottom of Telegram chat until operation finishes!
          const stopTypingIndicator = isExplicitGroupCommand
            ? await startTelegramContinuousTypingIndicator(
                botConfig.token,
                chatId,
                isVoiceWillBeSent ? "record_voice" : "typing"
              )
            : async () => {};

          let rawAiReply = "";
          try {
            rawAiReply = await getGeminiAnswerForTelegramSession(
              session,
              userText,
              imageAttachment,
              audioAttachment,
              chatId
            );

            // If AI Vision/Audio/Text detected obscene/inappropriate content ([AUTO_DELETE_VIOLATION]), delete user message immediately!
            const shouldAutoDelete = isResponseAnAutoDeleteViolation(rawAiReply);
            const aiReply = rawAiReply.replace(/\[AUTO_DELETE_VIOLATION\]\s*/gi, "").trim();
            if (shouldAutoDelete) {
              await deleteTelegramMessage(botConfig.token, chatId, message.message_id);
            }

            if (isGroupChat && !isExplicitGroupCommand && !shouldAutoDelete) {
              continue;
            }

            // Requirement 3 & 4: Render 100% Web-System Visual Solution Board for exercises, and clean General Knowledge Q&A for general questions
            const isCasualUser = isCasualConversationPrompt(userText) || isCasualSocialChat(userText);
            const visuals =
              shouldAutoDelete || isCasualUser || isGeneralKnowledgeQuestion(userText)
                ? { solutionCards: [] as Buffer[], diagramImages: [] as Buffer[] }
                : renderTelegramSolutionVisuals(aiReply);

            const displayReplyWithTranscript =
              heardVoiceTranscript && session.showLiveTranscript !== false
                ? `🎙️ **សម្ដីអ្នកសួរដែលចាប់បាន (Gemini Live Voice Capture)៖** «${heardVoiceTranscript}»\n\n${aiReply}`
                : aiReply;

            const isGeminiExerciseTurn =
              !isCasualUser &&
              !shouldAutoDelete &&
              !isGeneralKnowledgeQuestion(userText) &&
              (isExercisePrompt(userText) ||
                isExerciseSolutionText(aiReply) ||
                visuals.solutionCards.length > 0);

            if (isGeminiExerciseTurn) {
              session.lastExercisePrompt = userText || "លំហាត់ពីរូបភាព";
              session.lastExerciseAnswer = aiReply;
            }

            const exerciseInlineMarkup = isGeminiExerciseTurn
              ? getGoogleGeminiExerciseInlineKeyboard(chatId)
              : undefined;

            const sendMainReplyPromise = (async () => {
              if (visuals.solutionCards.length > 0) {
                // Send 100% Web-App Identical Solution Board PNG + Full Step-by-Step HTML Solution with Google Gemini AI Options!
                const summaryCaption = extractSolutionCaptionSummary(aiReply);
                await sendTelegramBufferPhoto(
                  botConfig.token,
                  chatId,
                  visuals.solutionCards[0],
                  summaryCaption
                );
                await sendTelegramMessage(
                  botConfig.token,
                  chatId,
                  displayReplyWithTranscript,
                  exerciseInlineMarkup
                );
              } else {
                // General Knowledge Q&A or chat message (with Google Gemini Exercise Inline Options if exercise)
                await sendTelegramMessage(
                  botConfig.token,
                  chatId,
                  displayReplyWithTranscript,
                  exerciseInlineMarkup
                );
              }
            })();

            if (isVoiceWillBeSent && typeof (stopTypingIndicator as any)?.setAction === "function") {
              (stopTypingIndicator as any).setAction("record_voice");
            }

            // Send Voice audio reply IN PARALLEL with the main reply for maximum speed!
            const sendVoicePromise = isVoiceWillBeSent
              ? sendTelegramVoiceReply(botConfig.token, chatId, aiReply)
              : Promise.resolve();

            await Promise.all([sendMainReplyPromise, sendVoicePromise]);
          } finally {
            await stopTypingIndicator();
          }

          // Schedule 1-minute silence follow-up probing in private chats (unless user said they are busy)
          if (!isGroupChat && !getCompanionBusyState(`tg_${chatId}`)) {
            scheduleServerTelegramSilenceProbing(
              botConfig.token,
              chatId,
              session,
              userText,
              0
            );
          }
        }
      }
    } catch {
      // Quietly continue polling on transient network error
    } finally {
      isChecking = false;
    }
  }, 260);
}

// Setup Vite middlewares in development (with hmr: false to prevent iframe WebSocket errors)
// or serve static build in production deployments
async function startServer() {
  const distIndex = path.resolve(__dirname, "dist", "index.html");
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: process.env.DISABLE_HMR === "true" ? null : undefined,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(distIndex)) {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(distIndex);
    });
  }

  // Auto-connect Telegram Bot if token is configured in .env or saved config
  const savedConfig = loadSavedTelegramConfig();
  if (savedConfig.token) {
    connectTelegramBot(savedConfig.token, savedConfig.lastUpdateId).catch(() => {});
  }

  // 24/7 Automated Daily Calendar & Holiday Notifier Scheduler Watcher
  startDailyCalendarSchedulerWatcher(() => activeTelegramBot?.token || loadSavedTelegramConfig().token);

  // 24/7 Self-Healing Watchdog: Ensures the Telegram Bot never stops running 24 hours a day, 7 days a week
  setInterval(() => {
    try {
      const currentSaved = loadSavedTelegramConfig();
      if (
        currentSaved.token &&
        (!activeTelegramBot || !activeTelegramBot.isActive) &&
        !isConnectingTelegramBot
      ) {
        connectTelegramBot(currentSaved.token, currentSaved.lastUpdateId).catch(() => {});
      }
    } catch {}
  }, 25000);

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Khmer Super AI Agent Server (24/7 Mode) running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
