import { toJewishDate, toHebrewJewishDate } from "jewish-date";

/**
 * Returns the Hebrew day string (e.g. "י״ז אייר") for a given Gregorian date.
 */
export function getHebrewDateString(year: number, month: number, day: number): string {
  const jewishDate = toJewishDate(new Date(year, month, day));
  const hebrewDate = toHebrewJewishDate(jewishDate);
  return `${hebrewDate.day} ${hebrewDate.monthName}`;
}

/**
 * Returns just the Hebrew day number string (e.g. "י״ז") for compact display.
 */
export function getHebrewDay(year: number, month: number, day: number): string {
  const jewishDate = toJewishDate(new Date(year, month, day));
  const hebrewDate = toHebrewJewishDate(jewishDate);
  return hebrewDate.day;
}
