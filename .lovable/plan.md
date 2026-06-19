# תוכנית: מסמך תיעוד טכני מפורט למערכת התמלולים

אכין קובץ Markdown מקיף בעברית בשם `docs/TRANSCRIPT_SYSTEM.md` שיכיל את כל מה שמתכנת צריך לדעת כדי לתחזק, לדבג ולהרחיב את מערכת משיכת התמלולים מ-YouTube.

## מבנה המסמך

### 1. סקירה כללית (Overview)
- מטרת המערכת ותהליך משיכת התמלול end-to-end
- דיאגרמת זרימה (ASCII) של כל הרכיבים: UI → Edge Function → YouTube → DB

### 2. ארכיטקטורת מסד הנתונים
- טבלת `videos`: שדות `transcript` (TEXT), `transcript_fetched_at` (TIMESTAMPTZ)
- מדיניות RLS, אינדקסים רלוונטיים
- מיגרציה מקורית שיצרה את העמודות

### 3. ה-Edge Function: `fetch-transcript`
- מיקום: `supabase/functions/fetch-transcript/index.ts`
- שני מצבי הפעלה: `youtube_id` בודד / `batch + limit`
- הרשאות: רץ עם `SUPABASE_SERVICE_ROLE_KEY`, `verify_jwt=false`
- CORS, ניהול שגיאות, פורמט התשובות

### 4. שלוש שיטות משיכת התמלול (לפי סדר ניסיון)
**א. InnerTube API** (`youtubei/v1/player`)
- ה-Innertube key הציבורי, body request מלא
- שני Clients: ANDROID (19.09.37) ו-WEB עם user-agents מדויקים
- מבנה התשובה: `captions.playerCaptionsTracklistRenderer.captionTracks`
- היגיון העדפה: עברית ידנית → עברית ASR → כל שפה

**ב. Scraping של דף ה-watch**
- פונקציית `extractJsonArrayAfter` — bracket-matching שמטפלת ב-strings ו-escape
- למה רגקס פשוט נכשל (escaping, nested arrays)

**ג. Fallback חיצוני** — `youtube-transcript.ai`
- פורמט הבקשה והפענוח של ה-markdown
- ולידציה (אורך > 50, ללא "sorry/blocking")

### 5. עיבוד ה-XML
- הוספת `&fmt=srv1` ל-baseUrl
- רגקס לחילוץ `<text>` tags
- `decodeHtml` — entities נומריים וסמליים
- מיזוג חלקים, נרמול whitespace

### 6. רכיבי UI
**`LessonTranscript.tsx`** — תצוגה לצופה: lazy load, retry, copy-to-clipboard, מצבי loading/empty/loaded, RTL

**`admin/TranscriptFetcher.tsx`** — פאנל אדמין: ספירות (סה״כ/עם תמלול/נותרו), Progress bar, batch loop של 20 בכל פעם, רענון react-query

### 7. זרימת הקריאות (Sequence)
דיאגרמת ASCII מלאה של batch run וגם של קריאה בודדת מהצופה

### 8. טיפול בכשלים והגבלות ידועות
- חסימת IP של ענן ע״י YouTube (למה ה-fallback קריטי)
- `transcript_fetched_at` נשמר גם בכשל למניעת ניסיונות חוזרים אינסופיים
- rate limiting: 250ms בין בקשות בבאצ׳
- דיוק נמוך של ASR בעברית

### 9. מדריך דיבאג
- איך לקרוא לוגים: `supabase functions logs fetch-transcript`
- שגיאות נפוצות ופירושן ("no captionTracks in watch html")
- שאילתות SQL שימושיות (כמה תמלולים יש, אילו נכשלו, איפוס לניסיון חוזר)
- בדיקה ידנית עם curl מול InnerTube

### 10. כיווני הרחבה
- הוספת תרגום אוטומטי לאנגלית דרך Lovable AI
- שיפור fallback (Whisper, יוטיוב data API v3 captions עם OAuth)
- שמירת timestamps לקפיצה בווידאו
- חיפוש מלא טקסט (`tsvector`) בתוך תמלולים

### 11. אבטחה
- מפתחות שלא נחשפים ל-client
- למה ה-Innertube key לא רגיש (ציבורי)
- ולידציית קלט בעתיד (zod)

### 12. נספחים
- הקובץ המלא של ה-Edge Function עם הערות שורה-שורה על החלקים הקריטיים
- רשימת כל קבצי הפרויקט שמעורבים
- glossary: InnerTube, ASR, srv1, vssId, kind

---

המסמך יהיה בעברית, מעוצב יפה ב-Markdown, עם בלוקי קוד מודגשים, וטבלאות היכן שצריך. אורך משוער: 600-900 שורות.
