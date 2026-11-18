import path from "path";
import fs from "node:fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const requireModule = createRequire(import.meta.url);
let _ResvgClass: any = null;
function getResvg() {
  if (!_ResvgClass) {
    try {
      const pkg = ["@resvg", "resvg-js"].join("/");
      const mod = requireModule(pkg);
      _ResvgClass = mod.Resvg || mod.default?.Resvg || mod;
    } catch {}
  }
  return _ResvgClass;
}
import {
  buildSolutionCardSvgStrings,
  formatHtmlForTelegram,
  formatTextForTelegram,
  ensureExerciseHasSvgDiagram,
  cleanLatexInline,
  extractSolutionCaptionSummary,
} from "./solutionCardSvgBuilder.ts";

export {
  formatHtmlForTelegram,
  formatTextForTelegram,
  ensureExerciseHasSvgDiagram,
  cleanLatexInline,
  extractSolutionCaptionSummary,
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FONT_KHMER = path.resolve(__dirname, "../../public/fonts/NotoSansKhmer.ttf");
const FONT_MONO = path.resolve(__dirname, "../../public/fonts/RobotoMono.ttf");
const SYSTEM_FONTS = [
  FONT_KHMER,
  FONT_MONO,
  "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
].filter((f) => {
  try {
    return fs.existsSync(f);
  } catch {
    return false;
  }
});

export function renderSvgStringToPngBuffer(svgString: string): Buffer | null {
  try {
    const ResvgClass = getResvg();
    if (!ResvgClass) return null;
    const resvg = new ResvgClass(svgString, {
      font: {
        fontFiles: SYSTEM_FONTS,
        loadSystemFonts: true,
        defaultFontFamily: "Noto Sans Khmer",
      },
    });
    return resvg.render().asPng();
  } catch {
    return null;
  }
}

export function renderTelegramSolutionVisuals(markdownText: string): {
  solutionCards: Buffer[];
  diagramCards: Buffer[];
} {
  const solutionCards: Buffer[] = [];
  const diagramCards: Buffer[] = [];

  const { solutionSvgs, diagramSvgs } = buildSolutionCardSvgStrings(markdownText);

  for (const svg of solutionSvgs) {
    const png = renderSvgStringToPngBuffer(svg);
    if (png) solutionCards.push(png);
  }

  for (const diagSvg of diagramSvgs) {
    const png = renderSvgStringToPngBuffer(diagSvg);
    if (png) diagramCards.push(png);
  }

  return { solutionCards, diagramCards };
}
