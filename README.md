# 🎬 Kick Donations — منصة تبرعات البث المباشر

> منصة تبرعات للستريمرز في ليبيا: لوحة تحكم لإدارة التبرعات، وصفحة عرض (Overlay) لـ OBS بتنبيهات متدرجة حسب قيمة التبرع.

![CI](https://img.shields.io/badge/CI-GitHub_Actions-blue) ![Version](https://img.shields.io/badge/version-2.0.0-green)

---

## 🏗️ البنية

```
 المتصفح (لوحة التحكم)            OBS (صفحة العرض)
        │  /api/* (نفس النطاق، كوكي httpOnly)      │  ?key=<مفتاح سري>
        ▼                                          ▼
┌──────────────────────┐   proxy    ┌──────────────────────────┐
│ Frontend — Next.js 15│ ─────────▶ │ Backend — Fastify 5      │
│ (Netlify)            │            │ (Render)                 │
└──────────────────────┘ ◀──────── │ REST + Socket.io (غرف)   │
          ▲        WebSocket مباشر  └────────────┬─────────────┘
          └──────────────────────────────────────┘│ service-role
                                                  ▼
                                    ┌──────────────────────────┐
                                    │ Supabase — Postgres + RLS│
                                    │ + Storage (الوسائط)      │
                                    └──────────────────────────┘
```

- **الخادم هو المصدر الوحيد للحقيقة**: يحدد فئة كل تبرع من جدول `tier_settings`، ويرسل التنبيه جاهزاً لصفحة العرض.
- **دورة حياة التبرع**: `pending` ← (إرسال) ← `live` ← (تأكيد صفحة العرض) ← `done`، مع إمكانية إعادة العرض.
- **الطابقات في الخادم**: `routes` (تحقق من المدخلات والصلاحيات) ← `services` (منطق العمل) ← Supabase.

---

## 🎯 الفئات الافتراضية

| المبلغ (د.ل) | الفئة | المدة |
|---|---|---|
| 1 – 4.99 | بسيط | 10 ث |
| 5 – 9.99 | فضي | 15 ث |
| 10 – 19.99 | ذهبي | 30 ث |
| 20 – 29.99 | بلاتيني | 45 ث |
| 30 – 39.99 | ملكي | 60 ث |
| 40+ (عدا 50) | أسطوري | 90 ث |
| 50 بالضبط | الخمسين الخارقة | 120 ث |

كل القيم قابلة للتعديل من **الإعدادات ← الفئات** (الحدود، اللون، المدة، الصوت، الخلفية، مستوى الصوت).

---

## 🚀 التشغيل المحلي

المتطلبات: **Node.js 20+** وحساب Supabase.

### 1. قاعدة البيانات

في Supabase ← SQL Editor:

1. **تثبيت جديد**: شغّل `backend/schema.sql`.
2. **ثم (دائماً)**: شغّل ملفات `backend/migrations/` بالترتيب (`001_hardening.sql` ...). الملفات آمنة لإعادة التشغيل.

### 2. الخادم

```bash
cd backend
npm install
cp .env.example .env   # عدّل القيم، خصوصاً JWT_SECRET و SUPABASE_*
npm run dev
```

توليد `JWT_SECRET` آمن:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. الواجهة

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

افتح `http://localhost:3000/login`. في أول تشغيل سيُطلب منك إنشاء حساب المشرف الرئيسي.

---

## 📺 ربط OBS

1. من لوحة التحكم: **الإعدادات ← صفحة العرض** ← انسخ الرابط (يحتوي على مفتاح سري).
2. في OBS أضف **Browser Source** والصق الرابط. العرض `1920` والارتفاع `1080`.
3. أضف `&autostart=1` لنهاية الرابط لتشغيل الصوت دون نقرة (OBS يسمح بالتشغيل التلقائي).
4. أضف فلتر **Chroma Key** باللون `#03E115`.
5. إذا تسرب الرابط: **إنشاء مفتاح جديد** يُبطل القديم فوراً.

---

## ☁️ النشر

### Render (الخادم)
| المتغير | القيمة |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | من إعدادات Supabase |
| `JWT_SECRET` | 32 حرفاً على الأقل |
| `FRONTEND_URL` | رابط Netlify بالضبط (يمكن عدة روابط مفصولة بفواصل) |
| `COOKIE_SAMESITE` | `lax` |
| `TRUST_PROXY_HOPS` | `2` |
| `TIMEZONE` | `Africa/Tripoli` |
| `SMS_AUTOMATION_KEY` | مفتاح n8n (24 حرفاً على الأقل)، أو فارغ للتعطيل |

`Health check path`: `/health` (يعيد 503 إذا كانت قاعدة البيانات تحتاج ترحيلاً).

### Netlify (الواجهة)
| المتغير | القيمة |
|---|---|
| `NEXT_PUBLIC_API_URL` | رابط Render (يُستخدم كهدف للـ proxy وللـ WebSocket والرفع) |

> الواجهة تمرر `/api/*` إلى الخادم عبر نفس النطاق، لذا تعمل الجلسة حتى مع حظر كوكيز الطرف الثالث في Safari/Chrome.

### n8n (تبرعات SMS التلقائية)
`POST {BACKEND}/api/donations/sms-auto` مع الترويسة `X-Api-Key`.
أرسل `reference` (رقم العملية/الرسالة) لمنع تكرار التبرع عند إعادة المحاولة.

---

## 🔒 الأمان

- جلسة في **كوكي httpOnly** فقط (لا توكن في `localStorage`)، صلاحية 12 ساعة.
- **إلغاء الجلسات**: تغيير كلمة المرور أو الصلاحية يُنهي كل الجلسات القديمة (`token_version`)، وزر «الخروج من كل الأجهزة».
- **CORS** مقيد بـ `FRONTEND_URL`، وحماية **CSRF** (ترويسة مخصصة + فحص Origin).
- **قفل الحساب** بعد 5 محاولات دخول فاشلة لمدة 15 دقيقة، وحد طلبات خاص بالدخول.
- **مصادقة WebSocket**: تذكرة قصيرة العمر للوحة التحكم، ومفتاح سري لصفحة العرض، وغرف منفصلة.
- **JSON Schema** لكل مدخل مع حذف الحقول غير المعروفة (لا mass-assignment).
- **RLS** مفعّل على كل الجداول بلا سياسات عامة؛ فقط الخادم يصل للبيانات.
- ترويسات أمان (CSP, HSTS, nosniff, Referrer-Policy) في الخادم والواجهة.
- رفع الملفات بفحص المحتوى الفعلي (magic bytes)، دون SVG/HTML.
- سجل نشاط كامل لكل العمليات الحساسة (الإعدادات ← سجل النشاط).
- فلتر رسائل عربي/ليبي/إنجليزي مع تطبيع للحروف، والرسائل المحجوبة **تُحفظ للمراجعة** بدل حذفها.

---

## 🧪 الجودة

```bash
cd backend  && npm run check   # ESLint + اختبارات (node:test)
cd frontend && npm run check   # TypeScript + ESLint
```

GitHub Actions يشغّل الفحوصات والبناء وتدقيق الحزم مع كل Push/PR.

---

## 📁 هيكل الملفات

```
backend/
├── migrations/            # ترحيلات SQL مرقمة
├── schema.sql             # البنية الأساسية للتثبيت الجديد
├── src/
│   ├── app.js             # تجميع التطبيق (الخدمات، الإضافات، المسارات، معالج الأخطاء)
│   ├── server.js          # التشغيل والإيقاف الآمن
│   ├── config/            # متغيرات البيئة (مع التحقق) وعميل Supabase
│   ├── plugins/           # security (CORS/CSRF/Helmet/Rate-limit) و auth (الجلسات)
│   ├── routes/            # auth, users, donations, settings, overlay, uploads, activity, public
│   ├── services/          # donations, tiers, users, settings, stats, audit, realtime, moderation
│   ├── lib/               # errors, time (المنطقة الزمنية), crypto, lockout
│   ├── utils/             # tiers (الافتراضية), validation
│   └── data/profanity.json
└── test/                  # اختبارات الوحدات والـ HTTP

frontend/src/
├── app/                   # login, dashboard/*, overlay
├── components/
│   ├── ui/                # Toast, Modal, ConfirmDialog, primitives
│   ├── dashboard/         # StatsCards, LiveControl, DonationForm, DonationsTable, AnalyticsSection
│   ├── settings/          # General, Overlay, Tiers, Security, Activity
│   └── overlay/           # StandardTier, Cinematic, Gold, Diamond, Fifty, Leaderboard
├── hooks/                 # queries (React Query), useAdminSocket, useOverlayController
└── lib/                   # api, socket, audio, tiers, format, types
```

---

**صُنع بـ ❤️ لمجتمع الستريمرز في ليبيا**
