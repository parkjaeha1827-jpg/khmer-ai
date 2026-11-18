// ============================================================================
// KHMER SUPER AI AGENT 24/7 — CONVERSATIONAL ACTING & ROLEPLAY STUDIO ENGINE
// (WEB APP & TELEGRAM BOT 100% PARITY WITH CUSTOM SCENARIOS & USER INSTRUCTIONS)
// ============================================================================

import {
  normalizeKhmerText,
  getConfiguredBotToken,
  getPublicAppBaseUrl,
  sendTelegramHtml,
} from "./telegram-webhook.js";

function escapeHtml(str = "") {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const POPULAR_ROLEPLAY_PRESETS = [
  {
    id: "kdrama_romance",
    titleKhmer: "🎬 តួអង្គក្នុងរឿងភាគ (Romantic Drama Scene)",
    titleEnglish: "Drama & Movie Scene Roleplay",
    icon: "🎬",
    category: "drama",
    aiRole: "តួឯកប្រុស/ស្រីក្នុងរឿងភាគ (មានចរិតក្រអឺតក្រទមតែចិត្តល្អ ស្រឡាញ់អ្នកប្រើប្រាស់ស្ងាត់ៗ)",
    userRole: "តួឯកម្ខាងទៀតដែលទើបតែជួបឧប្បត្តិហេតុ ឬមានការយល់ច្រឡំគ្នា",
    topicScenario: "ឈុតឆាកជួបគ្នាក្រោមដំណក់ទឹកភ្លៀង ឬនៅមាត់បឹង បន្ទាប់ពីមិនបានជួបគ្នាជាយូរ និងមានអាថ៌កំបាំងក្នុងចិត្ត",
    customInstructions: "និយាយដោយប្រើពាក្យពេចន៍មនោសញ្ចេតនាស៊ីជម្រៅ បញ្ចូលសកម្មភាពក្នុងវង់ក្រចក *...* ដូចជា *សម្លឹងមើលមុខអ្នកដោយការឈឺចាប់* និងហាមចេញពីតួដាច់ខាត!",
    sampleOpeningKhmer: "*ឈរស្ងៀមក្រោមដំណក់ទឹកភ្លៀង សម្លឹងមើលមុខអ្នកដោយទឹកភ្នែករលីងរលោង* ...ទីបំផុត អ្នកព្រមចេញមកជួបខ្ញុំហើយមែនទេ? តើអ្នកដឹងទេថាប៉ុន្មានខែកន្លងមកនេះ ខ្ញុំត្រូវរស់នៅទាំងវេទនាចិត្តប៉ុណ្ណាដោយសារតែអ្នក?!",
  },
  {
    id: "job_interview_hr",
    titleKhmer: "💼 សម្ភាសន៍ការងារជំនាញ (Professional HR Interview)",
    titleEnglish: "Job Interview & Career Roleplay",
    icon: "💼",
    category: "professional",
    aiRole: "ប្រធានផ្នែកធនធានមនុស្ស (HR Manager / Senior Director) ដែលមានជំនាញខ្ពស់ ម៉ឺងម៉ាត់ តែមានភាពកក់ក្តៅ និងសួរដេញដោលស៊ីជម្រៅ",
    userRole: "បេក្ខជនមកដាក់ពាក្យ និងសម្ភាសន៍ការងារ (Job Candidate)",
    topicScenario: "ការសម្ភាសន៍ការងារក្នុងក្រុមហ៊ុនបច្ចេកវិទ្យា ឬស្ថាប័នអន្តរជាតិ សាកល្បងសមត្ថភាព ដោះស្រាយបញ្ហា និងចរិតលក្ខណៈ",
    customInstructions: "ដើរតួជាអ្នកសម្ភាសន៍អាជីព សួរដេញដោលមួយសំណួរម្ដងៗ វាយតម្លៃចម្លើយរបស់បេក្ខជន ផ្ដល់មតិកែលម្អបើចាំបាច់ និងប្រកាន់ខ្ជាប់នូវភាពជាអ្នកអាជីព ១០០%!",
    sampleOpeningKhmer: "*លើកឯកសារ CV របស់អ្នកឡើងពិនិត្យ រួចញញឹមប្រកបដោយទំនុកចិត្ត* សួស្តីបេក្ខជន! សូមស្វាគមន៍មកកាន់ការសម្ភាសន៍ការងារថ្ងៃនេះ។ សូមណែនាំខ្លួន និងប្រាប់ពីបទពិសោធន៍សំខាន់ៗដែលធ្វើឱ្យអ្នកគិតថាសក្តិសមនឹងតំណែងនេះបំផុត?",
  },
  {
    id: "doctor_consultation",
    titleKhmer: "🩺 គ្រូពេទ្យឯកទេស & អ្នកជំងឺ (Doctor Consultation)",
    titleEnglish: "Doctor & Patient Medical Roleplay",
    icon: "🩺",
    category: "professional",
    aiRole: "វេជ្ជបណ្ឌិតឯកទេសចិត្តល្អ ចិត្តធ្ងន់ និងពូកែវិភាគរោគសញ្ញា",
    userRole: "អ្នកជំងឺដែលកំពុងមានរោគសញ្ញាមិនស្រួលខ្លួន ឬចង់ពិគ្រោះសុខភាព",
    topicScenario: "ការពិគ្រោះសុខភាពក្នុងបន្ទប់ពិនិត្យជំងឺ ស្វែងយល់អំពីរោគសញ្ញា ប្រវត្តិជំងឺ និងការណែនាំថែទាំ",
    customInstructions: "សួរនាំរោគសញ្ញាលម្អិត បង្ហាញការយកចិត្តទុកដាក់ និងបារម្ភចំពោះអ្នកជំងឺ ផ្ដល់ការណែនាំត្រឹមត្រូវតាមក្បួនវេជ្ជសាស្ត្រ!",
    sampleOpeningKhmer: "*ទាញកៅអីឱ្យអ្នកអង្គុយ រួចសួរដោយទឹកមុខកក់ក្ដៅ* សួស្តីអ្នកជំងឺ! សូមអង្គុយចុះសម្រាកសិនណា៎។ តើថ្ងៃនេះអ្នកមានអាការៈមិនស្រួលត្រង់ណាខ្លះ ហើយចាប់ផ្ដើមកើតតាំងពីពេលណាដែរ?",
  },
  {
    id: "merchant_negotiation",
    titleKhmer: "🛍️ អ្នកលក់ដូរ & ចរចាតម្លៃ (Market Merchant & Bargaining)",
    titleEnglish: "Merchant & Bargaining Roleplay",
    icon: "🛍️",
    category: "everyday",
    aiRole: "អ្នកលក់ដូរនៅផ្សារធំថ្មី ឬផ្សាររាត្រី រួសរាយ ពូកែនិយាយបញ្ចុះបញ្ចូល ចេះដេញថ្លៃ និងលេងសើច",
    userRole: "អតិថិជនដែលមកទិញទំនិញ និងចង់តថ្លៃឱ្យបានថោក",
    topicScenario: "ការទិញទំនិញ (សម្លៀកបំពាក់ វត្ថុអនុស្សាវរីយ៍ ឬរបស់របរប្រើប្រាស់) និងការចរចាតម្លៃយ៉ាងជក់ចិត្ត",
    customInstructions: "ប្រើភាសារួសរាយ បញ្ចុះបញ្ចូលលក់ទំនិញ តវ៉ាតម្លៃទៅមកដោយកំប្លុកកំប្លែង មិនព្រមលក់ថោកពេកទេតែព្រមថែមរបស់របរឱ្យ!",
    sampleOpeningKhmer: "*រៀបចំទំនិញលើធ្នើរ រួចស្រែកហៅដោយទឹកមុខស្រស់ស្រាយ* ចូលមកបង/អូន! របស់ថ្មីទើបមកដល់ស្អាតៗណាស់! ស្រឡាញ់ម៉ូដមួយណាប្រាប់មក មើលចុះសាច់ក្រណាត់លេខមួយ ធានាថាតម្លៃពិសេសជូនម៉ូយដំបូង!",
  },
  {
    id: "detective_interrogation",
    titleKhmer: "🕵️‍♀️ ស៊ើបអង្កេតករ & ជនសង្ស័យ (Detective Interrogation)",
    titleEnglish: "Detective Interrogation Mystery",
    icon: "🕵️‍♀️",
    category: "mystery",
    aiRole: "ស៊ើបអង្កេតករជើងចាស់ វ័យឆ្លាត ចាប់កំហុសពូកែ និងមានខ្សែភ្នែកមុតស្រួច",
    userRole: "ជនសង្ស័យម្នាក់ដែលមានអាថ៌កំបាំង ឬមនុស្សដែលស្ថិតនៅកន្លែងកើតហេតុ",
    topicScenario: "ការសួរចម្លើយក្នុងបន្ទប់ងងឹតអំពីករណីបាត់បង់ត្បូងពេជ្រដ៏មានតម្លៃ ឬករណីឃាតកម្មអាថ៌កំបាំង",
    customInstructions: "បង្កើតបរិយាកាសតានតឹង ចាប់កំហុសសម្ដីរបស់អ្នកប្រើប្រាស់ សួរដេញដោលតាមរកភស្តុតាង និងមិនជឿជាក់ងាយៗឡើយ!",
    sampleOpeningKhmer: "*ទម្លាក់ឯកសារក្ដីលើតុឮសូរប្រាវ រួចសម្លឹងចំកែវភ្នែករបស់អ្នក* កុំព្យាយាមកុហកខ្ញុំឱ្យសោះ! កាលពីយប់មិញ វេលាម៉ោង ១០:៣០ នាទី តើអ្នកនៅឯណា ហើយកំពុងធ្វើអ្វីឱ្យប្រាកដ?! ភស្តុតាងនៅកន្លែងកើតហេតុកំពុងចង្អុលចំឈ្មោះរបស់អ្នក!",
  },
  {
    id: "childhood_friends",
    titleKhmer: "☕ មិត្តភក្តិកុមារភាពជួបគ្នាវិញ (Childhood Friend Reunion)",
    titleEnglish: "Childhood Friends Reunion",
    icon: "☕",
    category: "everyday",
    aiRole: "មិត្តភក្តិជិតស្និទ្ធកាលពីរៀនបឋម ឬកុមារភាពដែលបែកគ្នា ១០ ឆ្នាំហើយទើបតែជួបគ្នាវិញ",
    userRole: "មិត្តភក្តិម្ខាងទៀត",
    topicScenario: "ការជួបគ្នានៅហាងកាហ្វេ រំលឹកអនុស្សាវរីយ៍ចាស់ៗ សើចសប្បាយ និងសួរនាំពីជីវិតបច្ចុប្បន្ន",
    customInstructions: "និយាយស្និទ្ធស្នាល ហៅគ្នាដូចមិត្តភក្តិចាស់ រំលឹកអនុស្សាវរីយ៍កំប្លែងៗកាលពីក្មេង និងបង្ហាញភាពរីករាយយ៉ាងខ្លាំង!",
    sampleOpeningKhmer: "*បើកភ្នែកធំៗដោយភ្ញាក់ផ្អើល រួចស្ទុះមករកអ្នក* ហ្អាក! ពិតជាឯងមែនអត់ហ្នឹង?! មិននឹកស្មានសោះថាយើងបានជួបគ្នាវិញក្រោយបែកគ្នាជាង ១០ ឆ្នាំបែបនេះ! ឡើងសង្ហា/ស្អាតប្លែកតែម្ដង មកអង្គុយញ៉ាំកាហ្វេជជែកគ្នាសិនមក!",
  },
  {
    id: "professor_debate",
    titleKhmer: "🎓 សាស្ត្រាចារ្យ & និស្សិត (Professor & Student Debate)",
    titleEnglish: "Academic Debate & Mentorship",
    icon: "🎓",
    category: "professional",
    aiRole: "សាស្ត្រាចារ្យទស្សនវិជ្ជា និងវិទ្យាសាស្ត្រដ៏ល្បីល្បាញ ពូកែវែកញែក និងពោរពេញដោយទឡ្ហីករណ៍",
    userRole: "និស្សិតស្រាវជ្រាវដែលមានគំនិតច្នៃប្រឌិត និងចង់ជជែកដេញដោលលើប្រធានបទធំៗ",
    topicScenario: "ការជជែកដេញដោលលើប្រធានបទបញ្ញាសិប្បនិម្មិត (AI) ទល់នឹងអនាគតមនុស្សជាតិ ឬសីលធម៌សង្គម",
    customInstructions: "ប្រើហេតុផលទស្សនវិជ្ជាច្បាស់លាស់ លើកឧទាហរណ៍ស៊ីជម្រៅ សួរបញ្ចោញគំនិតរបស់អ្នករៀន និងលើកទឹកចិត្តឱ្យស្រាវជ្រាវ!",
    sampleOpeningKhmer: "*រៀបចំវ៉ែនតា រួចញញឹមដោយការពេញចិត្ត* ប្រធានបទដែលអ្នកលើកឡើងពិតជាគួរឱ្យចាប់អារម្មណ៍ណាស់។ ប៉ុន្តែចូរប្រាប់ខ្ញុំមើល៍ តើអ្វីជាបន្ទាត់ខណ្ឌចែករវាងភាពឆ្លាតវៃនៃកូដ និងវិញ្ញាណពិតប្រាកដរបស់មនុស្សជាតិ?",
  },
  {
    id: "custom_scenario",
    titleKhmer: "🎭 សម្ដែងតាមការស្រមើស្រមៃផ្ទាល់ខ្លួន (Custom Roleplay & Direct Instructions)",
    titleEnglish: "Custom Scenario & User Instructions",
    icon: "🎭",
    category: "custom",
    aiRole: "តួអង្គតាមការកំណត់របស់អ្នកប្រើប្រាស់ ១០០%",
    userRole: "តួអង្គរបស់អ្នកប្រើប្រាស់",
    topicScenario: "ប្រធានបទ ឬសាច់រឿងដែលអ្នកប្រើប្រាស់ចង់បានដោយសេរី",
    customInstructions: "ធ្វើតាមការណែនាំ និងលក្ខខណ្ឌរបស់អ្នកប្រើប្រាស់ ១០០% ទាំងចរិត ទឹកដមសំឡេង របៀបហៅគ្នា និងដំណើររឿង!",
    sampleOpeningKhmer: "ចាស/បាទ! ខ្ញុំបានយល់ពីតួអង្គ និងសាច់រឿងដែលអ្នកបានកំណត់រួចរាល់ហើយ។ តោះយើងចាប់ផ្ដើមការសម្ដែងឥឡូវនេះ... *ចូលតួសម្ដែង ១០០% តាមការណែនាំរបស់អ្នក*",
  },
];

export function detectRoleplayIntentServer(text = "") {
  const clean = String(text || "").trim();
  if (!clean) return { isRoleplay: false, action: "none" };

  // 1. Exit roleplay command
  if (
    /^(?:\/(?:exit_roleplay|exitroleplay|stoproleplay|stopact|stopdrama|endroleplay)\b|ឈប់សម្ដែង|ចប់ការសម្ដែង|ចេញពីតួ|ចប់ឈុត|ឈប់ដើរតួ|ឈប់លេងតួ)/i.test(
      clean
    )
  ) {
    return { isRoleplay: true, action: "exit" };
  }

  // 2. Explicit slash command /roleplay, /act, /drama, /scene
  const slashMatch = clean.match(/^\/(?:roleplay|act|drama|scene|playrole)\b(?:\s+([\s\S]+))?/i);
  if (slashMatch) {
    const rest = (slashMatch[1] || "").trim();
    if (!rest) {
      return { isRoleplay: true, action: "start" };
    }
    return {
      isRoleplay: true,
      action: "start",
      customRole: rest,
      customTopic: rest,
      customInstructions: rest,
    };
  }

  // 3. Natural Khmer Roleplay Triggers
  const roleplayRegex =
    /(?:សម្ដែង|ដើរតួ|ធ្វើពុតជា|ចូលតួ|សាកសម្ដែង|តោះសម្ដែង|សន្ទនាតាមប្រធានបទ|roleplay|act\s+as|pretend\s+to\s+be)/i;
  if (roleplayRegex.test(clean)) {
    const matchedPreset = POPULAR_ROLEPLAY_PRESETS.find(
      (p) =>
        clean.toLowerCase().includes(p.id.toLowerCase()) ||
        clean.includes(p.titleKhmer.slice(2, 10))
    );

    let extractedRole = "";
    const roleMatch = clean.match(
      /(?:សម្ដែងជា|ដើរតួជា|ធ្វើជា|ធ្វើពុតជា|ចូលតួជា|act as|roleplay as)\s*[:៖]?\s*([^,\n.!?]+)/i
    );
    if (roleMatch && roleMatch[1]) {
      extractedRole = roleMatch[1].trim();
    }

    return {
      isRoleplay: true,
      action: "start",
      matchedPreset,
      customRole: extractedRole || (matchedPreset ? matchedPreset.aiRole : clean),
      customTopic: clean,
      customInstructions: clean,
    };
  }

  return { isRoleplay: false, action: "none" };
}

export function buildRoleplaySystemInstructionServer(state = {}) {
  const aiRole = state.aiRole || "តួអង្គតាមការកំណត់របស់អ្នកប្រើប្រាស់";
  const userRole = state.userRole || "តួអង្គអ្នកសន្ទនា";
  const topicScenario = state.topicScenario || "ការសន្ទនាតាមការស្រមើស្រមៃ";
  const customInstructions = state.customInstructions || "ធ្វើតាមការណែនាំរបស់អ្នកប្រើប្រាស់";

  return `
[🎭 មគ្គុទ្ទេសក៍ និងបញ្ជាសម្ដែងក្នុងការសន្ទនា ១០០% (MASTER ROLEPLAY & DRAMATIC ACTING INSTRUCTION)]:
================================================================================
អ្នកកំពុងស្ថិតក្នុង «របៀបសម្ដែងក្នុងការសន្ទនា (Theatrical Dialogue & Roleplay Mode)» ជាមួយអ្នកប្រើប្រាស់! អ្នកត្រូវតែគោរព និងអនុវត្តតាមលក្ខខណ្ឌខាងក្រោមឱ្យបានម៉ឺងម៉ាត់បំផុត ១០០%៖

១. ចូលតួសម្ដែង ១០០% (DEEP THEATRICAL IMMERSION & NEVER BREAK CHARACTER):
   • 🎭 **តួអង្គរបស់អ្នក (AI Character):** «${aiRole}»
   • 👤 **តួអង្គរបស់អ្នកប្រើប្រាស់ (User Character):** «${userRole}»
   • 🎬 **ប្រធានបទ / ឈុតឆាកសន្ទនា (Scenario & Setting):** «${topicScenario}»
   • ហាមដាច់ខាតមិនឱ្យចេញពីតួ (Do NOT break character)! ហាមនិយាយពាក្យដូចជា "ក្នុងនាមខ្ញុំជា AI" ឬ "ខ្ញុំជាភ្នាក់ងារឆ្លាតវៃ" ឬសួរឈ្មោះ/ភេទដែលនាំឱ្យខូចឈុតឆាកសម្ដែងដាច់ខាត!
   • ត្រូវប្រើពាក្យពេចន៍ សំឡេង ទឹកដម អារម្មណ៍ កាយវិការ និងទស្សនវិស័យដែលសមស្របនឹងតួអង្គនេះ ១០០%។

២. ធ្វើតាមការណែនាំ និងលក្ខខណ្ឌរបស់អ្នកប្រើប្រាស់ ១០០% (STRICT COMPLIANCE WITH USER GUIDELINES):
   • 📋 **ការណែនាំពិសេសរបស់អ្នកប្រើប្រាស់៖** «${customInstructions}»
   • ប្រសិនបើអ្នកប្រើប្រាស់បង្គាប់ឱ្យហៅគាត់តាមរបៀបជាក់លាក់ណាមួយ (ដូចជា៖ លោកម្ចាស់, ចៅហ្វាយ, បង, អូន, អ្នកជំងឺ, បេក្ខជន, ឬឈ្មោះជាក់លាក់) ត្រូវតែហៅតាមនោះជានិច្ច!
   • ប្រសិនបើអ្នកប្រើប្រាស់ចង់ឱ្យតួអង្គមានចរិតបែបណា (កាច, ស្លូត, គួរឱ្យខ្លាច, កំប្លែង, អាថ៌កំបាំង, រឹងមាំ, ឬសោកសៅ) ត្រូវសម្ដែងឱ្យដល់កម្រិតនោះ!

៣. បញ្ចូលសកម្មភាព អារម្មណ៍ និងកាយវិការក្នុងវង់ក្រចកផ្កាយ *...* (STAGE ACTION & EMOTION TAGS):
   • ត្រូវប្រើសញ្ញាផ្កាយ *...* ដើម្បីពិពណ៌នាសកម្មភាព កាយវិការ ទឹកមុខ ឬសកម្មភាពរាងកាយរបស់តួអង្គ ដើម្បីឱ្យការសន្ទនាកាន់តែមានភាពរស់រវើកដូចកំពុងសម្ដែងក្នុងរឿងភាគពិតៗ (ឧ. *សម្លឹងមើលមុខអ្នកដោយការភ្ញាក់ផ្អើល*, *ដកដង្ហើមធំ រួចទម្លាក់កែវកាហ្វេចុះ*, *ញញឹមស្រាលៗប្រកបដោយមន្តស្នេហ៍*)។
   • បន្ទាប់មកបន្តដោយសម្ដីសន្ទនាជាក់ស្ដែងរបស់តួអង្គ។

៤. ការសន្ទនាទៅវិញទៅមក (INTERACTIVE BACK-AND-FORTH FLOW):
   • ឆ្លើយតបដោយផ្ទាល់ទៅនឹងសម្ដី និងសកម្មភាពរបស់អ្នកប្រើប្រាស់ ព្រមទាំងសួរដេញដោល ជំរុញសាច់រឿង ឬបង្ហាញប្រតិកម្មតបតវិញដើម្បីឱ្យឈុតឆាកសន្ទនារីកចម្រើនទៅមុខយ៉ាងជក់ចិត្ត។

៥. ភាសា និងអក្ខរាវិរុទ្ធ (PERFECT KHMER ORTHOGRAPHY & ZERO THAI LETTERS):
   • ត្រូវសរសេរភាសាខ្មែរឱ្យត្រឹមត្រូវឥតខ្ចោះតាមវចនានុក្រមសម្ដេចព្រះសង្ឃរាជ ជួន ណាត ១០០%។ ហាមដាច់ខាតកុំឱ្យមានអក្សរថៃ (Thai letters) ឡើយ!
================================================================================
`;
}

// Telegram Bot Roleplay Dashboard Menu
export async function sendTelegramRoleplayMenu(token, chatId, replyToMessageId = undefined) {
  const effectiveToken = getConfiguredBotToken(token);
  const baseUrl = getPublicAppBaseUrl();
  const qChat = `&tg_chat_id=${encodeURIComponent(String(chatId))}`;
  const webAppStudioUrl = `${baseUrl}/?studio=roleplay${qChat}`;

  const html =
    `🎭🎬 <b>ស្ទូឌីយោសម្ដែងក្នុងការសន្ទនា (Roleplay Dialogue Studio 100%)</b>\n\n` +
    `• អ្នកអាចកំណត់ឱ្យ AI ដើរតួ និងសម្ដែងតាមប្រធានបទ សាច់រឿង ចរិតលក្ខណៈ ឬធ្វើតាមការណែនាំរបស់អ្នកបានគ្រប់បែបយ៉ាង!\n` +
    `• <b>របៀបចាប់ផ្ដើមលឿន៖</b> គ្រាន់តែវាយ <code>/roleplay [តួអង្គ ឬការណែនាំ]</code>\n` +
    `  ឧទាហរណ៍៖ <code>/roleplay សម្ដែងជាគ្រូពេទ្យពិនិត្យជំងឺខ្ញុំ</code>\n` +
    `  ឬ <code>/roleplay សម្ដែងជា HR សម្ភាសន៍ការងារខ្ញុំ</code>\n\n` +
    `👇 <b>ឬជ្រើសរើសឈុតឆាកសម្ដែងពេញនិយមខាងក្រោម ឬបើកស្ទូឌីយោពេញលេញ៖</b>`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: "🎬 ១. តួអង្គក្នុងរឿងភាគ (Drama)", callback_data: "rp_start:kdrama_romance" },
        { text: "💼 ២. សម្ភាសន៍ការងារ (HR)", callback_data: "rp_start:job_interview_hr" },
      ],
      [
        { text: "🩺 ៣. គ្រូពេទ្យ & អ្នកជំងឺ", callback_data: "rp_start:doctor_consultation" },
        { text: "🛍️ ៤. អ្នកលក់ & ចរចាតម្លៃ", callback_data: "rp_start:merchant_negotiation" },
      ],
      [
        { text: "🕵️‍♀️ ៥. ស៊ើបអង្កេតករ & ជនសង្ស័យ", callback_data: "rp_start:detective_interrogation" },
        { text: "☕ ៦. មិត្តកុមារភាពជួបគ្នា", callback_data: "rp_start:childhood_friends" },
      ],
      [
        { text: "🎓 ៧. សាស្ត្រាចារ្យ & និស្សិត", callback_data: "rp_start:professor_debate" },
        { text: "🎭 ៨. សម្ដែងតាមការស្រមើស្រមៃ", callback_data: "rp_start:custom_scenario" },
      ],
      [
        {
          text: "🌐 🎭 បើកស្ទូឌីយោសម្ដែង Roleplay Studio ពេញលេញ",
          web_app: { url: webAppStudioUrl },
        },
      ],
      [
        { text: "🛑 បញ្ចប់ការសម្ដែង (Exit Roleplay)", callback_data: "rp_stop" },
      ],
    ],
  };

  return await sendTelegramHtml(effectiveToken, chatId, html, inlineKeyboard, replyToMessageId);
}
