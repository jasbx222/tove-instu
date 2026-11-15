const words: Record<string, [string, string]> = {
  view: ["عرض", "View"],
  create: ["إنشاء", "Create"],
  update: ["تعديل", "Edit"],
  delete: ["حذف", "Delete"],
  format: ["تهيئة", "Format"],
  correct: ["تصحيح", "Correct"],
  manage: ["إدارة", "Manage"],
  courses: ["الدورات", "courses"],
  course: ["الدورة", "course"],
  chapters: ["الفصول", "chapters"],
  lessons: ["الدروس", "lessons"],
  summaries: ["الملخصات", "summaries"],
  summary: ["الملخص", "summary"],
  exams: ["الاختبارات", "exams"],
  questions: ["الأسئلة", "questions"],
  groups: ["المجموعات", "groups"],
  classrooms: ["القاعات", "classrooms"],
  sessions: ["الجلسات", "sessions"],
  codes: ["الأكواد", "codes"],
  meetings: ["الحصص", "meetings"],
  meeting: ["الحصة", "meeting"],
  employees: ["الموظفين", "staff"],
  students: ["الطلاب", "students"],
  reports: ["التقارير", "reports"],
  plans: ["الباقات", "plans"],
  subscriptions: ["الاشتراكات", "subscriptions"],
  teachers: ["المعلمين", "teachers"],
  schools: ["المدارس", "schools"],
  advertisements: ["الإعلانات", "ads"],
  faq: ["الأسئلة الشائعة", "FAQ"],
  hour: ["الساعات", "hours"],
  pool: ["الرصيد", "pool"],
}

export function permissionLabel(slug: string, lang: string) {
  return slug.replace(/^can-/, "").split("-").map((token) => {
    const pair = words[token]
    return pair ? (lang === "ar" ? pair[0] : pair[1]) : token
  }).join(" ")
}

/** Name of the module a permission belongs to, for grouping in the picker. */
export function moduleLabel(key: string, lang: string) {
  const text = key.split("-").map((token) => {
    const pair = words[token]
    return pair ? (lang === "ar" ? pair[0] : pair[1]) : token
  }).join(" ")
  return lang === "ar" ? text : text.charAt(0).toUpperCase() + text.slice(1)
}
