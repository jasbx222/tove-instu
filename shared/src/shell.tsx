import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { NavLink, useLocation, useNavigate } from "react-router"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { IconChevronLeft, IconChevronRight, IconCommand, IconDotsCircleHorizontal, IconLanguage, IconLogout, IconMenu2, IconPhone, IconSearch, IconX } from "@tabler/icons-react"
import { setToken, type SessionUser } from "./api"
import { AuthScene, Mark, Sprout } from "./art"
import { appConfig } from "./config"
import { useI18n } from "./i18n"
import { routeVisual } from "./icons"
import { Avatar, Button, IconButton, PageCtx } from "./ui"
import { TextField } from "./form"

export type NavItem = { to: string; ar: string; en: string; group?: string }

function groupLabel(group: string | undefined, lang: string) {
  if (!group) return ""
  return group.includes("|") ? (lang === "ar" ? group.split("|")[0] : group.split("|")[1]) : group
}

export function Shell({ title, items, user, children }: { title: string; items: NavItem[]; user?: SessionUser | null; children: ReactNode }) {
  const { t, lang, toggle, dir } = useI18n()
  const [open, setOpen] = useState(false)
  const [palette, setPalette] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const reduce = useReducedMotion()
  const room = location.pathname.includes("/meetings/")
  const exact = items.find((item) => item.to === location.pathname)
  const nested = items.filter((item) => item.to !== "/" && location.pathname.startsWith(item.to)).sort((a, b) => b.to.length - a.to.length)[0]
  const current = exact ?? nested
  const pageLabel = current ? (lang === "ar" ? current.ar : current.en) : title
  const Sep = dir === "rtl" ? IconChevronLeft : IconChevronRight

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPalette(true) }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("keydown", onKey)
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("keydown", onKey) }
  }, [])
  useEffect(() => { setOpen(false); window.scrollTo({ top: 0 }) }, [location.pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  let lastGroup = ""
  const tabItems = items.slice(0, 4)
  const signOut = () => { setToken(""); navigate("/login") }

  return (
    <div className="app" data-app={appConfig.kind}>
      <a href="#main" className="sr-only">{pageLabel}</a>
      {open ? <motion.button className="scrim" aria-label={t.close} onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} /> : null}
      <aside className={open ? "side open" : "side"} aria-label={t.menu}>
        <div className="side-brand">
          <Mark size={42} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{t.brand}</strong>
            <small>{title}</small>
          </div>
          <span className="menu-btn"><IconButton icon={IconX} label={t.close} onClick={() => setOpen(false)} /></span>
        </div>
        <button type="button" className="side-jump" onClick={() => setPalette(true)}>
          <IconSearch size={17} aria-hidden="true" />
          {t.menuSearch}
          <kbd><IconCommand size={11} style={{ display: "inline", verticalAlign: "-1px" }} />K</kbd>
        </button>
        <nav className="side-nav">
          {items.map((item) => {
            const label = groupLabel(item.group, lang)
            const header = label && item.group !== lastGroup ? label : ""
            if (item.group) lastGroup = item.group
            const { Icon: Glyph, tone } = routeVisual(item.to)
            return (
              <div key={item.to}>
                {header ? <div className="nav-group">{header}</div> : null}
                <NavLink className={({ isActive }) => `nav-link tone-${tone}${isActive ? " active" : ""}`} to={item.to} end={item.to === "/"}>
                  <span className="nav-ico" aria-hidden="true"><Glyph size={19} stroke={1.9} /></span>
                  {lang === "ar" ? item.ar : item.en}
                </NavLink>
              </div>
            )
          })}
        </nav>
        {appConfig.kind === "teacher" ? (
          <div className="side-foot" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sprout className="side-sprout" mood="wave" />
            <small style={{ color: "var(--text-3)", fontSize: 12, lineHeight: 1.4 }}>{lang === "ar" ? "استوديو المحتوى" : "Content studio"}</small>
          </div>
        ) : null}
      </aside>

      <div className="main">
        <header className={scrolled ? "top scrolled" : "top"}>
          <span className="menu-btn"><IconButton icon={IconMenu2} label={t.menu} onClick={() => setOpen(true)} outlined /></span>
          <nav className="crumbs" aria-label="breadcrumb">
            <span className="crumb-root">{title}</span>
            <Sep size={14} className="crumb-sep" aria-hidden="true" />
            <strong aria-current="page">{pageLabel}</strong>
          </nav>
          <div className="top-actions">
            <IconButton icon={IconSearch} label={t.menuSearch} onClick={() => setPalette(true)} />
            <IconButton icon={IconLanguage} label={t.language} onClick={toggle} />
            <ProfileMenu user={user} title={title} onSignOut={signOut} />
          </div>
        </header>
        <PageCtx.Provider value={current ? { to: current.to, label: pageLabel } : { to: location.pathname, label: pageLabel }}>
          <AnimatePresence mode="wait">
            <motion.main
              id="main"
              key={location.pathname}
              className={room ? "content room" : "content"}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </PageCtx.Provider>
      </div>

      <nav className="tabbar" aria-label={t.menu}>
        {tabItems.map((item) => {
          const { Icon: Glyph } = routeVisual(item.to)
          return (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} aria-label={lang === "ar" ? item.ar : item.en} className={({ isActive }) => (isActive ? "active" : "")}>
              <Glyph size={22} stroke={1.9} aria-hidden="true" />
              <span>{lang === "ar" ? item.ar : item.en}</span>
            </NavLink>
          )
        })}
        {items.length > 4 ? (
          <button type="button" aria-label={t.more} onClick={() => setOpen(true)}>
            <IconDotsCircleHorizontal size={22} stroke={1.9} aria-hidden="true" />
            <span>{t.more}</span>
          </button>
        ) : null}
      </nav>

      <Palette open={palette} onClose={() => setPalette(false)} items={items} />
    </div>
  )
}

function ProfileMenu({ user, title, onSignOut }: { user?: SessionUser | null; title: string; onSignOut: () => void }) {
  const { t, toggle } = useI18n()
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => { if (!wrap.current?.contains(event.target as Node)) setOpen(false) }
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", close)
    document.addEventListener("keydown", key)
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", key) }
  }, [open])
  const name = user?.name || user?.instituteName || title
  return (
    <div className="menu-wrap" ref={wrap}>
      <button type="button" className="profile-btn" aria-label={`${name} · ${t.account}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Avatar name={name} />
        <span className="who"><strong>{name}</strong><small>{title}</small></span>
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div className="pop down end menu-pop" role="menu" initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
            <div className="menu-head">
              <strong>{name}</strong>
              {user?.phone ? <small style={{ display: "flex", gap: 4, alignItems: "center" }}><IconPhone size={13} aria-hidden="true" /><span dir="ltr">{user.phone}</span></small> : <small>{title}</small>}
            </div>
            <button type="button" role="menuitem" className="opt" onClick={() => { toggle(); setOpen(false) }}><IconLanguage size={18} aria-hidden="true" />{t.language}</button>
            <button type="button" role="menuitem" className="opt danger" onClick={onSignOut}><IconLogout size={18} aria-hidden="true" className="flip-rtl" />{t.logout}</button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/** Keyboard page switcher. It only navigates between pages this person can already see. */
function Palette({ open, onClose, items }: { open: boolean; onClose: () => void; items: NavItem[] }) {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [hot, setHot] = useState(0)
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return needle ? items.filter((item) => item.ar.includes(needle) || item.en.toLowerCase().includes(needle)) : items
  }, [items, query])
  useEffect(() => { if (open) { setQuery(""); setHot(0) } }, [open])
  const go = (to: string) => { onClose(); navigate(to) }
  return (
    <AnimatePresence>
      {open ? (
        <div className="dlg-layer" onKeyDown={(event) => {
          if (event.key === "Escape") onClose()
          if (event.key === "ArrowDown") { event.preventDefault(); setHot((h) => Math.min(results.length - 1, h + 1)) }
          if (event.key === "ArrowUp") { event.preventDefault(); setHot((h) => Math.max(0, h - 1)) }
          if (event.key === "Enter" && results[hot]) go(results[hot].to)
        }}>
          <motion.div className="dlg-back" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div className="palette" role="dialog" aria-modal="true" aria-label={t.menuSearch} initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <div className="ctl">
              <IconSearch size={20} aria-hidden="true" />
              <input autoFocus value={query} placeholder={t.jumpHint} aria-label={t.menuSearch} onChange={(event) => { setQuery(event.target.value); setHot(0) }} />
              <kbd style={{ fontSize: 11, color: "var(--text-3)", border: "1px solid var(--line)", borderRadius: 6, padding: "1px 6px" }}>Esc</kbd>
            </div>
            <div className="list" role="listbox">
              {results.length === 0 ? <div className="pop-empty">{t.noPages}</div> : results.map((item, index) => {
                const { Icon: Glyph, tone } = routeVisual(item.to)
                return (
                  <button key={item.to} type="button" role="option" aria-selected={hot === index} className={hot === index ? "opt hot" : "opt"} onMouseEnter={() => setHot(index)} onClick={() => go(item.to)}>
                    <span className={`nav-ico tone-${tone}`} aria-hidden="true"><Glyph size={18} stroke={1.9} /></span>
                    {lang === "ar" ? item.ar : item.en}
                    <small>{groupLabel(item.group, lang)}</small>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}

/* ---------------- Sign-in screens ---------------- */

export function AuthLayout({ title, lede, children, wide }: { title: string; lede?: string; children: ReactNode; wide?: boolean }) {
  const { t, toggle, lang } = useI18n()
  const heading = appConfig.kind === "admin"
    ? (lang === "ar" ? "مركز قيادة الأكاديمية" : "The academy command center")
    : appConfig.kind === "teacher"
      ? (lang === "ar" ? "استوديو تصنع فيه دروسك" : "A studio for your lessons")
      : (lang === "ar" ? "مساحة عمل معهدك" : "Your institute workspace")
  return (
    <div className="auth" data-app={appConfig.kind}>
      <aside className="auth-art" aria-hidden="true">
        <div className="auth-brand"><Mark size={44} />{t.brand}</div>
        {appConfig.kind === "teacher" ? <Sprout className="scene" mood="wave" /> : <AuthScene />}
        <div>
          <h2>{heading}</h2>
          <p>{t.tagline}</p>
        </div>
      </aside>
      <main className="auth-panel">
        <div className="auth-top">
          <span className="auth-mobile-brand"><Mark size={34} />{t.brand}</span>
          <Button variant="ghost" size="sm" icon={IconLanguage} onClick={toggle}>{t.language}</Button>
        </div>
        <div className={wide ? "auth-form wide" : "auth-form"}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ display: "grid", gap: 6 }}>
            <h1>{title}</h1>
            <p className="lede">{lede ?? t.tagline}</p>
          </motion.div>
          {children}
        </div>
      </main>
    </div>
  )
}

export function LoginCard({ title, onSubmit, extra }: { title: string; onSubmit: (phone: string, password: string) => Promise<void>; extra?: ReactNode }) {
  const { t, lang } = useI18n()
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  return (
    <AuthLayout title={title} lede={lang === "ar" ? "ادخل برقم هاتفك وكلمة المرور." : "Sign in with your phone number and password."}>
      <form className="form" onSubmit={async (event) => {
        event.preventDefault()
        setError("")
        setBusy(true)
        try { await onSubmit(phone, password) } catch (reason) { setError(reason instanceof Error ? reason.message : t.error) } finally { setBusy(false) }
      }}>
        <TextField label={t.phone} icon={IconPhone} value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="username" inputMode="tel" dir="ltr" placeholder="07XXXXXXXXX" />
        <TextField label={t.password} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" error={error || undefined} />
        <Button variant="primary" size="lg" type="submit" block busy={busy}>{t.login}</Button>
        {extra}
      </form>
    </AuthLayout>
  )
}

export function Boot() {
  const { t } = useI18n()
  return (
    <div className="boot" role="status" aria-label={t.loading} data-app={appConfig.kind}>
      <span className="boot-mark"><Mark size={64} /></span>
    </div>
  )
}
