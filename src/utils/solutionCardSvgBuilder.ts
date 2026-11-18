import { normalizeKhmerOrthography } from "./khmerOrthography.ts";

export function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Strip raw Unicode emojis from SVG <text> nodes so @resvg/resvg-js on Linux never renders missing-glyph □ boxes
export function stripEmojisForSvg(str: string): string {
  return normalizeKhmerOrthography(str)
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu,
      ""
    )
    .replace(/\s{2,}/g, " ")
    .trim();
}

const SUPERSCRIPT_MAP: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "+": "⁺",
  "-": "⁻",
  "=": "⁼",
  "(": "⁽",
  ")": "⁾",
  n: "ⁿ",
  i: "ⁱ",
  x: "ˣ",
  y: "ʸ",
};

const SUBSCRIPT_MAP: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
  "+": "₊",
  "-": "₋",
  "=": "₌",
  "(": "₍",
  ")": "₎",
  a: "ₐ",
  e: "ₑ",
  i: "ᵢ",
  k: "ₖ",
  m: "ₘ",
  n: "ₙ",
  o: "ₒ",
  p: "ₚ",
  r: "ᵣ",
  s: "ₛ",
  t: "ₜ",
  u: "ᵤ",
  v: "ᵥ",
  x: "ₓ",
};

function toSuperscript(str: string): string {
  const cleaned = str.trim();
  if (cleaned === "\\circ" || cleaned === "o" || cleaned === "°") return "°";
  let result = "";
  for (const ch of cleaned) {
    if (SUPERSCRIPT_MAP[ch]) {
      result += SUPERSCRIPT_MAP[ch];
    } else {
      return `^(${cleaned})`;
    }
  }
  return result;
}

function toSubscript(str: string): string {
  const cleaned = str.trim();
  let result = "";
  for (const ch of cleaned) {
    if (SUBSCRIPT_MAP[ch]) {
      result += SUBSCRIPT_MAP[ch];
    } else {
      return `_${cleaned.length > 1 ? `(${cleaned})` : cleaned}`;
    }
  }
  return result;
}

// Unwrap any SVG diagram that the model accidentally placed inside ```svg ... ``` or ```xml ... ``` fences
export function unwrapCodeFencedSvg(rawText: string): string {
  return rawText.replace(
    /```(?:svg|xml|html)?\s*(<svg[\s\S]*?<\/svg>)\s*```/gi,
    "\n$1\n"
  );
}

// Clean LaTeX inline symbols into crisp Unicode math for text lines & SVG labels
export function cleanLatexInline(expr: string): string {
  return expr
    .replace(/\\text\{([^{}]*)\}/g, "$1")
    .replace(/\\mathrm\{([^{}]*)\}/g, "$1")
    .replace(/\\mathbf\{([^{}]*)\}/g, "$1")
    .replace(/\\mathit\{([^{}]*)\}/g, "$1")
    .replace(/\\mathcal\{D\}/g, "D")
    .replace(/\\mathcal\{([^{}]*)\}/g, "$1")
    .replace(/\\mathbb\{R\}/g, "R")
    .replace(/\\mathbb\{N\}/g, "N")
    .replace(/\\mathbb\{Z\}/g, "Z")
    .replace(/\\mathbb\{Q\}/g, "Q")
    .replace(/\\mathbb\{C\}/g, "C")
    .replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, "$1√($2)")
    .replace(/\\sqrt\{([^{}]+)\}/g, "√($1)")
    .replace(/\\vec\{([^{}]+)\}/g, "$1→")
    .replace(/\\overrightarrow\{([^{}]+)\}/g, "$1→")
    .replace(/\\overline\{([^{}]+)\}/g, "$1")
    .replace(/\\bar\{([^{}]+)\}/g, "$1")
    .replace(/\\hat\{([^{}]+)\}/g, "$1")
    .replace(/\\xrightarrow\{([^{}]+)\}/g, " --[$1]--> ")
    .replace(/\\stackrel\{([^{}]+)\}\{([^{}]+)\}/g, "$2($1)")
    .replace(/\\begin\{(?:cases|aligned|array|matrix|pmatrix|bmatrix)\}/g, "")
    .replace(/\\end\{(?:cases|aligned|array|matrix|pmatrix|bmatrix)\}/g, "")
    .replace(/\^\\circ/g, "°")
    .replace(/\\boxed\{([^{}]*)\}/g, "$1")
    .replace(/\\(?:d|t|c)?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)")
    .replace(/\^\{\\circ\}|\^\\circ/g, "°")
    .replace(/\\circ/g, "°")
    .replace(/\\degree/g, "°")
    .replace(/\\AA/g, "Å")
    .replace(/\\times/g, " × ")
    .replace(/\\cdot/g, " · ")
    .replace(/\\div/g, " ÷ ")
    .replace(/\\pm/g, " ± ")
    .replace(/\\mp/g, " ∓ ")
    .replace(/\\leq/g, " ≤ ")
    .replace(/\\le\b/g, " ≤ ")
    .replace(/\\geq/g, " ≥ ")
    .replace(/\\ge\b/g, " ≥ ")
    .replace(/\\neq/g, " ≠ ")
    .replace(/\\ne\b/g, " ≠ ")
    .replace(/\\approx/g, " ≈ ")
    .replace(/\\equiv/g, " ≡ ")
    .replace(/\\sim/g, " ~ ")
    .replace(/\\propto/g, " ∝ ")
    .replace(/\\infty/g, "∞")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\nabla/g, "∇")
    .replace(/\\partial/g, "∂")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\delta/g, "δ")
    .replace(/\\epsilon/g, "ε")
    .replace(/\\varepsilon/g, "ε")
    .replace(/\\theta/g, "θ")
    .replace(/\\lambda/g, "λ")
    .replace(/\\mu/g, "μ")
    .replace(/\\nu/g, "ν")
    .replace(/\\rho/g, "ρ")
    .replace(/\\sigma/g, "σ")
    .replace(/\\tau/g, "τ")
    .replace(/\\phi/g, "φ")
    .replace(/\\varphi/g, "φ")
    .replace(/\\omega/g, "ω")
    .replace(/\\Omega/g, "Ω")
    .replace(/\\pi/g, "π")
    .replace(/\\rightarrow/g, " → ")
    .replace(/\\to\b/g, " → ")
    .replace(/\\leftarrow/g, " ← ")
    .replace(/\\Rightarrow/g, " => ")
    .replace(/\\implies/g, " => ")
    .replace(/\\Leftrightarrow/g, " <=> ")
    .replace(/\\iff/g, " <=> ")
    .replace(/\\rightleftharpoons/g, " <=> ")
    .replace(/\\uparrow/g, "↑")
    .replace(/\\downarrow/g, "↓")
    .replace(/\\int/g, "∫")
    .replace(/\\sum/g, "∑")
    .replace(/\\prod/g, "∏")
    .replace(/\\in\b/g, " ∈ ")
    .replace(/\\notin\b/g, " ∉ ")
    .replace(/\\subset/g, " ⊂ ")
    .replace(/\\cup/g, " ∪ ")
    .replace(/\\cap/g, " ∩ ")
    .replace(/\\setminus/g, " \\ ")
    .replace(/\\emptyset/g, "∅")
    .replace(/\\forall/g, "∀")
    .replace(/\\exists/g, "∃")
    .replace(/\\perp/g, "⊥")
    .replace(/\\parallel/g, "∥")
    .replace(/\\angle/g, "∠")
    .replace(/\\triangle/g, "Δ")
    .replace(/\\therefore/g, "∴")
    .replace(/\\because/g, "∵")
    .replace(/\\sin\b/g, "sin")
    .replace(/\\cos\b/g, "cos")
    .replace(/\\tan\b/g, "tan")
    .replace(/\\cot\b/g, "cot")
    .replace(/\\sec\b/g, "sec")
    .replace(/\\csc\b/g, "csc")
    .replace(/\\arcsin\b/g, "arcsin")
    .replace(/\\arccos\b/g, "arccos")
    .replace(/\\arctan\b/g, "arctan")
    .replace(/\\ln\b/g, "ln")
    .replace(/\\log\b/g, "log")
    .replace(/\\lim\b/g, "lim")
    .replace(/\\max\b/g, "max")
    .replace(/\\min\b/g, "min")
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/\^\{([^{}]+)\}/g, (_m, p1) => toSuperscript(p1))
    .replace(/\^([0-9+\-nxy])/g, (_m, p1) => toSuperscript(p1))
    .replace(/_\{([^{}]+)\}/g, (_m, p1) => toSubscript(p1))
    .replace(/_([0-9+\-nxyikm0])/g, (_m, p1) => toSubscript(p1))
    .replace(/\\quad/g, "  ")
    .replace(/\\qquad/g, "   ")
    .replace(/\\[,;:!]/g, " ")
    .replace(/&/g, " ")
    .replace(/[ \t]{2,}/g, " ");
}

// Extract a concise 1-2 line caption summary for the Telegram Solution Card photo
export function extractSolutionCaptionSummary(rawText: string): string {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (/(?:ចម្លើយ[៖:]|🎯|ដូចនេះ|ចម្លើយចុងក្រោយ)/.test(line)) {
      let concText = line;
      // If the line is only a short heading like "• 🎯 ដូចនេះ៖", include the next line too
      if (concText.replace(/[•\-\*#🎯✅:\s៖]/g, "").length <= 10 && i + 1 < lines.length) {
        concText = `${concText} ${lines[i + 1]}`;
      }
      const cleanConc = cleanLatexInline(
        concText
          .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
          .replace(/\$\$/g, "")
          .replace(/\$/g, "")
          .replace(/\*\*/g, "")
      )
        .replace(/\s+/g, " ")
        .trim();
      return `✨ ដំណោះស្រាយលំហាត់តាមបែប Google Gemini AI\n✅ ${cleanConc}`.slice(0, 900);
    }
  }
  return "✨ តារាងដំណោះស្រាយលំហាត់ និងរូបភាពគំនូសបំព្រួញតាមបែប Google Gemini AI";
}

// Convert LaTeX math and SVG tags into clean, readable Unicode text for plain Telegram fallback
export function formatTextForTelegram(rawText: string): string {
  const unwrapped = unwrapCodeFencedSvg(rawText);
  return cleanLatexInline(
    unwrapped
      .replace(
        /<svg[\s\S]*?<\/svg>/gi,
        "\n📊 [គំនូសបំព្រួញពន្យល់លំហាត់ត្រូវបានបង្ហាញក្នុងរូបភាពខាងលើ]\n"
      )
      .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
      .replace(/\$\$([\s\S]*?)\$\$/g, "\n$1\n")
      .replace(/\$([^\$]+)\$/g, "$1")
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Format text for Telegram HTML mode with <blockquote> callouts & <pre> dark formula boxes
export function formatHtmlForTelegram(rawText: string): string {
  const unwrapped = unwrapCodeFencedSvg(rawText);
  const withoutSvg = unwrapped
    .replace(
      /<svg[\s\S]*?<\/svg>/gi,
      "\n📊 គំនូសបំព្រួញពន្យល់លំហាត់ (Explanatory Diagram) ត្រូវបានភ្ជាប់ជារូបភាពខាងលើ\n"
    )
    .trim();

  const parts = withoutSvg.split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|```[\s\S]*?```)/g);
  const htmlChunks: string[] = [];

  for (const part of parts) {
    if (!part) continue;

    // Display Math Block -> Dark <pre><code> card box in Telegram!
    if (
      (part.startsWith("$$") && part.endsWith("$$")) ||
      (part.startsWith("\\[") && part.endsWith("\\]"))
    ) {
      const expr = part
        .slice(2, -2)
        .trim()
        .replace(/\\\\/g, "\n")
        .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1) / ($2)")
        .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1) / ($2)");
      const cleanLines = expr
        .split("\n")
        .map((l) => cleanLatexInline(l).replace(/\s+/g, " ").trim())
        .filter(Boolean);
      htmlChunks.push(
        `\n<pre><code>${cleanLines.map((l) => `  ${escapeHtml(l)}  `).join("\n")}</code></pre>\n`
      );
      continue;
    }

    // Code block -> <pre><code>
    if (part.startsWith("```") && part.endsWith("```")) {
      const codeContent = part.slice(3, -3).replace(/^[a-zA-Z0-9_+#.-]+\n/, "").trim();
      if (codeContent) {
        htmlChunks.push(`\n<pre><code>${escapeHtml(codeContent)}</code></pre>\n`);
      }
      continue;
    }

    const lines = part.split("\n");
    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) {
        htmlChunks.push("");
        continue;
      }
      if (trimmed === "---") {
        htmlChunks.push("────────────────────");
        continue;
      }

      const inlineCleaned = cleanLatexInline(
        trimmed
          .replace(/\$([^\$]+)\$/g, (_m, inner) =>
            inner.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
          )
          .replace(/\\\(([^\n]+?)\\\)/g, (_m, inner) =>
            inner.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
          )
          .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
      );

      if (trimmed.startsWith("📊")) {
        const cleanTitle = inlineCleaned.replace(/\*\*/g, "");
        htmlChunks.push(`\n<blockquote><b>${escapeHtml(cleanTitle)}</b></blockquote>`);
        continue;
      }

      if (
        trimmed.startsWith("### ") ||
        trimmed.startsWith("## ") ||
        trimmed.startsWith("# ")
      ) {
        const title = inlineCleaned.replace(/^#+\s*/, "").replace(/\*\*/g, "");
        htmlChunks.push(`\n<blockquote><b>📘 ${escapeHtml(title)}</b></blockquote>`);
        continue;
      }

      if (
        trimmed.includes("😠") ||
        trimmed.includes("😡") ||
        trimmed.includes("ការស្ដីបន្ទោស") ||
        trimmed.includes("ការស្តីបន្ទោស") ||
        trimmed.includes("ស្ដីបន្ទោសដាស់តឿន") ||
        trimmed.includes("ស្តីបន្ទោសដាស់តឿន") ||
        trimmed.includes("អប់រំសីលធម៌")
      ) {
        const cleanTitle = inlineCleaned.replace(/\*\*/g, "").replace(/^[•\-\*]\s*/, "");
        htmlChunks.push(`\n<blockquote><b>⚠️ ${escapeHtml(cleanTitle)}</b></blockquote>`);
        continue;
      }

      if (
        trimmed.includes("💪") ||
        trimmed.includes("ការលើកទឹកចិត្ត") ||
        trimmed.includes("ពន្យល់ចំណុចខ្វះខាត") ||
        trimmed.includes("ពន្យល់ចំនុចខ្វះខាត") ||
        trimmed.includes("ចំណុចខ្វះខាត៖") ||
        trimmed.includes("ចំនុចខ្វះខាត៖")
      ) {
        const cleanTitle = inlineCleaned.replace(/\*\*/g, "").replace(/^[•\-\*]\s*/, "");
        htmlChunks.push(`\n<blockquote><b>✨ ${escapeHtml(cleanTitle)}</b></blockquote>`);
        continue;
      }

      if (
        trimmed.includes("📝") ||
        trimmed.includes("បម្រាប់ប្រធាន") ||
        trimmed.includes("បម្រាប់ (Givens)") ||
        trimmed.startsWith("• បម្រាប់")
      ) {
        const cleanTitle = inlineCleaned.replace(/\*\*/g, "");
        htmlChunks.push(`\n<blockquote><b>📖 ${escapeHtml(cleanTitle)}</b></blockquote>`);
        continue;
      }

      if (
        trimmed.includes("📐") ||
        trimmed.includes("រូបមន្តគ្រឹះ") ||
        trimmed.includes("រូបមន្ត (Formula)") ||
        trimmed.includes("តាមរូបមន្ត")
      ) {
        const cleanTitle = inlineCleaned.replace(/\*\*/g, "");
        htmlChunks.push(`\n<blockquote><b>${escapeHtml(cleanTitle)}</b></blockquote>`);
        continue;
      }

      if (
        trimmed.includes("🔢") ||
        trimmed.includes("ដំណោះស្រាយ (Calculation)") ||
        trimmed.includes("ដំណោះស្រាយជាជំហានៗ") ||
        trimmed.includes("ការគណនា")
      ) {
        const cleanTitle = inlineCleaned.replace(/\*\*/g, "");
        htmlChunks.push(`\n<blockquote><b>${escapeHtml(cleanTitle)}</b></blockquote>`);
        continue;
      }

      if (
        trimmed.includes("🎯") ||
        trimmed.includes("ចម្លើយចុងក្រោយ") ||
        trimmed.startsWith("ដូចនេះ")
      ) {
        const cleanTitle = inlineCleaned.replace(/\*\*/g, "");
        htmlChunks.push(`\n<blockquote><b>✅ ${escapeHtml(cleanTitle)}</b></blockquote>`);
        continue;
      }

      let escapedLine = escapeHtml(inlineCleaned);
      escapedLine = escapedLine
        .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
        .replace(/`([^`]+)`/g, "<code>$1</code>");

      htmlChunks.push(escapedLine);
    }
  }

  return htmlChunks.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// Automatically synthesize a crisp, accurate SVG diagram (with zero raw emojis) for any exercise that lacks one
export function synthesizeExerciseDiagramSvg(markdownText: string): string {
  const blockMathMatch = markdownText.match(/\$\$([\s\S]*?)\$\$/);
  const inlineMathMatch = markdownText.match(/\$([^$\n]{3,45})\$/);
  const rawFormula = blockMathMatch
    ? blockMathMatch[1].replace(/\\\\/g, " ").trim()
    : inlineMathMatch
    ? inlineMathMatch[1].trim()
    : "f(x) = y";
  const cleanFormula = stripEmojisForSvg(
    cleanLatexInline(rawFormula.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)"))
  )
    .replace(/\s+/g, " ")
    .slice(0, 42);

  const conclusionMatch = markdownText.match(
    /(?:🎯|ដូចនេះ|ចម្លើយចុងក្រោយ)[^\n:៖]*[:៖]?\s*([^\n]+)/i
  );
  const rawConclusion = conclusionMatch ? conclusionMatch[1] : "";
  const cleanConclusion = stripEmojisForSvg(
    cleanLatexInline(
      rawConclusion
        .replace(/\$\$/g, "")
        .replace(/\$/g, "")
        .replace(/\*\*/g, "")
        .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
    )
  )
    .trim()
    .slice(0, 48);

  if (/(?:ត្រីកោណ|ពីតាគ័រ|កែងត្រង់|អ៊ីប៉ូតេនុស|មុំ|ធរណីមាត្រ|ABC)/i.test(markdownText)) {
    return `<svg viewBox="0 0 500 240" width="100%" height="240" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="triFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0284c7" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.08"/>
        </linearGradient>
      </defs>
      <rect x="90" y="172" width="18" height="18" fill="none" stroke="#fbbf24" stroke-width="2"/>
      <polygon points="90,50 90,190 290,190" fill="url(#triFill)" stroke="#38bdf8" stroke-width="3"/>
      <circle cx="90" cy="50" r="4.5" fill="#4ade80"/>
      <circle cx="90" cy="190" r="4.5" fill="#fbbf24"/>
      <circle cx="290" cy="190" r="4.5" fill="#f43f5e"/>
      <text x="72" y="48" fill="#4ade80" font-size="16" font-weight="bold">B</text>
      <text x="58" y="206" fill="#fbbf24" font-size="15" font-weight="bold">A (90°)</text>
      <text x="302" y="196" fill="#f43f5e" font-size="16" font-weight="bold">C</text>
      <text x="195" y="110" fill="#bae6fd" font-size="14" font-weight="bold">BC (អ៊ីប៉ូតេនុស)</text>
      <rect x="330" y="42" width="155" height="150" rx="12" fill="#112236" stroke="#1e3a5f" stroke-width="1.5"/>
      <text x="407" y="72" text-anchor="middle" fill="#38bdf8" font-size="14" font-weight="bold">រូបមន្តគោល</text>
      <text x="407" y="102" text-anchor="middle" fill="#f8fafc" font-size="13.5" font-weight="bold">${escapeXml(cleanFormula.slice(0, 22))}</text>
      <line x1="346" y1="122" x2="468" y2="122" stroke="#1e3a5f" stroke-width="1"/>
      <text x="407" y="148" text-anchor="middle" fill="#34d399" font-size="14" font-weight="bold">លទ្ធផល</text>
      <text x="407" y="174" text-anchor="middle" fill="#a7f3d0" font-size="12.5">${escapeXml(cleanConclusion.slice(0, 22) || "តាមស្តង់ដា MoEYS")}</text>
    </svg>`;
  }

  if (/(?:កម្លាំង|ម៉ាស|សំទុះ|ល្បឿន|ញូតុន|ថាមពល|កម្មន្ត|អគ្គិសនី|រេស៊ីស្តង់|តង់ស្យុង|ចរន្ត|ប៉ូល|ដែនម៉ាញេទិច)/i.test(markdownText)) {
    return `<svg viewBox="0 0 500 240" width="100%" height="240" xmlns="http://www.w3.org/2000/svg">
      <line x1="30" y1="175" x2="470" y2="175" stroke="#64748b" stroke-width="3"/>
      <line x1="60" y1="175" x2="45" y2="190" stroke="#475569" stroke-width="2"/>
      <line x1="120" y1="175" x2="105" y2="190" stroke="#475569" stroke-width="2"/>
      <line x1="180" y1="175" x2="165" y2="190" stroke="#475569" stroke-width="2"/>
      <line x1="240" y1="175" x2="225" y2="190" stroke="#475569" stroke-width="2"/>
      <line x1="300" y1="175" x2="285" y2="190" stroke="#475569" stroke-width="2"/>
      <rect x="130" y="105" width="96" height="70" rx="10" fill="#0284c7" fill-opacity="0.35" stroke="#38bdf8" stroke-width="2.5"/>
      <circle cx="178" cy="140" r="4" fill="#f8fafc"/>
      <text x="178" y="132" text-anchor="middle" fill="#f8fafc" font-size="16" font-weight="bold">m</text>
      <line x1="226" y1="140" x2="345" y2="140" stroke="#4ade80" stroke-width="3.5"/>
      <polygon points="345,133 362,140 345,147" fill="#4ade80"/>
      <text x="295" y="125" text-anchor="middle" fill="#4ade80" font-size="15" font-weight="bold">F (កម្លាំង)</text>
      <line x1="178" y1="105" x2="178" y2="48" stroke="#fbbf24" stroke-width="2.5"/>
      <polygon points="172,50 178,36 184,50" fill="#fbbf24"/>
      <text x="202" y="55" fill="#fbbf24" font-size="14" font-weight="bold">N</text>
      <line x1="178" y1="175" x2="178" y2="220" stroke="#f43f5e" stroke-width="2.5"/>
      <polygon points="172,216 178,230 184,216" fill="#f43f5e"/>
      <text x="218" y="218" fill="#f43f5e" font-size="14" font-weight="bold">P = m·g</text>
      <rect x="310" y="32" width="170" height="62" rx="10" fill="#112236" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="395" y="55" text-anchor="middle" fill="#7dd3fc" font-size="13" font-weight="bold">រូបមន្តរូបវិទ្យា</text>
      <text x="395" y="79" text-anchor="middle" fill="#f8fafc" font-size="14" font-weight="bold">${escapeXml(cleanFormula.slice(0, 24))}</text>
    </svg>`;
  }

  if (/(?:សមីការ|អនុគមន៍|អាំងតេក្រាល|ដេរីវេ|លីមីត|ប៉ារ៉ាបូល|ក្រាហ្វ|ឫស|ឌីសគ្រីមីណង់|\bx\b)/i.test(markdownText)) {
    return `<svg viewBox="0 0 500 240" width="100%" height="240" xmlns="http://www.w3.org/2000/svg">
      <line x1="50" y1="60" x2="310" y2="60" stroke="#1e293b" stroke-width="1"/>
      <line x1="50" y1="100" x2="310" y2="100" stroke="#1e293b" stroke-width="1"/>
      <line x1="50" y1="180" x2="310" y2="180" stroke="#1e293b" stroke-width="1"/>
      <line x1="110" y1="30" x2="110" y2="215" stroke="#1e293b" stroke-width="1"/>
      <line x1="250" y1="30" x2="250" y2="215" stroke="#1e293b" stroke-width="1"/>
      <line x1="45" y1="145" x2="315" y2="145" stroke="#94a3b8" stroke-width="2"/>
      <polygon points="315,140 326,145 315,150" fill="#94a3b8"/>
      <text x="320" y="165" fill="#cbd5e1" font-size="15" font-weight="bold">x</text>
      <line x1="180" y1="215" x2="180" y2="28" stroke="#94a3b8" stroke-width="2"/>
      <polygon points="175,30 180,18 185,30" fill="#94a3b8"/>
      <text x="192" y="32" fill="#cbd5e1" font-size="15" font-weight="bold">y</text>
      <text x="163" y="164" fill="#94a3b8" font-size="14">O</text>
      <path d="M 85 55 Q 180 225 275 55" fill="none" stroke="#38bdf8" stroke-width="3.2"/>
      <circle cx="132" cy="145" r="4.5" fill="#4ade80"/>
      <circle cx="228" cy="145" r="4.5" fill="#4ade80"/>
      <circle cx="180" cy="140" r="4" fill="#fbbf24"/>
      <text x="122" y="165" fill="#4ade80" font-size="13" font-weight="bold">x₁</text>
      <text x="225" y="165" fill="#4ade80" font-size="13" font-weight="bold">x₂</text>
      <rect x="335" y="38" width="150" height="160" rx="12" fill="#112236" stroke="#1e3a5f" stroke-width="1.5"/>
      <text x="410" y="68" text-anchor="middle" fill="#38bdf8" font-size="13.5" font-weight="bold">សមីការ / អនុគមន៍</text>
      <text x="410" y="96" text-anchor="middle" fill="#f8fafc" font-size="13" font-weight="bold">${escapeXml(cleanFormula.slice(0, 22))}</text>
      <line x1="348" y1="116" x2="472" y2="116" stroke="#1e3a5f" stroke-width="1"/>
      <text x="410" y="142" text-anchor="middle" fill="#4ade80" font-size="13.5" font-weight="bold">ចម្លើយ</text>
      <text x="410" y="168" text-anchor="middle" fill="#a7f3d0" font-size="12.5">${escapeXml(cleanConclusion.slice(0, 22) || "ដោះស្រាយតាមជំហាន")}</text>
    </svg>`;
  }

  return `<svg viewBox="0 0 500 220" width="100%" height="220" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="55" width="135" height="110" rx="12" fill="#0c263b" stroke="#38bdf8" stroke-width="2"/>
    <text x="87" y="92" text-anchor="middle" fill="#7dd3fc" font-size="14" font-weight="bold">១. បម្រាប់</text>
    <text x="87" y="122" text-anchor="middle" fill="#e2e8f0" font-size="12.5">វិភាគទិន្នន័យប្រធាន</text>
    <text x="87" y="144" text-anchor="middle" fill="#94a3b8" font-size="11.5">MoEYS Standard</text>

    <line x1="155" y1="110" x2="178" y2="110" stroke="#38bdf8" stroke-width="2.5"/>
    <polygon points="175,104 185,110 175,116" fill="#38bdf8"/>

    <rect x="185" y="55" width="140" height="110" rx="12" fill="#171b3a" stroke="#818cf8" stroke-width="2"/>
    <text x="255" y="92" text-anchor="middle" fill="#a5b4fc" font-size="14" font-weight="bold">២. រូបមន្តគោល</text>
    <text x="255" y="124" text-anchor="middle" fill="#f8fafc" font-size="13" font-weight="bold">${escapeXml(cleanFormula.slice(0, 20))}</text>

    <line x1="325" y1="110" x2="348" y2="110" stroke="#4ade80" stroke-width="2.5"/>
    <polygon points="345,104 355,110 345,116" fill="#4ade80"/>

    <rect x="355" y="55" width="125" height="110" rx="12" fill="#062e26" stroke="#10b981" stroke-width="2"/>
    <text x="417" y="92" text-anchor="middle" fill="#6ee7b7" font-size="14" font-weight="bold">៣. ដូចនេះ</text>
    <text x="417" y="124" text-anchor="middle" fill="#f8fafc" font-size="12.5" font-weight="bold">${escapeXml(cleanConclusion.slice(0, 18) || "ចម្លើយត្រឹមត្រូវ")}</text>
  </svg>`;
}

// Ensure that if the response is an exercise solution, it has a clean inline <svg> diagram
export function ensureExerciseHasSvgDiagram(rawText: string): string {
  const unwrapped = unwrapCodeFencedSvg(rawText);

  // Never synthesize diagrams for casual chat, social conversation, or simple advice
  if (
    /(?:សួស្តី|សួស្ដី|ជម្រាបសួរ|ហេឡូ|នឹក|ស្រឡាញ់|ស្រលាញ់|ញ៉ាំបាយ|ធ្វើអី|សុខសប្បាយ|បាទអូន|ចាសបង|បងសម្លាញ់|អូនសម្លាញ់)/.test(
      unwrapped
    ) &&
    !/(?:###\s*ដំណោះស្រាយសមីការ|###\s*🇰🇭\s*ដំណោះស្រាយលំហាត់)/.test(unwrapped)
  ) {
    return unwrapped;
  }

  const isExercise =
    /(?:###\s*ដំណោះស្រាយសមីការ|###\s*🇰🇭\s*ដំណោះស្រាយលំហាត់|•\s*📝\s*\*\*បម្រាប់ប្រធាន|•\s*📐\s*\*\*រូបមន្តគ្រឹះ|•\s*🔢\s*\*\*ដំណោះស្រាយ|ដំណោះស្រាយតាមស្តង់ដាក្រសួងអប់រំ|Google\s*Gemini\s*(?:AI\s*)?(?:Math|Physics|Chemistry|Biology|Exercise|Solution)|ឫសសមីការ)/.test(
      unwrapped
    ) ||
    (/\$\$[\s\S]*?\$\$/i.test(unwrapped) && /(?:សមីការ|លំហាត់|រូបមន្ត|ដំណោះស្រាយ)/.test(unwrapped));

  if (!isExercise) {
    return unwrapped;
  }

  if (/<svg[\s\S]*?<\/svg>/i.test(unwrapped)) {
    return unwrapped;
  }

  const autoSvg = synthesizeExerciseDiagramSvg(unwrapped);
  const engIdx = unwrapped.search(/(?:🇬🇧\s*)?English\s*Summary\s*:/i);
  if (engIdx > 0) {
    return (
      unwrapped.slice(0, engIdx).trim() +
      "\n\n" +
      autoSvg +
      "\n\n" +
      unwrapped.slice(engIdx).trim()
    );
  }
  return unwrapped.trim() + "\n\n" + autoSvg;
}

// Enhance any raw <svg> diagram so black/dark lines & text become bright and 100% visible on dark backgrounds, and strip raw emojis
export function enhanceSvgDiagramVisibility(rawSvg: string): string {
  let svg = rawSvg.trim();
  if (!svg.includes("xmlns=")) {
    svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  svg = svg
    .replace(
      /stroke=["'](?:#000000|#000|black|#111111|#111|#222222|#222|#333333|#333)["']/gi,
      'stroke="#94a3b8"'
    )
    .replace(/stroke=["']blue["']/gi, 'stroke="#38bdf8"')
    .replace(/stroke=["']red["']/gi, 'stroke="#f43f5e"')
    .replace(/stroke=["']green["']/gi, 'stroke="#4ade80"');

  svg = svg.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/gi, (_full, attrs: string, inner: string) => {
    let updatedAttrs = attrs;
    if (/fill=["'](?:#000000|#000|black|#111|#222|#333)["']/i.test(updatedAttrs)) {
      updatedAttrs = updatedAttrs.replace(
        /fill=["'](?:#000000|#000|black|#111|#222|#333)["']/i,
        'fill="#f8fafc"'
      );
    } else if (!/fill=/i.test(updatedAttrs)) {
      updatedAttrs += ' fill="#f8fafc"';
    }
    if (!/font-family=/i.test(updatedAttrs)) {
      updatedAttrs += ' font-family="Noto Sans Khmer, Roboto Mono, Liberation Sans, sans-serif"';
    }
    if (!/font-weight=/i.test(updatedAttrs)) {
      updatedAttrs += ' font-weight="600"';
    }
    return `<text${updatedAttrs}>${stripEmojisForSvg(inner)}</text>`;
  });

  svg = svg.replace(/<line\b([^>]*)>/gi, (_full, attrs: string) => {
    if (!/stroke=/i.test(attrs)) {
      return `<line${attrs} stroke="#94a3b8" stroke-width="2">`;
    }
    return `<line${attrs}>`;
  });

  return svg;
}

export function buildFramedDiagramSvgString(rawSvg: string): string {
  const cleanInnerSvg = enhanceSvgDiagramVisibility(rawSvg);
  const viewBoxMatch = cleanInnerSvg.match(/viewBox=["']([^"']+)["']/i);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 480 240";
  const innerBody = cleanInnerSvg
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>[\s\S]*$/i, "");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="460" viewBox="0 0 920 460">
    <rect width="920" height="460" rx="18" fill="#0d1624" stroke="#1e3a5f" stroke-width="2"/>
    <rect x="2" y="2" width="916" height="52" rx="16" fill="#132338"/>
    <line x1="0" y1="54" x2="920" y2="54" stroke="#1e3a5f" stroke-width="1.5"/>
    <g transform="translate(26, 17)" stroke="#38bdf8" stroke-width="2" fill="none">
      <rect x="2" y="2" width="18" height="18" rx="3"/>
      <circle cx="7.5" cy="7.5" r="1.5" fill="#38bdf8"/>
      <path d="M20 14l-4.5-4.5L5 20"/>
    </g>
    <text x="56" y="34" fill="#38bdf8" font-family="Noto Sans Khmer, Roboto Mono, Liberation Sans, sans-serif" font-size="18.5" font-weight="bold">រូបភាពគំនូសបំព្រួញពន្យល់លំហាត់ (Explanatory Diagram)</text>
    <svg x="40" y="68" width="840" height="330" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">
      ${innerBody}
    </svg>
    <rect x="2" y="410" width="916" height="48" rx="14" fill="#132338" opacity="0.75"/>
    <line x1="0" y1="410" x2="920" y2="410" stroke="#1e3a5f" stroke-width="1"/>
    <text x="460" y="440" text-anchor="middle" fill="#7dd3fc" font-family="Noto Sans Khmer, Liberation Sans, sans-serif" font-size="14.5">រូបភាពគូសបញ្ជាក់ និងកំណត់សម្គាល់សម្រាប់ស្វែងយល់ដំណោះស្រាយលំហាត់</text>
  </svg>`;
}

interface MathSegment {
  type: "text" | "frac";
  text?: string;
  num?: string;
  den?: string;
}

function parseMathSegments(rawExpr: string): MathSegment[] {
  const expr = rawExpr.trim();
  const segments: MathSegment[] = [];
  const fracRegex = /\\frac\{([^{}]+(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]+(?:\{[^{}]*\}[^{}]*)*)\}/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = fracRegex.exec(expr)) !== null) {
    if (match.index > lastIndex) {
      const plain = stripEmojisForSvg(cleanLatexInline(expr.slice(lastIndex, match.index)));
      if (plain) segments.push({ type: "text", text: plain });
    }
    segments.push({
      type: "frac",
      num: stripEmojisForSvg(cleanLatexInline(match[1].trim())),
      den: stripEmojisForSvg(cleanLatexInline(match[2].trim())),
    });
    lastIndex = fracRegex.lastIndex;
  }

  if (lastIndex < expr.length) {
    const tail = stripEmojisForSvg(cleanLatexInline(expr.slice(lastIndex)));
    if (tail) segments.push({ type: "text", text: tail });
  }

  return segments.length > 0
    ? segments
    : [{ type: "text", text: stripEmojisForSvg(cleanLatexInline(expr)) }];
}

function estimateTextWidth(str: string, fontSize: number): number {
  let width = 0;
  for (const ch of str) {
    const code = ch.charCodeAt(0);
    if ((code >= 0x17b6 && code <= 0x17d3) || code === 0x17d2) {
      width += fontSize * 0.08;
    } else if (code >= 0x1780 && code <= 0x17ff) {
      width += fontSize * 0.62;
    } else {
      width += fontSize * 0.56;
    }
  }
  return Math.max(fontSize * 0.6, width);
}

function splitLongKhmerToken(token: string, maxChars: number): string[] {
  if (token.length <= maxChars) return [token];
  const parts: string[] = [];
  let buf = "";
  for (let i = 0; i < token.length; i++) {
    buf += token[i];
    const nextCode = i + 1 < token.length ? token.charCodeAt(i + 1) : 0;
    const isNextDependent =
      (nextCode >= 0x17b6 && nextCode <= 0x17d3) ||
      nextCode === 0x17d2 ||
      (token.charCodeAt(i) === 0x17d2 && nextCode >= 0x1780 && nextCode <= 0x17a2);
    if (buf.length >= maxChars && !isNextDependent) {
      parts.push(buf);
      buf = "";
    }
  }
  if (buf) parts.push(buf);
  return parts;
}

function wrapTextLine(text: string, maxChars = 62): string[] {
  const trimmed = stripEmojisForSvg(text);
  if (!trimmed) return [];
  if (trimmed.length <= maxChars) return [trimmed];

  const rawWords = trimmed.split(/\s+/);
  const words: string[] = [];
  for (const w of rawWords) {
    if (w.length > maxChars) {
      words.push(...splitLongKhmerToken(w, maxChars));
    } else {
      words.push(w);
    }
  }

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function formatLinePreservingFrac(line: string): string {
  return line
    .replace(/\$([^\$]+)\$/g, "$1")
    .replace(/\\\(([^\n]+?)\\\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

export interface RenderBlock {
  kind:
    | "callout_reprimand"
    | "callout_encourage"
    | "callout_givens"
    | "callout_formula"
    | "callout_calc"
    | "callout_conclusion"
    | "heading"
    | "math_box"
    | "diagram_box"
    | "bullet_frac"
    | "bullet"
    | "text"
    | "spacer";
  text?: string;
  lines?: string[];
  mathRows?: string[];
  svgContent?: string;
  height: number;
}

function cleanCalloutLineText(rawLine: string): string {
  return stripEmojisForSvg(
    cleanLatexInline(
      formatLinePreservingFrac(rawLine)
        .replace(/^[#•\-\*\s]+/, "")
        .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
    )
  );
}

export function buildSolutionBlocks(markdownText: string): RenderBlock[] {
  const withDiagram = ensureExerciseHasSvgDiagram(markdownText);
  const parts = withDiagram.split(
    /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|<svg[\s\S]*?<\/svg>|```[\s\S]*?```)/gi
  );
  const blocks: RenderBlock[] = [];

  const appendOrMergeCallout = (
    kind:
      | "callout_reprimand"
      | "callout_encourage"
      | "callout_givens"
      | "callout_formula"
      | "callout_calc"
      | "callout_conclusion",
    wrappedLines: string[]
  ) => {
    if (wrappedLines.length === 0) return;
    // Look back skipping a single spacer to merge consecutive callout lines of the same kind
    let prevIdx = blocks.length - 1;
    if (prevIdx >= 0 && blocks[prevIdx].kind === "spacer") {
      prevIdx--;
    }
    if (prevIdx >= 0 && blocks[prevIdx].kind === kind && blocks[prevIdx].lines) {
      if (prevIdx === blocks.length - 2) {
        blocks.pop(); // remove intermediate spacer
      }
      const target = blocks[blocks.length - 1];
      target.lines = [...(target.lines || []), ...wrappedLines];
      target.height = (kind === "callout_conclusion" ? 28 : 26) + target.lines.length * 30;
      return;
    }

    blocks.push({
      kind,
      lines: wrappedLines,
      height: (kind === "callout_conclusion" ? 28 : 26) + wrappedLines.length * 30,
    });
  };

  for (const part of parts) {
    if (!part) continue;

    // Embedded SVG Diagram -> Render directly inside the Solution Card!
    if (part.toLowerCase().startsWith("<svg") && part.toLowerCase().endsWith("</svg>")) {
      blocks.push({
        kind: "diagram_box",
        svgContent: part,
        height: 356,
      });
      continue;
    }

    // Display Math Block $$...$$ -> Multi-line aware 2D Math Box!
    if (
      (part.startsWith("$$") && part.endsWith("$$")) ||
      (part.startsWith("\\[") && part.endsWith("\\]"))
    ) {
      const expr = part.slice(2, -2).trim();
      if (expr) {
        const rawRows = expr
          .replace(/\\begin\{(?:cases|aligned|array|matrix)\}/g, "")
          .replace(/\\end\{(?:cases|aligned|array|matrix)\}/g, "")
          .split(/\\\\|\n/)
          .map((r) => r.replace(/&/g, " ").trim())
          .filter(Boolean);
        const rows = rawRows.length > 0 ? rawRows.slice(0, 6) : [expr];
        blocks.push({
          kind: "math_box",
          mathRows: rows,
          height: Math.max(90, rows.length * 64 + 26),
        });
      }
      continue;
    }

    if (part.startsWith("```") && part.endsWith("```")) {
      const codeLines = part.slice(3, -3).trim().split("\n").slice(0, 18);
      for (const cl of codeLines) {
        const cleanCl = stripEmojisForSvg(cl);
        if (cleanCl) {
          blocks.push({
            kind: "text",
            text: "  " + cleanCl,
            height: 34,
          });
        }
      }
      continue;
    }

    const lines = part.split("\n");
    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed || trimmed === "---") {
        blocks.push({ kind: "spacer", height: 10 });
        continue;
      }

      if (
        trimmed.includes("😠") ||
        trimmed.includes("😡") ||
        trimmed.includes("ការស្ដីបន្ទោស") ||
        trimmed.includes("ការស្តីបន្ទោស") ||
        trimmed.includes("ស្ដីបន្ទោសដាស់តឿន") ||
        trimmed.includes("ស្តីបន្ទោសដាស់តឿន") ||
        trimmed.includes("អប់រំសីលធម៌")
      ) {
        const cText = cleanCalloutLineText(trimmed);
        appendOrMergeCallout("callout_reprimand", wrapTextLine(cText, 58));
        continue;
      }

      if (
        trimmed.includes("💪") ||
        trimmed.includes("ការលើកទឹកចិត្ត") ||
        trimmed.includes("ពន្យល់ចំណុចខ្វះខាត") ||
        trimmed.includes("ពន្យល់ចំនុចខ្វះខាត") ||
        trimmed.includes("ចំណុចខ្វះខាត៖") ||
        trimmed.includes("ចំនុចខ្វះខាត៖")
      ) {
        const cText = cleanCalloutLineText(trimmed);
        appendOrMergeCallout("callout_encourage", wrapTextLine(cText, 58));
        continue;
      }

      if (
        /^[•\-\*\s]*(?:\*\*)?គំនិត\s*[៖:]/i.test(trimmed) ||
        trimmed.includes("📝") ||
        trimmed.includes("បម្រាប់ប្រធាន") ||
        trimmed.includes("បម្រាប់ (Givens)") ||
        trimmed.includes("បម្រាប់:") ||
        trimmed.includes("បម្រាប់៖") ||
        /^[•\-\*\s]*ដោយ\s*[:៖(]/.test(trimmed)
      ) {
        const cText = cleanCalloutLineText(trimmed);
        appendOrMergeCallout("callout_formula", wrapTextLine(cText, 58));
        continue;
      }

      if (
        trimmed.includes("📐") ||
        trimmed.includes("រូបមន្តគ្រឹះ") ||
        trimmed.includes("រូបមន្ត (Formula)") ||
        trimmed.includes("តាមរូបមន្ត")
      ) {
        const cText = cleanCalloutLineText(trimmed);
        appendOrMergeCallout("callout_formula", wrapTextLine(cText, 58));
        continue;
      }

      if (
        /^[•\-\*\s]*(?:\*\*)?ការពន្យល់\s*[៖:]/i.test(trimmed) ||
        trimmed.includes("🔢") ||
        trimmed.includes("ដំណោះស្រាយ (Calculation)") ||
        trimmed.includes("ដំណោះស្រាយជាជំហានៗ") ||
        trimmed.includes("ការគណនា") ||
        /^[•\-\*\s]*នាំឱ្យ\s*[:៖(]/.test(trimmed)
      ) {
        const cText = cleanCalloutLineText(trimmed);
        appendOrMergeCallout("callout_calc", wrapTextLine(cText, 58));
        continue;
      }

      if (
        /^[•\-\*\s]*(?:\*\*)?ចម្លើយ\s*[៖:]/i.test(trimmed) ||
        trimmed.includes("🎯") ||
        trimmed.includes("ចម្លើយចុងក្រោយ") ||
        trimmed.startsWith("ដូចនេះ") ||
        trimmed.includes("ដូចនេះ៖") ||
        trimmed.includes("ដូចនេះ:")
      ) {
        const cText = cleanCalloutLineText(trimmed);
        appendOrMergeCallout("callout_conclusion", wrapTextLine(cText, 56));
        continue;
      }

      if (trimmed.startsWith("#")) {
        const hText = cleanCalloutLineText(trimmed);
        if (hText) {
          blocks.push({
            kind: "heading",
            text: hText,
            height: 54,
          });
        }
        continue;
      }

      const isBullet = /^([•\-\*]|\d+[\.\)])\s+/.test(trimmed);
      const preserved = formatLinePreservingFrac(trimmed.replace(/^([•\-\*])\s+/, ""));

      // If this line has a \frac{a}{b}, render it with 2D stacked fractions!
      if (preserved.includes("\\frac") && preserved.length <= 105) {
        blocks.push({
          kind: "bullet_frac",
          text: preserved,
          height: 68,
        });
        continue;
      }

      const cleanLine = stripEmojisForSvg(
        cleanLatexInline(preserved.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)"))
      );
      const wrapped = wrapTextLine(cleanLine, 60);

      wrapped.forEach((wLine, idx) => {
        blocks.push({
          kind: isBullet && idx === 0 ? "bullet" : "text",
          text: wLine,
          height: 38,
        });
      });
    }
  }

  return blocks;
}

export function buildBlocksPageSvgString(
  blocks: RenderBlock[],
  pageIndex: number,
  totalPages: number
): string {
  const width = 920;
  const headerHeight = 74;
  const footerHeight = 56;
  const contentHeight = blocks.reduce((sum, b) => sum + b.height, 0);
  const totalHeight = headerHeight + contentHeight + footerHeight + 20;

  const svgElements: string[] = [];

  // Outer dark card background (#182533) matching Web App MessageItem 100%
  svgElements.push(
    `<rect width="${width}" height="${totalHeight}" rx="22" fill="#182533" stroke="#26384d" stroke-width="2"/>`
  );

  // Top Header Bar: Khmer Super AI Agent [ឆ្លាតវៃ] + Vector Zap Icon
  svgElements.push(
    `<text x="36" y="45" fill="#38bdf8" font-family="Noto Sans Khmer, Roboto Mono, Liberation Sans, sans-serif" font-size="20" font-weight="bold">Khmer Super AI Agent</text>`
  );
  svgElements.push(
    `<rect x="260" y="23" width="68" height="28" rx="14" fill="#0ea5e9" opacity="0.22"/>`
  );
  svgElements.push(
    `<text x="294" y="42" text-anchor="middle" fill="#7dd3fc" font-family="Noto Sans Khmer, Liberation Sans, sans-serif" font-size="14">ឆ្លាតវៃ</text>`
  );

  // Vector Lightning Bolt Icon (matches <Zap /> in MessageItem.tsx)
  svgElements.push(
    `<polygon points="${width - 178},26 ${width - 186},37 ${width - 179},37 ${width - 181},46 ${width - 171},34 ${width - 178},34" fill="#34d399"/>`
  );
  const pageBadge = totalPages > 1 ? `ទំព័រ ${pageIndex + 1}/${totalPages}` : "MoEYS Standard";
  svgElements.push(
    `<text x="${width - 36}" y="44" text-anchor="end" fill="#34d399" font-family="Noto Sans Khmer, Roboto Mono, Liberation Sans, sans-serif" font-size="16" font-weight="bold">${escapeXml(pageBadge)}</text>`
  );
  svgElements.push(
    `<line x1="28" y1="62" x2="${width - 28}" y2="62" stroke="#26384d" stroke-width="1.5"/>`
  );

  let y = headerHeight + 10;

  for (const block of blocks) {
    if (block.kind === "spacer") {
      y += block.height;
      continue;
    }

    if (block.kind === "heading") {
      svgElements.push(
        `<rect x="32" y="${y}" width="${width - 64}" height="44" rx="10" fill="#112236"/>`
      );
      svgElements.push(
        `<rect x="32" y="${y}" width="6" height="44" rx="3" fill="#38bdf8"/>`
      );
      svgElements.push(
        `<text x="52" y="${y + 29}" fill="#7dd3fc" font-family="Noto Sans Khmer, Roboto Mono, Liberation Sans, sans-serif" font-size="19.5" font-weight="bold">${escapeXml((block.text || "").slice(0, 68))}</text>`
      );
      y += block.height;
      continue;
    }

    // 0a. Reprimand / Scolding Callout (Rose Red Box + Vector AlertTriangle Icon — Identical to FormattedContent.tsx)
    if (block.kind === "callout_reprimand") {
      const cLines = block.lines || [block.text || ""];
      const boxH = block.height - 10;
      svgElements.push(
        `<rect x="32" y="${y}" width="${width - 64}" height="${boxH}" rx="10" fill="#3b0c1c"/>`
      );
      svgElements.push(
        `<rect x="32" y="${y}" width="6" height="${boxH}" rx="3" fill="#f43f5e"/>`
      );
      // Vector AlertTriangle Icon
      svgElements.push(
        `<g transform="translate(50, ${y + 13})" stroke="#fb7185" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></g>`
      );
      cLines.forEach((l, idx) => {
        const textX = idx === 0 ? 80 : 54;
        svgElements.push(
          `<text x="${textX}" y="${y + 30 + idx * 30}" fill="#fda4af" font-family="Noto Sans Khmer, Roboto Mono, Liberation Sans, sans-serif" font-size="18.5" font-weight="bold">${escapeXml(l)}</text>`
        );
      });
      y += block.height;
      continue;
    }

    // 0b. Encouragement & Shortcomings Callout (Amber Gold Box + Vector Sparkles Icon — Identical to FormattedContent.tsx)
    if (block.kind === "callout_encourage") {
      const cLines = block.lines || [block.text || ""];
      const boxH = block.height - 10;
      svgElements.push(
        `<rect x="32" y="${y}" width="${width - 64}" height="${boxH}" rx="10" fill="#362407"/>`
      );
      svgElements.push(
        `<rect x="32" y="${y}" width="6" height="${boxH}" rx="3" fill="#fbbf24"/>`
      );
      // Vector Sparkles Icon
      svgElements.push(
        `<g transform="translate(50, ${y + 13})" stroke="#fbbf24" stroke-width="2" fill="none"><path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z"/></g>`
      );
      cLines.forEach((l, idx) => {
        const textX = idx === 0 ? 80 : 54;
        svgElements.push(
          `<text x="${textX}" y="${y + 30 + idx * 30}" fill="#fde68a" font-family="Noto Sans Khmer, Roboto Mono, Liberation Sans, sans-serif" font-size="18.5" font-weight="bold">${escapeXml(l)}</text>`
        );
      });
      y += block.height;
      continue;
    }

    // 1. Givens Callout (Sky Blue Box + Vector BookOpen Icon — Identical to FormattedContent.tsx)
    if (block.kind === "callout_givens") {
      const cLines = block.lines || [block.text || ""];
      const boxH = block.height - 10;
      svgElements.push(
        `<rect x="32" y="${y}" width="${width - 64}" height="${boxH}" rx="10" fill="#0c263b"/>`
      );
      svgElements.push(
        `<rect x="32" y="${y}" width="6" height="${boxH}" rx="3" fill="#38bdf8"/>`
      );
      // Vector BookOpen Icon
      svgElements.push(
        `<g transform="translate(50, ${y + 13})" stroke="#38bdf8" stroke-width="2" fill="none"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></g>`
      );
      cLines.forEach((l, idx) => {
        const textX = idx === 0 ? 80 : 54;
        svgElements.push(
          `<text x="${textX}" y="${y + 30 + idx * 30}" fill="#7dd3fc" font-family="Noto Sans Khmer, Roboto Mono, Liberation Sans, sans-serif" font-size="18.5" font-weight="bold">${escapeXml(l)}</text>`
        );
      });
      y += block.height;
      continue;
    }

    // 2. Formula Callout (Indigo Box + Vector Triangle Ruler Icon — Identical to FormattedContent.tsx)
    if (block.kind === "callout_formula") {
      const cLines = block.lines || [block.text || ""];
      const boxH = block.height - 10;
      svgElements.push(
        `<rect x="32" y="${y}" width="${width - 64}" height="${boxH}" rx="10" fill="#171b3a"/>`
      );
      svgElements.push(
        `<rect x="32" y="${y}" width="6" height="${boxH}" rx="3" fill="#818cf8"/>`
      );
      // Vector Triangle Ruler Icon
      svgElements.push(
        `<g transform="translate(50, ${y + 13})" stroke="#818cf8" stroke-width="2" fill="none"><polygon points="3,20 20,20 3,3"/><line x1="7" y1="16" x2="11" y2="16"/></g>`
      );
      cLines.forEach((l, idx) => {
        const textX = idx === 0 ? 80 : 54;
        svgElements.push(
          `<text x="${textX}" y="${y + 30 + idx * 30}" fill="#a5b4fc" font-family="Noto Sans Khmer, Roboto Mono, Liberation Sans, sans-serif" font-size="18.5" font-weight="bold">${escapeXml(l)}</text>`
        );
      });
      y += block.height;
      continue;
    }

    // 3. Calculation Callout (Blue Box + Vector Steps Icon — Identical to FormattedContent.tsx)
    if (block.kind === "callout_calc") {
      const cLines = block.lines || [block.text || ""];
      const boxH = block.height - 10;
      svgElements.push(
        `<rect x="32" y="${y}" width="${width - 64}" height="${boxH}" rx="10" fill="#102340"/>`
      );
      svgElements.push(
        `<rect x="32" y="${y}" width="6" height="${boxH}" rx="3" fill="#60a5fa"/>`
      );
      // Vector Calculator / Steps Badge Icon
      svgElements.push(
        `<g transform="translate(50, ${y + 13})" stroke="#60a5fa" stroke-width="2" fill="none"><rect x="3" y="2" width="16" height="18" rx="2"/><line x1="7" y1="6" x2="15" y2="6"/><line x1="7" y1="11" x2="15" y2="11"/><line x1="7" y1="15" x2="12" y2="15"/></g>`
      );
      cLines.forEach((l, idx) => {
        const textX = idx === 0 ? 80 : 54;
        svgElements.push(
          `<text x="${textX}" y="${y + 30 + idx * 30}" fill="#93c5fd" font-family="Noto Sans Khmer, Roboto Mono, Liberation Sans, sans-serif" font-size="18.5" font-weight="bold">${escapeXml(l)}</text>`
        );
      });
      y += block.height;
      continue;
    }

    // 4. Conclusion Callout (Emerald Box + Vector CheckCircle2 Icon — Identical to FormattedContent.tsx)
    if (block.kind === "callout_conclusion") {
      const cLines = block.lines || [block.text || ""];
      const boxH = block.height - 10;
      svgElements.push(
        `<rect x="32" y="${y}" width="${width - 64}" height="${boxH}" rx="10" fill="#062e26" stroke="#10b981" stroke-width="1.5"/>`
      );
      // Vector CheckCircle2 Icon (matches <CheckCircle2 /> in FormattedContent.tsx)
      svgElements.push(
        `<g transform="translate(48, ${y + 14})" stroke="#34d399" stroke-width="2.2" fill="none"><circle cx="10" cy="10" r="9"/><path d="M6 10.5l2.8 2.8L14.5 7.5"/></g>`
      );
      cLines.forEach((l, idx) => {
        const textX = idx === 0 ? 78 : 54;
        svgElements.push(
          `<text x="${textX}" y="${y + 31 + idx * 30}" fill="#6ee7b7" font-family="Noto Sans Khmer, Roboto Mono, Liberation Sans, sans-serif" font-size="18.5" font-weight="bold">${escapeXml(l)}</text>`
        );
      });
      y += block.height;
      continue;
    }

    // 5. Embedded Explanatory Diagram Box (Matches <SvgDiagram /> in FormattedContent.tsx 100%)
    if (block.kind === "diagram_box" && block.svgContent) {
      const cleanInner = enhanceSvgDiagramVisibility(block.svgContent);
      const vbMatch = cleanInner.match(/viewBox=["']([^"']+)["']/i);
      const vb = vbMatch ? vbMatch[1] : "0 0 500 240";
      const innerBody = cleanInner
        .replace(/^[\s\S]*?<svg[^>]*>/i, "")
        .replace(/<\/svg>[\s\S]*$/i, "");

      const boxX = 34;
      const boxW = width - 68;
      const boxH = 340;

      svgElements.push(
        `<rect x="${boxX}" y="${y}" width="${boxW}" height="${boxH}" rx="14" fill="#0d1624" stroke="#1e3a5f" stroke-width="1.5"/>`
      );
      svgElements.push(
        `<rect x="${boxX + 1}" y="${y + 1}" width="${boxW - 2}" height="40" rx="12" fill="#132338"/>`
      );
      svgElements.push(
        `<line x1="${boxX}" y1="${y + 41}" x2="${boxX + boxW}" y2="${y + 41}" stroke="#1e3a5f" stroke-width="1"/>`
      );
      // Vector ImageIcon (matches <ImageIcon /> in FormattedContent.tsx)
      svgElements.push(
        `<g transform="translate(${boxX + 18}, ${y + 11})" stroke="#38bdf8" stroke-width="2" fill="none"><rect x="2" y="2" width="16" height="16" rx="2"/><circle cx="7" cy="7" r="1.5" fill="#38bdf8"/><path d="M18 13l-4-4L5 18"/></g>`
      );
      svgElements.push(
        `<text x="${boxX + 44}" y="${y + 27}" fill="#38bdf8" font-family="Noto Sans Khmer, Roboto Mono, Liberation Sans, sans-serif" font-size="16" font-weight="bold">រូបភាពគំនូសបំព្រួញពន្យល់លំហាត់ (Explanatory Diagram)</text>`
      );
      svgElements.push(
        `<svg x="${boxX + 24}" y="${y + 48}" width="${boxW - 48}" height="248" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${innerBody}</svg>`
      );
      svgElements.push(
        `<rect x="${boxX + 1}" y="${y + boxH - 36}" width="${boxW - 2}" height="35" rx="10" fill="#132338" opacity="0.75"/>`
      );
      svgElements.push(
        `<text x="${width / 2}" y="${y + boxH - 13}" text-anchor="middle" fill="#7dd3fc" font-family="Noto Sans Khmer, Liberation Sans, sans-serif" font-size="13.5">រូបភាពគូសបញ្ជាក់ និងកំណត់សម្គាល់សម្រាប់ស្វែងយល់ដំណោះស្រាយលំហាត់</text>`
      );

      y += block.height;
      continue;
    }

    if (block.kind === "bullet_frac" && block.text) {
      svgElements.push(`<circle cx="48" cy="${y + 30}" r="4" fill="#38bdf8"/>`);
      const segments = parseMathSegments(block.text);
      const fontSize = block.text.length > 70 ? 16.5 : 18;
      let curX = 64;
      const centerY = y + 30;

      segments.forEach((seg) => {
        if (seg.type === "frac") {
          const wNum = estimateTextWidth(seg.num || "", fontSize - 2);
          const wDen = estimateTextWidth(seg.den || "", fontSize - 2);
          const w = Math.max(wNum, wDen) + 22;
          const midX = curX + w / 2;
          svgElements.push(
            `<text x="${midX}" y="${centerY - 10}" text-anchor="middle" fill="#f8fafc" font-family="Roboto Mono, Noto Sans Khmer, Liberation Sans, sans-serif" font-size="${fontSize - 2}" font-weight="bold">${escapeXml(seg.num || "")}</text>`
          );
          svgElements.push(
            `<line x1="${curX + 6}" y1="${centerY - 2}" x2="${curX + w - 6}" y2="${centerY - 2}" stroke="#f8fafc" stroke-width="1.8"/>`
          );
          svgElements.push(
            `<text x="${midX}" y="${centerY + 19}" text-anchor="middle" fill="#f8fafc" font-family="Roboto Mono, Noto Sans Khmer, Liberation Sans, sans-serif" font-size="${fontSize - 2}" font-weight="bold">${escapeXml(seg.den || "")}</text>`
          );
          curX += w + 4;
        } else {
          const txt = seg.text || "";
          const w = estimateTextWidth(txt, fontSize);
          svgElements.push(
            `<text x="${curX}" y="${centerY + 6}" fill="#f1f5f9" font-family="Noto Sans Khmer, Roboto Mono, Liberation Sans, sans-serif" font-size="${fontSize}">${escapeXml(txt)}</text>`
          );
          curX += w + 6;
        }
      });

      y += block.height;
      continue;
    }

    if (block.kind === "math_box" && block.mathRows) {
      const boxX = 36;
      const boxW = width - 72;
      const boxH = block.height - 14;
      svgElements.push(
        `<rect x="${boxX}" y="${y}" width="${boxW}" height="${boxH}" rx="12" fill="#101823" stroke="#223042" stroke-width="1.5"/>`
      );

      const rowCount = block.mathRows.length;
      const rowStep = boxH / rowCount;

      block.mathRows.forEach((rowExpr, rIdx) => {
        const segments = parseMathSegments(rowExpr);
        const baseFontSize = rowExpr.length > 52 ? 17.5 : 20.5;
        const segWidths = segments.map((seg) => {
          if (seg.type === "frac") {
            const wNum = estimateTextWidth(seg.num || "", baseFontSize - 2);
            const wDen = estimateTextWidth(seg.den || "", baseFontSize - 2);
            return Math.max(wNum, wDen) + 26;
          }
          return estimateTextWidth(seg.text || "", baseFontSize) + 8;
        });

        const totalFormulaWidth = segWidths.reduce((a, b) => a + b, 0);
        let curX = Math.max(boxX + 20, boxX + (boxW - totalFormulaWidth) / 2);
        const centerY = y + rowStep * rIdx + rowStep / 2;

        segments.forEach((seg, idx) => {
          const w = segWidths[idx];
          if (seg.type === "frac") {
            const midX = curX + w / 2;
            svgElements.push(
              `<text x="${midX}" y="${centerY - 11}" text-anchor="middle" fill="#f8fafc" font-family="Roboto Mono, Noto Sans Khmer, Liberation Sans, sans-serif" font-size="${baseFontSize - 2}" font-weight="bold">${escapeXml(seg.num || "")}</text>`
            );
            svgElements.push(
              `<line x1="${curX + 7}" y1="${centerY - 3}" x2="${curX + w - 7}" y2="${centerY - 3}" stroke="#f8fafc" stroke-width="2"/>`
            );
            svgElements.push(
              `<text x="${midX}" y="${centerY + 20}" text-anchor="middle" fill="#f8fafc" font-family="Roboto Mono, Noto Sans Khmer, Liberation Sans, sans-serif" font-size="${baseFontSize - 2}" font-weight="bold">${escapeXml(seg.den || "")}</text>`
            );
          } else {
            svgElements.push(
              `<text x="${curX + w / 2}" y="${centerY + 7}" text-anchor="middle" fill="#f8fafc" font-family="Roboto Mono, Noto Sans Khmer, Liberation Sans, sans-serif" font-size="${baseFontSize}" font-weight="bold">${escapeXml(seg.text || "")}</text>`
            );
          }
          curX += w;
        });
      });

      y += block.height;
      continue;
    }

    if (block.kind === "bullet") {
      svgElements.push(`<circle cx="48" cy="${y + 18}" r="4" fill="#38bdf8"/>`);
      svgElements.push(
        `<text x="64" y="${y + 24}" fill="#f1f5f9" font-family="Noto Sans Khmer, Roboto Mono, Liberation Sans, sans-serif" font-size="18.5">${escapeXml(block.text || "")}</text>`
      );
      y += block.height;
      continue;
    }

    svgElements.push(
      `<text x="44" y="${y + 24}" fill="#e2e8f0" font-family="Noto Sans Khmer, Roboto Mono, Liberation Sans, sans-serif" font-size="18.5">${escapeXml(block.text || "")}</text>`
    );
    y += block.height;
  }

  // Bottom Web-App-Identical Footer Badge with Vector Volume2 Icon
  const footerY = totalHeight - 44;
  svgElements.push(
    `<line x1="28" y1="${footerY}" x2="${width - 28}" y2="${footerY}" stroke="#26384d" stroke-width="1"/>`
  );
  svgElements.push(
    `<g transform="translate(36, ${footerY + 11})" stroke="#38bdf8" stroke-width="2" fill="none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></g>`
  );
  svgElements.push(
    `<text x="62" y="${footerY + 27}" fill="#7dd3fc" font-family="Noto Sans Khmer, Roboto Mono, Liberation Sans, sans-serif" font-size="14">សំឡេងពន្យល់៖ Google AI Studio Voice (MoEYS Standard)</text>`
  );
  svgElements.push(
    `<text x="${width - 36}" y="${footerY + 27}" text-anchor="end" fill="#64748b" font-family="Noto Sans Khmer, Roboto Mono, Liberation Sans, sans-serif" font-size="14">Khmer Super AI Agent</text>`
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}">
    ${svgElements.join("\n")}
  </svg>`;
}

export function buildSolutionCardSvgStrings(markdownText: string): {
  solutionSvgs: string[];
  diagramSvgs: string[];
} {
  const solutionSvgs: string[] = [];
  const diagramSvgs: string[] = [];

  const enhancedMarkdown = ensureExerciseHasSvgDiagram(markdownText);
  const hasExerciseStructure =
    /(?:\*\*គំនិត[៖:]?\*\*|គំនិត[៖:]|\*\*ការពន្យល់[៖:]?\*\*|ការពន្យល់[៖:]|\*\*ចម្លើយ[៖:]|📝|📐|🔢|🎯|បម្រាប់|រូបមន្ត|ដំណោះស្រាយ|ដូចនេះ|\$\$|\\frac|<svg)/i.test(
      enhancedMarkdown
    );

  if (!hasExerciseStructure) {
    return { solutionSvgs, diagramSvgs };
  }

  const allBlocks = buildSolutionBlocks(enhancedMarkdown);
  if (allBlocks.length > 0) {
    // Keep the entire exercise solution + embedded diagram on 1 SINGLE unified card (matching the Web App bubble!)
    solutionSvgs.push(buildBlocksPageSvgString(allBlocks, 0, 1));
  }

  const svgMatches = enhancedMarkdown.match(/<svg[\s\S]*?<\/svg>/gi);
  if (svgMatches) {
    for (const rawSvg of svgMatches.slice(0, 1)) {
      diagramSvgs.push(buildFramedDiagramSvgString(rawSvg));
    }
  }

  return { solutionSvgs, diagramSvgs };
}
