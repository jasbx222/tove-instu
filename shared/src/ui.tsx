import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { Link } from "react-router"
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion"
import { IconAlertTriangle, IconArrowRight, IconCircleCheck, IconDots, IconExclamationCircle, IconInfoCircle, IconRefresh, IconX, type Icon } from "@tabler/icons-react"
import { Cover, EmptyArt } from "./art"
import { useI18n } from "./i18n"
import { routeVisual, type Tone } from "./icons"

/* ---------------- Buttons ---------------- */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "danger-soft" | "sky"
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg"; icon?: Icon; iconEnd?: Icon; busy?: boolean; block?: boolean }

function buttonClass(variant: Variant = "secondary", size: "sm" | "md" | "lg" = "md", block?: boolean, busy?: boolean, extra?: string) {
  return ["btn", variant === "secondary" ? "" : variant, size === "md" ? "" : size, block ? "block" : "", busy ? "busy" : "", extra ?? ""].filter(Boolean).join(" ")
}

export function Button({ variant, size, icon: Lead, iconEnd: Trail, busy, block, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, block, busy, className)} disabled={disabled || busy} aria-busy={busy || undefined} {...rest}>
      {busy ? <span className="spin" aria-hidden="true" /> : Lead ? <Lead size={size === "sm" ? 16 : 19} stroke={2} aria-hidden="true" /> : null}
      {children}
      {Trail ? <Trail size={size === "sm" ? 16 : 18} stroke={2} aria-hidden="true" className="flip-rtl" /> : null}
    </button>
  )
}

export function ButtonLink({ to, variant, size, icon: Lead, iconEnd: Trail, block, children, className }: { to: string; variant?: Variant; size?: "sm" | "md" | "lg"; icon?: Icon; iconEnd?: Icon; block?: boolean; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={buttonClass(variant, size, block, false, className)}>
      {Lead ? <Lead size={size === "sm" ? 16 : 19} stroke={2} aria-hidden="true" /> : null}
      {children}
      {Trail ? <Trail size={18} stroke={2} aria-hidden="true" className="flip-rtl" /> : null}
    </Link>
  )
}

/** Icon-only button. The label is required: it becomes the tooltip and the accessible name. */
export function IconButton({ icon: Glyph, label, size = "md", tone, outlined, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: Icon; label: string; size?: "sm" | "md"; tone?: "danger"; outlined?: boolean }) {
  return (
    <Tip label={label}>
      <button type="button" aria-label={label} className={["icon-btn", size === "sm" ? "sm" : "", tone ?? "", outlined ? "outlined" : "", className ?? ""].filter(Boolean).join(" ")} {...rest}>
        <Glyph size={size === "sm" ? 17 : 20} stroke={1.9} aria-hidden="true" />
      </button>
    </Tip>
  )
}

export function Tip({ label, children }: { label: string; children: ReactNode }) {
  return <span className="tip">{children}<span className="tip-bubble" aria-hidden="true">{label}</span></span>
}

/* ---------------- Status ---------------- */

const statusKind: Record<string, "ok" | "info" | "wait" | "bad"> = {
  active: "ok", approved: "ok", true: "ok", completed: "ok", paid: "ok", scheduled: "info", live: "info", ongoing: "info",
  waiting: "wait", new: "wait", pending: "wait", undercorrection: "wait", under_correction: "wait",
  false: "bad", inactive: "bad", disabled: "bad", expired: "bad", canceled: "bad", cancelled: "bad", failed: "bad",
}

const statusAr: Record<string, string> = {
  true: "نعم", false: "لا", active: "فعّال", inactive: "متوقف", disabled: "متوقف", scheduled: "مجدول", approved: "معتمد",
  waiting: "بانتظار", completed: "مكتمل", expired: "منتهٍ", canceled: "ملغى", cancelled: "ملغى", pending: "معلّق",
  new: "جديد", assistant: "مساعد", staff: "موظف", internal: "داخلي", external: "خارجي", paid: "مدفوع",
  undercorrection: "قيد التصحيح", under_correction: "قيد التصحيح", live: "مباشر", ongoing: "جارية",
  forteacher: "للمعلم", forinstitute: "للمعهد", info: "معلومة", ads: "إعلان", warning: "تحذير",
  all: "الجميع", teacher: "معلم", daily: "يومي", weekly: "أسبوعي", monthly: "شهري", quarterly: "ربع سنوي", yearly: "سنوي",
  basic: "أساسي", detailed: "مفصّل", advanced: "متقدم", openended: "مقالي", multiplechoice: "اختيار من متعدد", truefalse: "صح أو خطأ",
}

const statusEn: Record<string, string> = { true: "Yes", false: "No", forteacher: "For teachers", forinstitute: "For institutes", openended: "Open ended", multiplechoice: "Multiple choice", truefalse: "True or false" }

/** Translate an enum value the API returns, without changing the value itself. */
export function enumText(value: string, lang: string) {
  const key = value.toLowerCase()
  if (lang === "ar") return statusAr[key] ?? value
  return statusEn[key] ?? value
}

export function statusTone(value: string) {
  return statusKind[value.toLowerCase()]
}

export function Badge({ tone, children, plain }: { tone?: "ok" | "info" | "wait" | "bad" | "purple" | "live"; children: ReactNode; plain?: boolean }) {
  return <span className={["badge", tone ?? "", plain ? "plain" : ""].filter(Boolean).join(" ")}>{children}</span>
}

export function StatusBadge({ value }: { value: unknown }) {
  const { lang } = useI18n()
  if (value == null || value === "") return <span className="muted">—</span>
  const text = String(value)
  return <Badge tone={statusTone(text)} plain={!statusTone(text)}>{enumText(text, lang)}</Badge>
}

export function Avatar({ name, size, tone }: { name: string; size?: "lg" | "xl"; tone?: Tone }) {
  const letter = (name || "؟").trim().slice(0, 1).toUpperCase()
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  const tones: Tone[] = ["green", "sky", "yellow", "coral", "purple"]
  return <span className={["avatar", size ?? "", `tone-${tone ?? tones[hash % tones.length]}`].filter(Boolean).join(" ")} aria-hidden="true">{letter}</span>
}

export function Alert({ tone = "info", children, title }: { tone?: "info" | "ok" | "bad" | "wait"; children: ReactNode; title?: string }) {
  const Glyph = tone === "ok" ? IconCircleCheck : tone === "bad" ? IconExclamationCircle : tone === "wait" ? IconAlertTriangle : IconInfoCircle
  return (
    <div className={`alert ${tone}`} role={tone === "bad" ? "alert" : "status"}>
      <Glyph size={20} stroke={2} aria-hidden="true" />
      <div>{title ? <strong style={{ display: "block" }}>{title}</strong> : null}{children}</div>
    </div>
  )
}

/* ---------------- Layout pieces ---------------- */

type PageInfo = { to: string; label: string }
export const PageCtx = createContext<PageInfo | null>(null)

/** Page header. Title and icon default to the current menu entry. */
export function PageHeader({ title, lede, kicker, actions, route }: { title?: string; lede?: ReactNode; kicker?: string; actions?: ReactNode; route?: string }) {
  const page = useContext(PageCtx)
  const { Icon: Glyph, tone } = routeVisual(route ?? page?.to ?? "/")
  return (
    <header className="page-head">
      <span className={`head-ico tone-${tone}`} aria-hidden="true"><Glyph size={26} stroke={1.9} /></span>
      <div className="head-copy">
        {kicker ? <p className="kicker">{kicker}</p> : null}
        <h1>{title ?? page?.label}</h1>
        {lede ? <p>{lede}</p> : null}
      </div>
      {actions ? <div className="head-actions">{actions}</div> : null}
    </header>
  )
}

export function Card({ children, className, pad, interactive, as: Tag = "section", onSubmit }: { children: ReactNode; className?: string; pad?: boolean; interactive?: boolean; as?: "section" | "article" | "div" | "aside" | "form"; onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void }) {
  const cls = ["card", pad ? "card-pad" : "", interactive ? "interactive" : "", className ?? ""].filter(Boolean).join(" ")
  if (Tag === "form") return <form className={cls} onSubmit={(event) => { event.preventDefault(); onSubmit?.(event) }}>{children}</form>
  return <Tag className={cls}>{children}</Tag>
}

export function CardHead({ title, sub, icon: Glyph, tone, actions }: { title: ReactNode; sub?: ReactNode; icon?: Icon; tone?: Tone; actions?: ReactNode }) {
  return (
    <div className="card-head">
      {Glyph ? <span className={`card-ico${tone ? ` tone-${tone}` : ""}`} aria-hidden="true"><Glyph size={20} stroke={1.9} /></span> : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2>{title}</h2>
        {sub ? <p>{sub}</p> : null}
      </div>
      {actions ? <div className="row">{actions}</div> : null}
    </div>
  )
}

/* ---------------- Numbers ---------------- */

/** Animated count from the previous value to the real value. Text stays exact once settled. */
export function CountUp({ value }: { value: number }) {
  const { locale } = useI18n()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const last = useRef(0)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const format = (n: number) => Math.round(n).toLocaleString(locale)
    if (reduce || !Number.isFinite(value)) { node.textContent = Number.isFinite(value) ? format(value) : "—"; last.current = value; return }
    const controls = animate(last.current, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1], onUpdate: (n) => { node.textContent = format(n) } })
    last.current = value
    return () => controls.stop()
  }, [value, locale, reduce])
  return <span ref={ref} className="num">{Number.isFinite(value) ? Math.round(value).toLocaleString(locale) : "—"}</span>
}

export function StatCard({ label, value, hint, icon: Glyph, tone = "green", hero }: { label: string; value: number | string; hint?: ReactNode; icon: Icon; tone?: Tone; hero?: boolean }) {
  return (
    <motion.div className={`card stat tone-${tone}${hero ? " hero" : ""}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
      <div className="stat-top">
        <span className="stat-ico" aria-hidden="true"><Glyph size={22} stroke={1.9} /></span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">{typeof value === "number" ? <CountUp value={value} /> : value}</div>
      {hint ? <div className="stat-hint">{hint}</div> : null}
    </motion.div>
  )
}

export function Bars({ items }: { items: { label: string; value: number; tone?: Tone }[] }) {
  const reduce = useReducedMotion()
  const max = Math.max(1, ...items.map((item) => item.value))
  return (
    <div className="bars" role="list">
      {items.map((item, index) => (
        <div key={item.label} className={`bar-row tone-${item.tone ?? "green"}`} role="listitem">
          <span>{item.label}</span>
          <div className="bar-track">
            <motion.div className="bar-fill" style={{ width: `${Math.max(3, (item.value / max) * 100)}%` }} initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }} />
          </div>
          <strong><CountUp value={item.value} /></strong>
        </div>
      ))}
    </div>
  )
}

/** Usage meter for real used/limit pairs only. */
export function Meter({ used, limit, label }: { used: number; limit: number; label?: string }) {
  const reduce = useReducedMotion()
  const pct = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0
  return (
    <div className="meter">
      <div className="meter-track" role="progressbar" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used} aria-label={label}>
        <motion.div className={`meter-fill${pct >= 100 ? " full" : pct >= 85 ? " warn" : ""}`} initial={reduce ? false : { width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
      </div>
      <small>{used} / {limit}</small>
    </div>
  )
}

/* ---------------- States ---------------- */

export function EmptyState({ title, hint, scene, action, compact }: { title: string; hint?: string; scene?: Parameters<typeof EmptyArt>[0]["scene"]; action?: ReactNode; compact?: boolean }) {
  return (
    <div className={compact ? "empty compact" : "empty"}>
      <EmptyArt scene={scene} />
      <h3>{title}</h3>
      {hint ? <p>{hint}</p> : null}
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n()
  return (
    <div className="empty" role="alert">
      <EmptyArt scene="error" />
      <h3>{t.error}</h3>
      <p>{message}</p>
      {onRetry ? <Button icon={IconRefresh} onClick={onRetry}>{t.retry}</Button> : null}
    </div>
  )
}

export function Skeleton({ lines = 3, block }: { lines?: number; block?: boolean }) {
  const { t } = useI18n()
  return (
    <div className="stack" role="status" aria-label={t.loading}>
      {block ? <div className="skel block" /> : null}
      {Array.from({ length: lines }).map((_, index) => <div key={index} className={`skel ${index % 3 === 2 ? "w40" : index % 2 ? "w80" : ""}`} />)}
    </div>
  )
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="stats">
      {Array.from({ length: count }).map((_, index) => <div key={index} className="card card-pad"><Skeleton lines={2} /></div>)}
    </div>
  )
}

/* ---------------- Tiles ---------------- */

export function CoverTiles({ rows, href, emptyTitle, emptyHint, emptyAction, scene = "books" }: { rows: { id: string; title: string; meta?: ReactNode }[]; href: (id: string) => string; emptyTitle: string; emptyHint?: string; emptyAction?: ReactNode; scene?: Parameters<typeof EmptyArt>[0]["scene"] }) {
  const { t } = useI18n()
  if (rows.length === 0) return <Card><EmptyState title={emptyTitle} hint={emptyHint} scene={scene} action={emptyAction} /></Card>
  return (
    <div className="tiles">
      {rows.map((row, index) => (
        <motion.div key={row.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04 }}>
          <Link to={href(row.id)} className="card interactive tile" style={{ height: "100%" }}>
            <Cover seed={row.title || row.id} />
            <div className="tile-body">
              <h3>{row.title || "—"}</h3>
              {row.meta ? <p>{row.meta}</p> : null}
              <span className="tile-cue">{t.view}<IconArrowRight size={16} className="flip-rtl" aria-hidden="true" /></span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

/* ---------------- Dialog ---------------- */

export function Dialog({ open, onClose, title, sub, icon: Glyph, tone, size = "md", children, footer, onSubmit, busy }: {
  open: boolean
  onClose: () => void
  title: string
  sub?: string
  icon?: Icon
  tone?: Tone
  size?: "sm" | "md" | "lg"
  children: ReactNode
  footer?: ReactNode
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
  busy?: boolean
}) {
  const id = useId()
  const reduce = useReducedMotion()
  const panel = useRef<HTMLDivElement>(null)
  const { t } = useI18n()
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) { event.stopPropagation(); onClose() }
      if (event.key === "Tab" && panel.current) {
        const focusable = panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([type="hidden"]):not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')
        if (focusable.length === 0) return
        const first = focusable[0], last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener("keydown", onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.setTimeout(() => {
      const target = panel.current?.querySelector<HTMLElement>("[data-autofocus], .dlg-body input:not([type=hidden]):not([type=file]), .dlg-body textarea, .dlg-body button")
      ;(target ?? panel.current)?.focus()
    }, 40)
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; previous?.focus?.() }
  }, [open, onClose, busy])

  const inner = (
    <>
      <div className="dlg-head">
        {Glyph ? <span className={`dlg-ico${tone ? ` tone-${tone}` : ""}`} aria-hidden="true"><Glyph size={22} stroke={1.9} /></span> : null}
        <div>
          <h2 id={`${id}-t`}>{title}</h2>
          {sub ? <p>{sub}</p> : null}
        </div>
        <IconButton icon={IconX} label={t.close} onClick={onClose} disabled={busy} />
      </div>
      <div className="dlg-body">{children}</div>
      {footer ? <div className="dlg-foot">{footer}</div> : null}
    </>
  )
  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="dlg-layer">
          <motion.div className="dlg-back" onClick={() => { if (!busy) onClose() }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            ref={panel}
            tabIndex={-1}
            className={`dlg ${size}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-t`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {onSubmit ? <form className="dlg-form" onSubmit={onSubmit}>{inner}</form> : inner}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel, tone = "danger" }: { open: boolean; onClose: () => void; onConfirm: () => Promise<void> | void; title: string; body: ReactNode; confirmLabel: string; tone?: "danger" | "primary" }) {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  return (
    <Dialog open={open} onClose={onClose} title={title} icon={IconAlertTriangle} tone={tone === "danger" ? "coral" : "green"} size="sm" busy={busy} footer={
      <>
        <Button variant="ghost" onClick={onClose} disabled={busy}>{t.cancel}</Button>
        <Button variant={tone} busy={busy} data-autofocus onClick={async () => { setBusy(true); try { await onConfirm() } finally { setBusy(false) } }}>{confirmLabel}</Button>
      </>
    }>
      <div style={{ color: "var(--text-2)" }}>{body}</div>
    </Dialog>
  )
}

/* ---------------- Menu ---------------- */

export type MenuAction = { label: string; icon?: Icon; onSelect: () => void; danger?: boolean; disabled?: boolean }

export function ActionMenu({ actions, label }: { actions: MenuAction[]; label?: string }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [hot, setHot] = useState(0)
  const wrap = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => { if (!wrap.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [open])
  return (
    <div className="menu-wrap" ref={wrap} onKeyDown={(event) => {
      if (!open) return
      if (event.key === "Escape") { setOpen(false); (wrap.current?.querySelector("button") as HTMLButtonElement | null)?.focus() }
      if (event.key === "ArrowDown") { event.preventDefault(); setHot((h) => (h + 1) % actions.length) }
      if (event.key === "ArrowUp") { event.preventDefault(); setHot((h) => (h - 1 + actions.length) % actions.length) }
      if (event.key === "Enter") { event.preventDefault(); const action = actions[hot]; if (action && !action.disabled) { setOpen(false); action.onSelect() } }
    }}>
      <IconButton icon={IconDots} label={label ?? t.actions} size="sm" aria-haspopup="menu" aria-expanded={open} onClick={() => { setHot(0); setOpen((v) => !v) }} />
      <AnimatePresence>
        {open ? (
          <motion.div className="pop down end menu-pop" role="menu" initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }}>
            {actions.map((action, index) => (
              <button key={action.label} type="button" role="menuitem" disabled={action.disabled} className={["opt", action.danger ? "danger" : "", hot === index ? "hot" : ""].filter(Boolean).join(" ")} onMouseEnter={() => setHot(index)} onClick={() => { setOpen(false); action.onSelect() }}>
                {action.icon ? <action.icon size={18} stroke={1.9} aria-hidden="true" /> : null}
                {action.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/* ---------------- Toasts and celebration ---------------- */

type Toast = { id: number; tone: "ok" | "bad" | "info"; text: string }
type ToastApi = { success: (text: string) => void; error: (text: string) => void; info: (text: string) => void }
const ToastCtx = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const { t } = useI18n()
  const push = useCallback((tone: Toast["tone"], text: string) => {
    const id = Date.now() + Math.random()
    setItems((list) => [...list.slice(-3), { id, tone, text }])
    window.setTimeout(() => setItems((list) => list.filter((item) => item.id !== id)), tone === "bad" ? 7000 : 4200)
  }, [])
  const api = useRef<ToastApi>({ success: (text) => push("ok", text), error: (text) => push("bad", text), info: (text) => push("info", text) })
  api.current = { success: (text) => push("ok", text), error: (text) => push("bad", text), info: (text) => push("info", text) }
  const stable = useRef<ToastApi>({ success: (x) => api.current.success(x), error: (x) => api.current.error(x), info: (x) => api.current.info(x) })
  return (
    <ToastCtx.Provider value={stable.current}>
      {children}
      {createPortal(
        <div className="toasts" aria-live="polite">
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const Glyph = item.tone === "ok" ? IconCircleCheck : item.tone === "bad" ? IconExclamationCircle : IconInfoCircle
              return (
                <motion.div key={item.id} layout className={`toast ${item.tone}`} role={item.tone === "bad" ? "alert" : "status"} initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }} transition={{ type: "spring", stiffness: 420, damping: 32 }}>
                  <span className="t-ico"><Glyph size={18} stroke={2.2} aria-hidden="true" /></span>
                  <span className="t-copy">{item.text}</span>
                  <button type="button" className="icon-btn" aria-label={t.close} onClick={() => setItems((list) => list.filter((x) => x.id !== item.id))}><IconX size={16} /></button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const value = useContext(ToastCtx)
  if (!value) throw new Error("toast")
  return value
}

/** A short confetti burst from an element. Skipped when the person prefers reduced motion. */
export function celebrate(from?: Element | null) {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const rect = from?.getBoundingClientRect()
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
  const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
  const host = document.createElement("div")
  host.className = "burst"
  host.style.left = `${x}px`
  host.style.top = `${y}px`
  const colors = ["#58CC02", "#1CB0F6", "#FFC800", "#FF6B81", "#A78BFA"]
  for (let i = 0; i < 18; i++) {
    const piece = document.createElement("i")
    const angle = (Math.PI * 2 * i) / 18
    const distance = 50 + Math.random() * 60
    piece.style.background = colors[i % colors.length]
    piece.style.setProperty("--x", `${Math.cos(angle) * distance}px`)
    piece.style.setProperty("--y", `${Math.sin(angle) * distance - 30}px`)
    piece.style.setProperty("--r", `${Math.random() * 360}deg`)
    host.appendChild(piece)
  }
  document.body.appendChild(host)
  window.setTimeout(() => host.remove(), 1000)
}

/* ---------------- Async helper ---------------- */

/** Wrap an async action with a busy flag and an error toast. Returns true when it succeeded. */
export function useAction() {
  const toast = useToast()
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const run = useCallback(async (work: () => Promise<unknown>, success?: string) => {
    setBusy(true)
    try {
      await work()
      if (success) toast.success(success)
      return true
    } catch (reason) {
      toast.error(reason instanceof Error && reason.message ? reason.message : t.error)
      return false
    } finally {
      setBusy(false)
    }
  }, [toast, t])
  return { busy, run }
}

export function formatDate(value: unknown, locale: string, withTime = false) {
  if (value == null || value === "") return "—"
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 1900) return String(value)
  return date.toLocaleString(locale, withTime ? { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short", year: "numeric" })
}
