import { createContext, useContext, useEffect, useMemo, useState } from "react"

const copy = {
  ar: {
    brand: "توفي",
    tagline: "أكاديمية تدير المحتوى والأكواد والحصص المباشرة في مكان واحد.",
    login: "دخول",
    phone: "الهاتف",
    password: "كلمة المرور",
    logout: "تسجيل الخروج",
    language: "English",
    languageName: "العربية",
    save: "حفظ",
    create: "إضافة",
    cancel: "إلغاء",
    empty: "لا توجد سجلات بعد",
    emptyHint: "عندما تُضاف سجلات ستظهر هنا.",
    noMatch: "لا نتائج مطابقة",
    noMatchHint: "جرّب كلمة بحث أخرى.",
    loading: "جار التحميل",
    error: "تعذر إكمال الطلب",
    retry: "إعادة المحاولة",
    remaining: "الرصيد المتبقي",
    search: "بحث",
    menuSearch: "انتقل إلى صفحة",
    menu: "القائمة",
    more: "المزيد",
    close: "إغلاق",
    view: "عرض التفاصيل",
    saved: "تم الحفظ",
    actions: "إجراءات",
    previous: "السابق",
    next: "التالي",
    page: "صفحة",
    of: "من",
    records: "سجل",
    required: "مطلوب",
    optional: "اختياري",
    choose: "اختر",
    none: "بلا",
    yes: "نعم",
    no: "لا",
    show: "إظهار",
    hide: "إخفاء",
    dropFile: "اسحب الملف إلى هنا أو اختر من جهازك",
    replaceFile: "استبدال الملف",
    selectAll: "تحديد الكل",
    clear: "مسح",
    selected: "محدد",
    today: "اليوم",
    time: "الوقت",
    jumpHint: "اكتب اسم الصفحة",
    noPages: "لا توجد صفحة بهذا الاسم",
    account: "الحساب",
    sortBy: "ترتيب حسب",
    pageSorted: "الترتيب يشمل الصفحة الحالية فقط",
  },
  en: {
    brand: "TOVI",
    tagline: "One academy for content, codes, and live classes.",
    login: "Sign in",
    phone: "Phone",
    password: "Password",
    logout: "Sign out",
    language: "العربية",
    languageName: "English",
    save: "Save",
    create: "Add",
    cancel: "Cancel",
    empty: "Nothing here yet",
    emptyHint: "Records will appear here once they are added.",
    noMatch: "No matching results",
    noMatchHint: "Try a different search.",
    loading: "Loading",
    error: "The request could not be completed",
    retry: "Try again",
    remaining: "Remaining balance",
    search: "Search",
    menuSearch: "Jump to a page",
    menu: "Menu",
    more: "More",
    close: "Close",
    view: "View details",
    saved: "Saved",
    actions: "Actions",
    previous: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    records: "records",
    required: "Required",
    optional: "Optional",
    choose: "Choose",
    none: "None",
    yes: "Yes",
    no: "No",
    show: "Show",
    hide: "Hide",
    dropFile: "Drop a file here or browse your device",
    replaceFile: "Replace file",
    selectAll: "Select all",
    clear: "Clear",
    selected: "selected",
    today: "Today",
    time: "Time",
    jumpHint: "Type a page name",
    noPages: "No page with that name",
    account: "Account",
    sortBy: "Sort by",
    pageSorted: "Sorting applies to the current page only",
  },
} as const

export type Lang = keyof typeof copy
type Copy = { [K in keyof (typeof copy)["ar"]]: string }
type I18n = { lang: Lang; dir: "rtl" | "ltr"; t: Copy; toggle: () => void; tr: (ar: string, en: string) => string; locale: string }

const Ctx = createContext<I18n | null>(null)

function storedLang(): Lang {
  try { return (localStorage.getItem("tovi-lang") as Lang) || "ar" } catch { return "ar" }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(storedLang)
  const dir = lang === "ar" ? "rtl" : "ltr"
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
    try { localStorage.setItem("tovi-lang", lang) } catch { /* storage can be blocked */ }
  }, [lang, dir])
  const value = useMemo<I18n>(() => ({
    lang,
    dir,
    t: copy[lang],
    toggle: () => setLang((v) => (v === "ar" ? "en" : "ar")),
    tr: (ar: string, en: string) => (lang === "ar" ? ar : en),
    locale: lang === "ar" ? "ar-IQ-u-nu-latn" : "en",
  }), [lang, dir])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n() {
  const value = useContext(Ctx)
  if (!value) throw new Error("i18n")
  return value
}
