import React, { useState } from "react";
import {
  X,
  Sparkles,
  Clapperboard,
  Send,
  UserCheck,
  Bot,
  MessageSquare,
  Compass,
  Check,
  StopCircle,
} from "lucide-react";
import {
  POPULAR_ROLEPLAY_PRESETS,
  RoleplayScenarioConfig,
} from "../utils/roleplayEngine";

interface RoleplayStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRoleplay: (promptText: string) => void;
  onStopRoleplay?: () => void;
  isCurrentlyRoleplaying?: boolean;
}

export const RoleplayStudioModal: React.FC<RoleplayStudioModalProps> = ({
  isOpen,
  onClose,
  onStartRoleplay,
  onStopRoleplay,
  isCurrentlyRoleplaying = false,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<RoleplayScenarioConfig>(
    POPULAR_ROLEPLAY_PRESETS[0]
  );
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [customAiRole, setCustomAiRole] = useState(POPULAR_ROLEPLAY_PRESETS[0].aiRole);
  const [customUserRole, setCustomUserRole] = useState(POPULAR_ROLEPLAY_PRESETS[0].userRole);
  const [customTopic, setCustomTopic] = useState(POPULAR_ROLEPLAY_PRESETS[0].topicScenario);
  const [customInstructions, setCustomInstructions] = useState(
    POPULAR_ROLEPLAY_PRESETS[0].customInstructions
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: RoleplayScenarioConfig) => {
    setSelectedPreset(preset);
    setCustomAiRole(preset.aiRole);
    setCustomUserRole(preset.userRole);
    setCustomTopic(preset.topicScenario);
    setCustomInstructions(preset.customInstructions);
  };

  const handleStart = () => {
    const formattedPrompt = [
      `🎭 [បញ្ជាសម្ដែងក្នុងការសន្ទនា - THEATRICAL ROLEPLAY SCENARIO]`,
      `• 🎬 **ប្រធានបទ/ឈុតឆាក៖** ${customTopic.trim() || selectedPreset.topicScenario}`,
      `• 🤖 **តួអង្គរបស់ AI (Your Role):** ${customAiRole.trim() || selectedPreset.aiRole}`,
      `• 👤 **តួអង្គរបស់ខ្ញុំ (My Role):** ${customUserRole.trim() || selectedPreset.userRole}`,
      `• 📋 **ការណែនាំពិសេសដែលអ្នកត្រូវធ្វើតាម (Special Instructions):** ${
        customInstructions.trim() || selectedPreset.customInstructions
      }`,
      ``,
      `សូមចូលតួសម្ដែង ១០០% តាមការណែនាំខាងលើឥឡូវនេះ ដោយមិនបាច់បកស្រាយក្រៅឆាកឡើយ! *ចាប់ផ្ដើមឈុតឆាកសន្ទនាដំបូង*`,
    ].join("\n");

    onStartRoleplay(formattedPrompt);
    onClose();
  };

  const filteredPresets =
    activeCategory === "all"
      ? POPULAR_ROLEPLAY_PRESETS
      : POPULAR_ROLEPLAY_PRESETS.filter((p) => p.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#17212b] border border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-950/40 via-sky-950/30 to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-inner">
              <Clapperboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  🎭 ស្ទូឌីយោសម្ដែងក្នុងការសន្ទនា (Roleplay Studio)
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 font-medium">
                  Acting 100%
                </span>
              </div>
              <p className="text-xs text-white/60">
                កំណត់ឱ្យ AI ដើរតួ និងសម្ដែងតាមប្រធានបទ ខ្លឹមសារ ឬការណែនាំដែលអ្នកចង់បាន
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCurrentlyRoleplaying && onStopRoleplay && (
              <button
                onClick={() => {
                  onStopRoleplay();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 text-xs font-medium transition cursor-pointer"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>ឈប់សម្ដែង</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: "✨ ទាំងអស់" },
              { id: "drama", label: "🎬 រឿងភាគ/មនោសញ្ចេតនា" },
              { id: "professional", label: "💼 អាជីព/ការងារ" },
              { id: "everyday", label: "☕ ជីវិតប្រចាំថ្ងៃ" },
              { id: "mystery", label: "🕵️‍♀️ អាថ៌កំបាំង/ស៊ើបអង្កេត" },
              { id: "custom", label: "🎭 កំណត់ផ្ទាល់ខ្លួន" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Preset Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredPresets.map((preset) => {
              const isSelected = selectedPreset.id === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500/50"
                      : "bg-[#1f2b38]/60 hover:bg-[#1f2b38] border-white/10 hover:border-white/20"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-2xl">{preset.icon}</span>
                      {isSelected && (
                        <span className="p-1 rounded-full bg-purple-500 text-white">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-white leading-snug line-clamp-1">
                      {preset.titleKhmer}
                    </h3>
                    <p className="text-[11px] text-white/60 line-clamp-2 mt-1">
                      {preset.topicScenario}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
                    <span className="text-purple-300 font-medium">
                      {preset.category}
                    </span>
                    <span className="text-white/40">ជ្រើសរើស →</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scenario & Instructions Configuration Area */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#1e2a38] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-purple-400" />
                <span>ការកំណត់ឈុតឆាក និងការណែនាំលម្អិត (Custom Scenario & Rules)</span>
              </h3>
              <span className="text-xs text-white/50">
                អ្នកអាចកែសម្រួលតាមចិត្តចង់បាន
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* AI Role */}
              <div>
                <label className="block text-xs font-semibold text-purple-300 mb-1.5 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" />
                  <span>តួអង្គរបស់ AI (AI Character & Persona)</span>
                </label>
                <textarea
                  value={customAiRole}
                  onChange={(e) => setCustomAiRole(e.target.value)}
                  rows={2}
                  className="w-full bg-[#141d26] border border-white/15 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none transition"
                  placeholder="ឧទាហរណ៍៖ គ្រូពេទ្យឯកទេស, មិត្តភក្តិចាស់, អ្នកសម្ភាសន៍ការងារ, តួឯកប្រុស..."
                />
              </div>

              {/* User Role */}
              <div>
                <label className="block text-xs font-semibold text-sky-300 mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>តួអង្គរបស់អ្នកប្រើប្រាស់ (Your Character)</span>
                </label>
                <textarea
                  value={customUserRole}
                  onChange={(e) => setCustomUserRole(e.target.value)}
                  rows={2}
                  className="w-full bg-[#141d26] border border-white/15 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none transition"
                  placeholder="ឧទាហរណ៍៖ អ្នកជំងឺ, បេក្ខជនសម្ភាសន៍, មិត្តភក្តិ, អតិថិជន..."
                />
              </div>
            </div>

            {/* Topic & Scenario */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>ប្រធានបទ / ឈុតឆាកសន្ទនា (Topic Scenario & Setting)</span>
              </label>
              <textarea
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                rows={2}
                className="w-full bg-[#141d26] border border-white/15 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none transition"
                placeholder="ឧទាហរណ៍៖ ការជួបគ្នានៅមន្ទីរពេទ្យ, ការសម្ភាសន៍ការងារក្នុងក្រុមហ៊ុន, ការតថ្លៃទំនិញនៅផ្សារ..."
              />
            </div>

            {/* Custom Instructions */}
            <div>
              <label className="block text-xs font-semibold text-emerald-300 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ការណែនាំពិសេសដែល AI ត្រូវធ្វើតាម (Special Instructions & Rules)</span>
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={2}
                className="w-full bg-[#141d26] border border-white/15 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none transition"
                placeholder="ឧទាហរណ៍៖ ហៅខ្ញុំថា 'លោកម្ចាស់', និយាយបែបកំប្លែង, បញ្ចូលកាយវិការក្នុង *...*, ហាមចេញពីតួ..."
              />
            </div>

            {/* Sample Opening preview */}
            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs">
              <span className="font-semibold text-purple-300 block mb-1">
                💬 គំរូសារចាប់ផ្ដើមឈុតឆាក (Opening Dialogue Preview):
              </span>
              <p className="text-white/80 italic font-serif">
                "{selectedPreset.sampleOpeningKhmer}"
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#141d26] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            បោះបង់
          </button>

          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition transform active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>🎭 ចាប់ផ្ដើមសម្ដែង (Start Roleplay)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
