import { useEffect, useId, useMemo, useRef, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { IconCalendar, IconCheck, IconChevronDown, IconChevronLeft, IconChevronRight, IconCloudUpload, IconEye, IconEyeOff, IconFileCheck, IconSearch, type Icon } from "@tabler/icons-react"
import { useI18n } from "./i18n"
import { moduleLabel, permissionLabel } from "./labels"

/* ---------------- Shell for every field ---------------- */

type FieldFrame = { label: string; help?: ReactNode; error?: string; required?: boolean; optional?: boolean; className?: string }

function Frame({ id, label, help, error, required, optional, className, children }: FieldFrame & { id: string; children: ReactNode }) {
  const { t } = useI18n()
  return (
    <div className={["fld", className ?? ""].filter(Boolean).join(" ")}>
      <label className="fld-label" htmlFor={id}>
        {label}
        {required ? <span className="req" aria-hidden="true">*</span> : null}
        {optional ? <span className="opt">{t.optional}</span> : null}
      </label>
      {children}
      {error ? <span className="fld-error" id={`${id}-e`} role="alert">{error}</span> : help ? <span className="fld-help" id={`${id}-h`}>{help}</span> : null}
    </div>
  )
}

export function TextField({ label, help, error, optional, icon: Lead, suffix, className, type = "text", ...input }: FieldFrame & { icon?: Icon; suffix?: ReactNode } & Omit<InputHTMLAttributes<HTMLInputElement>, "className">) {
  const auto = useId()
  const id = input.id ?? auto
  const [reveal, setReveal] = useState(false)
  const { t } = useI18n()
  const isPassword = type === "password"
  return (
    <Frame id={id} label={label} help={help} error={error} required={input.required} optional={optional} className={className}>
      <div className={["ctl", error ? "invalid" : "", input.disabled ? "disabled" : ""].filter(Boolean).join(" ")}>
        {Lead ? <Lead size={19} stroke={1.8} aria-hidden="true" /> : null}
        <input id={id} type={isPassword && reveal ? "text" : type} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-e` : help ? `${id}-h` : undefined} {...input} />
        {suffix ? <span className="suffix">{suffix}</span> : null}
        {isPassword ? (
          <button type="button" className="icon-btn sm" aria-label={reveal ? t.hide : t.show} onClick={() => setReveal((v) => !v)}>
            {reveal ? <IconEyeOff size={18} /> : <IconEye size={18} />}
          </button>
        ) : null}
      </div>
    </Frame>
  )
}

export function TextArea({ label, help, error, optional, className, ...input }: FieldFrame & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">) {
  const auto = useId()
  const id = input.id ?? auto
  return (
    <Frame id={id} label={label} help={help} error={error} required={input.required} optional={optional} className={className}>
      <div className={["ctl area", error ? "invalid" : ""].filter(Boolean).join(" ")}>
        <textarea id={id} aria-invalid={error ? true : undefined} {...input} />
      </div>
    </Frame>
  )
}

/* ---------------- Select (custom listbox) ---------------- */

export type Option = { value: string; label: string; hint?: string }

export function Select({ label, value, onChange, options, placeholder, help, error, required, optional, className, name, icon: Lead, disabled }: FieldFrame & {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  name?: string
  icon?: Icon
  disabled?: boolean
}) {
  const id = useId()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [hot, setHot] = useState(0)
  const [query, setQuery] = useState("")
  const wrap = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const searchable = options.length > 8
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return needle ? options.filter((option) => option.label.toLowerCase().includes(needle)) : options
  }, [options, query])
  const current = options.find((option) => option.value === value)
  const [up, setUp] = useState(false)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => { if (!wrap.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", close)
    const rect = wrap.current?.getBoundingClientRect()
    setUp(rect ? window.innerHeight - rect.bottom < 320 && rect.top > 320 : false)
    return () => document.removeEventListener("mousedown", close)
  }, [open])

  useEffect(() => { list.current?.querySelector<HTMLElement>(`[data-i="${hot}"]`)?.scrollIntoView({ block: "nearest" }) }, [hot, open])

  function openList() {
    if (disabled) return
    setQuery("")
    setHot(Math.max(0, options.findIndex((option) => option.value === value)))
    setOpen(true)
  }
  function choose(option: Option) {
    onChange(option.value)
    setOpen(false)
    wrap.current?.querySelector<HTMLButtonElement>("button.ctl-trigger")?.focus()
  }
  function onKey(event: React.KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) { event.preventDefault(); openList() }
      return
    }
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false) }
    if (event.key === "ArrowDown") { event.preventDefault(); setHot((h) => Math.min(visible.length - 1, h + 1)) }
    if (event.key === "ArrowUp") { event.preventDefault(); setHot((h) => Math.max(0, h - 1)) }
    if (event.key === "Enter") { event.preventDefault(); const option = visible[hot]; if (option) choose(option) }
    if (event.key === "Tab") setOpen(false)
  }

  return (
    <Frame id={id} label={label} help={help} error={error} required={required} optional={optional} className={className}>
      <div ref={wrap} style={{ position: "relative" }} onKeyDown={onKey}>
        <div className={["ctl", error ? "invalid" : "", disabled ? "disabled" : ""].filter(Boolean).join(" ")}>
          <button type="button" id={id} className="ctl-trigger" role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-l`} disabled={disabled} onClick={() => (open ? setOpen(false) : openList())}>
            {Lead ? <Lead size={19} stroke={1.8} aria-hidden="true" color="var(--ink-400)" /> : null}
            <span className={current && current.value !== "" ? "ctl-value" : "ctl-value placeholder"}>{current?.label || placeholder || t.choose}</span>
            <IconChevronDown size={18} aria-hidden="true" color="var(--ink-400)" style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : undefined }} />
          </button>
        </div>
        {name ? <input type="hidden" name={name} value={value} /> : null}
        {required ? <input tabIndex={-1} aria-hidden="true" required value={value} onChange={() => undefined} style={{ position: "absolute", opacity: 0, height: 1, width: 1, bottom: 0, insetInlineStart: 20, pointerEvents: "none" }} /> : null}
        <AnimatePresence>
          {open ? (
            <motion.div ref={list} id={`${id}-l`} className={`pop ${up ? "up" : "down"} start`} role="listbox" aria-labelledby={id} initial={{ opacity: 0, y: up ? 4 : -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}>
              {searchable ? (
                <div className="pop-search">
                  <input autoFocus value={query} placeholder={t.search} aria-label={t.search} onChange={(event) => { setQuery(event.target.value); setHot(0) }} />
                </div>
              ) : null}
              {visible.length === 0 ? <div className="pop-empty">{t.noMatch}</div> : visible.map((option, index) => (
                <button key={option.value + index} type="button" role="option" data-i={index} aria-selected={option.value === value} className={hot === index ? "opt hot" : "opt"} onMouseEnter={() => setHot(index)} onClick={() => choose(option)}>
                  <span>{option.label}{option.hint ? <small style={{ display: "block", color: "var(--text-3)", fontSize: 12, fontWeight: 400 }}>{option.hint}</small> : null}</span>
                  {option.value === value ? <IconCheck size={18} className="check" aria-hidden="true" /> : null}
                </button>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </Frame>
  )
}

/* ---------------- Segmented ---------------- */

export function Segmented({ label, value, onChange, options, block }: { label: string; value: string; onChange: (value: string) => void; options: (Option & { icon?: Icon })[]; block?: boolean }) {
  const id = useId()
  return (
    <div className="fld">
      <span className="fld-label" id={id}>{label}</span>
      <div className={block ? "seg block" : "seg"} role="radiogroup" aria-labelledby={id} onKeyDown={(event) => {
        const index = options.findIndex((option) => option.value === value)
        const step = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : 0
        if (!step) return
        event.preventDefault()
        const rtl = document.documentElement.dir === "rtl" && (event.key === "ArrowLeft" || event.key === "ArrowRight")
        const next = options[(index + (rtl ? -step : step) + options.length) % options.length]
        onChange(next.value)
      }}>
        {options.map((option) => (
          <button key={option.value} type="button" role="radio" aria-checked={option.value === value} tabIndex={option.value === value ? 0 : -1} onClick={() => onChange(option.value)}>
            {option.icon ? <option.icon size={17} stroke={1.9} aria-hidden="true" /> : null}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Choice chips ---------------- */

export function ChoiceChips({ label, options, selected, onChange, help, emptyText }: { label: string; options: Option[]; selected: string[]; onChange: (next: string[]) => void; help?: ReactNode; emptyText?: string }) {
  const id = useId()
  return (
    <div className="fld" role="group" aria-labelledby={id}>
      <span className="fld-label" id={id}>{label}</span>
      {options.length === 0 && emptyText ? <span className="fld-help">{emptyText}</span> : null}
      <div className="chips">
        {options.map((option) => {
          const on = selected.includes(option.value)
          return (
            <label key={option.value} className={on ? "chip on" : "chip"}>
              <input type="checkbox" checked={on} onChange={() => onChange(on ? selected.filter((item) => item !== option.value) : [...selected, option.value])} />
              <span className="box" aria-hidden="true"><IconCheck size={14} stroke={3} /></span>
              {option.label}
            </label>
          )
        })}
      </div>
      {help ? <span className="fld-help">{help}</span> : null}
    </div>
  )
}

/* ---------------- Permission picker ---------------- */

export function PermissionPicker({ slugs, selected, onChange }: { slugs: string[]; selected: string[]; onChange: (next: string[]) => void }) {
  const { t, lang } = useI18n()
  const [query, setQuery] = useState("")
  const groups = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const slug of slugs) {
      const parts = slug.replace(/^can-/, "").split("-")
      const key = parts.length > 1 ? parts.slice(1).join("-") : parts[0]
      map.set(key, [...(map.get(key) ?? []), slug])
    }
    return [...map.entries()]
  }, [slugs])
  const needle = query.trim().toLowerCase()
  return (
    <div className="stack">
      <div className="perm-tools">
        <div className="ctl">
          <IconSearch size={18} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} aria-label={t.search} />
        </div>
        <span className="badge plain">{selected.length} {t.selected}</span>
        <button type="button" className="btn sm ghost" onClick={() => onChange(slugs)}>{t.selectAll}</button>
        <button type="button" className="btn sm ghost" onClick={() => onChange([])}>{t.clear}</button>
      </div>
      <div className="perm-groups">
        {groups.map(([key, items]) => {
          const shown = needle ? items.filter((slug) => slug.includes(needle) || permissionLabel(slug, lang).toLowerCase().includes(needle)) : items
          if (shown.length === 0) return null
          const all = items.every((slug) => selected.includes(slug))
          return (
            <section key={key} className="perm-group">
              <header>
                <strong>{moduleLabel(key, lang)}</strong>
                <small>{items.filter((slug) => selected.includes(slug)).length}/{items.length}</small>
                <button type="button" onClick={() => onChange(all ? selected.filter((slug) => !items.includes(slug)) : Array.from(new Set([...selected, ...items])))}>{all ? t.clear : t.selectAll}</button>
              </header>
              <div className="chips">
                {shown.map((slug) => {
                  const on = selected.includes(slug)
                  return (
                    <label key={slug} className={on ? "chip on" : "chip"} title={slug}>
                      <input type="checkbox" checked={on} onChange={() => onChange(on ? selected.filter((item) => item !== slug) : [...selected, slug])} />
                      <span className="box" aria-hidden="true"><IconCheck size={12} stroke={3} /></span>
                      {permissionLabel(slug, lang)}
                    </label>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------- Date and time ---------------- */

const pad = (n: number) => String(n).padStart(2, "0")
/** Value format matches the native datetime-local input: YYYY-MM-DDTHH:mm, local time. */
function toLocalValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function DateTimeField({ label, value, onChange, help, error, required, optional, className, name }: FieldFrame & { value: string; onChange: (value: string) => void; name?: string }) {
  const id = useId()
  const { t, locale, dir } = useI18n()
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const parsed = value ? new Date(value) : null
  const valid = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null
  const [view, setView] = useState(() => { const base = valid ?? new Date(); return new Date(base.getFullYear(), base.getMonth(), 1) })
  const [up, setUp] = useState(false)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => { if (!wrap.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", close)
    const rect = wrap.current?.getBoundingClientRect()
    setUp(rect ? window.innerHeight - rect.bottom < 420 && rect.top > 420 : false)
    return () => document.removeEventListener("mousedown", close)
  }, [open])

  const today = new Date()
  const first = new Date(view.getFullYear(), view.getMonth(), 1)
  const offset = (first.getDay() + 1) % 7 // weeks start on Saturday
  const days = Array.from({ length: 42 }, (_, index) => new Date(view.getFullYear(), view.getMonth(), index - offset + 1))
  const weekdays = Array.from({ length: 7 }, (_, index) => new Date(2024, 0, 6 + index).toLocaleDateString(locale, { weekday: "narrow" }))
  const hours = valid?.getHours() ?? 9
  const minutes = valid?.getMinutes() ?? 0
  const same = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  const set = (date: Date, h = hours, m = minutes) => onChange(toLocalValue(new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m)))
  const Prev = dir === "rtl" ? IconChevronRight : IconChevronLeft
  const Next = dir === "rtl" ? IconChevronLeft : IconChevronRight

  return (
    <Frame id={id} label={label} help={help} error={error} required={required} optional={optional} className={className}>
      <div ref={wrap} style={{ position: "relative" }} onKeyDown={(event) => { if (event.key === "Escape" && open) { event.stopPropagation(); setOpen(false) } }}>
        <div className={["ctl", error ? "invalid" : ""].filter(Boolean).join(" ")}>
          <button type="button" id={id} className="ctl-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={() => { if (valid) setView(new Date(valid.getFullYear(), valid.getMonth(), 1)); setOpen((v) => !v) }}>
            <IconCalendar size={19} stroke={1.8} aria-hidden="true" color="var(--ink-400)" />
            <span className={valid ? "ctl-value" : "ctl-value placeholder"}>{valid ? valid.toLocaleString(locale, { weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : t.choose}</span>
          </button>
        </div>
        {name ? <input type="hidden" name={name} value={value} /> : null}
        {required ? <input tabIndex={-1} aria-hidden="true" required value={value} onChange={() => undefined} style={{ position: "absolute", opacity: 0, height: 1, width: 1, bottom: 0, insetInlineStart: 20, pointerEvents: "none" }} /> : null}
        <AnimatePresence>
          {open ? (
            <motion.div className={`pop cal ${up ? "up" : "down"} start`} role="dialog" aria-label={label} initial={{ opacity: 0, y: up ? 6 : -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="cal-head">
                <button type="button" className="icon-btn sm" aria-label={t.previous} onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}><Prev size={18} /></button>
                <strong>{view.toLocaleDateString(locale, { month: "long", year: "numeric" })}</strong>
                <button type="button" className="icon-btn sm" aria-label={t.next} onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}><Next size={18} /></button>
              </div>
              <div className="cal-grid">
                {weekdays.map((day, index) => <span key={index} className="dow">{day}</span>)}
                {days.map((day) => (
                  <button key={day.toISOString()} type="button" aria-label={day.toLocaleDateString(locale, { dateStyle: "full" })} aria-pressed={valid ? same(day, valid) : false}
                    className={[day.getMonth() !== view.getMonth() ? "out" : "", same(day, today) ? "today" : "", valid && same(day, valid) ? "sel" : ""].filter(Boolean).join(" ")}
                    onClick={() => set(day)}>
                    {day.toLocaleDateString(locale, { day: "numeric" })}
                  </button>
                ))}
              </div>
              <div className="cal-time">
                <label htmlFor={`${id}-h`}>{t.time}</label>
                <select id={`${id}-h`} value={hours} aria-label={t.time} onChange={(event) => set(valid ?? today, Number(event.target.value), minutes)}>
                  {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{pad(h)}</option>)}
                </select>
                <span>:</span>
                <select value={minutes - (minutes % 5)} aria-label={t.time} onChange={(event) => set(valid ?? today, hours, Number(event.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => <option key={m} value={m}>{pad(m)}</option>)}
                </select>
              </div>
              <div className="cal-foot">
                <button type="button" className="btn sm ghost" onClick={() => { set(today, today.getHours(), today.getMinutes()); setView(new Date(today.getFullYear(), today.getMonth(), 1)) }}>{t.today}</button>
                <button type="button" className="btn sm primary" onClick={() => setOpen(false)}>{t.save}</button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </Frame>
  )
}

/* ---------------- File drop ---------------- */

export function FileDrop({ label, name, accept, required, help, hint }: { label: string; name: string; accept?: string; required?: boolean; help?: ReactNode; hint?: string }) {
  const id = useId()
  const { t } = useI18n()
  const [file, setFile] = useState<File | null>(null)
  const [over, setOver] = useState(false)
  const [preview, setPreview] = useState("")
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) { setPreview(""); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  const size = file ? (file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`) : ""
  return (
    <Frame id={id} label={label} help={help} required={required}>
      <div className={["drop", over ? "over" : "", file ? "has" : ""].filter(Boolean).join(" ")} onDragEnter={() => setOver(true)} onDragLeave={() => setOver(false)} onDrop={() => setOver(false)}>
        <input id={id} name={name} type="file" accept={accept} required={required} onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        {preview ? <img className="preview" src={preview} alt="" /> : <span className="drop-ico" aria-hidden="true">{file ? <IconFileCheck size={24} /> : <IconCloudUpload size={24} />}</span>}
        <div style={{ minWidth: 0 }}>
          <strong>{file ? file.name : t.dropFile}</strong>
          <small>{file ? `${size} · ${t.replaceFile}` : hint}</small>
        </div>
      </div>
    </Frame>
  )
}

/* ---------------- Sections ---------------- */

export function FormSection({ step, title, sub, children, tone }: { step?: number | string; title: string; sub?: string; children: ReactNode; tone?: string }) {
  return (
    <section className={["form-section", tone ? `tone-${tone}` : ""].filter(Boolean).join(" ")}>
      <div className="form-section-head">
        {step != null ? <span className="step" aria-hidden="true">{step}</span> : null}
        <div><h3>{title}</h3>{sub ? <p>{sub}</p> : null}</div>
      </div>
      {children}
    </section>
  )
}

export function Fields({ children, two }: { children: ReactNode; two?: boolean }) {
  return <div className={two ? "fields two" : "fields"}>{children}</div>
}
