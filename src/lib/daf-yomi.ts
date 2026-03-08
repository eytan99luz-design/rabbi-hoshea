// Daf Yomi cycle calculation
// Cycle 14 started on January 5, 2020

const DAF_YOMI_MASECHTOT = [
  { name: "ברכות", dafim: 63 },
  { name: "שבת", dafim: 156 },
  { name: "עירובין", dafim: 104 },
  { name: "פסחים", dafim: 120 },
  { name: "שקלים", dafim: 21 },
  { name: "יומא", dafim: 87 },
  { name: "סוכה", dafim: 55 },
  { name: "ביצה", dafim: 39 },
  { name: "ראש השנה", dafim: 34 },
  { name: "תענית", dafim: 30 },
  { name: "מגילה", dafim: 31 },
  { name: "מועד קטן", dafim: 28 },
  { name: "חגיגה", dafim: 26 },
  { name: "יבמות", dafim: 121 },
  { name: "כתובות", dafim: 111 },
  { name: "נדרים", dafim: 90 },
  { name: "נזיר", dafim: 65 },
  { name: "סוטה", dafim: 48 },
  { name: "גיטין", dafim: 89 },
  { name: "קידושין", dafim: 81 },
  { name: "בבא קמא", dafim: 118 },
  { name: "בבא מציעא", dafim: 118 },
  { name: "בבא בתרא", dafim: 175 },
  { name: "סנהדרין", dafim: 112 },
  { name: "מכות", dafim: 23 },
  { name: "שבועות", dafim: 48 },
  { name: "עבודה זרה", dafim: 75 },
  { name: "הוריות", dafim: 13 },
  { name: "זבחים", dafim: 119 },
  { name: "מנחות", dafim: 109 },
  { name: "חולין", dafim: 141 },
  { name: "בכורות", dafim: 60 },
  { name: "ערכין", dafim: 33 },
  { name: "תמורה", dafim: 33 },
  { name: "כריתות", dafim: 27 },
  { name: "מעילה", dafim: 21 },
  { name: "תמיד", dafim: 32 },
  { name: "נידה", dafim: 72 },
];

const TOTAL_DAFIM = DAF_YOMI_MASECHTOT.reduce((sum, m) => sum + m.dafim, 0);

// Cycle 14 start date: January 5, 2020
const CYCLE_14_START = new Date(2020, 0, 5); // Month is 0-indexed

export interface DafYomiInfo {
  masechet: string;
  daf: number; // 1-indexed daf within masechet (add 1 for actual daf number since we start from daf 2)
  actualDaf: number; // The actual daf number (daf 2 = first daf)
}

export function getTodaysDafYomi(date: Date = new Date()): DafYomiInfo {
  const startDate = new Date(CYCLE_14_START);
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = targetDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Position within the cycle
  const posInCycle = ((diffDays % TOTAL_DAFIM) + TOTAL_DAFIM) % TOTAL_DAFIM;
  
  let remaining = posInCycle;
  for (const masechet of DAF_YOMI_MASECHTOT) {
    if (remaining < masechet.dafim) {
      return {
        masechet: masechet.name,
        daf: remaining + 1,
        actualDaf: remaining + 2, // Daf Yomi starts from daf 2
      };
    }
    remaining -= masechet.dafim;
  }
  
  // Fallback (shouldn't reach here)
  return { masechet: "ברכות", daf: 1, actualDaf: 2 };
}
