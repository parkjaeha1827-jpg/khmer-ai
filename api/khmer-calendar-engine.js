// ============================================================================
// KHMER COMPREHENSIVE SOLAR & LUNAR CALENDAR ENGINE (ប្រតិទិនកម្ពុជាពេញលេញ)
// Computes daily Solar date, Lunar date (ចន្ទគតិ), Sil day (ថ្ងៃសីល),
// National & International holidays (ថ្ងៃបុណ្យជាតិ-អន្តរជាតិ),
// Public holidays (ថ្ងៃឈប់សម្រាក), and Observances (ទិវាជាតិ-អន្តរជាតិ).
// ============================================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const KHMER_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];

export function toKhmerNumber(num) {
  return String(num ?? "")
    .split("")
    .map((c) => (/\d/.test(c) ? KHMER_DIGITS[Number(c)] : c))
    .join("");
}

export const KHMER_WEEKDAYS = [
  "ថ្ងៃអាទិត្យ",
  "ថ្ងៃចន្ទ",
  "ថ្ងៃអង្គារ",
  "ថ្ងៃពុធ",
  "ថ្ងៃព្រហស្បតិ៍",
  "ថ្ងៃសុក្រ",
  "ថ្ងៃសៅរ៍",
];

export const KHMER_SOLAR_MONTHS = [
  "មករា",
  "កុម្ភៈ",
  "មីនា",
  "មេសា",
  "ឧសភា",
  "មិថុនា",
  "កក្កដា",
  "សីហា",
  "កញ្ញា",
  "តុលា",
  "វិច្ឆិកា",
  "ធ្នូ",
];

export const KHMER_LUNAR_MONTHS = [
  "មិគសិរ", // 1 (Nov-Dec)
  "បុស្ស",   // 2 (Dec-Jan)
  "មាឃ",    // 3 (Jan-Feb)
  "ផល្គុន",  // 4 (Feb-Mar)
  "ចែត្រ",   // 5 (Mar-Apr)
  "ពិសាខ",  // 6 (Apr-May)
  "ជេស្ឋ",   // 7 (May-Jun)
  "អាសាឍ",  // 8 (Jun-Jul)
  "ស្រាពណ៍", // 9 (Jul-Aug)
  "ភទ្របទ",  // 10 (Aug-Sep)
  "អស្សុជ",  // 11 (Sep-Oct)
  "កត្តិក",   // 12 (Oct-Nov)
];

export const KHMER_ANIMAL_YEARS = [
  "ឆ្នាំជូត (កណ្ដុរ)",
  "ឆ្នាំឆ្លូវ (គោ)",
  "ឆ្នាំខាល (ខ្លា)",
  "ឆ្នាំថោះ (ទន្សាយ)",
  "ឆ្នាំរោង (នាគ)",
  "ឆ្នាំម្សាញ់ (ពស់)",
  "ឆ្នាំមមី (សេះ)",
  "ឆ្នាំមមែ (ពពែ)",
  "ឆ្នាំវក (ស្វា)",
  "ឆ្នាំរកា (មាន់)",
  "ឆ្នាំច (ឆ្កែ)",
  "ឆ្នាំកុរ (ជ្រូក)",
];

export const KHMER_SAK_ERAS = [
  "សំរឹទ្ធិស័ក (០)",
  "ឯកស័ក (១)",
  "ទោស័ក (២)",
  "ត្រីស័ក (៣)",
  "ចត្វាស័ក (៤)",
  "បញ្ចស័ក (៥)",
  "ឆស័ក (៦)",
  "សប្តស័ក (៧)",
  "អដ្ឋស័ក (៨)",
  "នព្វស័ក (៩)",
];

// Reference known new moons for precise astronomical lunar month and day anchoring
// Synodic month is approximately 29.53058885 days
const SYNODIC_MONTH = 29.53058885;
// Anchor New Moon: 2026-01-18 19:52 UTC (start of month មាឃ)
const REF_NEW_MOON_2026 = new Date("2026-01-18T19:52:00Z").getTime();

/**
 * Computes the Cambodia Date Info in Asia/Phnom_Penh timezone
 */
export function getCambodiaTimeParts(inputDate = new Date()) {
  const d = inputDate instanceof Date ? inputDate : new Date(inputDate);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Phnom_Penh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(d);

  const year = Number(parts.find((p) => p.type === "year")?.value || d.getFullYear());
  const month = Number(parts.find((p) => p.type === "month")?.value || d.getMonth() + 1);
  const day = Number(parts.find((p) => p.type === "day")?.value || d.getDate());
  const hour = Number(parts.find((p) => p.type === "hour")?.value || d.getHours());
  const minute = Number(parts.find((p) => p.type === "minute")?.value || d.getMinutes());
  const second = Number(parts.find((p) => p.type === "second")?.value || d.getSeconds());

  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const dayObj = new Date(`${iso}T00:00:00Z`);
  const weekdayIdx = dayObj.getUTCDay();

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    iso,
    weekdayIdx,
    weekdayKhmer: KHMER_WEEKDAYS[weekdayIdx] || "ថ្ងៃនេះ",
  };
}

/**
 * Computes Khmer Solar Date (កាលបរិច្ឆេទសុរិយគតិ)
 */
export function getKhmerSolarDate(inputDate = new Date()) {
  const parts = getCambodiaTimeParts(inputDate);
  const solarMonthKhmer = KHMER_SOLAR_MONTHS[parts.month - 1] || "មករា";
  const solarFull = `${parts.weekdayKhmer} ទី ${toKhmerNumber(parts.day)} ខែ${solarMonthKhmer} ឆ្នាំ ${toKhmerNumber(
    parts.year
  )}`;

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    iso: parts.iso,
    weekdayIdx: parts.weekdayIdx,
    weekdayKhmer: parts.weekdayKhmer,
    solarMonthKhmer,
    solarFull,
  };
}

/**
 * Computes Khmer Lunar Date (កាលបរិច្ឆេទចន្ទគតិ) & Moon Phase
 */
export function getKhmerLunarDate(inputDate = new Date()) {
  const solar = getKhmerSolarDate(inputDate);
  const dateObj = new Date(`${solar.iso}T05:00:00Z`);
  const diffDays = (dateObj.getTime() - REF_NEW_MOON_2026) / 86400000;
  
  // Calculate cycle index and day in cycle
  const cyclesCount = Math.floor(diffDays / SYNODIC_MONTH);
  const moonAge = ((diffDays % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  
  // Lunar day 1 to 30
  let lunarDayNum = Math.floor(moonAge) + 1;
  if (lunarDayNum > 30) lunarDayNum = 30;

  let isWaxing = false;
  let lunarPhaseKhmer = "";
  let lunarDayInPhase = 1;
  let isFullMoon = false;
  let isNewMoon = false;

  if (lunarDayNum <= 15) {
    isWaxing = true;
    lunarDayInPhase = lunarDayNum;
    if (lunarDayInPhase === 15) {
      isFullMoon = true;
      lunarPhaseKhmer = "១៥ កើត (ពេញបូណ៌មី)";
    } else {
      lunarPhaseKhmer = `${toKhmerNumber(lunarDayInPhase)} កើត`;
    }
  } else {
    isWaxing = false;
    lunarDayInPhase = lunarDayNum - 15;
    if (lunarDayInPhase >= 14) {
      isNewMoon = true;
      lunarPhaseKhmer = `${toKhmerNumber(lunarDayInPhase)} រោច (ដាច់ខែ)`;
    } else {
      lunarPhaseKhmer = `${toKhmerNumber(lunarDayInPhase)} រោច`;
    }
  }

  // Khmer Lunar Month mapping based on anchor 2026-01-18 = month មាឃ (index 2)
  // Month indices: 0: មិគសិរ, 1: បុស្ស, 2: មាឃ, 3: ផល្គុន, 4: ចែត្រ, 5: ពិសាខ, 6: ជេស្ឋ, 7: អាសាឍ, 8: ស្រាពណ៍, 9: ភទ្របទ, 10: អស្សុជ, 11: កត្តិក
  const anchorMonthIndex = 2; // មាឃ
  const monthIdx = ((anchorMonthIndex + cyclesCount) % 12 + 12) % 12;
  const lunarMonthKhmer = KHMER_LUNAR_MONTHS[monthIdx] || "អស្សុជ";

  // Zodiac Animal Year: 2026 is Horse (ឆ្នាំមមី)
  // Animal years: 0: ជូត, 1: ឆ្លូវ, 2: ខាល, 3: ថោះ, 4: រោង, 5: ម្សាញ់, 6: មមី, 7: មមែ, 8: វក, 9: រកា, 10: ច, 11: កុរ
  // Formula: (year - 4) % 12
  const animalIdx = ((solar.year - 4) % 12 + 12) % 12;
  const animalYearKhmer = KHMER_ANIMAL_YEARS[animalIdx] || "ឆ្នាំមមី (សេះ)";

  // Sak Era (10-year cycle): 2026 is Sak 8 (អដ្ឋស័ក)
  // Formula: (year - 8) % 10 -> (2026 - 8) = 2018 -> 8
  const sakIdx = ((solar.year - 8) % 10 + 10) % 10;
  const sakKhmer = KHMER_SAK_ERAS[sakIdx] || "អដ្ឋស័ក (៨)";

  // Buddhist Era (ព.ស.):
  // Transition happens around Visak Bochea (May). Before May: year + 543, After: year + 544
  const isAfterVisak = solar.month > 5 || (solar.month === 5 && solar.day >= 15);
  const buddhistEra = solar.year + (isAfterVisak ? 544 : 543);
  const buddhistEraKhmer = `ព.ស. ${toKhmerNumber(buddhistEra)}`;

  // Full formatted Lunar string
  const lunarFull = `${solar.weekdayKhmer} ${lunarPhaseKhmer} ខែ${lunarMonthKhmer} ${animalYearKhmer} ${sakKhmer} ${buddhistEraKhmer}`;

  return {
    lunarDayNum,
    isWaxing,
    lunarDayInPhase,
    lunarPhaseKhmer,
    lunarMonthKhmer,
    lunarMonthIdx: monthIdx,
    animalYearKhmer,
    sakKhmer,
    buddhistEra,
    buddhistEraKhmer,
    isFullMoon,
    isNewMoon,
    lunarFull,
  };
}

/**
 * Computes ថ្ងៃសីល (Buddhist Precept / Holy Day) Info & Countdown
 * Buddhist holy days occur 4 times each lunar month:
 * 1. ៨ កើត (8th day of waxing moon)
 * 2. ១៥ កើត (15th day of waxing moon - Full Moon / ពេញបូណ៌មី)
 * 3. ៨ រោច (8th day of waning moon)
 * 4. ១៤ រោច ឬ ១៥ រោច (14th/15th day of waning moon - New Moon / ដាច់ខែ)
 */
export function getSilDayInfo(inputDate = new Date()) {
  const lunar = getKhmerLunarDate(inputDate);
  const solar = getKhmerSolarDate(inputDate);

  let isTodaySilDay = false;
  let silType = "";
  let silDescription = "";

  if (lunar.isWaxing && lunar.lunarDayInPhase === 8) {
    isTodaySilDay = true;
    silType = "៨ កើត";
    silDescription = "ថ្ងៃសីល ៨ កើត (ព្រះចន្ទកន្លះវង់) សម្រាប់សមាទានឧបោសថសីល និងសាងកុសលផលបុណ្យ";
  } else if (lunar.isWaxing && lunar.lunarDayInPhase === 15) {
    isTodaySilDay = true;
    silType = "១៥ កើត (ពេញបូណ៌មី)";
    silDescription = "ថ្ងៃសីលធំ ១៥ កើត ពេញបូណ៌មី (ព្រះចន្ទពេញវង់) ថ្ងៃមង្គលឧត្តមសម្រាប់ពុទ្ធបរិស័ទរក្សាសីល និងស្ដាប់ធម៌";
  } else if (!lunar.isWaxing && lunar.lunarDayInPhase === 8) {
    isTodaySilDay = true;
    silType = "៨ រោច";
    silDescription = "ថ្ងៃសីល ៨ រោច សម្រាប់ប្រតិបត្តិធម៌ សមាទានសីល ៥ ឬសីល ៨ និងធ្វើបុណ្យទាន";
  } else if (!lunar.isWaxing && (lunar.lunarDayInPhase === 14 || lunar.lunarDayInPhase === 15)) {
    isTodaySilDay = true;
    silType = "ដាច់ខែ (១៤/១៥ រោច)";
    silDescription = "ថ្ងៃសីលធំ ដាច់ខែ (ព្រះចន្ទអរូប) ថ្ងៃបិទបញ្ចប់ខែចន្ទគតិ សម្រាប់លាងជម្រះចិត្ត និងសាងកុសល";
  }

  // Find next Sil Day if today is not Sil Day (search ahead up to 30 days)
  let nextSilDateIso = "";
  let nextSilKhmerDate = "";
  let nextSilType = "";
  let daysUntilSil = 0;

  if (isTodaySilDay) {
    nextSilDateIso = solar.iso;
    nextSilKhmerDate = solar.solarFull;
    nextSilType = silType;
    daysUntilSil = 0;
  } else {
    for (let offset = 1; offset <= 30; offset++) {
      const futureDate = new Date(new Date(`${solar.iso}T05:00:00Z`).getTime() + offset * 86400000);
      const futLunar = getKhmerLunarDate(futureDate);
      const futSolar = getKhmerSolarDate(futureDate);

      let isFutSil = false;
      let fType = "";

      if (futLunar.isWaxing && futLunar.lunarDayInPhase === 8) {
        isFutSil = true;
        fType = "៨ កើត";
      } else if (futLunar.isWaxing && futLunar.lunarDayInPhase === 15) {
        isFutSil = true;
        fType = "១៥ កើត (ពេញបូណ៌មី)";
      } else if (!futLunar.isWaxing && futLunar.lunarDayInPhase === 8) {
        isFutSil = true;
        fType = "៨ រោច";
      } else if (!futLunar.isWaxing && (futLunar.lunarDayInPhase === 14 || futLunar.lunarDayInPhase === 15)) {
        isFutSil = true;
        fType = "ដាច់ខែ";
      }

      if (isFutSil) {
        daysUntilSil = offset;
        nextSilDateIso = futSolar.iso;
        nextSilKhmerDate = `${futSolar.solarFull} (${futLunar.lunarPhaseKhmer} ខែ${futLunar.lunarMonthKhmer})`;
        nextSilType = fType;
        break;
      }
    }
  }

  const silStatusBanner = isTodaySilDay
    ? `🪷🔔 <b>ថ្ងៃនេះជា «ថ្ងៃសីល» (${silType})!</b>\nសូមពុទ្ធបរិស័ទរក្សាសីល សមាទានឧបោសថសីល ៥ ឬ ៨ ធ្វើបុណ្យទាន និងចម្រើនមេត្តាភាវនាដើម្បីសេចក្ដីសុខសិរីមង្គល។`
    : `⏳ <b>ថ្ងៃសីលបន្ទាប់គឺ៖</b> ${nextSilKhmerDate}\n(នៅសល់ <b>${toKhmerNumber(
        daysUntilSil
      )} ថ្ងៃទៀត</b> - ដំណាក់កាល៖ <b>${nextSilType}</b>)`;

  return {
    isTodaySilDay,
    silType,
    silDescription,
    nextSilDateIso,
    nextSilKhmerDate,
    nextSilType,
    daysUntilSil,
    silStatusBanner,
  };
}

/**
 * Cambodian National, International, Traditional Festivals & Observances Database
 */
export function getAllCambodiaEventsForYear(year = 2026) {
  const y = Number(year) || 2026;

  // Movable Buddhist & Traditional Festivals by Year
  const movableByYear = {
    2025: {
      meakBochea: "02-12",
      visakBochea: "05-11",
      royalPlowing: "05-15",
      pchumBenStart: "09-21",
      pchumBenMid: "09-22",
      pchumBenEnd: "09-23",
      waterFestival1: "11-04",
      waterFestival2: "11-05",
      waterFestival3: "11-06",
    },
    2026: {
      meakBochea: "03-03",
      visakBochea: "05-31",
      royalPlowing: "06-04",
      pchumBenStart: "10-09",
      pchumBenMid: "10-10",
      pchumBenEnd: "10-11",
      waterFestival1: "11-23",
      waterFestival2: "11-24",
      waterFestival3: "11-25",
    },
    2027: {
      meakBochea: "02-21",
      visakBochea: "05-20",
      royalPlowing: "05-24",
      pchumBenStart: "09-29",
      pchumBenMid: "09-30",
      pchumBenEnd: "10-01",
      waterFestival1: "11-13",
      waterFestival2: "11-14",
      waterFestival3: "11-15",
    },
  };

  const mov = movableByYear[y] || movableByYear[2026];

  const rawList = [
    // JANUARY
    {
      mmdd: "01-01",
      titleKhmer: "ទិវាចូលឆ្នាំសកល (International New Year's Day)",
      titleEnglish: "New Year's Day",
      type: "international_holiday",
      categoryLabel: "🎉 បុណ្យអន្តរជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ថ្ងៃចូលឆ្នាំសកលទូទាំងពិភពលោក និងថ្ងៃឈប់សម្រាកផ្លូវការនៅកម្ពុជា។",
    },
    {
      mmdd: "01-07",
      titleKhmer: "ទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍ (Victory over Genocide Day)",
      titleEnglish: "Victory Day (7 January)",
      type: "national_holiday",
      categoryLabel: "🇰🇭 ថ្ងៃបុណ្យជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "រំឭកដល់ថ្ងៃរំដោះប្រទេសជាតិចេញពីរបបប្រល័យពូជសាសន៍ ប៉ុល ពត (៧ មករា ១៩៧៩)។",
    },

    // FEBRUARY
    {
      mmdd: "02-14",
      titleKhmer: "ទិវានៃក្ដីស្រឡាញ់ (Valentine's Day)",
      titleEnglish: "Valentine's Day",
      type: "international_observance",
      categoryLabel: "❤️ ទិវាអន្តរជាតិ",
      isPublicHoliday: false,
      description: "ទិវាបង្ហាញក្ដីស្រឡាញ់ មេត្តាធម៌ និងការដឹងគុណចំពោះឪពុកម្ដាយ លោកគ្រូអ្នកគ្រូ និងមនុស្សជាទីស្រឡាញ់។",
    },
    {
      mmdd: mov.meakBochea,
      titleKhmer: "ពិធីបុណ្យមាឃបូជា (Meak Bochea Day)",
      titleEnglish: "Meak Bochea Buddhist Festival",
      type: "buddhist_festival",
      categoryLabel: "🪷 ពិធីបុណ្យព្រះពុទ្ធសាសនា & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "រំឭកដល់ថ្ងៃដែលព្រះសម្មាសម្ពុទ្ធទ្រង់ប្រកាសឱវាទបាតិមោក្ខ និងដាក់ព្រះជន្មាយុសង្ខារ (១៥ កើត ខែមាឃ)។",
    },

    // MARCH
    {
      mmdd: "03-03",
      titleKhmer: "ទិវាវប្បធម៌ជាតិ ៣ មីនា (National Culture Day)",
      titleEnglish: "Cambodia National Culture Day",
      type: "national_observance",
      categoryLabel: "🏛️ ទិវាជាតិកម្ពុជា",
      isPublicHoliday: false,
      description: "ទិវាលើកស្ទួយ ការពារ និងអភិរក្សមរតកវប្បធម៌ អរិយធម៌ដ៏សម្បូរបែបរបស់ជាតិខ្មែរ។",
    },
    {
      mmdd: "03-08",
      titleKhmer: "ទិវានារីអន្តរជាតិ ៨ មីនា (International Women's Day)",
      titleEnglish: "International Women's Day",
      type: "international_holiday",
      categoryLabel: "🌸 បុណ្យអន្តរជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ថ្ងៃឈប់សម្រាកផ្លូវការដើម្បីអបអរសាទរ និងលើកកម្ពស់សិទ្ធិ តួនាទី និងសមភាពយេនឌ័ររបស់ស្ត្រី។",
    },

    // APRIL
    {
      mmdd: "04-14",
      titleKhmer: "ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិខ្មែរ - ថ្ងៃមហាសង្ក្រាន្ត (Day 1)",
      titleEnglish: "Khmer New Year (Maha Songkran)",
      type: "national_holiday",
      categoryLabel: "🇰🇭🪷 បុណ្យប្រពៃណីជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ថ្ងៃទី ១ នៃពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិខ្មែរ ទទួលទេវតាឆ្នាំថ្មី រៀបចំបាយសម្ល និងទៅវត្តអារាម។",
    },
    {
      mmdd: "04-15",
      titleKhmer: "ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិខ្មែរ - ថ្ងៃវារៈវនបត (Day 2)",
      titleEnglish: "Khmer New Year (Virak Wanabat)",
      type: "national_holiday",
      categoryLabel: "🇰🇭🪷 បុណ្យប្រពៃណីជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ថ្ងៃទី ២ នៃពិធីបុណ្យចូលឆ្នាំខ្មែរ ធ្វើបុណ្យទាន ជូនសម្លៀកបំពាក់ដល់មាតាបិតា និងចាស់ព្រឹទ្ធាចារ្យ។",
    },
    {
      mmdd: "04-16",
      titleKhmer: "ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិខ្មែរ - ថ្ងៃវារៈឡើងស័ក (Day 3)",
      titleEnglish: "Khmer New Year (Virak Loeurng Sak)",
      type: "national_holiday",
      categoryLabel: "🇰🇭🪷 បុណ្យប្រពៃណីជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ថ្ងៃទី ៣ នៃពិធីបុណ្យចូលឆ្នាំខ្មែរ ស្រង់ព្រះពុទ្ធបដិមា ស្រង់មាតាបិតា និងផ្លាស់ចូលសករាជថ្មី។",
    },

    // MAY
    {
      mmdd: "05-01",
      titleKhmer: "ទិវាពលកម្មអន្តរជាតិ (International Labor Day)",
      titleEnglish: "International Labor Day",
      type: "international_holiday",
      categoryLabel: "🛠️ បុណ្យអន្តរជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ថ្ងៃឈប់សម្រាកផ្លូវការដើម្បីអបអរសាទរ និងលើកតម្កើងតម្លៃការងាររបស់កម្មករ និយោជិតទូទាំងពិភពលោក។",
    },
    {
      mmdd: "05-14",
      titleKhmer: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម ព្រះករុណា ព្រះបាទសម្ដេចព្រះបរមនាថ នរោត្តម សីហមុនី",
      titleEnglish: "King Norodom Sihamoni's Birthday",
      type: "national_holiday",
      categoryLabel: "👑 ថ្ងៃបុណ្យជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ថ្ងៃឈប់សម្រាកផ្លូវការអបអរសាទរព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្មព្រះមហាក្សត្រនៃព្រះរាជាណាចក្រកម្ពុជា។",
    },
    {
      mmdd: "05-20",
      titleKhmer: "ទិវាជាតិនៃការចងចាំ (National Day of Remembrance)",
      titleEnglish: "National Day of Remembrance",
      type: "national_observance",
      categoryLabel: "🕯️ ទិវាជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ទិវាជាតិរំឭកវិញ្ញាណក្ខន្ធជនរងគ្រោះក្នុងរបបកម្ពុជាប្រជាធិបតេយ្យ និងរួមគ្នាការពារសន្តិភាព។",
    },
    {
      mmdd: mov.visakBochea,
      titleKhmer: "ពិធីបុណ្យវិសាខបូជា (Visak Bochea Day)",
      titleEnglish: "Visak Bochea Day (Buddha Day)",
      type: "buddhist_festival",
      categoryLabel: "🪷 ពិធីបុណ្យព្រះពុទ្ធសាសនា & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "រំឭកដល់ព្រះសម្មាសម្ពុទ្ធទ្រង់ប្រសូត ត្រាស់ដឹង និងបរិនិព្វាន (១៥ កើត ខែពិសាខ)។",
    },
    {
      mmdd: mov.royalPlowing,
      titleKhmer: "ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល (Royal Plowing Ceremony)",
      titleEnglish: "Royal Plowing Ceremony",
      type: "national_holiday",
      categoryLabel: "🐂 ព្រះរាជពិធីប្រពៃណី & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ព្រះរាជពិធីបុរាណប្រកាសការចាប់ផ្ដើមរដូវបង្កបង្កើនផលស្រែចម្ការ និងផ្សងមើលអាកាសធាតុតាមគោឧសភរាជ។",
    },

    // JUNE
    {
      mmdd: "06-01",
      titleKhmer: "ទិវាកុមារអន្តរជាតិ (International Children's Day)",
      titleEnglish: "International Children's Day",
      type: "international_observance",
      categoryLabel: "🧒 ទិវាអន្តរជាតិ",
      isPublicHoliday: false,
      description: "ទិវាលើកកម្ពស់សិទ្ធិ ការអប់រំ ការការពារ និងសុខុមាលភាពរបស់កុមារទូទាំងពិភពលោក។",
    },
    {
      mmdd: "06-05",
      titleKhmer: "ទិវាបរិស្ថានពិភពលោក និងបរិស្ថានជាតិ (World Environment Day)",
      titleEnglish: "World Environment Day",
      type: "international_observance",
      categoryLabel: "🌱 ទិវាអន្តរជាតិ & ជាតិ",
      isPublicHoliday: false,
      description: "ទិវាអំពាវនាវឱ្យរួមគ្នាថែរក្សាការពារបរិស្ថាន ព្រៃឈើ និងភពផែនដី។",
    },
    {
      mmdd: "06-18",
      titleKhmer: "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម សម្ដេចព្រះមហាក្សត្រី នរោត្តម មុនិនាថ សីហនុ",
      titleEnglish: "Queen Mother Norodom Monineath Sihanouk's Birthday",
      type: "national_holiday",
      categoryLabel: "👑 ថ្ងៃបុណ្យជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ថ្ងៃឈប់សម្រាកផ្លូវការអបអរសាទរព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្មសម្ដេចព្រះវររាជមាតាជាតិខ្មែរ។",
    },

    // SEPTEMBER
    {
      mmdd: "09-24",
      titleKhmer: "ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ (National Constitution Day)",
      titleEnglish: "Constitution Day",
      type: "national_holiday",
      categoryLabel: "📜 ថ្ងៃបុណ្យជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "រំឭកដល់ការប្រកាសឱ្យប្រើរដ្ឋធម្មនុញ្ញនៃព្រះរាជាណាចក្រកម្ពុជា (២៤ កញ្ញា ១៩៩៣)។",
    },

    // OCTOBER
    {
      mmdd: "10-05",
      titleKhmer: "ទិវាគ្រូបង្រៀនពិភពលោក និងជាតិ (World & National Teachers' Day)",
      titleEnglish: "Teachers' Day",
      type: "international_observance",
      categoryLabel: "🎓 ទិវាជាតិ & អន្តរជាតិ",
      isPublicHoliday: false,
      description: "ទិវាដឹងគុណលោកគ្រូអ្នកគ្រូដែលបានលះបង់កម្លាំងកាយចិត្តបណ្ដុះបណ្ដាលវិជ្ជាជីវៈ និងធនធានមនុស្ស។",
    },
    {
      mmdd: mov.pchumBenStart,
      titleKhmer: "ពិធីបុណ្យភ្ជុំបិណ្ឌ - ថ្ងៃទី ១ (Pchum Ben Day 1)",
      titleEnglish: "Pchum Ben Ancestors' Festival (Day 1)",
      type: "traditional_holiday",
      categoryLabel: "🪷 បុណ្យប្រពៃណីជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ពិធីបុណ្យប្រពៃណីជាតិដ៏ធំរបស់ខ្មែរ ឧទ្ទិសកុសលជូនដល់បុព្វការីជន និងញាតិការទាំង ៧ សន្ដាន។",
    },
    {
      mmdd: mov.pchumBenMid,
      titleKhmer: "ពិធីបុណ្យភ្ជុំបិណ្ឌ - ថ្ងៃទី ២ ភ្ជុំធំ (Pchum Ben Day 2)",
      titleEnglish: "Pchum Ben Ancestors' Festival (Day 2 - Big Day)",
      type: "traditional_holiday",
      categoryLabel: "🪷 បុណ្យប្រពៃណីជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ថ្ងៃភ្ជុំធំ (១៥ រោច ខែភទ្របទ) ប្រជាពលរដ្ឋជួបជុំគ្រួសារយកចង្ហាន់ទៅប្រគេនព្រះសង្ឃនៅវត្តអារាម។",
    },
    {
      mmdd: mov.pchumBenEnd,
      titleKhmer: "ពិធីបុណ្យភ្ជុំបិណ្ឌ - ថ្ងៃទី ៣ ឆ្លងបុណ្យ (Pchum Ben Day 3)",
      titleEnglish: "Pchum Ben Ancestors' Festival (Day 3)",
      type: "traditional_holiday",
      categoryLabel: "🪷 បុណ្យប្រពៃណីជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ថ្ងៃឆ្លងពិធីបុណ្យភ្ជុំបិណ្ឌ និងទទួលពរជ័យសិរីសួស្ដីពីព្រះសង្ឃ និងឪពុកម្ដាយ។",
    },
    {
      mmdd: "10-15",
      titleKhmer: "ទិវាគោរពព្រះវិញ្ញាណក្ខន្ធ ព្រះបរមរតនកោដ្ឋ ព្រះបាទសម្ដេចព្រះ នរោត្តម សីហនុ",
      titleEnglish: "Commemoration Day of King Father Norodom Sihanouk",
      type: "national_holiday",
      categoryLabel: "👑 ថ្ងៃបុណ្យជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ថ្ងៃឈប់សម្រាកផ្លូវការដើម្បីគោរពដឹងគុណព្រះមហាវីរក្សត្រ ព្រះវររាជបិតាឯករាជ្យជាតិខ្មែរ។",
    },
    {
      mmdd: "10-29",
      titleKhmer: "ព្រះរាជពិធីគ្រងព្រះបរមរាជសម្បត្តិរបស់ព្រះមហាក្សត្រ (King's Coronation Day)",
      titleEnglish: "King Norodom Sihamoni's Coronation Day",
      type: "national_holiday",
      categoryLabel: "👑 ថ្ងៃបុណ្យជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ថ្ងៃឈប់សម្រាកផ្លូវការរំឭកដល់ការឡើងគ្រងរាជសម្បត្តិរបស់ព្រះករុណា ព្រះបាទសម្ដេចព្រះបរមនាថ នរោត្តម សីហមុនី។",
    },

    // NOVEMBER
    {
      mmdd: "11-09",
      titleKhmer: "ទិវាបុណ្យឯករាជ្យជាតិ ៩ វិច្ឆិកា (National Independence Day)",
      titleEnglish: "National Independence Day",
      type: "national_holiday",
      categoryLabel: "🇰🇭🔥 ថ្ងៃបុណ្យឯករាជ្យជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ប្រារព្ធខួបនៃការទទួលបានឯករាជ្យពេញលេញរបស់កម្ពុជាពីអាណានិគមបារាំង (៩ វិច្ឆិកា ១៩៥៣)។",
    },
    {
      mmdd: mov.waterFestival1,
      titleKhmer: "ព្រះរាជពិធីបុណ្យអុំទូក បណ្ដែតប្រទីប និងសំពះព្រះខែ អកអំបុក (ថ្ងៃទី ១)",
      titleEnglish: "Cambodia Water Festival (Day 1)",
      type: "traditional_holiday",
      categoryLabel: "🚣‍♂️🌕 ព្រះរាជពិធីបុណ្យប្រពៃណី & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ថ្ងៃទី ១ នៃព្រះរាជពិធីបុណ្យអុំទូក រំឭកដល់វីរភាពកងទ័ពជើងទឹកខ្មែរ និងអំណរគុណដល់ទន្លេមេគង្គ។",
    },
    {
      mmdd: mov.waterFestival2,
      titleKhmer: "ព្រះរាជពិធីបុណ្យអុំទូក - ពិធីបណ្ដែតប្រទីប និងសំពះព្រះខែ អកអំបុក (ថ្ងៃទី ២)",
      titleEnglish: "Cambodia Water Festival (Day 2 - Moon Salutation)",
      type: "traditional_holiday",
      categoryLabel: "🚣‍♂️🌕 ព្រះរាជពិធីបុណ្យប្រពៃណី & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ថ្ងៃទី ២ (ពេញបូណ៌មី ខែកត្តិក) ប្រារព្ធពិធីបណ្ដែតប្រទីប សំពះព្រះខែ និងអកអំបុក។",
    },
    {
      mmdd: mov.waterFestival3,
      titleKhmer: "ព្រះរាជពិធីបុណ្យអុំទូក - ថ្ងៃកាត់ព្រ័ត្រ (ថ្ងៃទី ៣)",
      titleEnglish: "Cambodia Water Festival (Day 3 - Final Race)",
      type: "traditional_holiday",
      categoryLabel: "🚣‍♂️🌕 ព្រះរាជពិធីបុណ្យប្រពៃណី & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ថ្ងៃទី ៣ (ថ្ងៃកាត់ព្រ័ត្រ) បិទបញ្ចប់ការប្រណាំងទូកង និងប្រគល់ពានរង្វាន់ជ័យលាភី។",
    },

    // DECEMBER
    {
      mmdd: "12-10",
      titleKhmer: "ទិវាសិទ្ធិមនុស្សអន្តរជាតិ (International Human Rights Day)",
      titleEnglish: "International Human Rights Day",
      type: "international_observance",
      categoryLabel: "🕊️ ទិវាអន្តរជាតិសំខាន់",
      isPublicHoliday: false,
      description: "រំឭកដល់ការអនុម័តសេចក្ដីប្រកាសជាសកលស្ដីពីសិទ្ធិមនុស្សរបស់អង្គការសហប្រជាជាតិ។",
    },
    {
      mmdd: "12-29",
      titleKhmer: "ទិវាសន្តិភាពនៅកម្ពុជា (Cambodia Peace Day)",
      titleEnglish: "Peace Day in Cambodia",
      type: "national_holiday",
      categoryLabel: "🕊️🇰🇭 ថ្ងៃបុណ្យជាតិ & ឈប់សម្រាកផ្លូវការ",
      isPublicHoliday: true,
      description: "ថ្ងៃឈប់សម្រាកផ្លូវការអបអរសាទរការបញ្ចប់សង្គ្រាមទាំងស្រុង និងការទទួលបានសន្តិភាពពេញលេញ (២៩ ធ្នូ)។",
    },
  ];

  return rawList
    .map((ev, idx) => {
      const [mStr, dStr] = ev.mmdd.split("-");
      const m = Number(mStr);
      const d = Number(dStr);
      const iso = `${y}-${mStr}-${dStr}`;
      return {
        id: `event-${y}-${idx + 1}`,
        iso,
        year: y,
        month: m,
        day: d,
        khmerDateShort: `ថ្ងៃទី ${toKhmerNumber(d)} ខែ${KHMER_SOLAR_MONTHS[m - 1]}`,
        ...ev,
      };
    })
    .sort((a, b) => a.iso.localeCompare(b.iso));
}

/**
 * Builds Full Daily Comprehensive Calendar Object for any date
 */
export function getDailyCalendarComprehensiveData(inputDate = new Date()) {
  const solar = getKhmerSolarDate(inputDate);
  const lunar = getKhmerLunarDate(inputDate);
  const sil = getSilDayInfo(inputDate);

  const allEventsThisYear = getAllCambodiaEventsForYear(solar.year);
  const allEventsNextYear = getAllCambodiaEventsForYear(solar.year + 1);

  const todayIso = solar.iso;
  const todayDateObj = new Date(`${todayIso}T00:00:00Z`);

  const decorateEvent = (ev) => {
    const evDateObj = new Date(`${ev.iso}T00:00:00Z`);
    const diffDays = Math.round((evDateObj.getTime() - todayDateObj.getTime()) / 86400000);
    let statusLabelKhmer = "";
    if (diffDays === 0) {
      statusLabelKhmer = "🔔 ថ្ងៃនេះផ្ទាល់! (Today)";
    } else if (diffDays > 0) {
      statusLabelKhmer = `⏳ នៅសល់ ${toKhmerNumber(diffDays)} ថ្ងៃទៀត`;
    } else {
      statusLabelKhmer = `✅ បានកន្លងផុត ${toKhmerNumber(Math.abs(diffDays))} ថ្ងៃមុន`;
    }
    return {
      ...ev,
      diffDays,
      statusLabelKhmer,
    };
  };

  const decoratedThisYear = allEventsThisYear.map(decorateEvent);
  const decoratedNextYear = allEventsNextYear.map(decorateEvent);

  const todayEvents = decoratedThisYear.filter((e) => e.iso === todayIso);
  const isTodayPublicHoliday = todayEvents.some((e) => e.isPublicHoliday);

  // Upcoming pool (all future events)
  const upcomingEvents = [
    ...decoratedThisYear.filter((e) => e.diffDays >= 0),
    ...decoratedNextYear.filter((e) => e.diffDays >= 0),
  ].slice(0, 5);

  const nextUpcomingEvent = upcomingEvents[0] || null;

  // Day off / Work status
  let dayOffStatus = "";
  if (isTodayPublicHoliday) {
    const holidayNames = todayEvents
      .filter((e) => e.isPublicHoliday)
      .map((e) => e.titleKhmer)
      .join(" និង ");
    dayOffStatus = `🔴 <b>ថ្ងៃឈប់សម្រាកការងារផ្លូវការនៅកម្ពុជា (Public Holiday)</b>៖ «${holidayNames}»`;
  } else if (solar.weekdayIdx === 0) {
    dayOffStatus = `🟢 <b>ថ្ងៃអាទិត្យ (ចុងសប្ដាហ៍)</b>៖ សម្រាកចុងសប្ដាហ៍ទូទៅ`;
  } else if (solar.weekdayIdx === 6) {
    dayOffStatus = `🟡 <b>ថ្ងៃសៅរ៍ (ចុងសប្ដាហ៍)</b>៖ សម្រាកកន្លះថ្ងៃ ឬពេញមួយថ្ងៃតាមស្ថាប័ន`;
  } else {
    dayOffStatus = `🟢 <b>ថ្ងៃធ្វើការធម្មតា (Regular Working Day)</b>`;
  }

  // Summary Notification Banner
  let summaryNotificationBanner = "";
  if (todayEvents.length > 0 && sil.isTodaySilDay) {
    summaryNotificationBanner = `🔔 <b>ជូនដំណឹងពិសេសថ្ងៃនេះ៖</b> គឺជា «${todayEvents
      .map((e) => e.titleKhmer)
      .join(" និង ")}» ហើយក៏ត្រូវជា <b>«ថ្ងៃសីល (${sil.silType})»</b> ផងដែរ! ${
      isTodayPublicHoliday ? "🔴 (ឈប់សម្រាកផ្លូវការ)" : ""
    }`;
  } else if (todayEvents.length > 0) {
    summaryNotificationBanner = `🔔 <b>ជូនដំណឹងពិសេសថ្ងៃនេះ៖</b> គឺជា «${todayEvents
      .map((e) => e.titleKhmer)
      .join(" និង ")}» ${isTodayPublicHoliday ? "🔴 (ថ្ងៃឈប់សម្រាកការងារផ្លូវការ)" : "🔵 (ទិវាសំខាន់)"}!`;
  } else if (sil.isTodaySilDay) {
    summaryNotificationBanner = `🪷🔔 <b>ជូនដំណឹងពិសេសថ្ងៃនេះ៖</b> គឺជា <b>«ថ្ងៃសីល (${sil.silType})»</b>! សូមពុទ្ធបរិស័ទរក្សាសីល សមាទានសីល និងធ្វើបុណ្យទាន។`;
  } else if (nextUpcomingEvent) {
    summaryNotificationBanner = `📅 ថ្ងៃនេះជា${dayOffStatus.replace(/<[^>]+>/g, "")}។ 🔔 ព្រឹត្តិការណ៍បន្ទាប់គឺ៖ «${
      nextUpcomingEvent.titleKhmer
    }» នៅ${nextUpcomingEvent.khmerDateShort} (${nextUpcomingEvent.statusLabelKhmer})!`;
  } else {
    summaryNotificationBanner = `📅 ប្រតិទិនប្រចាំថ្ងៃ៖ ${solar.solarFull}។`;
  }

  return {
    ok: true,
    todayIso,
    solar,
    lunar,
    sil,
    todayEvents,
    isTodayPublicHoliday,
    dayOffStatus,
    summaryNotificationBanner,
    nextUpcomingEvent,
    upcomingEvents,
    totalPublicHolidaysThisYear: decoratedThisYear.filter((e) => e.isPublicHoliday).length,
    totalEventsCountThisYear: decoratedThisYear.length,
    allEvents: decoratedThisYear,
  };
}

/**
 * Formats Telegram HTML Message for Daily Calendar Report
 */
export function formatDailyCalendarTelegramHtml(calData) {
  const solar = calData.solar;
  const lunar = calData.lunar;
  const sil = calData.sil;

  // 1. Solar Date
  const solarHtml = `☀️ <b>១. កាលបរិច្ឆេទសុរិយគតិ (Solar Date)៖</b>\n• <b>${solar.solarFull}</b> (គ.ស. ${toKhmerNumber(
    solar.year
  )})`;

  // 2. Lunar Date
  const lunarHtml = `🌙 <b>២. កាលបរិច្ឆេទចន្ទគតិ (Khmer Lunar Date)៖</b>\n• <b>${lunar.lunarFull}</b>\n• ដំណាក់កាលព្រះចន្ទ៖ <b>${
    lunar.lunarPhaseKhmer
  }</b>`;

  // 3. Sil Day (ថ្ងៃសីល)
  const silBadge = sil.isTodaySilDay
    ? `🪷🔔 <b>ថ្ងៃនេះជា «ថ្ងៃសីល (${sil.silType})»!</b>\n   • ${sil.silDescription}\n   • សូមពុទ្ធបរិស័ទទាំងអស់រក្សាសីល ៥ ឬសីល ៨ ធ្វើបុណ្យទាន និងចម្រើនមេត្តាធម៌។`
    : `🪷 <b>ថ្ងៃនេះមិនមែនជាថ្ងៃសីលទេ</b>\n   • ⏳ <b>ថ្ងៃសីលបន្ទាប់គឺ៖</b> ${sil.nextSilKhmerDate}\n   • នៅសល់ <b>${toKhmerNumber(
        sil.daysUntilSil
      )} ថ្ងៃទៀត</b> (ដំណាក់កាល៖ <b>${sil.nextSilType}</b>)`;

  const silHtml = `🪷 <b>៣. ស្ថានភាពថ្ងៃសីល (Buddhist Holy Day)៖</b>\n${silBadge}`;

  // 4. National & International Holidays
  let holidayHtml = "";
  const holidaysToday = calData.todayEvents.filter(
    (e) => e.type === "national_holiday" || e.type === "international_holiday" || e.type === "traditional_holiday" || e.type === "buddhist_festival"
  );
  if (holidaysToday.length > 0) {
    holidayHtml = `🇰🇭🌍 <b>៤. ថ្ងៃបុណ្យជាតិ និងបុណ្យអន្តរជាតិថ្ងៃនេះ៖</b>\n` +
      holidaysToday.map((h) => `• <b>${h.titleKhmer}</b> (${h.categoryLabel})\n   💡 <i>${h.description}</i>`).join("\n");
  } else {
    holidayHtml = `🇰🇭🌍 <b>៤. ថ្ងៃបុណ្យជាតិ និងបុណ្យអន្តរជាតិ៖</b>\n• ថ្ងៃនេះគ្មានពិធីបុណ្យជាតិធំ ឬបុណ្យអន្តរជាតិទេ (ជាថ្ងៃធម្មតា)`;
  }

  // 5. Day Off / Public Holiday Status
  const dayOffHtml = `🔴 <b>៥. ស្ថានភាពថ្ងៃឈប់សម្រាក (Day Off Status)៖</b>\n• ${calData.dayOffStatus}`;

  // 6. National & International Observances (ទិវាជាតិ និងទិវាអន្តរជាតិ)
  let observancesHtml = "";
  const observancesToday = calData.todayEvents.filter(
    (e) => e.type === "national_observance" || e.type === "international_observance"
  );
  if (observancesToday.length > 0) {
    observancesHtml = `🏛️ <b>៦. ទិវាជាតិ និងទិវាអន្តរជាតិថ្ងៃនេះ៖</b>\n` +
      observancesToday.map((o) => `• <b>${o.titleKhmer}</b>\n   💡 <i>${o.description}</i>`).join("\n");
  } else {
    observancesHtml = `🏛️ <b>៦. ទិវាជាតិ និងទិវាអន្តរជាតិ៖</b>\n• ថ្ងៃនេះគ្មានទិវាជាតិ ឬទិវាអន្តរជាតិផ្លូវការទេ`;
  }

  // 7. Upcoming Events
  const upcomingRows = calData.upcomingEvents
    .map(
      (e, i) =>
        `${i + 1}. 🗓️ <b>${e.khmerDateShort}</b> (${e.statusLabelKhmer})\n   • <b>${e.titleKhmer}</b> ${
          e.isPublicHoliday ? "🔴[ឈប់សម្រាក]" : "🔵[ទិវាសំខាន់]"
        }\n   • <i>${e.description}</i>`
    )
    .join("\n\n");
  const upcomingHtml = `⏳ <b>៧. ពិធីបុណ្យ និងទិវាសំខាន់ៗជិតមកដល់បន្ទាប់៖</b>\n${upcomingRows}`;

  const header = `🇰🇭📅 <b>របាយការណ៍ប្រតិទិនប្រចាំថ្ងៃ និងអ្នកជូនដំណឹងព្រឹត្តិការណ៍កម្ពុជា</b>\n(រាយការណ៍ស្វ័យប្រវត្តិកាលបរិច្ឆេទ សុរិយគតិ-ចន្ទគតិ, ថ្ងៃសីល, ថ្ងៃបុណ្យជាតិ-អន្តរជាតិ, ថ្ងៃឈប់សម្រាក, និងទិវាសំខាន់ៗ)\n\n` +
    `📢 <b>សេចក្ដីសង្ខេបប្រចាំថ្ងៃ៖</b>\n${calData.summaryNotificationBanner}\n\n`;

  return `${header}${solarHtml}\n\n${lunarHtml}\n\n${silHtml}\n\n${holidayHtml}\n\n${dayOffHtml}\n\n${observancesHtml}\n\n${upcomingHtml}`;
}

/**
 * Creates SVG Visual Card for Cambodia Calendar & Sil Day
 */
export function createComprehensiveCalendarSvgCard(calData) {
  const solar = calData.solar;
  const lunar = calData.lunar;
  const sil = calData.sil;

  const solarLine = escapeSvgXml(solar.solarFull);
  const lunarLine = escapeSvgXml(lunar.lunarFull);
  const silBadgeText = escapeSvgXml(
    sil.isTodaySilDay
      ? `🪷 ថ្ងៃនេះជា «ថ្ងៃសីល (${sil.silType})»!`
      : `⏳ ថ្ងៃសីលបន្ទាប់៖ ${sil.nextSilType} (នៅសល់ ${toKhmerNumber(sil.daysUntilSil)} ថ្ងៃ)`
  );
  const banner = escapeSvgXml((calData.summaryNotificationBanner || "").replace(/<[^>]+>/g, "").slice(0, 72));

  const upcoming = (calData.upcomingEvents || []).slice(0, 3);
  const rowsSvg = upcoming
    .map((ev, i) => {
      const y = 255 + i * 54;
      const title = escapeSvgXml(ev.titleKhmer.slice(0, 42));
      const dShort = escapeSvgXml(ev.khmerDateShort);
      const status = escapeSvgXml(ev.statusLabelKhmer);
      const isOff = ev.isPublicHoliday;
      return `
        <rect x="36" y="${y}" width="728" height="46" rx="10" fill="#0f172a" fill-opacity="0.88" stroke="${
        isOff ? "#ef4444" : "#10b981"
      }" stroke-width="1" stroke-opacity="0.45"/>
        <text x="52" y="${y + 28}" fill="#ffffff" font-family="Noto Sans Khmer, sans-serif" font-size="16" font-weight="bold">${i + 1}. ${title}</text>
        <text x="748" y="${y + 28}" text-anchor="end" fill="#fde047" font-family="Noto Sans Khmer, sans-serif" font-size="14">${dShort} (${status})</text>
      `;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <defs>
      <linearGradient id="calGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#064e3b"/>
        <stop offset="50%" stop-color="#022c22"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="800" height="450" rx="24" fill="url(#calGrad)" stroke="#10b981" stroke-width="2" stroke-opacity="0.6"/>
    
    <!-- Header -->
    <text x="36" y="44" fill="#34d399" font-family="Noto Sans Khmer, sans-serif" font-size="20" font-weight="bold">🇰🇭📅 របាយការណ៍ប្រតិទិនកម្ពុជាប្រចាំថ្ងៃ &amp; អ្នកជូនដំណឹងថ្ងៃសីល-ថ្ងៃបុណ្យ</text>
    
    <!-- Main Card Box -->
    <rect x="36" y="60" width="728" height="175" rx="14" fill="#030712" fill-opacity="0.82" stroke="#fbbf24" stroke-width="1.4"/>
    
    <!-- Solar Date -->
    <text x="56" y="94" fill="#fde047" font-family="Noto Sans Khmer, sans-serif" font-size="19" font-weight="bold">☀️ សុរិយគតិ៖ ${solarLine}</text>
    
    <!-- Lunar Date -->
    <text x="56" y="128" fill="#38bdf8" font-family="Noto Sans Khmer, sans-serif" font-size="18" font-weight="bold">🌙 ចន្ទគតិ៖ ${lunarLine}</text>
    
    <!-- Sil Day Pill -->
    <rect x="56" y="145" width="480" height="32" rx="8" fill="${sil.isTodaySilDay ? "#854d0e" : "#1e293b"}" stroke="${sil.isTodaySilDay ? "#facc15" : "#64748b"}" stroke-width="1"/>
    <text x="70" y="167" fill="${sil.isTodaySilDay ? "#fef08a" : "#cbd5e1"}" font-family="Noto Sans Khmer, sans-serif" font-size="15" font-weight="bold">${silBadgeText}</text>
    
    <!-- Summary notification -->
    <text x="56" y="205" fill="#e2e8f0" font-family="Noto Sans Khmer, sans-serif" font-size="14">${banner}</text>
    <text x="56" y="224" fill="#a7f3d0" font-family="Noto Sans Khmer, sans-serif" font-size="13">🔴 ថ្ងៃឈប់សម្រាកសរុបឆ្នាំ ${toKhmerNumber(solar.year)}៖ ${toKhmerNumber(calData.totalPublicHolidaysThisYear)} ថ្ងៃ | ព្រឹត្តិការណ៍សរុប៖ ${toKhmerNumber(calData.totalEventsCountThisYear)} ទិវា</text>

    <!-- Upcoming Events Section -->
    <text x="36" y="248" fill="#93c5fd" font-family="Noto Sans Khmer, sans-serif" font-size="14" font-weight="bold">⏳ ពិធីបុណ្យជាតិ-អន្តរជាតិ និងទិវាសំខាន់ៗបន្ទាប់៖</text>
    ${rowsSvg}
    
    <!-- Footer watermark -->
    <text x="760" y="435" text-anchor="end" fill="#64748b" font-family="Noto Sans Khmer, sans-serif" font-size="12">Khmer Super AI Agent • ប្រតិទិនប្រចាំថ្ងៃស្វ័យប្រវត្តិ ២៤/៧</text>
  </svg>`;
}

function escapeSvgXml(str = "") {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
