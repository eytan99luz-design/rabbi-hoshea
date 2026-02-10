export const MASECHET_LIST = [
  { hebrew: "ברכות", english: "Brachot" },
  { hebrew: "שבת", english: "Shabbat" },
  { hebrew: "עירובין", english: "Eruvin" },
  { hebrew: "פסחים", english: "Pesachim" },
  { hebrew: "שקלים", english: "Shekalim" },
  { hebrew: "יומא", english: "Yoma" },
  { hebrew: "סוכה", english: "Sukkah" },
  { hebrew: "ביצה", english: "Beitzah" },
  { hebrew: "ראש השנה", english: "Rosh Hashanah" },
  { hebrew: "תענית", english: "Taanit" },
  { hebrew: "מגילה", english: "Megillah" },
  { hebrew: "מועד קטן", english: "Moed Katan" },
  { hebrew: "חגיגה", english: "Chagigah" },
  { hebrew: "יבמות", english: "Yevamot" },
  { hebrew: "כתובות", english: "Ketubot" },
  { hebrew: "נדרים", english: "Nedarim" },
  { hebrew: "נזיר", english: "Nazir" },
  { hebrew: "סוטה", english: "Sotah" },
  { hebrew: "גיטין", english: "Gittin" },
  { hebrew: "קידושין", english: "Kiddushin" },
  { hebrew: "בבא קמא", english: "Bava Kamma" },
  { hebrew: "בבא מציעא", english: "Bava Metzia" },
  { hebrew: "בבא בתרא", english: "Bava Batra" },
  { hebrew: "סנהדרין", english: "Sanhedrin" },
  { hebrew: "מכות", english: "Makkot" },
  { hebrew: "שבועות", english: "Shevuot" },
  { hebrew: "עבודה זרה", english: "Avodah Zarah" },
  { hebrew: "הוריות", english: "Horayot" },
  { hebrew: "זבחים", english: "Zevachim" },
  { hebrew: "מנחות", english: "Menachot" },
  { hebrew: "חולין", english: "Chullin" },
  { hebrew: "בכורות", english: "Bechorot" },
  { hebrew: "ערכין", english: "Arachin" },
  { hebrew: "תמורה", english: "Temurah" },
  { hebrew: "כריתות", english: "Keritot" },
  { hebrew: "מעילה", english: "Meilah" },
  { hebrew: "תמיד", english: "Tamid" },
  { hebrew: "נידה", english: "Niddah" },
] as const;

export type MasechetHebrew = typeof MASECHET_LIST[number]["hebrew"];

export function parseTitleForMasechetDaf(title: string): { masechet: string | null; daf: number | null } {
  for (const m of MASECHET_LIST) {
    const regex = new RegExp(`${m.hebrew}\\s+(?:מ?דף\\s+)?(\\p{N}+|[א-ת]{1,3})(?:\\s|$|\\.)`, 'u');
    const match = title.match(regex);
    if (match) {
      const dafStr = match[1];
      if (['עמ', 'של', 'על', 'את', 'לא'].includes(dafStr)) continue;
      // Try parsing as number first
      const num = parseInt(dafStr, 10);
      if (!isNaN(num)) {
        return { masechet: m.hebrew, daf: num };
      }
      // Try Hebrew gematria
      const gematria = hebrewToNumber(dafStr);
      if (gematria) {
        return { masechet: m.hebrew, daf: gematria };
      }
    }
  }
  return { masechet: null, daf: null };
}

function hebrewToNumber(str: string): number | null {
  const values: Record<string, number> = {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
    'י': 10, 'כ': 20, 'ל': 30, 'מ': 40, 'נ': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'צ': 90,
    'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400,
  };
  let total = 0;
  for (const ch of str) {
    if (values[ch]) {
      total += values[ch];
    } else {
      return null;
    }
  }
  return total > 0 ? total : null;
}

export function getMasechetEnglish(hebrew: string): string {
  const found = MASECHET_LIST.find(m => m.hebrew === hebrew);
  return found?.english ?? hebrew;
}

export function numberToHebrewDaf(num: number): string {
  if (num <= 0) return String(num);
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const hundreds = ['', 'ק', 'ר', 'ש', 'ת'];

  if (num === 15) return 'טו';
  if (num === 16) return 'טז';

  let result = '';
  if (num >= 100) {
    result += hundreds[Math.floor(num / 100)];
    num %= 100;
  }
  if (num >= 10) {
    result += tens[Math.floor(num / 10)];
    num %= 10;
  }
  result += ones[num];
  return result;
}
