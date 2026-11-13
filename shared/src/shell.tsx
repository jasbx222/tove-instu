import { useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { TiltLayer } from "./vivid"
import { setToken } from "./api"
import { useI18n } from "./i18n"

export type NavItem = { to: string; ar: string; en: string; group?: string }

const glyphs: Record<string, string> = {
  home: "M12 3.2 3.6 10.1c-.25.2-.2.6.05.75V20c0 .7.55 1.25 1.25 1.25h4.4v-5.5c0-.35.3-.65.65-.65h4.1c.35 0 .65.3.65.65v5.5h4.4c.7 0 1.25-.55 1.25-1.25v-9.15c.25-.15.3-.55.05-.75L12 3.2Z",
  people: "M8.1 11.4a2.85 2.85 0 1 0 0-5.7 2.85 2.85 0 0 0 0 5.7Zm8.15-.35a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5ZM3.15 18.9c.45-2.7 2.45-4.15 4.95-4.15s4.5 1.45 4.95 4.15c.08.4-.22.75-.63.75H3.78c-.41 0-.71-.35-.63-.75Zm11.35-.15c.25-1.7 1.55-2.75 3.2-2.75 1.35 0 2.45.7 2.95 2.05.16.42-.16.8-.6.8h-5.05c-.32 0-.52-.28-.5-.6Z",
  book: "M6.2 4.3C6.2 3 7.3 2 8.6 2H19v16.4H8.8c-.85 0-1.6.4-2.1 1-.2.25-.5.15-.5-.15V4.3Zm3.3 2.5h6.3v1.5H9.5V6.8Zm0 3.2h6.3v1.5H9.5V10Z",
  live: "M3.2 8.1c0-.7.55-1.25 1.25-1.25h8.3c.7 0 1.25.55 1.25 1.25v7.8c0 .7-.55 1.25-1.25 1.25h-8.3c-.7 0-1.25-.55-1.25-1.25V8.1Zm12 1.35 4.35-2.35c.45-.25.95.08.95.6v8.6c0 .52-.5.85-.95.6L15.2 14.55V9.45Z",
  coins: "M12 4.2c3.9 0 7 1.05 7 2.35S15.9 8.9 12 8.9 5 7.85 5 6.55 8.1 4.2 12 4.2Zm6.55 3.55c.15.3.25.6.25.9 0 1.15-3 2.15-6.8 2.15s-6.8-1-6.8-2.15c0-.3.1-.6.25-.9C6.3 8.7 8.9 9.4 12 9.4s5.7-.7 6.55-1.65Zm0 3.7c.15.3.25.6.25.9 0 1.15-3 2.15-6.8 2.15s-6.8-1-6.8-2.15c0-.3.1-.6.25-.9.85.95 3.45 1.65 6.55 1.65s5.7-.7 6.55-1.65Zm0 3.7c.15.3.25.6.25.9 0 1.15-3 2.15-6.8 2.15s-6.8-1-6.8-2.15c0-.3.1-.6.25-.9.85.95 3.45 1.65 6.55 1.65s5.7-.7 6.55-1.65Z",
  note: "M7.2 2.8h6.4L19 8.2v12.2c0 .7-.55 1.25-1.25 1.25H7.2c-.7 0-1.25-.55-1.25-1.25V4.05c0-.7.55-1.25 1.25-1.25Zm5.9 1.5V8.4H17l-3.9-4.1ZM8.6 11.2h6.6v1.45H8.6V11.2Zm0 3h5.1v1.45H8.6v-1.45Z",
  gear: "M10.15 2.7h3.7l.45 1.85c.55.15 1.05.4 1.5.7l1.75-.85 1.85 1.85-.85 1.75c.3.45.55.95.7 1.5l1.85.45v3.7l-1.85.45c-.15.55-.4 1.05-.7 1.5l.85 1.75-1.85 1.85-1.75-.85c-.45.3-.95.55-1.5.7l-.45 1.85h-3.7l-.45-1.85a6 6 0 0 1-1.5-.7l-1.75.85-1.85-1.85.85-1.75a6 6 0 0 1-.7-1.5l-1.85-.45v-3.7l1.85-.45c.15-.55.4-1.05.7-1.5l-.85-1.75 1.85-1.85 1.75.85c.45-.3.95-.55 1.5-.7l.45-1.85ZM12 9.15a2.85 2.85 0 1 0 0 5.7 2.85 2.85 0 0 0 0-5.7Z",
}

function iconFor(to: string) {
  if (to === "/" || to.endsWith("home")) return "home"
  if (/teacher|student|employee|assistant|group/.test(to)) return "people"
  if (/course|summar|exam|subject|grade|section|domain|guide|faq|ad/.test(to)) return "book"
  if (/session|classroom|meeting|chat|hour|pool/.test(to)) return "live"
  if (/plan|subscription|invoice|code|report/.test(to)) return "coins"
  if (/setting|parameter|profile|notif/.test(to)) return "gear"
  return "note"
}

function Glyph({ name }: { name: string }) {
  const gear = name === "gear"
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule={gear ? "evenodd" : undefined} d={glyphs[name] ?? glyphs.note} />
    </svg>
  )
}

export function Mark() {
  return (
    <svg className="mark-svg" viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="16" fill="#6A4CFF" />
      <path d="M11.5 13h13M18 13v12" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="29" cy="7" r="3.4" fill="#FFC23D" />
    </svg>
  )
}

export function Shell({ title, items, children }: { title: string; items: NavItem[]; children: React.ReactNode }) {
  const { t, lang, toggle } = useI18n()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const reduce = useReducedMotion()
  const room = location.pathname.includes("/meetings/")
  const needle = query.trim().toLowerCase()
  const visible = needle ? items.filter((item) => (lang === "ar" ? item.ar : item.en).toLowerCase().includes(needle)) : items
  const exact = items.find((item) => item.to === location.pathname)
  const nested = items.filter((item) => item.to !== "/" && location.pathname.startsWith(item.to)).sort((a, b) => b.to.length - a.to.length)[0]
  const current = exact ?? nested
  const pageLabel = current ? (lang === "ar" ? current.ar : current.en) : title
  let lastGroup = ""
  return (
    <div className="tovi-app">
      <TiltLayer />
      {open ? <button className="scrim" aria-label={t.close} onClick={() => setOpen(false)} /> : null}
      <aside className={open ? "tovi-side open" : "tovi-side"}>
        <div className="brand">
          <Mark />
          <div><strong>{t.brand}</strong><span>{title}</span></div>
        </div>
        <div className="side-scroll">
          {visible.map((item) => {
            const groupLabel = item.group?.includes("|") ? (lang === "ar" ? item.group.split("|")[0] : item.group.split("|")[1]) : item.group
            const group = !needle && groupLabel && item.group !== lastGroup ? groupLabel : ""
            if (item.group) lastGroup = item.group
            const label = lang === "ar" ? item.ar : item.en
            return (
              <div key={item.to}>
                {group ? <div className="nav-group">{group}</div> : null}
                <NavLink className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} to={item.to} end={item.to === "/"} onClick={() => setOpen(false)}>
                  <Glyph name={iconFor(item.to)} />
                  {label}
                </NavLink>
              </div>
            )
          })}
          {visible.length === 0 ? <p className="nav-empty">{t.empty}</p> : null}
        </div>
        <div className="side-foot">
          <button className="lang" type="button" onClick={toggle}>{t.language}</button>
          <button className="ghost" type="button" onClick={() => { setToken(""); navigate("/login") }}>{t.logout}</button>
        </div>
      </aside>
      <div className="tovi-main">
        <header className="tovi-top">
          <button className="menu-btn ghost" type="button" onClick={() => setOpen(true)}>{t.menu}</button>
          <div className="top-title">
            <span className="top-kicker">{title}</span>
            {room ? null : <h1>{pageLabel}</h1>}
          </div>
          <label className="top-search">
            <span className="sr-only">{t.menuSearch}</span>
            <input className="search" value={query} placeholder={t.menuSearch} onChange={(event) => {
              setQuery(event.target.value)
              if (event.target.value.trim() && window.matchMedia("(max-width: 860px)").matches) setOpen(true)
            }} />
          </label>
          <div className="who-chip">
            <span className="who-copy"><strong>{title}</strong><small>{t.brand}</small></span>
            <span className="who" aria-hidden="true">{title.slice(0, 1)}</span>
          </div>
        </header>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className={room ? "tovi-content room" : "tovi-content"}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export function AuthLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const { t, toggle } = useI18n()
  return (
    <div className="auth">
      <div className="auth-stage">
        <main className="auth-card">
          <div className="auth-head">
            <Mark />
            <button className="lang" type="button" onClick={toggle}>{t.language}</button>
          </div>
          <p className="auth-brand">{t.brand}</p>
          <h1>{title}</h1>
          <p className="lede">{t.tagline}</p>
          {children}
        </main>
      </div>
    </div>
  )
}

export function LoginCard({ title, onSubmit, extra }: { title: string; onSubmit: (phone: string, password: string) => Promise<void>; extra?: React.ReactNode }) {
  const { t } = useI18n()
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  return (
    <AuthLayout title={title}>
      <form onSubmit={async (event) => {
        event.preventDefault()
        setError("")
        try { await onSubmit(phone, password) } catch (reason) { setError(reason instanceof Error ? reason.message : t.error) }
      }}>
        <label className="field">{t.phone}
          <input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="username" inputMode="tel" />
        </label>
        <label className="field">{t.password}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="btn" type="submit">{t.login}</button>
        {extra}
      </form>
    </AuthLayout>
  )
}
