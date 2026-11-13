import { useEffect, useState } from "react"
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router"
import { api, setToken, type SessionUser } from "../shared/src/api"
import { useI18n } from "../shared/src/i18n"
import { institutePermissions } from "../shared/src/permissions"
import { Resource } from "../shared/src/resource"
import { AuthLayout, LoginCard, Shell, type NavItem } from "../shared/src/shell"
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
  useEffect(() => { api<NonNullable<typeof data>>("/api/institute/dashboard").then(setData).catch((reason) => setError(reason.message)) }, [])
  if (error) return <Callout tone="bad">{error}</Callout>
  if (!data) return <div className="panel"><div className="skel" /><div className="skel short" style={{ marginTop: 12 }} /></div>
  return (
    <div className="stack">
      <Mast kicker={lang === "ar" ? "تشغيل المعهد" : "Institute operations"} title={lang === "ar" ? "المعلمون والدورات والرصيد المشترك" : "Teachers, courses, and the shared pool"} />
      <MetricBand items={[
        { label: lang === "ar" ? "ساعات الرصيد" : "Pool hours", value: data.poolHours, hint: `${data.poolMinutes} ${lang === "ar" ? "دقيقة" : "minutes"}`, lead: true },
        { label: lang === "ar" ? "المعلمون" : "Teachers", value: data.teachers },
        { label: lang === "ar" ? "الدورات" : "Courses", value: data.courses },
        { label: lang === "ar" ? "الطلاب" : "Students", value: data.students },
        { label: lang === "ar" ? "رصيد الأكواد" : "Code balance", value: data.codeBalance },
      ]} />
    </div>
  )
}

function Teachers() {
  const { lang } = useI18n()
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", password: "" })
  const [error, setError] = useState("")
  const [tick, setTick] = useState(0)
  return (
    <div className="page">
      <Mast title={lang === "ar" ? "أضف معلماً ثم افتح دوراته." : "Add a teacher, then open their courses."} />
      <form className="composer" onSubmit={async (event) => {
        event.preventDefault()
        setError("")
        try { await api("/api/institute/teachers", { method: "POST", body: JSON.stringify(form) }); setForm({ firstName: "", lastName: "", phone: "", password: "" }); setTick((value) => value + 1) }
        catch (reason) { setError(reason instanceof Error ? reason.message : "") }
      }}>
        <div className="form-grid">
          <Field label={lang === "ar" ? "الاسم" : "First"} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <Field label={lang === "ar" ? "اللقب" : "Last"} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <Field label={lang === "ar" ? "الهاتف" : "Phone"} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Field type="password" label={lang === "ar" ? "كلمة المرور" : "Password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error ? <Callout tone="bad">{error}</Callout> : null}
        <button className="btn" type="submit">{lang === "ar" ? "إضافة معلم" : "Add teacher"}</button>
      </form>
      <TeacherLinks tick={tick} />
    </div>
  )
}

function TeacherLinks({ tick = 0 }: { tick?: number }) {
  const { lang } = useI18n()
  const [rows, setRows] = useState<Row[]>([])
  useEffect(() => { api<{ items: Row[] }>("/api/institute/teachers").then((page) => setRows(page.items ?? [])).catch(() => setRows([])) }, [tick])
  return <CourseCards rows={rows.map((row) => ({ id: row.id, title: `${row.firstName} ${row.lastName}`, meta: row.phone }))} href={(id) => `/courses?teacherId=${id}`} empty={lang === "ar" ? "لا يوجد معلمون بعد" : "No teachers yet"} />
}

function Courses() {
  const { lang } = useI18n()
  const teacherId = new URLSearchParams(location.search).get("teacherId") ?? ""
  const [title, setTitle] = useState("")
  const [chosen, setChosen] = useState(teacherId)
  const [error, setError] = useState("")
  const [tick, setTick] = useState(0)
  const path = teacherId ? `/api/institute/courses?teacherId=${teacherId}` : "/api/institute/courses"
  return (
    <div className="page">
      <Mast title={lang === "ar" ? "الدورة تُنشأ وتُسنَد إلى معلم المعهد." : "A course is created and assigned to an institute teacher."} />
      <form className="composer" onSubmit={async (event) => {
        event.preventDefault()
        setError("")
        try { await api("/api/institute/courses", { method: "POST", body: JSON.stringify({ title, teacherId: chosen }) }); setTitle(""); setTick((value) => value + 1) }
        catch (reason) { setError(reason instanceof Error ? reason.message : "") }
      }}>
        <div className="form-grid">
          <Field label={lang === "ar" ? "عنوان الدورة" : "Title"} value={title} onChange={(e) => setTitle(e.target.value)} />
          <Field label={lang === "ar" ? "معرف المعلم" : "Teacher id"} value={chosen} onChange={(e) => setChosen(e.target.value)} />
        </div>
        {error ? <Callout tone="bad">{error}</Callout> : null}
        <button className="btn" type="submit">{lang === "ar" ? "إنشاء وتعيين المعلم" : "Create and assign the teacher"}</button>
      </form>
      <CourseLinks path={path} tick={tick} />
    </div>
  )
}

function CourseLinks({ path, tick = 0 }: { path: string; tick?: number }) {
  const { lang } = useI18n()
  const [rows, setRows] = useState<Row[]>([])
  useEffect(() => { api<{ items: Row[] }>(path).then((page) => setRows(page.items ?? [])).catch(() => setRows([])) }, [path, tick])
  return <CourseCards rows={rows.map((row) => ({ id: row.id, title: row.title }))} href={(id) => `/courses/${id}`} empty={lang === "ar" ? "لا توجد دورات بعد" : "No courses yet"} />
}

function CourseChapters() {
  const { id = "" } = useParams()
  const { lang } = useI18n()
  const [chapters, setChapters] = useState<Row[]>([])
  const [title, setTitle] = useState("")
  async function load() { setChapters(await api(`/api/institute/courses/${id}/chapters`)) }
  useEffect(() => { void load() }, [id])
  return (
    <div className="page">
      <Mast title={lang === "ar" ? "فصول الدورة" : "Course chapters"} />
      <form className="composer inline" onSubmit={async (event) => { event.preventDefault(); await api("/api/institute/chapters", { method: "POST", body: JSON.stringify({ courseId: id, title }) }); setTitle(""); await load() }}>
        <Field label={lang === "ar" ? "فصل" : "Chapter"} value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className="btn" type="submit">{lang === "ar" ? "إضافة" : "Add"}</button>
      </form>
      {chapters.map((chapter) => <Lessons key={chapter.id} chapter={chapter} />)}
    </div>
  )
}

function Lessons({ chapter }: { chapter: Row }) {
  const { lang } = useI18n()
  const [lessons, setLessons] = useState<Row[]>([])
  const [title, setTitle] = useState("")
  const [video, setVideo] = useState("")
  async function load() { setLessons(await api(`/api/institute/chapters/${chapter.id}/lessons`)) }
  useEffect(() => { void load() }, [chapter.id])
  return (
    <section className="sheet">
      <h2>{chapter.title}</h2>
      {lessons.map((lesson) => <p key={lesson.id} className="lesson-row">{lesson.title}</p>)}
      <form className="form-grid" onSubmit={async (event) => { event.preventDefault(); await api("/api/institute/lessons", { method: "POST", body: JSON.stringify({ chapterId: chapter.id, title, videoReference: video || null }) }); setTitle(""); setVideo(""); await load() }}>
        <Field label={lang === "ar" ? "درس" : "Lesson"} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Field label={lang === "ar" ? "مرجع الفيديو" : "Video"} value={video} onChange={(e) => setVideo(e.target.value)} />
        <button className="btn" type="submit">{lang === "ar" ? "إضافة" : "Add"}</button>
      </form>
    </section>
  )
}

function Students() {
  const { lang } = useI18n()
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", password: "", kind: "Internal", schoolId: "" })
  const [error, setError] = useState("")
  const [tick, setTick] = useState(0)
  return (
    <div className="page">
      <Mast title={lang === "ar" ? "طلاب المعهد، داخليون وخارجيون." : "Institute students, internal and external."} />
      <form className="composer" onSubmit={async (event) => {
        event.preventDefault()
        setError("")
        try {
          await api("/api/institute/students", { method: "POST", body: JSON.stringify({ ...form, schoolId: form.schoolId || null }) })
          setTick((value) => value + 1)
        } catch (reason) { setError(reason instanceof Error ? reason.message : "") }
      }}>
        <div className="form-grid">
          <Field label={lang === "ar" ? "الاسم" : "First"} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <Field label={lang === "ar" ? "اللقب" : "Last"} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <Field label={lang === "ar" ? "الهاتف" : "Phone"} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Field type="password" label={lang === "ar" ? "كلمة المرور" : "Password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <SelectField label={lang === "ar" ? "داخلي أو خارجي" : "Internal or external"} value={form.kind} onChange={(value) => setForm({ ...form, kind: value })} options={[{ value: "Internal", label: lang === "ar" ? "داخلي" : "Internal" }, { value: "External", label: lang === "ar" ? "خارجي" : "External" }]} />
          <Field label={lang === "ar" ? "معرف المدرسة" : "School id"} value={form.schoolId} onChange={(e) => setForm({ ...form, schoolId: e.target.value })} />
        </div>
        {error ? <Callout tone="bad">{error}</Callout> : null}
        <button className="btn" type="submit">{lang === "ar" ? "إضافة طالب" : "Add student"}</button>
      </form>
      <Resource key={tick} path="/api/institute/students" title={lang === "ar" ? "سجل الطلاب" : "Student records"} columns={[{ key: "firstName", label: lang === "ar" ? "الاسم" : "Name" }, { key: "phone", label: lang === "ar" ? "الهاتف" : "Phone" }, { key: "studentKind", label: lang === "ar" ? "النوع" : "Kind" }]} />
    </div>
  )
}

function Employees() {
  const { lang } = useI18n()
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", password: "", groupName: "" })
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState("")
  const [tick, setTick] = useState(0)
  return (
    <div className="page">
      <Mast title={lang === "ar" ? "الصلاحيات تُحفظ مع مجموعة على الخادم." : "Permissions are saved with a group on the server."} />
      <form className="composer" onSubmit={async (event) => {
        event.preventDefault()
        setError("")
        try {
          const group = await api<{ id: string }>("/api/institute/permission-groups", { method: "POST", body: JSON.stringify({ name: form.groupName || form.firstName, permissions: selected }) })
          await api("/api/institute/employees", { method: "POST", body: JSON.stringify({ ...form, style: "Staff", groupId: group.id, permissions: [] }) })
          setTick((value) => value + 1)
        } catch (reason) { setError(reason instanceof Error ? reason.message : "") }
      }}>
        <div className="form-grid">
          <Field label={lang === "ar" ? "الاسم" : "First"} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <Field label={lang === "ar" ? "اللقب" : "Last"} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <Field label={lang === "ar" ? "الهاتف" : "Phone"} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Field type="password" label={lang === "ar" ? "كلمة المرور" : "Password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Field className="span-2" label={lang === "ar" ? "مجموعة الصلاحيات" : "Permission group"} value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })} />
        </div>
        <PermissionPicker slugs={institutePermissions} selected={selected} onChange={setSelected} lang={lang} />
        {error ? <Callout tone="bad">{error}</Callout> : null}
        <button className="btn" type="submit">{lang === "ar" ? "حفظ الموظف" : "Save employee"}</button>
      </form>
      <Resource key={tick} path="/api/institute/employees" title={lang === "ar" ? "سجل الموظفين" : "Employee records"} columns={[{ key: "firstName", label: lang === "ar" ? "الاسم" : "Name" }, { key: "phone", label: lang === "ar" ? "الهاتف" : "Phone" }]} />
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
  const [classroomId, setClassroomId] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [duration, setDuration] = useState(60)
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState("")
  async function load() { setRows(await api("/api/institute/sessions")) }
  useEffect(() => { void load() }, [])
  return (
    <div className="page">
      <Mast title={lang === "ar" ? "الجدولة تخصم المدة من الرصيد المشترك." : "Scheduling deducts the duration from the shared pool."} />
      <form className="composer" onSubmit={async (event) => {
        event.preventDefault()
        setError("")
        try {
          await api("/api/institute/sessions", { method: "POST", body: JSON.stringify({ classroomId, startsAt: new Date(startsAt).toISOString(), durationMinutes: duration }) })
          await load()
        } catch (reason) { setError(reason instanceof Error ? reason.message : "") }
      }}>
        <Field label={lang === "ar" ? "معرف القاعة من الطلب" : "Classroom id from the request"} value={classroomId} onChange={(e) => setClassroomId(e.target.value)} />
        <Field type="datetime-local" label={lang === "ar" ? "البداية" : "Starts"} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        <SelectField label={lang === "ar" ? "المدة" : "Duration"} value={String(duration)} onChange={(value) => setDuration(Number(value))} options={[30, 45, 60, 90, 120].map((minutes) => ({ value: String(minutes), label: String(minutes) }))} />
        {error ? <Callout tone="bad">{error}</Callout> : null}
        <button className="btn" type="submit">{lang === "ar" ? "جدولة من الرصيد المشترك" : "Schedule from the shared pool"}</button>
      </form>
      {rows.map((row) => <p key={row.id} className="record">{row.classroomId} · {row.durationMinutes} · {row.status}</p>)}
    </div>
  )
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
      {rows.map((row) => <p key={row.id} className="lesson-row">{row.startsAt} · {row.durationMinutes}</p>)}
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
