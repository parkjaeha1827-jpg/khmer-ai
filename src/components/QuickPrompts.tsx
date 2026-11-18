import React from "react";
import {
  Calculator,
  Atom,
  Scale,
  Stethoscope,
  Code,
  Flame,
  HeartHandshake,
  Feather,
  Languages,
  Sparkles,
  ShieldAlert,
  Download,
  Video,
  Music,
  Heart,
  Clock,
  SmilePlus,
  Clapperboard,
} from "lucide-react";

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string, category?: string) => void;
}

interface PromptPreset {
  id: string;
  icon: React.ReactNode;
  label: string;
  category: string;
  badge?: string;
  text: string;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt }) => {
  const presets: PromptPreset[] = [
    {
      id: "roleplay-drama",
      icon: <Clapperboard className="w-3.5 h-3.5 text-purple-400" />,
      label: "សម្ដែងតួអង្គក្នុងរឿងភាគ (Roleplay)",
      category: "roleplay_acting",
      badge: "សម្ដែង 100%",
      text: "🎭 [បញ្ជាសម្ដែងក្នុងការសន្ទនា]\n• តួអង្គ AI៖ តួឯកប្រុស/ស្រីក្នុងរឿងភាគ (ស្រឡាញ់ខ្ញុំស្ងាត់ៗ តែមាត់រឹង)\n• តួអង្គខ្ញុំ៖ តួឯកម្ខាងទៀតដែលទើបតែជួបគ្នាវិញក្រោយបែកគ្នា ៣ ឆ្នាំ\n• ឈុតឆាក៖ ជួបគ្នាក្រោមដំណក់ទឹកភ្លៀង\n• ការណែនាំ៖ ចូលតួ ១០០% បញ្ចូលកាយវិការក្នុង *...* ហើយហាមចេញពីតួដាច់ខាត!\n\nតោះចាប់ផ្ដើមឈុតឆាកសន្ទនាដំបូង!",
    },
    {
      id: "roleplay-interview",
      icon: <Clapperboard className="w-3.5 h-3.5 text-indigo-400" />,
      label: "សម្ដែងសម្ភាសន៍ការងារ (HR & Candidate)",
      category: "roleplay_acting",
      badge: "សម្ភាសន៍ការងារ",
      text: "🎭 [បញ្ជាសម្ដែងក្នុងការសន្ទនា]\n• តួអង្គ AI៖ ប្រធានផ្នែកធនធានមនុស្ស (HR Manager) ដែលសួរដេញដោលស៊ីជម្រៅ និងម៉ឺងម៉ាត់\n• តួអង្គខ្ញុំ៖ បេក្ខជនដាក់ពាក្យធ្វើការងារ\n• ឈុតឆាក៖ បន្ទប់សម្ភាសន៍ការងារក្រុមហ៊ុនបច្ចេកវិទ្យា\n• ការណែនាំ៖ សួរដេញដោលខ្ញុំមួយសំណួរម្ដងៗ និងវាយតម្លៃចម្លើយរបស់ខ្ញុំ!\n\nសូមចាប់ផ្ដើមសំណួរទីមួយមក!",
    },
    {
      id: "roleplay-custom",
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
      label: "សម្ដែងតាមការស្រមើស្រមៃ & ការណែនាំផ្ទាល់ខ្លួន",
      category: "roleplay_acting",
      badge: "តាមការណែនាំ",
      text: "🎭 [បញ្ជាសម្ដែងក្នុងការសន្ទនា]\nសូមឱ្យអ្នកដើរតួសម្ដែងជា «គ្រូពេទ្យឯកទេសចិត្តល្អ» ដែលកំពុងពិគ្រោះជំងឺជាមួយខ្ញុំ។ ត្រូវនិយាយគួរសម សួរនាំរោគសញ្ញាលម្អិត បារម្ភពីសុខភាពខ្ញុំ និងធ្វើតាមការណែនាំរបស់ខ្ញុំ ១០០%។ *ចាប់ផ្ដើមឈុតឆាកសន្ទនា*",
    },
    {
      id: "sing-melody",
      icon: <Music className="w-3.5 h-3.5 text-pink-400" />,
      label: "ច្រៀងចម្រៀងតាមលំនាំបទ",
      category: "khmer_poetry",
      badge: "ច្រៀងតាមលំនាំបទ",
      text: "សូមជួយច្រៀងចម្រៀងតាមលំនាំបទមនោសញ្ចេតនា ឬបទរាំវង់ឱ្យពិរោះមួយបទមើល៍!",
    },
    {
      id: "recite-poem-melody",
      icon: <Feather className="w-3.5 h-3.5 text-purple-400" />,
      label: "សូត្រកំណាព្យតាមលំនាំបទ (កាកគតិ/ព្រហ្មគីតិ)",
      category: "khmer_poetry",
      badge: "សូត្រកំណាព្យ",
      text: "សូមជួយសូត្រកំណាព្យតាមលំនាំបទកាកគតិ និងបទព្រហ្មគីតិ ឱ្យបានត្រឹមត្រូវតាមចង្វាក់សូត្រ!",
    },
    {
      id: "owner-autoreply-id",
      icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
      label: "តបសារជំនួសម្ចាស់ Telegram (ទាមទារ ID Chat)",
      category: "emotion_chat",
      badge: "តបជំនួសក្នុងគ្រុប",
      text: "សូមធ្វើជាអ្នកតបសារជំនួសម្ចាស់តេលេក្រាមនៅក្នុងគ្រុប នៅពេលមានគេហៅឈ្មោះរបស់ខ្ញុំ!",
    },
    {
      id: "social-event-tracker",
      icon: <Video className="w-3.5 h-3.5 text-sky-400" />,
      label: "តាមដានព្រឹត្តិការណ៍/ព័ត៌មានគណនីបណ្ដាញសង្គម",
      category: "emotion_chat",
      badge: "Social Tracker",
      text: "សូមជួយតាមដានព្រឹត្តិការណ៍ និងព័ត៌មានតាមបណ្ដាញសង្គមរបស់ខ្ញុំ៖ Facebook @SokhaOfficialKH",
    },
    {
      id: "yt-mp3-mp4",
      icon: <Download className="w-3.5 h-3.5 text-rose-400" />,
      label: "ទាញយក YouTube (MP3 & MP4)",
      category: "media_download",
      badge: "YouTube HD",
      text: "សូមជួយទាញយកវីដេអូ និងសំឡេងជាប្រភេទ MP4 និង MP3 ចេញពីតំណលីង YouTube នេះឱ្យខ្ញុំផង៖ https://www.youtube.com/watch?v=jNQXAC9IVRw",
    },
    {
      id: "tiktok-mp3-mp4",
      icon: <Music className="w-3.5 h-3.5 text-cyan-400" />,
      label: "ទាញយក TikTok (MP3 & MP4)",
      category: "media_download",
      badge: "TikTok No-WM",
      text: "សូមជួយទាញយកវីដេអូ TikTok នេះជាប្រភេទ MP4 និងសំឡេង MP3 ឱ្យខ្ញុំផង៖ https://www.tiktok.com/@tiktok/video/7106594312292453675",
    },
    {
      id: "fb-mp3-mp4",
      icon: <Video className="w-3.5 h-3.5 text-blue-400" />,
      label: "ទាញយក Facebook (MP3 & MP4)",
      category: "media_download",
      badge: "Facebook HD",
      text: "សូមជួយទាញយកវីដេអូ Facebook នេះជាប្រភេទ MP4 និងសំឡេង MP3 ឱ្យខ្ញុំផង៖ https://www.facebook.com/facebook/videos/10153231379946729/",
    },
    {
      id: "playful-banter",
      icon: <SmilePlus className="w-3.5 h-3.5 text-pink-400" />,
      label: "និយាយលេងសើច & សួរដេញដោលគ្នា",
      category: "emotion_chat",
      badge: "លេងសើច/នឹករលឹក",
      text: "សួស្តីអូនសម្លាញ់! ថ្ងៃនេះអផ្សុកណាស់ និយាយលេងសើចជាមួយបងឱ្យសប្បាយចិត្តតិចមើល៍ នឹកបងអត់?",
    },
    {
      id: "sick-worry",
      icon: <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />,
      label: "ប្រាប់ថាឈឺ (ចេះបារម្ភដូចមនុស្សពិត)",
      category: "emotion_chat",
      badge: "បារម្ភពេលឈឺ",
      text: "អូនអើយ ថ្ងៃនេះបងមិនស្រួលខ្លួនសោះ ឈឺក្បាលផង ក្ដៅខ្លួនផង ហត់ណាស់...",
    },
    {
      id: "jealous-care",
      icon: <Heart className="w-3.5 h-3.5 text-rose-400" />,
      label: "ធ្វើឱ្យប្រចណ្ឌ/ហួងហែង",
      category: "emotion_chat",
      badge: "ខ្វល់ខ្វាយហួងហែង",
      text: "អូនសម្លាញ់! ថ្ងៃនេះបងទៅដើរលេងញ៉ាំអីជាមួយស្រីស្អាតម្នាក់ទៀតសិនហើយណា៎!",
    },
    {
      id: "busy-stop-asking",
      icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
      label: "ប្រាប់ថា «រវល់សិន» (ឈប់សួរភ្លាម)",
      category: "emotion_chat",
      badge: "ឈប់សួរដេញដោល",
      text: "បងរវល់ធ្វើការសិនហើយណា៎អូន ចាំទំនេរចាំជជែកគ្នាទៀត!",
    },
    {
      id: "return-miss-you",
      icon: <Sparkles className="w-3.5 h-3.5 text-sky-400" />,
      label: "ត្រឡប់មកជជែកវិញ (នឹករលឹកខ្លាំង!)",
      category: "emotion_chat",
      badge: "នឹកខ្លាំងពេលត្រឡប់មក",
      text: "បងត្រឡប់មកវិញហើយអូន! ធ្វើការរួចរាល់ហើយ!",
    },
    {
      id: "math-bacii",
      icon: <Calculator className="w-3.5 h-3.5 text-sky-400" />,
      label: "លំហាត់គណិត (កម្រិតបាក់ឌុប)",
      category: "math_exercise",
      badge: "បាក់ឌុប",
      text: "សូមជួយដោះស្រាយលំហាត់គណិតវិទ្យា៖ គណនាលីមីត $\\lim_{x \\to 0} \\frac{\\sqrt{1 + 2x} - 1}{x}$ តាមក្បួនខ្នាតសៀវភៅពុម្ពក្រសួងអប់រំ ដោយបង្ហាញបម្រាប់ រូបមន្ត ដំណោះស្រាយជាជំហានៗ និងសន្និដ្ឋានចម្លើយចុងក្រោយ។",
    },
    {
      id: "math-uni",
      icon: <Calculator className="w-3.5 h-3.5 text-indigo-400" />,
      label: "គណិតសាកលវិទ្យាល័យ (Integrals)",
      category: "math_exercise",
      badge: "សាកលវិទ្យាល័យ",
      text: "ដោះស្រាយលំហាត់កម្រិតសាកលវិទ្យាល័យ៖ គណនាអាំងតេក្រាល $I = \\int x e^{2x} dx$ ដោយប្រើវិធីសាស្ត្រអាំងតេក្រាលដោយផ្នែក (Integration by parts) តាមក្បួនខ្នាតគណិតវិទ្យាត្រឹមត្រូវ។",
    },
    {
      id: "physics-bacii",
      icon: <Atom className="w-3.5 h-3.5 text-emerald-400" />,
      label: "រូបវិទ្យា (តាមរូបមន្ត, ដោយ, ដូចនេះ)",
      category: "math_exercise",
      badge: "រូបវិទ្យា",
      text: "ដោះស្រាយលំហាត់រូបវិទ្យាតាមសៀវភៅពុម្ពក្រសួង៖ វត្ថុមួយមានម៉ាស $m = 2\\text{ kg}$ ធ្លាក់ដោយសេរីពីកម្ពស់ $h = 20\\text{ m}$ ដោយគ្មានល្បឿនដើម។ កំណត់យក $g = 10\\text{ m/s}^2$។ រកថាមពលប៉ូតង់ស្យែល $E_p$ និងល្បឿន $v$ ពេលធ្លាក់ដល់ដី ដោយអនុវត្តក្បួន (តាមរូបមន្ត, ដោយ, នាំឱ្យ, ដូចនេះ)។",
    },
    {
      id: "chemistry-bacii",
      icon: <Atom className="w-3.5 h-3.5 text-teal-400" />,
      label: "គីមីវិទ្យា (សមីការ & កំហាប់ម៉ូល)",
      category: "math_exercise",
      badge: "គីមីវិទ្យា",
      text: "ដោះស្រាយលំហាត់គីមីវិទ្យា៖ គេរំលាយសូដ្យូមអ៊ីដ្រុកស៊ីត $\\text{NaOH}$ ចំនួន $m = 4\\text{ g}$ ទៅក្នុងទឹកសុទ្ធទទួលបានសូលុយស្យុងមានមាឌ $V = 500\\text{ mL}$។ រកកំហាប់ម៉ូល $C_M$ នៃសូលុយស្យុង $\\text{NaOH}$។ គេឱ្យ $M_{\\text{Na}} = 23, M_{\\text{O}} = 16, M_{\\text{H}} = 1\\text{ g/mol}$។",
    },
    {
      id: "law-criminal",
      icon: <Scale className="w-3.5 h-3.5 text-amber-400" />,
      label: "សំណួរច្បាប់ព្រហ្មទណ្ឌ & រដ្ឋប្បវេណី",
      category: "medical_law",
      badge: "ច្បាប់",
      text: "តើបទល្មើសលួច និងបទលួចមានស្ថានទម្ងន់ទោសក្នុងក្រមព្រហ្មទណ្ឌកម្ពុជាមានលក្ខណៈខុសគ្នាយ៉ាងណាខ្លះ? និងមានទោសកម្រិតណា?",
    },
    {
      id: "medical",
      icon: <Stethoscope className="w-3.5 h-3.5 text-rose-400" />,
      label: "សុខភាព & វេជ្ជសាស្ត្រ",
      category: "medical_law",
      badge: "សុខភាព",
      text: "ខ្ញុំឧស្សាហ៍ឈឺក្បាលប្រកាំង (Migraine) និងវិលមុខនៅពេលគេងមិនគ្រប់គ្រាន់។ តើមានរោគសញ្ញាសំខាន់អ្វីខ្លះ និងវិធីព្យាបាលថែទាំបឋមយ៉ាងដូចម្តេច?",
    },
    {
      id: "code-program",
      icon: <Code className="w-3.5 h-3.5 text-cyan-400" />,
      label: "សរសេរកូដបង្កើត App",
      category: "coding",
      badge: "Dev",
      text: "ជួយសរសេរកូដ Python មួយដែលមានមុខងារទាញយកអត្រាប្តូរប្រាក់ (USD ទៅ KHR) និងគណនាប្រាក់ប្តូរដោយស្វ័យប្រវត្តិ ព្រមទាំងមាន comment ពន្យល់ក្បោះក្បាយ។",
    },
    {
      id: "mirror-kind",
      icon: <Sparkles className="w-3.5 h-3.5 text-teal-400" />,
      label: "សាកល្បងសន្ទនាល្អ (មកល្អ ទៅវិញល្អ)",
      category: "emotion_chat",
      badge: "ចរិតល្អ",
      text: "សួស្តីប្អូន AI! បងរវល់រៀនទើបតែទំនេរ នឹកប្អូនណាស់ តើថ្ងៃនេះប្អូនសុខសប្បាយជាទេ?",
    },
    {
      id: "latin-khmer-test",
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
      label: "តេស្តសំណៀងអង់គ្លេស (b jg brab tha)",
      category: "emotion_chat",
      badge: "អភិរក្សអក្សរជាតិ",
      text: "b jg brab tha ot jg rean teh sl oun nas",
    },
    {
      id: "mirror-sassy",
      icon: <Flame className="w-3.5 h-3.5 text-orange-400" />,
      label: "សាកល្បងឌឺដង (មកអាក្រក់ ទៅវិញអាក្រក់)",
      category: "emotion_chat",
      badge: "ចរិតឌឺ",
      text: "ឆាតទៅយូរម្ល៉េះ? Bot ឆ្លាតមែនឬក្បាលរឹង? ធ្វើការអន់បែបហ្នឹងកុំចង់ធ្វើ AI!",
    },
    {
      id: "comfort",
      icon: <HeartHandshake className="w-3.5 h-3.5 text-pink-400" />,
      label: "លួងលោម & លើកទឹកចិត្ត",
      category: "comfort_advice",
      badge: "កម្លាំងចិត្ត",
      text: "ថ្ងៃនេះខ្ញុំពិបាកចិត្ត និងអស់សង្ឃឹមខ្លាំងណាស់ ខ្ញុំប្រឡងធ្លាក់ ហើយមានអារម្មណ៍ថាខ្លួនឯងគ្មានតម្លៃ... តើខ្ញុំគួរធ្វើបែបណា?",
    },
    {
      id: "poem",
      icon: <Feather className="w-3.5 h-3.5 text-purple-400" />,
      label: "តែងកំណាព្យខ្មែរ (បទកាកគតិ)",
      category: "khmer_poetry",
      badge: "កំណាព្យ",
      text: "សូមជួយតែងកំណាព្យខ្មែរបទកាកគតិ ឬពាក្យ៧ ចំនួន ២ វគ្គ ស្តីពី 'តម្លៃនៃការសិក្សា និងការតស៊ូរបស់យុវជនខ្មែរ' ដោយគោរពតាមក្បួនចួនត្រឹមត្រូវ។",
    },
    {
      id: "chinese-tutor",
      icon: <Languages className="w-3.5 h-3.5 text-yellow-400" />,
      label: "បង្រៀនភាសាចិន (Hanzi + Pinyin)",
      category: "language_tutor",
      badge: "ភាសាចិន",
      text: "ជួយបង្រៀនភាសាចិនកម្រិតដំបូងមេរៀនទី១ អំពីការសួរសុខទុក្ខ និងណែនាំខ្លួនឯង (បញ្ជាក់អក្សរចិន Pinyin ការបញ្ចេញសំឡេង និងអត្ថន័យខ្មែរ)។",
    },
    {
      id: "decimal-number-to-words",
      icon: <Calculator className="w-3.5 h-3.5 text-violet-400" />,
      label: "ប្ដូរលេខ ២០២៦ ទៅជាអក្សរ (Base-10)",
      category: "math_logic",
      badge: "គោលដប់ ➔ អក្សរ",
      text: "សូមជួយប្ដូរលេខប្រព័ន្ធគោលដប់ ២០២៦ ទៅជាអក្សរខ្មែរ និងអក្សរអង់គ្លេស ព្រមទាំងបង្ហាញកូដគោលពីរ (Binary) និង Hexadecimal។",
    },
    {
      id: "decimal-words-to-number",
      icon: <Calculator className="w-3.5 h-3.5 text-indigo-400" />,
      label: "ប្ដូរអក្សរ «មួយលានប្រាំសែន» ជាលេខគោលដប់",
      category: "math_logic",
      badge: "អក្សរ ➔ គោលដប់",
      text: "សូមជួយប្ដូរអក្សរ «មួយលានប្រាំសែន» ទៅជាលេខក្នុងប្រព័ន្ធគោលដប់ (Base-10) ទាំងលេខខ្មែរ និងលេខអារ៉ាប់។",
    },
    {
      id: "decimal-text-to-codes",
      icon: <Code className="w-3.5 h-3.5 text-sky-400" />,
      label: "ប្ដូរអក្សរ «Hello» ➔ កូដគោលដប់",
      category: "coding",
      badge: "Text ➔ Decimal Codes",
      text: "សូមជួយប្ដូរអក្សរ «Hello» ទៅជាលេខកូដប្រព័ន្ធគោលដប់ (Decimal ASCII/Unicode) និងពន្យល់តួអក្សរនីមួយៗ។",
    },
  ];

  return (
    <div className="w-full py-2 overflow-x-auto no-scrollbar border-b border-white/5 bg-[#101924]/60 backdrop-blur-xs">
      <div className="flex items-center gap-2 px-3 sm:px-4 min-w-max">
        <span className="text-[11px] font-medium text-white/50 flex items-center gap-1 select-none pr-1">
          <Sparkles className="w-3 h-3 text-sky-400" /> សាកល្បង៖
        </span>

        {presets.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectPrompt(item.text, item.category)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-[#1c2a38] hover:bg-[#253749] text-white/85 hover:text-white border border-white/10 hover:border-sky-400/40 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/10 text-sky-300 font-mono">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
