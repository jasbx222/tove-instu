import { useEffect, useState, type ReactNode } from "react"
import { Link, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router"
import { AnimatePresence, motion } from "framer-motion"
import {
  IconArrowRight, IconBuildingCommunity, IconCalendarPlus, IconCheck, IconChevronDown, IconClockHour4, IconExternalLink, IconHourglass,
  IconMapPin, IconMovie, IconPackage, IconPhone, IconPlus, IconPresentation, IconSchool, IconTicket, IconUserPlus, IconUsers, IconVideo,
} from "@tabler/icons-react"
import { api, setToken, type SessionUser } from "../shared/src/api"
import { FormSection, Fields, PermissionPicker, DateTimeField, Segmented, Select, TextArea, TextField } from "../shared/src/form"
import { useI18n } from "../shared/src/i18n"
import { institutePermissions } from "../shared/src/permissions"
import { PaymentsPaused, SubscriptionsCard, usePaymentsOnline } from "../shared/src/plans"
import { Resource } from "../shared/src/resource"
import { AuthLayout, Boot, LoginCard, Shell, type NavItem } from "../shared/src/shell"
import {
  Alert, Avatar, Badge, Button, ButtonLink, Card, CardHead, CardSkeleton, CoverTiles, Dialog, EmptyState, ErrorState, PageHeader, Skeleton,
  StatCard, StatusBadge, celebrate, formatDate, useAction,
} from "../shared/src/ui"

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
const list = <T,>(data: T[] | { items?: T[] }) => (Array.isArray(data) ? data : data.items ?? [])

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
  const { tr } = useI18n()
  return (
    <LoginCard title={tr("لوحة المعهد", "Institute")} extra={<p className="auth-switch">{tr("معهد جديد؟", "New institute?")} <Link to="/register">{tr("تسجيل معهد جديد", "Register an institute")}</Link></p>} onSubmit={async (phone, password) => {
      const result = await api<{ token: string }>("/api/auth/institute/login", { method: "POST", body: JSON.stringify({ phone, password }) })
      setToken(result.token)
      navigate("/")
    }} />
  )
}

function Register() {
  const navigate = useNavigate()
  const { tr } = useI18n()
  const [form, setForm] = useState({ instituteName: "", firstName: "", phone: "", phone2: "", address: "", description: "", password: "" })
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const set = (name: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [name]: event.target.value })
  return (
    <AuthLayout wide title={tr("تسجيل المعهد", "Institute registration")} lede={tr("ثلاث خطوات قصيرة، ثم تدخل مساحة عملك.", "Three short steps, then you are in your workspace.")}>
      <form className="form" onSubmit={async (event) => {
        event.preventDefault()
        setError("")
        setBusy(true)
        try {
          const result = await api<{ token: string }>("/api/auth/institute/register", { method: "POST", body: JSON.stringify(form) })
          setToken(result.token)
          navigate("/")
        } catch (reason) { setError(reason instanceof Error ? reason.message : "") } finally { setBusy(false) }
      }}>
        <FormSection step={1} title={tr("المعهد", "Institute")} tone="sky">
          <TextField label={tr("اسم المعهد", "Institute name")} icon={IconBuildingCommunity} value={form.instituteName} onChange={set("instituteName")} required />
          <TextField label={tr("العنوان", "Address")} icon={IconMapPin} value={form.address} onChange={set("address")} required />
          <TextArea label={tr("الوصف", "Description")} value={form.description} onChange={set("description")} required rows={3} />
        </FormSection>
        <FormSection step={2} title={tr("المسؤول", "Contact person")} tone="sky">
          <TextField label={tr("الاسم", "First name")} value={form.firstName} onChange={set("firstName")} required />
          <Fields two>
            <TextField label={tr("هاتف عراقي", "Iraqi phone")} icon={IconPhone} inputMode="tel" dir="ltr" value={form.phone} onChange={set("phone")} required />
            <TextField label={tr("هاتف عراقي ثان", "Second Iraqi phone")} icon={IconPhone} inputMode="tel" dir="ltr" value={form.phone2} onChange={set("phone2")} required />
          </Fields>
        </FormSection>
        <FormSection step={3} title={tr("الدخول", "Sign-in")} tone="sky">
          <TextField type="password" label={tr("كلمة المرور", "Password")} value={form.password} onChange={set("password")} required autoComplete="new-password" />
        </FormSection>
        {error ? <Alert tone="bad">{error}</Alert> : null}
        <Button variant="sky" size="lg" type="submit" block busy={busy}>{tr("إنشاء الحساب", "Create account")}</Button>
        <p className="auth-switch">{tr("لديك حساب؟", "Have an account?")} <Link to="/login">{tr("لدي حساب", "I already have an account")}</Link></p>
      </form>
    </AuthLayout>
  )
}

function Screen({ lede, actions, children, title }: { lede?: ReactNode; actions?: ReactNode; children: ReactNode; title?: string }) {
  return <div className="page"><PageHeader title={title} lede={lede} actions={actions} />{children}</div>
}

function Frame() {
  const [me, setMe] = useState<SessionUser | null>(null)
  const navigate = useNavigate()
  const { tr } = useI18n()
  useEffect(() => { api<SessionUser>("/api/auth/me").then(setMe).catch(() => navigate("/login")) }, [navigate])
  if (!me) return <Boot />
  if (me.type === "Teacher") {
    return (
      <Shell title={tr("جلساتي", "My sessions")} items={[{ to: "/sessions", ar: "الجلسات", en: "Sessions" }]} user={me}>
        <Routes>
          <Route path="/sessions" element={<TeacherSessions />} />
          <Route path="*" element={<Navigate to="/sessions" replace />} />
        </Routes>
      </Shell>
    )
  }
  const items = nav.filter((item) => !item.permission || me.permissions.includes(item.permission))
  return (
    <Shell title={me.instituteName || tr("المعهد", "Institute")} items={items} user={me}>
      <Routes>
        <Route path="/" element={<Dashboard me={me} items={items} />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseChapters />} />
        <Route path="/summaries" element={<Screen lede={tr("ملخصات معلمي المعهد.", "Summaries by the institute's teachers.")}>
          <Resource path="/api/institute/summaries" title={tr("الملخصات", "Summaries")} columns={[{ key: "title", label: tr("العنوان", "Title") }]} />
        </Screen>} />
        <Route path="/students" element={<Students />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/schools" element={<Screen lede={tr("المدارس التي ينتمي إليها طلاب المعهد.", "Schools the institute's students belong to.")}>
          <Resource path="/api/institute/schools" title={tr("المدارس", "Schools")} createLabel={tr("مدرسة جديدة", "New school")} columns={[{ key: "name", label: tr("الاسم", "Name") }]} fields={[{ name: "name", label: tr("اسم المدرسة", "School") }]} />
        </Screen>} />
        <Route path="/exams" element={<Screen lede={tr("اختبارات دورات المعهد وحالتها.", "Exams on the institute's courses and their status.")}>
          <Resource path="/api/institute/exams" title={tr("الاختبارات", "Exams")} columns={[
            { key: "title", label: tr("العنوان", "Title") },
            { key: "status", label: tr("الحالة", "Status") },
            { key: "mark", label: tr("الدرجة", "Mark"), align: "end" },
          ]} />
        </Screen>} />
        <Route path="/ads" element={<Screen lede={tr("إعلانات المعهد.", "The institute's advertisements.")}>
          <Resource path="/api/institute/advertisements" title={tr("الإعلانات", "Advertisements")} columns={[{ key: "title", label: tr("العنوان", "Title") }]} />
        </Screen>} />
        <Route path="/reports" element={<Screen lede={tr("أكواد المعهد وحالتها.", "The institute's codes and their status.")}>
          <Resource path="/api/institute/reports/codes" title={tr("تقارير الأكواد", "Code reports")} columns={[
            { key: "code", label: tr("الكود", "Code"), render: (row) => <span className="code-chip">{String(row.code ?? "—")}</span> },
            { key: "status", label: tr("الحالة", "Status") },
          ]} />
        </Screen>} />
        <Route path="/plans" element={<Plans me={me} />} />
        <Route path="/pool" element={<Pool />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/faq" element={<Screen lede={tr("الأسئلة الشائعة كما نشرتها الإدارة.", "Frequently asked questions as published by the admin.")}>
          <Resource path="/api/institute/faq" title={tr("الأسئلة", "FAQ")} columns={[
            { key: "question", label: tr("السؤال", "Question") },
            { key: "answer", label: tr("الجواب", "Answer"), render: (row) => <span style={{ display: "block", maxWidth: 560, whiteSpace: "normal", color: "var(--text-2)" }}>{String(row.answer ?? "")}</span> },
          ]} />
        </Screen>} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  )
}

/* ---------------- Dashboard ---------------- */

function Dashboard({ me, items }: { me: SessionUser; items: NavItem[] }) {
  const { tr, locale } = useI18n()
  const [data, setData] = useState<{ teachers: number; courses: number; students: number; codeBalance: number; poolMinutes: number; poolHours: number } | null>(null)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)
  useEffect(() => { setError(""); api<NonNullable<typeof data>>("/api/institute/dashboard").then(setData).catch((reason) => setError(reason.message)) }, [attempt])
  const can = (to: string) => items.some((item) => item.to === to)
  return (
    <div className="page">
      <section className="hero sky" style={{ marginTop: 16 }}>
        <div>
          <p className="hero-date">{new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Baghdad" })}</p>
          <h1>{me.instituteName || tr("المعهد", "Institute")}</h1>
          <p>{tr("المعلمون والدورات والرصيد المشترك في نظرة واحدة.", "Teachers, courses, and the shared pool at a glance.")}</p>
          <div className="hero-actions">
            {can("/teachers") ? <ButtonLink to="/teachers" className="on-hero" icon={IconUsers}>{tr("المعلمون", "Teachers")}</ButtonLink> : null}
            {can("/sessions") ? <ButtonLink to="/sessions" className="on-hero-ghost" icon={IconCalendarPlus}>{tr("جدولة جلسة", "Schedule a session")}</ButtonLink> : null}
          </div>
        </div>
        <WorkspaceArt />
      </section>
      {error ? <Card><ErrorState message={error} onRetry={() => setAttempt((n) => n + 1)} /></Card> : !data ? <CardSkeleton count={5} /> : (
        <div className="stats">
          <StatCard hero label={tr("ساعات الرصيد", "Pool hours")} value={data.poolHours} icon={IconHourglass} tone="sky" hint={<><span className="num">{data.poolMinutes.toLocaleString(locale)}</span> {tr("دقيقة", "minutes")}</>} />
          <StatCard label={tr("المعلمون", "Teachers")} value={data.teachers} icon={IconUsers} tone="purple" />
          <StatCard label={tr("الدورات", "Courses")} value={data.courses} icon={IconPresentation} tone="green" />
          <StatCard label={tr("الطلاب", "Students")} value={data.students} icon={IconSchool} tone="yellow" />
          <StatCard label={tr("رصيد الأكواد", "Code balance")} value={data.codeBalance} icon={IconTicket} tone="coral" />
        </div>
      )}
      <div className="grid-3">
        {[
          { to: "/teachers", icon: IconUserPlus, tone: "purple", ar: "أضف معلماً", en: "Add a teacher", sar: "ثم أسند إليه الدورات", sen: "Then assign courses" },
          { to: "/students", icon: IconSchool, tone: "yellow", ar: "سجّل طالباً", en: "Register a student", sar: "داخلي أو خارجي", sen: "Internal or external" },
          { to: "/pool", icon: IconHourglass, tone: "sky", ar: "رصيد الساعات", en: "Hour pool", sar: "الدقائق المتاحة للحصص", sen: "Minutes available for classes" },
        ].filter((item) => can(item.to)).map((item) => (
          <Link key={item.to} to={item.to} className={`card interactive person-card tone-${item.tone}`}>
            <span className="index-badge" style={{ width: 46, height: 46, borderRadius: 14 }}><item.icon size={22} /></span>
            <div><h3>{tr(item.ar, item.en)}</h3><p>{tr(item.sar, item.sen)}</p></div>
            <IconArrowRight size={20} className="go flip-rtl" />
          </Link>
        ))}
      </div>
    </div>
  )
}

function WorkspaceArt() {
  return (
    <svg className="hero-art" viewBox="0 0 220 180" aria-hidden="true">
      <ellipse cx="110" cy="166" rx="80" ry="9" fill="#03263a" opacity="0.15" />
      <rect x="34" y="70" width="152" height="90" rx="10" fill="#fff" />
      <path d="M24 74 110 24l86 50Z" fill="#202B3C" />
      <rect x="56" y="96" width="24" height="34" rx="5" fill="#58CC02" />
      <rect x="98" y="96" width="24" height="34" rx="5" fill="#FFC800" />
      <rect x="140" y="96" width="24" height="34" rx="5" fill="#FF6B81" />
      <rect x="96" y="138" width="28" height="22" rx="4" fill="#A78BFA" />
      <circle cx="110" cy="56" r="9" fill="#FFC800" />
      <path d="M190 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" fill="#fff" />
    </svg>
  )
}

/* ---------------- Teachers and courses ---------------- */

function Teachers() {
  const { tr } = useI18n()
  const empty = { firstName: "", lastName: "", phone: "", password: "" }
  const [form, setForm] = useState(empty)
  const [error, setError] = useState("")
  const [tick, setTick] = useState(0)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const add = <Button variant="sky" icon={IconUserPlus} onClick={() => { setError(""); setOpen(true) }}>{tr("إضافة معلم", "Add teacher")}</Button>
  return (
    <Screen lede={tr("أضف معلماً ثم افتح دوراته.", "Add a teacher, then open their courses.")} actions={add}>
      <TeacherLinks tick={tick} action={add} />
      <Dialog open={open} onClose={() => setOpen(false)} title={tr("إضافة معلم", "Add teacher")} icon={IconUserPlus} tone="purple" busy={busy}
        onSubmit={async (event) => {
          event.preventDefault()
          setError("")
          setBusy(true)
          try { await api("/api/institute/teachers", { method: "POST", body: JSON.stringify(form) }); setForm(empty); setTick((value) => value + 1); setOpen(false); celebrate() }
          catch (reason) { setError(reason instanceof Error ? reason.message : "") } finally { setBusy(false) }
        }}
        footer={<><Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>{tr("إلغاء", "Cancel")}</Button><Button variant="sky" type="submit" busy={busy}>{tr("إضافة معلم", "Add teacher")}</Button></>}>
        <div className="form">
          {error ? <Alert tone="bad">{error}</Alert> : null}
          <Fields two>
            <TextField label={tr("الاسم", "First")} value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
            <TextField label={tr("اللقب", "Last")} value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
            <TextField label={tr("الهاتف", "Phone")} icon={IconPhone} inputMode="tel" dir="ltr" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            <TextField type="password" label={tr("كلمة المرور", "Password")} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" />
          </Fields>
        </div>
      </Dialog>
    </Screen>
  )
}

function TeacherLinks({ tick = 0, action }: { tick?: number; action: ReactNode }) {
  const { tr } = useI18n()
  const [rows, setRows] = useState<Row[] | null>(null)
  useEffect(() => { api<{ items: Row[] }>("/api/institute/teachers").then((page) => setRows(page.items ?? [])).catch(() => setRows([])) }, [tick])
  if (rows === null) return <div className="tiles">{Array.from({ length: 4 }).map((_, i) => <Card key={i} pad><Skeleton lines={2} /></Card>)}</div>
  if (rows.length === 0) return <Card><EmptyState scene="people" title={tr("لا يوجد معلمون بعد", "No teachers yet")} hint={tr("المعلم الأول يفتح باب الدورات.", "Your first teacher opens the way to courses.")} action={action} /></Card>
  return (
    <div className="tiles">
      {rows.map((row, index) => {
        const name = `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim()
        return (
          <motion.div key={row.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.04 }}>
            <Link to={`/courses?teacherId=${row.id}`} className="card interactive person-card" style={{ height: "100%" }}>
              <Avatar name={name || "?"} size="lg" />
              <div style={{ minWidth: 0 }}><h3>{name || "—"}</h3><p dir="ltr" style={{ textAlign: "start" }}>{row.phone}</p></div>
              <IconArrowRight size={20} className="go flip-rtl" />
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}

function Courses() {
  const { tr } = useI18n()
  const [params] = useSearchParams()
  const teacherId = params.get("teacherId") ?? ""
  const [title, setTitle] = useState("")
  const [chosen, setChosen] = useState(teacherId)
  const [teachers, setTeachers] = useState<Row[]>([])
  const [error, setError] = useState("")
  const [tick, setTick] = useState(0)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => { setChosen(teacherId) }, [teacherId])
  useEffect(() => { api<{ items: Row[] }>("/api/institute/teachers").then((page) => setTeachers(page.items ?? [])).catch(() => setTeachers([])) }, [])
  const path = teacherId ? `/api/institute/courses?teacherId=${teacherId}` : "/api/institute/courses"
  const teacher = teachers.find((row) => row.id === teacherId)
  const add = <Button variant="sky" icon={IconPlus} onClick={() => { setError(""); setOpen(true) }}>{tr("دورة جديدة", "New course")}</Button>
  return (
    <Screen lede={tr("الدورة تُنشأ وتُسنَد إلى معلم المعهد.", "A course is created and assigned to an institute teacher.")} actions={add}>
      {teacherId ? (
        <div className="row">
          <Badge tone="info">{tr("معلم:", "Teacher:")} {teacher ? `${teacher.firstName} ${teacher.lastName ?? ""}` : teacherId}</Badge>
          <ButtonLink to="/courses" variant="ghost" size="sm">{tr("كل الدورات", "All courses")}</ButtonLink>
        </div>
      ) : null}
      <CourseLinks path={path} tick={tick} action={add} />
      <Dialog open={open} onClose={() => setOpen(false)} title={tr("دورة جديدة", "New course")} icon={IconPresentation} tone="green" busy={busy}
        onSubmit={async (event) => {
          event.preventDefault()
          setError("")
          setBusy(true)
          try { await api("/api/institute/courses", { method: "POST", body: JSON.stringify({ title, teacherId: chosen }) }); setTitle(""); setTick((value) => value + 1); setOpen(false); celebrate() }
          catch (reason) { setError(reason instanceof Error ? reason.message : "") } finally { setBusy(false) }
        }}
        footer={<><Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>{tr("إلغاء", "Cancel")}</Button><Button variant="sky" type="submit" busy={busy}>{tr("إنشاء وتعيين المعلم", "Create and assign the teacher")}</Button></>}>
        <div className="form">
          {error ? <Alert tone="bad">{error}</Alert> : null}
          <TextField label={tr("عنوان الدورة", "Title")} value={title} onChange={(event) => setTitle(event.target.value)} />
          {teachers.length > 0
            ? <Select label={tr("المعلم", "Teacher")} value={chosen} onChange={setChosen} options={teachers.map((row) => ({ value: row.id, label: `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim() || row.id, hint: row.phone }))} />
            : <TextField label={tr("معرف المعلم", "Teacher id")} value={chosen} onChange={(event) => setChosen(event.target.value)} dir="ltr" />}
        </div>
      </Dialog>
    </Screen>
  )
}

function CourseLinks({ path, tick = 0, action }: { path: string; tick?: number; action: ReactNode }) {
  const { tr } = useI18n()
  const [rows, setRows] = useState<Row[] | null>(null)
  useEffect(() => { setRows(null); api<{ items: Row[] }>(path).then((page) => setRows(page.items ?? [])).catch(() => setRows([])) }, [path, tick])
  if (rows === null) return <div className="tiles">{Array.from({ length: 4 }).map((_, i) => <Card key={i} pad><Skeleton lines={2} block /></Card>)}</div>
  return <CoverTiles rows={rows.map((row) => ({ id: row.id, title: row.title }))} href={(id) => `/courses/${id}`} emptyTitle={tr("لا توجد دورات بعد", "No courses yet")} emptyAction={action} />
}

function CourseChapters() {
  const { id = "" } = useParams()
  const { tr } = useI18n()
  const [chapters, setChapters] = useState<Row[] | null>(null)
  const [title, setTitle] = useState("")
  const [openId, setOpenId] = useState<string | null>(null)
  const { busy, run } = useAction()
  async function load() { setChapters(await api(`/api/institute/courses/${id}/chapters`)) }
  useEffect(() => { load().catch(() => setChapters([])) }, [id])
  return (
    <Screen title={tr("فصول الدورة", "Course chapters")} lede={tr("رتّب محتوى الدورة نيابة عن المعلم.", "Arrange the course content on the teacher's behalf.")}
      actions={<ButtonLink to="/courses" variant="ghost" icon={IconPresentation}>{tr("كل الدورات", "All courses")}</ButtonLink>}>
      <Card as="form" onSubmit={async (event) => {
        const target = event.currentTarget
        if (await run(async () => { await api("/api/institute/chapters", { method: "POST", body: JSON.stringify({ courseId: id, title }) }); setTitle(""); await load() }, tr("أُضيف الفصل", "Chapter added"))) celebrate(target)
      }}>
        <div className="card-body" style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px" }}><TextField label={tr("فصل جديد", "New chapter")} value={title} onChange={(event) => setTitle(event.target.value)} /></div>
          <Button variant="sky" type="submit" icon={IconPlus} busy={busy}>{tr("إضافة", "Add")}</Button>
        </div>
      </Card>
      <div>
        {chapters === null ? <Card pad><Skeleton lines={4} /></Card> : chapters.length === 0
          ? <Card><EmptyState scene="books" title={tr("لا توجد فصول بعد", "No chapters yet")} /></Card>
          : chapters.map((chapter, index) => <Lessons key={chapter.id} chapter={chapter} index={index} open={openId === chapter.id || (openId === null && index === 0)} onToggle={() => setOpenId(openId === chapter.id ? "" : chapter.id)} />)}
      </div>
    </Screen>
  )
}

function Lessons({ chapter, index, open, onToggle }: { chapter: Row; index: number; open: boolean; onToggle: () => void }) {
  const { tr } = useI18n()
  const [lessons, setLessons] = useState<Row[]>([])
  const [title, setTitle] = useState("")
  const [video, setVideo] = useState("")
  const { busy, run } = useAction()
  async function load() { setLessons(await api(`/api/institute/chapters/${chapter.id}/lessons`)) }
  useEffect(() => { load().catch(() => setLessons([])) }, [chapter.id])
  return (
    <div className={open ? "acc open" : "acc"}>
      <button type="button" className="acc-head" aria-expanded={open} onClick={onToggle}>
        <span className="index-badge tone-sky">{index + 1}</span>
        <h3>{chapter.title}</h3>
        <Badge plain>{lessons.length} {tr("درس", "lessons")}</Badge>
        <IconChevronDown size={20} className="chev" aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div className="acc-body" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24 }} style={{ overflow: "hidden" }}>
            <div className="list">
              {lessons.length === 0 ? <EmptyState compact scene="books" title={tr("لا دروس في هذا الفصل", "No lessons in this chapter")} /> : lessons.map((lesson, i) => (
                <div key={lesson.id} className="list-item">
                  <span className="index-badge">{i + 1}</span>
                  <div className="li-main"><strong>{lesson.title}</strong></div>
                </div>
              ))}
            </div>
            <form className="inner" style={{ borderTop: "1px solid var(--line-soft)", background: "var(--surface-2)" }} onSubmit={async (event) => {
              event.preventDefault()
              await run(async () => { await api("/api/institute/lessons", { method: "POST", body: JSON.stringify({ chapterId: chapter.id, title, videoReference: video || null }) }); setTitle(""); setVideo(""); await load() }, tr("أُضيف الدرس", "Lesson added"))
            }}>
              <div className="inline-add">
                <TextField label={tr("درس جديد", "New lesson")} value={title} onChange={(event) => setTitle(event.target.value)} />
                <TextField label={tr("مرجع الفيديو", "Video")} optional icon={IconMovie} dir="ltr" value={video} onChange={(event) => setVideo(event.target.value)} />
                <div><Button type="submit" icon={IconPlus} busy={busy}>{tr("إضافة", "Add")}</Button></div>
              </div>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/* ---------------- People ---------------- */

function Students() {
  const { tr } = useI18n()
  const empty = { firstName: "", lastName: "", phone: "", password: "", kind: "Internal", schoolId: "" }
  const [form, setForm] = useState(empty)
  const [schools, setSchools] = useState<Row[]>([])
  const [error, setError] = useState("")
  const [tick, setTick] = useState(0)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => { api<Row[] | { items: Row[] }>("/api/institute/schools?page=1&pageSize=100").then((data) => setSchools(list(data))).catch(() => setSchools([])) }, [])
  return (
    <Screen lede={tr("طلاب المعهد، داخليون وخارجيون.", "Institute students, internal and external.")} actions={<Button variant="sky" icon={IconUserPlus} onClick={() => { setError(""); setOpen(true) }}>{tr("إضافة طالب", "Add student")}</Button>}>
      <Resource key={tick} path="/api/institute/students" title={tr("سجل الطلاب", "Student records")} columns={[
        { key: "firstName", label: tr("الاسم", "Name"), render: (row) => <span className="cell-main"><Avatar name={String(row.firstName ?? "?")} />{String(row.firstName ?? "")}</span> },
        { key: "phone", label: tr("الهاتف", "Phone"), render: (row) => <span dir="ltr" className="num">{String(row.phone ?? "—")}</span> },
        { key: "studentKind", label: tr("النوع", "Kind"), render: (row) => <StatusBadge value={row.studentKind} /> },
      ]} />
      <Dialog open={open} onClose={() => setOpen(false)} title={tr("إضافة طالب", "Add student")} icon={IconSchool} tone="yellow" size="lg" busy={busy}
        onSubmit={async (event) => {
          event.preventDefault()
          setError("")
          setBusy(true)
          try {
            await api("/api/institute/students", { method: "POST", body: JSON.stringify({ ...form, schoolId: form.schoolId || null }) })
            setTick((value) => value + 1); setOpen(false); setForm(empty); celebrate()
          } catch (reason) { setError(reason instanceof Error ? reason.message : "") } finally { setBusy(false) }
        }}
        footer={<><Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>{tr("إلغاء", "Cancel")}</Button><Button variant="sky" type="submit" busy={busy}>{tr("إضافة طالب", "Add student")}</Button></>}>
        <div className="form">
          {error ? <Alert tone="bad">{error}</Alert> : null}
          <FormSection step={1} title={tr("الطالب", "Student")}>
            <Fields two>
              <TextField label={tr("الاسم", "First")} value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
              <TextField label={tr("اللقب", "Last")} value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
              <TextField label={tr("الهاتف", "Phone")} icon={IconPhone} inputMode="tel" dir="ltr" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              <TextField type="password" label={tr("كلمة المرور", "Password")} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" />
            </Fields>
          </FormSection>
          <FormSection step={2} title={tr("الانتماء", "Affiliation")}>
            <Segmented block label={tr("داخلي أو خارجي", "Internal or external")} value={form.kind} onChange={(value) => setForm({ ...form, kind: value })} options={[{ value: "Internal", label: tr("داخلي", "Internal") }, { value: "External", label: tr("خارجي", "External") }]} />
            {schools.length > 0
              ? <Select label={tr("المدرسة", "School")} optional value={form.schoolId} onChange={(value) => setForm({ ...form, schoolId: value })} options={[{ value: "", label: tr("بلا", "None") }, ...schools.map((row) => ({ value: row.id, label: row.name }))]} />
              : <TextField label={tr("معرف المدرسة", "School id")} optional dir="ltr" value={form.schoolId} onChange={(event) => setForm({ ...form, schoolId: event.target.value })} />}
          </FormSection>
        </div>
      </Dialog>
    </Screen>
  )
}

function Employees() {
  const { tr } = useI18n()
  const empty = { firstName: "", lastName: "", phone: "", password: "", groupName: "" }
  const [form, setForm] = useState(empty)
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState("")
  const [tick, setTick] = useState(0)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  return (
    <Screen lede={tr("الصلاحيات تُحفظ مع مجموعة على الخادم.", "Permissions are saved with a group on the server.")} actions={<Button variant="sky" icon={IconUserPlus} onClick={() => { setError(""); setOpen(true) }}>{tr("موظف جديد", "New employee")}</Button>}>
      <Resource key={tick} path="/api/institute/employees" title={tr("سجل الموظفين", "Employee records")} columns={[
        { key: "firstName", label: tr("الاسم", "Name"), render: (row) => <span className="cell-main"><Avatar name={String(row.firstName ?? "?")} />{String(row.firstName ?? "")}</span> },
        { key: "phone", label: tr("الهاتف", "Phone"), render: (row) => <span dir="ltr" className="num">{String(row.phone ?? "—")}</span> },
      ]} />
      <Dialog open={open} onClose={() => setOpen(false)} title={tr("موظف جديد", "New employee")} icon={IconUserPlus} tone="navy" size="lg" busy={busy}
        onSubmit={async (event) => {
          event.preventDefault()
          setError("")
          setBusy(true)
          try {
            const group = await api<{ id: string }>("/api/institute/permission-groups", { method: "POST", body: JSON.stringify({ name: form.groupName || form.firstName, permissions: selected }) })
            await api("/api/institute/employees", { method: "POST", body: JSON.stringify({ ...form, style: "Staff", groupId: group.id, permissions: [] }) })
            setTick((value) => value + 1); setOpen(false); setForm(empty); setSelected([]); celebrate()
          } catch (reason) { setError(reason instanceof Error ? reason.message : "") } finally { setBusy(false) }
        }}
        footer={<><Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>{tr("إلغاء", "Cancel")}</Button><Button variant="sky" type="submit" busy={busy}>{tr("حفظ الموظف", "Save employee")}</Button></>}>
        <div className="form">
          {error ? <Alert tone="bad">{error}</Alert> : null}
          <FormSection step={1} title={tr("الحساب", "Account")}>
            <Fields two>
              <TextField label={tr("الاسم", "First")} value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
              <TextField label={tr("اللقب", "Last")} value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
              <TextField label={tr("الهاتف", "Phone")} icon={IconPhone} inputMode="tel" dir="ltr" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              <TextField type="password" label={tr("كلمة المرور", "Password")} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" />
            </Fields>
          </FormSection>
          <FormSection step={2} title={tr("مجموعة الصلاحيات", "Permission group")}>
            <TextField label={tr("اسم المجموعة", "Group name")} value={form.groupName} onChange={(event) => setForm({ ...form, groupName: event.target.value })} help={tr("إن تُرك فارغاً يُستخدم الاسم", "If left empty, the first name is used")} />
            <PermissionPicker slugs={institutePermissions} selected={selected} onChange={setSelected} />
          </FormSection>
        </div>
      </Dialog>
    </Screen>
  )
}

/* ---------------- Plans, pool, sessions ---------------- */

function Plans({ me }: { me: SessionUser }) {
  const { tr, locale } = useI18n()
  const [plans, setPlans] = useState<Row[] | null>(null)
  const [url, setUrl] = useState("")
  const [paying, setPaying] = useState("")
  const [error, setError] = useState("")
  const online = usePaymentsOnline()
  useEffect(() => { api<Row[]>("/api/institute/plans").then(setPlans).catch(() => setPlans([])) }, [])
  const tones = ["sky", "green", "purple", "yellow"]
  return (
    <Screen lede={tr("الباقات السنوية والدفع.", "Yearly plans and payment.")}>
      {online ? null : <PaymentsPaused />}
      {url ? <Alert tone="info" title={tr("رابط الدفع جاهز", "Payment link ready")}><a href={url} className="link" style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>{tr("افتح صفحة الدفع", "Open the payment page")}<IconExternalLink size={14} /></a><span dir="ltr" style={{ display: "block", marginTop: 4, opacity: 0.8 }}>{url}</span></Alert> : null}
      {error ? <Alert tone="bad">{error}</Alert> : null}
      {plans === null ? <CardSkeleton count={3} /> : plans.length === 0 ? <Card><EmptyState scene="ticket" title={tr("لا توجد باقات متاحة", "No plans available")} /></Card> : (
        <div className="tiles">
          {plans.map((plan, index) => (
            <Card key={plan.id} className={`price-card tone-${tones[index % tones.length]}`} interactive>
              <span style={{ display: "grid", placeItems: "center", width: 46, height: 46, borderRadius: 14, background: "var(--tile-bg)", color: "var(--tile-fg)" }}><IconPackage size={24} /></span>
              <h3 style={{ fontSize: "var(--fs-xl)" }}>{plan.title}</h3>
              <div className="price">{Number(plan.priceYearly).toLocaleString(locale)} <small>IQD / {tr("سنة", "year")}</small></div>
              {plan.codesCount != null ? <ul><li><IconCheck size={16} /><span><span className="num">{plan.codesCount}</span> {tr("كود تفعيل", "activation codes")}</span></li></ul> : null}
              <Button variant="sky" block disabled={!online} busy={paying === plan.id} onClick={async () => {
                setPaying(plan.id); setError("")
                try {
                  const result = await api<{ paymentUrl: string }>("/api/institute/subscriptions", { method: "POST", body: JSON.stringify({ userId: me.ownerId, planId: plan.id }) })
                  setUrl(result.paymentUrl)
                } catch (reason) { setError(reason instanceof Error ? reason.message : "") } finally { setPaying("") }
              }}>{tr("الدفع", "Pay")}</Button>
            </Card>
          ))}
        </div>
      )}
      <SubscriptionsCard path="/api/institute/subscriptions" plans={plans} />
    </Screen>
  )
}

function Pool() {
  const { tr, locale } = useI18n()
  const [pool, setPool] = useState<{ remainingMinutes: number; hours: number } | null | undefined>(undefined)
  useEffect(() => { api<{ remainingMinutes: number; hours: number }>("/api/institute/pool").then(setPool).catch(() => setPool(null)) }, [])
  return (
    <Screen lede={tr("دقائق المعهد المتاحة للحصص. الجدولة تخصم منها.", "Institute minutes available for classes. Scheduling deducts from them.")}>
      {pool === undefined ? <CardSkeleton count={2} /> : pool === null ? <Alert tone="info">{tr("الرصيد يُحمّل من الخادم", "The balance loads from the server")}</Alert> : (
        <div className="stats">
          <StatCard hero label={tr("الساعات المعروضة", "Displayed hours")} value={pool.hours} icon={IconHourglass} tone="sky" />
          <StatCard label={tr("الدقائق المتبقية", "Remaining minutes")} value={pool.remainingMinutes} icon={IconClockHour4} tone="green" hint={tr(`تكفي ${Math.floor(pool.remainingMinutes / 60).toLocaleString(locale)} ساعة كاملة`, `Enough for ${Math.floor(pool.remainingMinutes / 60).toLocaleString(locale)} full hours`)} />
        </div>
      )}
    </Screen>
  )
}

function Sessions() {
  const { tr, locale } = useI18n()
  const [classroomId, setClassroomId] = useState("")
  const [classrooms, setClassrooms] = useState<Row[]>([])
  const [startsAt, setStartsAt] = useState("")
  const [duration, setDuration] = useState(60)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  async function load() { setRows(await api("/api/institute/sessions")) }
  useEffect(() => { load().catch(() => setRows([])) }, [])
  useEffect(() => { api<Row[] | { items: Row[] }>("/api/institute/classrooms").then((data) => setClassrooms(list(data))).catch(() => setClassrooms([])) }, [])
  return (
    <Screen lede={tr("الجدولة تخصم المدة من الرصيد المشترك.", "Scheduling deducts the duration from the shared pool.")}>
      <div className="with-aside">
        <Card>
          <CardHead title={tr("الجلسات", "Sessions")} icon={IconVideo} tone="coral" />
          {rows === null ? <div className="card-body"><Skeleton lines={4} /></div> : rows.length === 0 ? <EmptyState scene="calendar" title={tr("لا توجد جلسات بعد", "No sessions yet")} /> : (
            <div className="list">
              {rows.map((row) => {
                const room = classrooms.find((item) => item.id === row.classroomId)
                return (
                  <div key={row.id} className="list-item">
                    <span className="index-badge tone-coral"><IconVideo size={17} /></span>
                    <div className="li-main">
                      <strong>{room?.title || <span className="mono">{row.classroomId}</span>}</strong>
                      <small>{row.startsAt ? <span className="num">{formatDate(row.startsAt, locale, true)} · </span> : null}<span className="num">{row.durationMinutes}</span> {tr("دقيقة", "min")}</small>
                    </div>
                    <StatusBadge value={row.status} />
                  </div>
                )
              })}
            </div>
          )}
        </Card>
        <aside>
          <Card as="form" onSubmit={async (event) => {
            const target = event.currentTarget
            setError("")
            setBusy(true)
            try {
              await api("/api/institute/sessions", { method: "POST", body: JSON.stringify({ classroomId, startsAt: new Date(startsAt).toISOString(), durationMinutes: duration }) })
              await load()
              celebrate(target)
            } catch (reason) { setError(reason instanceof Error ? reason.message : "") } finally { setBusy(false) }
          }}>
            <CardHead title={tr("جدولة جلسة", "Schedule a session")} icon={IconCalendarPlus} tone="sky" />
            <div className="card-body form">
              {classrooms.length > 0
                ? <Select label={tr("القاعة", "Classroom")} value={classroomId} onChange={setClassroomId} options={classrooms.map((row) => ({ value: row.id, label: row.title || row.id }))} />
                : <TextField label={tr("معرف القاعة من الطلب", "Classroom id from the request")} value={classroomId} onChange={(event) => setClassroomId(event.target.value)} dir="ltr" />}
              <DateTimeField label={tr("البداية", "Starts")} value={startsAt} onChange={setStartsAt} required />
              <Segmented block label={tr("المدة بالدقائق", "Duration in minutes")} value={String(duration)} onChange={(value) => setDuration(Number(value))} options={[30, 45, 60, 90, 120].map((minutes) => ({ value: String(minutes), label: String(minutes) }))} />
              {error ? <Alert tone="bad">{error}</Alert> : null}
            </div>
            <div className="card-foot"><Button variant="sky" type="submit" block busy={busy}>{tr("جدولة من الرصيد المشترك", "Schedule from the shared pool")}</Button></div>
          </Card>
        </aside>
      </div>
    </Screen>
  )
}

function TeacherSessions() {
  const { tr, locale } = useI18n()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState("")
  useEffect(() => { api<Row[]>("/api/teacher/sessions").then(setRows).catch((reason) => { setError(reason.message); setRows([]) }) }, [])
  return (
    <Screen title={tr("جلساتك فقط", "Your sessions only")} lede={tr("الجلسات التي جدولها المعهد لك.", "Sessions the institute scheduled for you.")}>
      {error ? <Alert tone="bad">{error}</Alert> : null}
      <Card>
        {rows === null ? <div className="card-body"><Skeleton lines={4} /></div> : rows.length === 0 ? <EmptyState scene="calendar" title={tr("لا توجد جلسات بعد", "No sessions yet")} /> : (
          <div className="list">
            {rows.map((row) => (
              <div key={row.id} className="list-item">
                <span className="index-badge tone-sky"><IconClockHour4 size={17} /></span>
                <div className="li-main"><strong className="num">{formatDate(row.startsAt, locale, true)}</strong><small><span className="num">{row.durationMinutes}</span> {tr("دقيقة", "min")}</small></div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Screen>
  )
}

function Settings() {
  const { tr } = useI18n()
  const [profile, setProfile] = useState<Row | null | undefined>(undefined)
  useEffect(() => { api<Row>("/api/institute/settings").then(setProfile).catch(() => setProfile(null)) }, [])
  return (
    <Screen lede={tr("هذه البيانات من واجهة المعهد.", "These values come from the institute API.")}>
      {profile === undefined ? <Card pad><Skeleton lines={4} /></Card> : profile === null ? <Card><ErrorState message={tr("تعذر تحميل البيانات", "The details could not be loaded")} /></Card> : (
        <div className="with-aside">
          <Card>
            <CardHead title={tr("بيانات المعهد", "Institute details")} icon={IconBuildingCommunity} tone="sky" />
            <dl className="kv card-body" style={{ margin: 0 }}>
              <div><dt>{tr("اسم المعهد", "Institute name")}</dt><dd>{profile.instituteName || "—"}</dd></div>
              <div><dt>{tr("الهاتف", "Phone")}</dt><dd dir="ltr" style={{ textAlign: "start" }}>{profile.phone || "—"}</dd></div>
              <div><dt>{tr("هاتف ثان", "Second phone")}</dt><dd dir="ltr" style={{ textAlign: "start" }}>{profile.phone2 || "—"}</dd></div>
              <div><dt>{tr("العنوان", "Address")}</dt><dd>{profile.address || "—"}</dd></div>
              <div><dt>{tr("الوصف", "Description")}</dt><dd>{profile.description || "—"}</dd></div>
            </dl>
          </Card>
          <aside>
            <Card pad>
              <div style={{ display: "grid", justifyItems: "center", gap: 10, textAlign: "center" }}>
                <Avatar name={profile.instituteName || "?"} size="xl" tone="sky" />
                <h2 style={{ fontSize: "var(--fs-xl)" }}>{profile.instituteName}</h2>
                <span className="text-3"><IconMapPin size={14} style={{ display: "inline", verticalAlign: "-2px" }} /> {profile.address || "—"}</span>
              </div>
            </Card>
          </aside>
        </div>
      )}
    </Screen>
  )
}
