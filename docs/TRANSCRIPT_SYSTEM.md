# מערכת משיכת תמלולים מ-YouTube — תיעוד טכני מלא

מסמך זה מתאר end-to-end את כל מה שמתכנת צריך לדעת על המערכת ששואבת, שומרת ומציגה תמלולים של שיעורי וידאו מ-YouTube באתר של הרב הושע רבינוביץ׳.

> **קהל יעד:** מפתח/ת Full-Stack שמכיר/ה React + TypeScript + Supabase (Edge Functions, Postgres, RLS).

---

## 1. סקירה כללית

המערכת פותרת בעיה אחת: YouTube לא חושף API ציבורי רשמי שמחזיר תמלול אוטומטי (ASR) של סרטון ללא OAuth של בעל הערוץ. כדי בכל זאת לשאוב את התמלולים אנו משתמשים ב-3 שיטות במקביל, עם fallback בין שיטה לשיטה.

### זרימה כללית

```text
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  Lesson.tsx  /  Admin.tsx   │        │      videos table (Postgres) │
│  ──────────────────────────  │        │  id, youtube_id,             │
│  LessonTranscript            │◀──────▶│  transcript TEXT,            │
│  TranscriptFetcher (admin)   │        │  transcript_fetched_at TZ    │
└──────────────┬──────────────┘        └──────────────▲───────────────┘
               │ supabase.functions.invoke           │ UPDATE (service role)
               ▼                                      │
┌─────────────────────────────────────────────────────┴─────────────┐
│              Edge Function: fetch-transcript                       │
│  ────────────────────────────────────────────────────────────────  │
│   1. InnerTube API   (youtubei/v1/player)   ← primary             │
│   2. Watch-page scrape (extractJsonArrayAfter)  ← fallback #1     │
│   3. youtube-transcript.ai                  ← fallback #2         │
│   4. Parse XML (fmt=srv1) → join → cleanup                        │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. מסד הנתונים

### העמודות הרלוונטיות בטבלה `videos`

| עמודה                  | סוג           | תפקיד                                                              |
| ---------------------- | ------------- | ------------------------------------------------------------------ |
| `id`                   | `uuid`        | מפתח ראשי                                                          |
| `youtube_id`           | `text UNIQUE` | מזהה הסרטון ב-YouTube (11 תווים)                                   |
| `transcript`           | `text`        | התמלול המלא כטקסט נקי (NULL אם לא הצלחנו לשלוף)                    |
| `transcript_fetched_at`| `timestamptz` | מתי ניסינו לאחרונה. נשמר **גם בכשל** כדי שלא ננסה כל סרטון בלולאה |

### היגיון "ניסיון חוזר"

- בקריאה בודדת (`youtube_id` מהצופה): תמיד מנסים שוב, גם אם `transcript_fetched_at` קיים.
- בבאצ׳ של האדמין (`TranscriptFetcher.tsx`): השאילתה היא `transcript IS NULL` — כך גם סרטון שנכשל בעבר ייכנס שוב לתור (החלפנו זאת מהבדיקה הישנה של `transcript_fetched_at IS NULL`).

### RLS

הטבלה `videos` קריאה לכל המשתמשים (`SELECT` ל-`anon` ו-`authenticated`). כל הכתיבה מתבצעת ע״י ה-Edge Function שרץ עם `SUPABASE_SERVICE_ROLE_KEY` ולכן עוקף RLS. אין צורך במדיניות INSERT/UPDATE עבור משתמשים.

---

## 3. ה-Edge Function `fetch-transcript`

**מיקום:** `supabase/functions/fetch-transcript/index.ts`
**הגדרות:** `verify_jwt = false` (ב-`supabase/config.toml`) — לא דורש משתמש מחובר; השומר הוא ה-CORS וה-Service Role בצד שרת.
**משתני סביבה:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (מוזרקים אוטומטית).

### חתימת ה-API

```http
POST /functions/v1/fetch-transcript
Content-Type: application/json
```

| שדה ב-body     | סוג     | תיאור                                                  |
| -------------- | ------- | ------------------------------------------------------ |
| `youtube_id`   | string  | סרטון יחיד — שואב, שומר ב-DB, מחזיר את התמלול          |
| `batch`        | boolean | מצב באצ׳: ירוץ על כל סרטון עם `transcript IS NULL`     |
| `limit`        | number  | גודל באצ׳ (ברירת מחדל 25, מקסימום 50)                  |

### תשובות

- **מצב יחיד, הצלחה:**
  `{ "success": true, "transcript": "..." }`
- **מצב יחיד, אין כתוביות:**
  `{ "success": false, "transcript": null }` (נשמר `transcript_fetched_at` בלבד)
- **מצב באצ׳:**
  `{ "success": true, "processed": N, "withTranscript": K, "withoutTranscript": N-K }`
- **שגיאה כללית:** סטטוס 500, `{ "error": "..." }`

---

## 4. שלוש שיטות משיכת התמלול

### 4.1 InnerTube API (Primary)

InnerTube הוא ה-API הפנימי של YouTube שאפליקציית המובייל ונגן הווב משתמשים בו. הוא לא מתועד רשמית אבל יציב מאוד.

- **Endpoint:** `https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`
- **המפתח (`key`)** הוא ה-Innertube Public Key — מוטמע ב-HTML של youtube.com ולכן לא רגיש. השימוש בו לא מצריך OAuth.
- **שני clients מנוסים בסבב** כי לעיתים YouTube חוסם אחד מהם:

| client        | clientVersion       | User-Agent                                                                         |
| ------------- | ------------------- | ---------------------------------------------------------------------------------- |
| `ANDROID`     | `19.09.37`          | `com.google.android.youtube/19.09.37 (Linux; U; Android 14) gzip`                  |
| `WEB`         | `2.20240101.00.00`  | Chrome 120 על Windows                                                              |

- **גוף הבקשה:**

```json
{
  "videoId": "<YT_ID>",
  "context": {
    "client": {
      "clientName": "ANDROID",
      "clientVersion": "19.09.37",
      "hl": "iw",
      "gl": "IL"
    }
  }
}
```

- **חילוץ הטראקים:** `json.captions.playerCaptionsTracklistRenderer.captionTracks` — מערך של אובייקטים `{ baseUrl, languageCode, kind, vssId, name }`.
  - `kind === "asr"` ⇒ כתוביות אוטומטיות.
  - אין `kind` ⇒ כתוביות ידניות (מועדפות).

### 4.2 Scraping של דף ה-watch (Fallback #1)

כשה-InnerTube מחזיר `UNPLAYABLE` / `LOGIN_REQUIRED` (קורה לפעמים מ-IP של ענן) ננסה לקרוא את ה-HTML של `https://www.youtube.com/watch?v=ID&hl=he&persist_hl=1`.

ה-HTML מכיל את ה-`ytInitialPlayerResponse` כ-JSON ענק (~1MB). חילוץ באמצעות רגקס פשוט נכשל בגלל:
- מרכאות מבוצעות (`\"`) בתוך מחרוזות
- מערכים מקוננים (`[ [ ] ]`)
- אובייקטים שמכילים `]` בתוך מחרוזת

לכן כתבנו `extractJsonArrayAfter(html, key)` — סורק תו-תו, סופר עומק `[`/`]`, ומדלג על `\\`/מחרוזות:

```ts
function extractJsonArrayAfter(html: string, key: string): unknown[] | null {
  const keyIndex = html.indexOf(`"${key}":[`);
  if (keyIndex < 0) return null;
  const start = html.indexOf("[", keyIndex);
  let depth = 0, inString = false, escaped = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "[") depth++;
    if (ch === "]") depth--;
    if (depth === 0) return JSON.parse(html.slice(start, i + 1));
  }
  return null;
}
```

### 4.3 שירות חיצוני: `youtube-transcript.ai` (Fallback #2)

כאשר YouTube חוסם לחלוטין את ה-IP של הענן (קורה הרבה ב-Supabase Edge runtime), נשתמש ב:

```http
GET https://youtube-transcript.ai/transcript/<youtube_id>.txt?lang=iw
```

השירות מחזיר Markdown עם כותרת `## Transcript`. אנחנו מפצלים על המחרוזת הזו, מנקים `\r\n`, מצמצמים שורות ריקות עוקבות ובודקים שאין הודעות "sorry/blocking/not available" ושהאורך > 50 תווים — אחרת מחזירים `null`.

### 4.4 לוגיקת בחירת הטראק

אחרי שיש לנו `tracks[]` מכל מקור שהוא, בוחרים בסדר העדפה הבא:

```ts
const pick =
  tracks.find(t => (t.languageCode === "iw" || t.languageCode === "he") && !t.kind) // עברית ידנית
  || tracks.find(t => t.languageCode === "iw" || t.languageCode === "he")           // עברית ASR
  || tracks[0];                                                                      // כל שפה
```

> הערה: YouTube משתמש ב-`iw` (קוד ISO ישן לעברית) ולא ב-`he`, אך אנחנו בודקים את שניהם להגנה.

---

## 5. עיבוד ה-XML של הכתוביות

ה-`baseUrl` של ה-track יכול להחזיר כברירת מחדל פורמטים שונים (json3 / srv3). אנחנו מאלצים `srv1` (XML פשוט):

```ts
if (!/[?&]fmt=/.test(url)) url += `${url.includes("?") ? "&" : "?"}fmt=srv1`;
```

מבנה ה-XML שמתקבל:

```xml
<transcript>
  <text start="0.5" dur="2.3">שלום וברכה</text>
  <text start="2.8" dur="1.9">היום נלמד את הדף...</text>
</transcript>
```

החילוץ:

```ts
const re = /<text[^>]*>([\s\S]*?)<\/text>/g;
while ((mm = re.exec(xml))) {
  const txt = decodeHtml(mm[1].replace(/<[^>]+>/g, "")).trim();
  if (txt) parts.push(txt);
}
const transcript = parts.join(" ").replace(/\s+/g, " ").trim();
```

פונקציית `decodeHtml` מטפלת ב-`&amp; &lt; &gt; &quot; &#39;` ובכל ה-numeric entities (`&#1488;` וכו׳) — חשוב כי עברית מגיעה לעיתים כ-codepoints.

---

## 6. רכיבי ה-UI

### 6.1 `src/components/LessonTranscript.tsx` — תצוגת צופה

- מקבל `videoId`, `youtubeId`, `initialTranscript`, `fetchedAt` מ-`Lesson.tsx`.
- שלושה מצבים:
  1. **יש תמלול** ⇒ אזור גלילה מקס׳ 420px עם כפתור Copy.
  2. **ניסינו ואין** (`fetchedAt && !transcript`) ⇒ הודעה + כפתור "נסה שוב".
  3. **לא ניסינו** ⇒ כפתור "טען תמלול".
- קריאה ל-Edge Function: `supabase.functions.invoke("fetch-transcript", { body: { youtube_id } })`.
- RTL/LTR אוטומטי דרך `useLanguage()`.

### 6.2 `src/components/admin/TranscriptFetcher.tsx` — פאנל אדמין

- שאילתת `react-query` ל-3 ספירות במקביל: `total`, `withTranscript`, `attempted`. שימוש ב-`{ count: "exact", head: true }` כדי לעקוף את מגבלת 1000 השורות של PostgREST.
- `remaining = total - withTranscript` (לא − attempted; כך מאפשרים retry).
- כפתור הבאצ׳ מריץ לולאה: בכל איטרציה `invoke("fetch-transcript", { batch: true, limit: 20 })`, מעדכן progress, ומפסיק כש-`processed < 20`.
- בין איטרציות: רענון react-query כדי שה-UI יציג את ההתקדמות בזמן אמת.
- 250ms בין סרטון לסרטון בתוך הבאצ׳ (בתוך ה-Edge Function עצמו).

---

## 7. דיאגרמת רצף (Sequence)

### קריאה בודדת מהצופה

```text
User                 LessonTranscript           Edge Function          YouTube/External         DB
  │                       │                            │                       │                 │
  │── click "טען תמלול" ─▶│                            │                       │                 │
  │                       │── invoke({youtube_id}) ──▶│                       │                 │
  │                       │                            │── InnerTube ANDROID ─▶│                 │
  │                       │                            │◀── captionTracks ─────│                 │
  │                       │                            │── GET baseUrl?fmt=srv1▶│                │
  │                       │                            │◀── XML ───────────────│                 │
  │                       │                            │── UPDATE videos ──────────────────────▶│
  │                       │◀── { transcript } ─────────│                                         │
  │◀── render text ───────│                                                                      │
```

### באצ׳ אדמין

```text
Admin → TranscriptFetcher → invoke({batch:true, limit:20})
                                  │
                                  ├─ SELECT youtube_id FROM videos WHERE transcript IS NULL LIMIT 20
                                  │
                                  └─ FOR each video:
                                       fetchTranscript(youtube_id)   ← 3 שיטות + fallback
                                       UPDATE videos SET transcript=?, transcript_fetched_at=now()
                                       sleep(250ms)
                                  ↩ { processed, withTranscript, withoutTranscript }
        ↻ הלולאה ב-UI חוזרת עד processed < 20
```

---

## 8. כשלים והגבלות ידועות

| כשל                                                  | סיבה                                                       | התמודדות                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| InnerTube מחזיר `UNPLAYABLE` / `LOGIN_REQUIRED`     | חסימת IP של ענן (Supabase Edge רץ על Deno Deploy/AWS)      | Fallback ל-watch scrape ואז ל-`youtube-transcript.ai`    |
| watch HTML נטען אבל אין `captionTracks`              | סרטון ללא כתוביות כלל, או דף consent (אירופה)              | לוג: `no captionTracks in watch html; status=...`        |
| כתוביות עבריות אוטומטיות עם דיוק נמוך               | מודל ASR של YouTube לא מצוין בעברית                        | מסומן באתר רק כ-"תמלול אוטומטי" — בעתיד Whisper          |
| Rate limit                                           | יותר מדי בקשות מאותו IP                                    | 250ms שינה בין סרטונים בבאצ׳                             |
| תמלול ארוך (>1MB)                                    | Postgres `text` תומך, אבל JSON response יכול להאט          | אין כרגע — בעתיד דחיסה או storage                        |

### למה שומרים `transcript_fetched_at` גם בכשל?

כדי שהצופה לא יראה את כפתור "טען תמלול" אחרי שכבר ניסינו וכשלנו. במקום זה רואים "אין תמלול זמין" + כפתור "נסה שוב" יזום.

---

## 9. מדריך דיבאג

### צפייה בלוגים

- מתוך לובבל: כלי `supabase__edge_function_logs` עם `function_name: "fetch-transcript"`.
- בלוגים מודפסים מסרים כמו:
  - `no captionTracks in watch html for <ID>; status=200; len=1092612` ⇒ הסרטון אין לו כתוביות בכלל.
  - `watch fallback failed for <ID>: <Error>` ⇒ שגיאת רשת בזמן ה-scrape.

### שאילתות SQL שימושיות

```sql
-- כמה תמלולים יש?
SELECT
  count(*) FILTER (WHERE transcript IS NOT NULL) AS with_t,
  count(*) FILTER (WHERE transcript IS NULL AND transcript_fetched_at IS NOT NULL) AS failed,
  count(*) FILTER (WHERE transcript_fetched_at IS NULL) AS pending,
  count(*) AS total
FROM videos;

-- 10 הסרטונים האחרונים שנכשלו
SELECT youtube_id, title, transcript_fetched_at
FROM videos
WHERE transcript IS NULL AND transcript_fetched_at IS NOT NULL
ORDER BY transcript_fetched_at DESC
LIMIT 10;

-- איפוס לניסיון חוזר על כל הכשלים
UPDATE videos
SET transcript_fetched_at = NULL
WHERE transcript IS NULL;

-- אורך תמלולים (לאיתור תמלולים חתוכים)
SELECT youtube_id, length(transcript) AS len
FROM videos
WHERE transcript IS NOT NULL
ORDER BY len ASC
LIMIT 20;
```

### בדיקה ידנית מול InnerTube (curl)

```bash
curl -sS "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8" \
  -H "Content-Type: application/json" \
  -H "User-Agent: com.google.android.youtube/19.09.37 (Linux; U; Android 14) gzip" \
  -d '{"videoId":"z4rKOmC89J0","context":{"client":{"clientName":"ANDROID","clientVersion":"19.09.37","hl":"iw","gl":"IL"}}}' \
  | jq '.captions.playerCaptionsTracklistRenderer.captionTracks[] | {languageCode, kind, baseUrl}'
```

אם התשובה ריקה ⇒ לסרטון אין כתוביות, או IP חסום.

---

## 10. כיווני הרחבה

1. **תרגום לאנגלית** — קריאה ל-Lovable AI Gateway (`google/gemini-2.5-flash`) עם prompt תרגום, שמירה לעמודה חדשה `transcript_en`.
2. **שיפור fallback** — שילוב Whisper (OpenAI / `faster-whisper` self-hosted) על קובץ ה-audio שמורד דרך `yt-dlp`. נותן דיוק עברית הרבה יותר גבוה.
3. **שמירת timestamps** — במקום `parts.join(" ")` לשמור מערך `{ start, dur, text }` ב-JSONB ולאפשר קליק בתמלול → קפיצה בשנייה המתאימה בנגן.
4. **חיפוש Full-Text** — הוספת `tsvector` generated column על `transcript`, אינדקס GIN, ושאילתות `websearch_to_tsquery('hebrew', ?)`. משתלב יפה עם ה-AI search הקיים.
5. **YouTube Data API v3 — captions endpoint** — דורש OAuth של בעל הערוץ, אבל מחזיר תמלול ידני "נקי". אם הרב יחבר את הערוץ פעם אחת, זה הופך לפתרון העיקרי.

---

## 11. אבטחה

- **`SUPABASE_SERVICE_ROLE_KEY`** קיים רק בתוך ה-Edge Function. ה-client לעולם לא מקבל אותו.
- **`AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`** הוא ה-Innertube Public Key — לא רגיש, חשוף ב-HTML של youtube.com. אין צורך להעביר אותו לסודות.
- **CORS:** `Access-Control-Allow-Origin: *` — סביר כי הפונקציה לא חושפת מידע פרטי, רק תמלול ציבורי. אם מחפצים להגביל ⇒ לבדוק `req.headers.get("origin")`.
- **`verify_jwt = false`:** הפונקציה פתוחה לכל אחד. כיום זה בסדר כי היא רק שולפת תמלול שגם ככה ציבורי. אם מוסיפים פעולות יקרות (Whisper) — להחיל `verify_jwt = true` או לבדוק `has_role(uid, 'admin')` בתוך הפונקציה.
- **ולידציית קלט:** כרגע אנחנו סומכים על `youtube_id`. שיפור עתידי — zod schema:

```ts
const Schema = z.object({
  youtube_id: z.string().regex(/^[a-zA-Z0-9_-]{11}$/).optional(),
  batch: z.boolean().optional(),
  limit: z.number().int().min(1).max(50).optional(),
});
```

---

## 12. נספחים

### 12.1 קבצים שמעורבים במערכת

| קובץ                                                | תפקיד                                   |
| --------------------------------------------------- | --------------------------------------- |
| `supabase/functions/fetch-transcript/index.ts`      | ה-Edge Function (שלוש השיטות + DB)       |
| `supabase/migrations/2026061712...sql`              | הוספת `transcript`, `transcript_fetched_at` |
| `src/components/LessonTranscript.tsx`               | תצוגה לצופה בעמוד השיעור                |
| `src/components/admin/TranscriptFetcher.tsx`        | פאנל אדמין לבאצ׳                        |
| `src/pages/Lesson.tsx`                              | מטמיע את `LessonTranscript`             |
| `src/pages/Admin.tsx`                               | מטמיע את `TranscriptFetcher`            |
| `src/integrations/supabase/types.ts` (auto-gen)     | טיפוסי `transcript` ו-`transcript_fetched_at` |

### 12.2 Glossary

- **InnerTube** — ה-API הפנימי של YouTube שמשמש את האפליקציות והנגן.
- **ASR** — Automatic Speech Recognition. בכתוביות YouTube מסומן ב-`kind: "asr"`.
- **srv1 / srv3 / json3** — פורמטי כתוביות של YouTube. אנחנו מאלצים `srv1` (XML פשוט).
- **vssId** — Video Subtitle Source ID, מזהה ייחודי של טראק כתוביות.
- **kind** — ריק = כתוביות ידניות; `"asr"` = אוטומטיות.
- **captionTracks** — המערך שמחזיר את כל הטראקים הזמינים לסרטון.
- **`hl` / `gl`** — Host Language / Geo Location. מוגדרים `iw`/`IL` כדי לדחוף את YouTube להחזיר עברית קודם.

---

**עודכן לאחרונה:** יוני 2026
**נקודת קשר טכנית:** ראה `src/components/admin/TranscriptFetcher.tsx` לפעולות תפעוליות.