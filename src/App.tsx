import { useEffect, useState } from "react"
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router"
import { api, mediaUrl, setToken, type SessionUser } from "../shared/src/api"
import { CourseCoverPicker, FreeToggle } from "../shared/src/media"
import { useI18n } from "../shared/src/i18n"
import { institutePermissions } from "../shared/src/permissions"
import { Resource, type Field as FormField } from "../shared/src/resource"
import { catalogLookup, personLookup, saveCourse, useLookupLabels } from "../shared/src/lookup"
import { SessionLine, sessionPhase, type SessionRow } from "../shared/src/sessions"
import { PlanetHero } from "../shared/src/vivid"
import { StatGrid } from "../shared/src/stats"
import { SessionSummary } from "../shared/src/summary"
import { AuthLayout, LoginCard, Shell, type NavItem } from "../shared/src/shell"
import { FormModal, PageHeader, useToast } from "../shared/src/crud"
import { CountChart } from "../shared/src/charts"
import { Callout, CourseCards, Field, Mast, MetricBand, PermissionPicker, SelectField } from "../shared/src/ui"

const nav: (NavItem & { permission?: string })[] = [
  { to: "/", ar: "اللوحة", en: "Dashboard", group: "المعهد|Institute" },
  { to: "/teachers", ar: "المعلمون", en: "Teachers", permission: "can-view-teachers" },
  { to: "/courses", ar: "الدورات", en: "Courses", permission: "can-view-courses" },
  { to: "/summaries", ar: "الملخصات", en: "Summaries", permission: "can-view-summaries" },
  { to: "/students", ar: "الطلاب", en: "Students", permission: "can-view-students", group: "الناس|People" },
  { to: "/employees", ar: "الموظفون", en: "Employees", permission: "can-view-employees" },
  { to: "/schools", ar: "المدارس", en: "Schools", permission: "can-view-schools" },
  { to: "/exams", ar: "الاختبارات", en: "Exams", permission: "can-view-exams", group: "التشغيل|Operations" },
  { to: "/ads", ar: "الإعلانات", en: "Advertisements", permission: "can-view-advertisements" },
  { to: "/reports", ar: "التقارير", en: "Reports", permission: "can-view-reports" },
  { to: "/plans", ar: "الباقات", en: "Plans", permission: "can-view-plans" },
  { to: "/pool", ar: "رصيد الساعات", en: "Hour pool", permission: "can-view-hour-pool", group: "الحصص|Live" },
  { to: "/sessions", ar: "الجلسات", en: "Sessions", permission: "can-view-sessions" },
  { to: "/faq", ar: "الأسئلة", en: "FAQ", permission: "can-view-faq" },
  { to: "/settings", ar: "الإعدادات", en: "Settings", group: "الحساب|Account" },
]

type Row = Record<string, string>

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/*" element={<Frame />} />
    </Routes>
  )
}

function Login() {
  const navigate = useNavigate()
  const { lang } = useI18n()
  return (
    <LoginCard title={lang === "ar" ? "لوحة المعهد" : "Institute"} extra={<Link className="auth-link" to="/register">{lang === "ar" ? "تسجيل معهد جديد" : "Register an institute"}</Link>} onSubmit={async (phone, password) => {
      const result = await api<{ token: string }>("/api/auth/institute/login", { method: "POST", body: JSON.stringify({ phone, password }) })
      setToken(result.token)
      navigate("/")
    }} />
  )
}

function Register() {
  const navigate = useNavigate()
  const { lang } = useI18n()
  const [form, setForm] = useState({ instituteName: "", firstName: "", phone: "", phone2: "", address: "", description: "", password: "" })
  const [error, setError] = useState("")
  const field = (name: keyof typeof form, label: string, type = "text") => (
    <Field type={type} label={label} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} required />
  )
  return (
    <AuthLayout title={lang === "ar" ? "تسجيل المعهد" : "Institute registration"}>
      <form className="stack" onSubmit={async (event) => {
        event.preventDefault()
        setError("")
        try {
          const result = await api<{ token: string }>("/api/auth/institute/register", { method: "POST", body: JSON.stringify(form) })
          setToken(result.token)
          navigate("/")
        } catch (reason) { setError(reason instanceof Error ? reason.message : "") }
      }}>
        {field("instituteName", lang === "ar" ? "اسم المعهد" : "Institute name")}
        {field("firstName", lang === "ar" ? "الاسم" : "First name")}
        {field("phone", lang === "ar" ? "هاتف عراقي" : "Iraqi phone")}
        {field("phone2", lang === "ar" ? "هاتف عراقي ثان" : "Second Iraqi phone")}
        {field("address", lang === "ar" ? "العنوان" : "Address")}
        {field("description", lang === "ar" ? "الوصف" : "Description")}
        {field("password", lang === "ar" ? "كلمة المرور" : "Password", "password")}
        {error ? <Callout tone="bad">{error}</Callout> : null}
        <button className="btn" type="submit">{lang === "ar" ? "إنشاء الحساب" : "Create account"}</button>
        <Link className="auth-link" to="/login">{lang === "ar" ? "لدي حساب" : "I already have an account"}</Link>
      </form>
    </AuthLayout>
  )
}

function Frame() {
  const [me, setMe] = useState<SessionUser | null>(null)
  const navigate = useNavigate()
  const { lang } = useI18n()
  useEffect(() => { api<SessionUser>("/api/auth/me").then(setMe).catch(() => navigate("/login")) }, [navigate])
  if (!me) return <div className="boot" aria-busy="true"><div className="skel" /><div className="skel short" /></div>
  if (me.type === "Teacher") {
    return (
      <Shell title={lang === "ar" ? "جلساتي" : "My sessions"} items={[{ to: "/sessions", ar: "الجلسات", en: "Sessions" }]}>
        <Routes>
          <Route path="/sessions" element={<TeacherSessions />} />
          <Route path="*" element={<Navigate to="/sessions" replace />} />
        </Routes>
      </Shell>
    )
  }
  const items = nav.filter((item) => !item.permission || me.permissions.includes(item.permission))
  return (
    <Shell title={me.instituteName || (lang === "ar" ? "المعهد" : "Institute")} items={items}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseChapters />} />
        <Route path="/summaries" element={<Resource path="/api/institute/summaries" title={lang === "ar" ? "الملخصات" : "Summaries"} columns={[{ key: "title", label: lang === "ar" ? "العنوان" : "Title" }]} />} />
        <Route path="/students" element={<Students />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/schools" element={<Resource path="/api/institute/schools" title={lang === "ar" ? "المدارس" : "Schools"} columns={[{ key: "name", label: lang === "ar" ? "الاسم" : "Name" }]} fields={[{ name: "name", label: lang === "ar" ? "اسم المدرسة" : "School" }]} />} />
        <Route path="/exams" element={<Resource path="/api/institute/exams" title={lang === "ar" ? "الاختبارات" : "Exams"} columns={[{ key: "title", label: lang === "ar" ? "العنوان" : "Title" }, { key: "status", label: lang === "ar" ? "الحالة" : "Status" }, { key: "mark", label: lang === "ar" ? "الدرجة" : "Mark" }]} />} />
        <Route path="/ads" element={<Resource path="/api/institute/advertisements" title={lang === "ar" ? "الإعلانات" : "Advertisements"} columns={[{ key: "title", label: lang === "ar" ? "العنوان" : "Title" }]} />} />
        <Route path="/reports" element={<Resource path="/api/institute/reports/codes" title={lang === "ar" ? "تقارير الأكواد" : "Code reports"} columns={[{ key: "code", label: lang === "ar" ? "الكود" : "Code" }, { key: "status", label: lang === "ar" ? "الحالة" : "Status" }]} />} />
        <Route path="/plans" element={<Plans me={me} />} />
        <Route path="/pool" element={<Pool />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/sessions/:id/summary" element={<SummaryRoom />} />
        <Route path="/faq" element={<Resource path="/api/institute/faq" title={lang === "ar" ? "الأسئلة" : "FAQ"} columns={[{ key: "question", label: lang === "ar" ? "السؤال" : "Question" }, { key: "answer", label: lang === "ar" ? "الجواب" : "Answer" }]} />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  )
}

function Dashboard() {
  const { lang } = useI18n()
  const [data, setData] = useState<{ teachers: number; courses: number; students: number; codeBalance: number; poolMinutes: number; poolHours: number } | null>(null)
  const [error, setError] = useState("")
  const [sessions, setSessions] = useState<SessionRow[]>([])
  useEffect(() => {
    api<NonNullable<typeof data>>("/api/institute/dashboard").then(setData).catch((reason) => setError(reason.message))
    api<SessionRow[]>("/api/institute/sessions").then(setSessions).catch(() => setSessions([]))
  }, [])
  const live = sessions.filter((row) => sessionPhase(row) === "live").length
  const upcoming = sessions.filter((row) => ["lobby", "upcoming"].includes(sessionPhase(row))).length
  if (error) return <Callout tone="bad">{error}</Callout>
  if (!data) return <div className="panel"><div className="skel" /><div className="skel short" style={{ marginTop: 12 }} /></div>
  return (
    <div className="stack">
      <PlanetHero kicker={lang === "ar" ? "تشغيل المعهد" : "Institute operations"} title={lang === "ar" ? "المعلمون والدورات والرصيد المشترك" : "Teachers, courses, and the shared pool"}>
        {live ? <span className="tv-chip live"><i className="tv-dot" />{live} {lang === "ar" ? "حصص مباشرة الآن" : "live now"}</span> : null}
        <span className="tv-glass-chip"><strong>{upcoming}</strong> {lang === "ar" ? "حصص قادمة" : "upcoming sessions"}</span>
        <Link className="btn" to="/sessions">{lang === "ar" ? "جدول الحصص" : "Sessions"}</Link>
      </PlanetHero>
      <StatGrid items={[
        { label: lang === "ar" ? "ساعات الرصيد المشترك" : "Shared pool hours", value: data.poolHours, icon: "clock", tone: "violet", sub: `${data.poolMinutes} ${lang === "ar" ? "دقيقة" : "minutes"}` },
        { label: lang === "ar" ? "المعلمون" : "Teachers", value: data.teachers, icon: "people", tone: "sun", sub: `${data.courses} ${lang === "ar" ? "دورات" : "courses"}` },
        { label: lang === "ar" ? "الطلاب" : "Students", value: data.students, icon: "student", tone: "mint" },
        { label: lang === "ar" ? "رصيد الأكواد" : "Code balance", value: data.codeBalance, icon: "ticket", tone: "coral", live: live > 0, sub: live ? `${live} ${lang === "ar" ? "حصص مباشرة الآن" : "live now"}` : undefined },
      ]} />
      <CountChart title={lang === "ar" ? "أرقام المعهد" : "Institute figures"} items={[
        { label: lang === "ar" ? "المعلمون" : "Teachers", value: data.teachers },
        { label: lang === "ar" ? "الدورات" : "Courses", value: data.courses },
        { label: lang === "ar" ? "الطلاب" : "Students", value: data.students },
        { label: lang === "ar" ? "الأكواد" : "Codes", value: data.codeBalance },
      ]} />
    </div>
  )
}

function Teachers() {
  const { lang } = useI18n()
  return (
    <Resource
      path="/api/institute/teachers"
      title={lang === "ar" ? "المعلمون" : "Teachers"}
      image="photoFileId"
      rowHref={(row) => `/courses?teacherId=${row.id}`}
      columns={[
        { key: "firstName", label: lang === "ar" ? "الاسم" : "Name", value: (row) => [row.firstName, row.lastName].filter(Boolean).join(" ") },
        { key: "phone", label: lang === "ar" ? "الهاتف" : "Phone" },
      ]}
      fields={[
        { name: "firstName", label: lang === "ar" ? "الاسم" : "First", required: true },
        { name: "lastName", label: lang === "ar" ? "اللقب" : "Last" },
        { name: "phone", label: lang === "ar" ? "الهاتف" : "Phone", type: "tel", required: true, hint: lang === "ar" ? "مثال: 07xxxxxxxx" : "Example: 07xxxxxxxx" },
        { name: "password", label: lang === "ar" ? "كلمة المرور" : "Password", type: "password", required: true },
      ]}
    />
  )
}

function TeacherLinks({ tick = 0 }: { tick?: number }) {
  const { lang } = useI18n()
  const [rows, setRows] = useState<Row[]>([])
  useEffect(() => { api<{ items: Row[] }>("/api/institute/teachers").then((page) => setRows(page.items ?? [])).catch(() => setRows([])) }, [tick])
  return <CourseCards rows={rows.map((row) => ({ id: row.id, title: `${row.firstName} ${row.lastName}`, meta: row.phone }))} href={(id) => `/courses?teacherId=${id}`} empty={lang === "ar" ? "لا يوجد معلمون بعد" : "No teachers yet"} />
}


function courseFields(lang: string, base: string, extra: FormField[] = []): FormField[] {
  const ar = lang === "ar"
  return [
    ...extra,
    { name: "title", label: ar ? "عنوان الدورة" : "Course title", required: true },
    { name: "description", label: ar ? "الوصف" : "Description", type: "textarea" },
    { name: "gradeId", label: ar ? "المرحلة" : "Grade", type: "lookup", required: true, lookup: catalogLookup(`${base}/grades`, lang, { ar: "المرحلة", en: "grade" }) },
    { name: "sectionId", label: ar ? "القسم" : "Section", type: "lookup", required: true, lookup: catalogLookup(`${base}/sections`, lang, { ar: "القسم", en: "section" }) },
    { name: "subjectId", label: ar ? "المادة" : "Subject", type: "lookup", required: true, lookup: catalogLookup(`${base}/subjects`, lang, { ar: "المادة", en: "subject" }) },
    { name: "learningDomainId", label: ar ? "المجال" : "Domain", type: "lookup", lookup: catalogLookup(`${base}/learning-domains`, lang, { ar: "المجال", en: "domain" }) },
    { name: "cover", label: ar ? "غلاف الدورة" : "Course cover", type: "file", required: false },
  ]
}

function Courses() {
  const { lang } = useI18n()
  const ar = lang === "ar"
  const teacherId = new URLSearchParams(location.search).get("teacherId") ?? ""
  const path = teacherId ? `/api/institute/courses?teacherId=${teacherId}` : "/api/institute/courses"
  const teacherOf = useLookupLabels("/api/institute/teachers", (row) => [row.firstName, row.lastName].filter(Boolean).join(" ") || String(row.phone ?? ""))
  const gradeOf = useLookupLabels("/api/institute/grades", (row) => String(row.name ?? ""))
  const subjectOf = useLookupLabels("/api/institute/subjects", (row) => String(row.name ?? ""))
  return (
    <Resource
      path={path}
      createPath="/api/institute/courses"
      createDefaults={teacherId ? { teacherId } : {}}
      title={ar ? "الدورات" : "Courses"}
      image="coverFileId"
      update
      rowHref={(row) => `/courses/${row.id}`}
      formTitle={(mode) => mode === "edit" ? (ar ? "تعديل دورة" : "Edit course") : (ar ? "إضافة دورة" : "Add course")}
      columns={[
        { key: "title", label: ar ? "العنوان" : "Title" },
        { key: "teacherId", label: ar ? "المعلم" : "Teacher", value: (row) => teacherOf(row.teacherId) },
        { key: "gradeId", label: ar ? "المرحلة" : "Grade", value: (row) => gradeOf(row.gradeId) },
        { key: "subjectId", label: ar ? "المادة" : "Subject", value: (row) => subjectOf(row.subjectId) },
      ]}
      fields={courseFields(lang, "/api/institute", [
        { name: "teacherId", label: ar ? "المعلم" : "Teacher", type: "lookup", required: true, lookup: personLookup("/api/institute/teachers", lang, { ar: "المعلم", en: "teacher" }) },
      ])}
      submit={async ({ payload, mode, row, files }) => {
        const body = payload instanceof FormData ? Object.fromEntries(payload.entries()) : payload
        await saveCourse("/api/institute", body as Record<string, unknown>, files, mode, row)
      }}
    />
  )
}

function CourseLinks({ path, tick = 0 }: { path: string; tick?: number }) {
  const { lang } = useI18n()
  const [rows, setRows] = useState<Row[]>([])
  useEffect(() => { api<{ items: Row[] }>(path).then((page) => setRows(page.items ?? [])).catch(() => setRows([])) }, [path, tick])
  return <CourseCards rows={rows.map((row) => ({ id: row.id, title: row.title, image: row.coverFileId ? mediaUrl(`/api/files/${row.coverFileId}`) : "" }))} href={(id) => `/courses/${id}`} empty={lang === "ar" ? "لا توجد دورات بعد" : "No courses yet"} />
}

function CourseChapters() {
  const { id = "" } = useParams()
  const { lang } = useI18n()
  const [chapters, setChapters] = useState<Row[]>([])
  const [title, setTitle] = useState("")
  const [open, setOpen] = useState(false)
  async function load() { setChapters(await api(`/api/institute/courses/${id}/chapters`)) }
  useEffect(() => { void load() }, [id])
  return (
    <div className="page">
      <Mast title={lang === "ar" ? "فصول الدورة" : "Course chapters"} />
      <div className="split">
        <div className="stack">
          <PageHeader title={lang === "ar" ? "الفصول" : "Chapters"} count={chapters.length} onAdd={() => setOpen(true)} addLabel={lang === "ar" ? "إضافة فصل" : "Add chapter"} />
          {chapters.map((chapter) => <Lessons key={chapter.id} chapter={chapter} />)}
        </div>
        <aside className="stack"><CourseCoverPicker base="/api/institute" id={id} /></aside>
      </div>
      <FormModal open={open} title={lang === "ar" ? "فصل جديد" : "New chapter"} onClose={() => setOpen(false)} onSubmit={async () => { await api("/api/institute/chapters", { method: "POST", body: JSON.stringify({ courseId: id, title }) }); setTitle(""); setOpen(false); await load() }}>
        <Field label={lang === "ar" ? "فصل" : "Chapter"} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </FormModal>
    </div>
  )
}

function Lessons({ chapter }: { chapter: Row }) {
  const { lang } = useI18n()
  const [lessons, setLessons] = useState<Row[]>([])
  const [title, setTitle] = useState("")
  const [video, setVideo] = useState("")
  const [free, setFree] = useState(false)
  async function load() { setLessons(await api(`/api/institute/chapters/${chapter.id}/lessons`)) }
  useEffect(() => { void load() }, [chapter.id])
  const [open, setOpen] = useState(false)
  return (
    <section className="sheet stack">
      <PageHeader title={chapter.title} count={lessons.length} onAdd={() => setOpen(true)} addLabel={lang === "ar" ? "إضافة درس" : "Add lesson"} />
      {lessons.length === 0 ? <div className="empty"><i /><strong>{lang === "ar" ? "لا دروس بعد" : "No lessons yet"}</strong></div> : lessons.map((lesson) => (
        <div key={lesson.id} className="lesson-row">
          <span>{lesson.title}{lesson.videoReference ? <small> · {lesson.videoReference}</small> : null}</span>
          <FreeToggle base="/api/institute" lesson={{ id: String(lesson.id), isFree: lesson.isFree }} onChange={() => void load()} />
        </div>
      ))}
      <FormModal open={open} title={lang === "ar" ? "درس جديد" : "New lesson"} onClose={() => setOpen(false)} onSubmit={async () => { await api("/api/institute/lessons", { method: "POST", body: JSON.stringify({ chapterId: chapter.id, title, videoReference: video || null, isFree: free }) }); setTitle(""); setVideo(""); setFree(false); setOpen(false); await load() }}>
        <Field label={lang === "ar" ? "درس" : "Lesson"} value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Field label={lang === "ar" ? "رابط يوتيوب أو مرجع الفيديو" : "YouTube link or video reference"} value={video} onChange={(e) => setVideo(e.target.value)} />
        <label className="check-line"><input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} /> {lang === "ar" ? "درس مجاني" : "Free lesson"}</label>
      </FormModal>
    </section>
  )
}

function Students() {
  const { lang } = useI18n()
  return (
    <Resource
      path="/api/institute/students"
      title={lang === "ar" ? "الطلاب" : "Students"}
      image="photoFileId"
      columns={[
        { key: "firstName", label: lang === "ar" ? "الاسم" : "Name", value: (row) => [row.firstName, row.lastName].filter(Boolean).join(" ") },
        { key: "phone", label: lang === "ar" ? "الهاتف" : "Phone" },
        { key: "studentKind", label: lang === "ar" ? "النوع" : "Kind" },
        { key: "xp", label: lang === "ar" ? "النقاط" : "XP" },
        { key: "streak", label: lang === "ar" ? "السلسلة (يوم)" : "Streak (days)" },
      ]}
      fields={[
        { name: "firstName", label: lang === "ar" ? "الاسم" : "First", required: true },
        { name: "lastName", label: lang === "ar" ? "اللقب" : "Last" },
        { name: "phone", label: lang === "ar" ? "الهاتف" : "Phone", type: "tel", required: true },
        { name: "password", label: lang === "ar" ? "كلمة المرور" : "Password", type: "password", required: true },
        { name: "kind", label: lang === "ar" ? "داخلي أو خارجي" : "Internal or external", type: "select", options: ["Internal", "External"], value: "Internal" },
        { name: "schoolId", label: lang === "ar" ? "معرف المدرسة" : "School id" },
      ]}
    />
  )
}
function Employees() {
  const { lang } = useI18n()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", password: "", groupName: "" })
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState("")
  const [tick, setTick] = useState(0)
  const [busy, setBusy] = useState(false)
  return (
    <div className="stack">
      <Resource key={tick} path="/api/institute/employees" title={lang === "ar" ? "الموظفون" : "Employees"} onAdd={() => { setError(""); setOpen(true) }} columns={[{ key: "firstName", label: lang === "ar" ? "الاسم" : "Name" }, { key: "phone", label: lang === "ar" ? "الهاتف" : "Phone" }]} />
      <FormModal open={open} title={lang === "ar" ? "إضافة موظف" : "Add employee"} onClose={() => setOpen(false)} busy={busy} error={error} onSubmit={async () => {
        setBusy(true)
        try {
          const group = await api<{ id: string }>("/api/institute/permission-groups", { method: "POST", body: JSON.stringify({ name: form.groupName || form.firstName, permissions: selected }) })
          await api("/api/institute/employees", { method: "POST", body: JSON.stringify({ ...form, style: "Staff", groupId: group.id, permissions: [] }) })
          setOpen(false); setTick((value) => value + 1); toast.push(lang === "ar" ? "تم حفظ الموظف" : "Employee saved")
        } catch (reason) { setError(reason instanceof Error ? reason.message : "") }
        finally { setBusy(false) }
      }}>
        <div className="form-grid">
          <Field label={lang === "ar" ? "الاسم" : "First"} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          <Field label={lang === "ar" ? "اللقب" : "Last"} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <Field label={lang === "ar" ? "الهاتف" : "Phone"} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Field type="password" label={lang === "ar" ? "كلمة المرور" : "Password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <Field className="span-2" label={lang === "ar" ? "مجموعة الصلاحيات" : "Permission group"} value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })} />
        </div>
        <PermissionPicker slugs={institutePermissions} selected={selected} onChange={setSelected} lang={lang} />
      </FormModal>
    </div>
  )
}
function Plans({ me }: { me: SessionUser }) {
  const { lang } = useI18n()
  const [plans, setPlans] = useState<Row[]>([])
  const [url, setUrl] = useState("")
  useEffect(() => { api<Row[]>("/api/institute/plans").then(setPlans).catch(() => setPlans([])) }, [])
  return (
    <div className="page">
      <Mast title={lang === "ar" ? "الباقات السنوية والدفع." : "Yearly plans and payment."} />
      {plans.map((plan) => (
        <article key={plan.id} className="record">
          <div><h2>{plan.title}</h2><p className="lede">{plan.priceYearly} IQD</p></div>
          <button className="btn" type="button" onClick={async () => {
            const result = await api<{ paymentUrl: string }>("/api/institute/subscriptions", { method: "POST", body: JSON.stringify({ userId: me.ownerId, planId: plan.id }) })
            setUrl(result.paymentUrl)
          }}>{lang === "ar" ? "الدفع" : "Pay"}</button>
        </article>
      ))}
      {url ? <a className="auth-link" href={url}>{url}</a> : null}
    </div>
  )
}

function Pool() {
  const { lang } = useI18n()
  const [pool, setPool] = useState<{ remainingMinutes: number; hours: number } | null>(null)
  useEffect(() => { api<typeof pool>("/api/institute/pool").then(setPool).catch(() => setPool(null)) }, [])
  if (!pool) return <Callout>{lang === "ar" ? "الرصيد يُحمّل من الخادم" : "The balance loads from the server"}</Callout>
  return (
    <div className="stack">
      <Mast kicker={lang === "ar" ? "الرصيد المشترك" : "Shared pool"} title={lang === "ar" ? "دقائق المعهد المتاحة للحصص" : "Institute minutes available for classes"} />
      <MetricBand items={[{ label: lang === "ar" ? "الساعات المعروضة" : "Displayed hours", value: pool.hours, hint: `${pool.remainingMinutes} ${lang === "ar" ? "دقيقة" : "minutes"}`, lead: true }]} />
    </div>
  )
}

function Sessions() {
  const { lang } = useI18n()
  const ar = lang === "ar"
  const [classrooms, setClassrooms] = useState<Row[]>([])
  const [classroomId, setClassroomId] = useState("")
  const [title, setTitle] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [duration, setDuration] = useState(60)
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState("")
  async function load() { setRows(await api("/api/institute/sessions")) }
  useEffect(() => { void load() }, [])
  useEffect(() => { api<Row[]>("/api/institute/classrooms").then((data) => setClassrooms(Array.isArray(data) ? data : [])).catch(() => setClassrooms([])) }, [])
  const roomTitle = (id: string) => classrooms.find((row) => row.id === id)?.title ?? ""
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  return (
    <div className="page">
      <PageHeader title={ar ? "الجلسات" : "Sessions"} count={rows.length} onAdd={() => { setError(""); setOpen(true) }} />
      <p className="lede">{ar ? "الجدولة تخصم المدة من الرصيد المشترك. غرفة الانتظار تفتح قبل البداية بعشر دقائق." : "Scheduling deducts the duration from the shared pool. The waiting room opens ten minutes early."}</p>
      <section className="directory-card crud-card">
        {rows.length === 0 ? <div className="empty"><i /><strong>{ar ? "ماكو جلسات مجدولة." : "No sessions scheduled."}</strong><button className="btn" type="button" onClick={() => setOpen(true)}>{ar ? "إضافة" : "Add"}</button></div> : rows.map((row) => <SessionLine key={row.id} row={row as unknown as SessionRow} room={roomTitle(row.classroomId)} summary={row.instituteId ? `/sessions/${row.id}/summary` : undefined} />)}
      </section>
      <FormModal open={open} title={ar ? "جدولة حصة" : "Schedule a session"} onClose={() => setOpen(false)} busy={busy} error={error} submitLabel={ar ? "جدولة من الرصيد المشترك" : "Schedule from the shared pool"} onSubmit={async () => {
        setBusy(true)
        try {
          await api("/api/institute/sessions", { method: "POST", body: JSON.stringify({ classroomId, startsAt: new Date(startsAt).toISOString(), durationMinutes: duration, title: title.trim() || null }) })
          setTitle(""); setOpen(false); toast.push(ar ? "تم جدولة الحصة" : "Session scheduled"); await load()
        } catch (reason) { setError(reason instanceof Error ? reason.message : "") }
        finally { setBusy(false) }
      }}>
        <Field label={ar ? "عنوان الحصة (اختياري)" : "Session title (optional)"} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
        {classrooms.length ? (
          <SelectField label={ar ? "القاعة" : "Classroom"} value={classroomId} onChange={setClassroomId} options={[{ value: "", label: "—" }, ...classrooms.map((row) => ({ value: String(row.id), label: String(row.title || row.id) }))]} />
        ) : (
          <Field label={ar ? "معرف القاعة من الطلب" : "Classroom id from the request"} value={classroomId} onChange={(e) => setClassroomId(e.target.value)} />
        )}
        <Field type="datetime-local" label={ar ? "البداية" : "Starts"} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        <SelectField label={ar ? "المدة" : "Duration"} value={String(duration)} onChange={(value) => setDuration(Number(value))} options={[30, 45, 60, 90, 120].map((minutes) => ({ value: String(minutes), label: `${minutes} ${ar ? "دقيقة" : "min"}` }))} />
      </FormModal>
    </div>
  )
}

function SummaryRoom() {
  const { id = "" } = useParams()
  return <SessionSummary sessionId={id} base="/api/institute" />
}

function TeacherSessions() {
  const { lang } = useI18n()
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState("")
  useEffect(() => { api<Row[]>("/api/teacher/sessions").then(setRows).catch((reason) => setError(reason.message)) }, [])
  return (
    <section className="sheet">
      <h2>{lang === "ar" ? "جلساتك فقط" : "Your sessions only"}</h2>
      {error ? <Callout tone="bad">{error}</Callout> : null}
      {rows.map((row) => <SessionLine key={row.id} row={row as unknown as SessionRow} />)}
    </section>
  )
}

function Settings() {
  const { lang } = useI18n()
  const [profile, setProfile] = useState<Row | null>(null)
  useEffect(() => { api<Row>("/api/institute/settings").then(setProfile).catch(() => setProfile(null)) }, [])
  if (!profile) return <div className="panel"><div className="skel" /></div>
  return (
    <section className="sheet">
      <p className="identity">{profile.instituteName}</p>
      <p className="lede">{profile.phone} · {profile.phone2}</p>
      <p>{profile.address}</p>
      <p className="lede">{profile.description}</p>
      <p className="lede">{lang === "ar" ? "هذه البيانات من واجهة المعهد." : "These values come from the institute API."}</p>
    </section>
  )
}
