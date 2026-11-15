import { useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { api, ApiError } from "./api"
import { appConfig } from "./config"
import { DateTimeField, Fields, Segmented, Select, TextArea, TextField } from "./form"
import { useI18n } from "./i18n"
import { routeVisual } from "./icons"
import { DataTable, Pagination, type Column } from "./table"
import { Alert, Button, Card, CardHead, Dialog, PageCtx, StatusBadge, celebrate, enumText, formatDate, statusTone, useToast } from "./ui"

export type Field = {
  name: string
  label: string
  type?: "text" | "number" | "password" | "select" | "textarea" | "datetime"
  options?: string[]
  value?: string
  help?: string
}

type Page<T> = { items: T[]; page: number; pageSize: number; total: number }
const PAGE_SIZE = 20

/** Default cell rendering: dates read as dates, enum and boolean values read as badges. */
export function Cell({ value }: { value: unknown }) {
  const { locale } = useI18n()
  if (value == null || value === "") return <span className="muted">—</span>
  if (typeof value === "boolean") return <StatusBadge value={String(value)} />
  if (typeof value === "number") return <span className="num">{value.toLocaleString(locale)}</span>
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const date = new Date(text)
    if (!Number.isNaN(date.getTime()) && date.getFullYear() > 1900) return <span className="num">{formatDate(text, locale, /T\d{2}:\d{2}/.test(text) && !/T00:00(:00)?/.test(text))}</span>
  }
  if (statusTone(text)) return <StatusBadge value={text} />
  return <>{text}</>
}

export function Resource<T extends Record<string, unknown>>({
  path, columns, fields, title, heading, sub, createLabel,
}: {
  path: string
  title: string
  columns: { key: string; label: string; value?: (row: T) => unknown; render?: (row: T) => ReactNode; align?: "start" | "end" }[]
  fields?: Field[]
  heading?: string
  sub?: string
  createLabel?: string
}) {
  const { t, lang, locale } = useI18n()
  const toast = useToast()
  const page = useContext(PageCtx)
  const [rows, setRows] = useState<T[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [error, setError] = useState("")
  const [current, setCurrent] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const server = appConfig.serverSearch

  async function load(next = current, q = query.trim()) {
    setError("")
    setLoading(true)
    try {
      const search = server && q ? `&q=${encodeURIComponent(q)}` : ""
      const data = await api<Page<T> | T[]>(`${path}${path.includes("?") ? "&" : "?"}page=${next}&pageSize=${PAGE_SIZE}${search}`)
      if (Array.isArray(data)) { setRows(data); setTotal(data.length) }
      else { setRows(data.items ?? []); setTotal(data.total ?? 0) }
    } catch (reason) {
      setRows([])
      setError(reason instanceof ApiError ? reason.message : t.error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!server) { void load(1); return }
    const handle = window.setTimeout(() => { setCurrent(1); void load(1, query.trim()) }, query ? 300 : 0)
    return () => window.clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, server ? [path, query] : [path])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (server || !needle) return rows
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(needle))
  }, [rows, query, server])

  const tableColumns: Column<T>[] = columns.map((column, index) => ({
    key: column.key,
    label: column.label,
    align: column.align,
    lead: index === 0,
    sortValue: (row) => {
      const raw = column.value ? column.value(row) : row[column.key]
      return typeof raw === "number" ? raw : String(raw ?? "")
    },
    render: column.render ?? ((row) => {
      const value = column.value ? column.value(row) : row[column.key]
      return index === 0 ? <strong><Cell value={value} /></strong> : <Cell value={value} />
    }),
  }))

  const { Icon: Glyph, tone } = routeVisual(page?.to ?? path)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")
    const payload: Record<string, unknown> = {}
    for (const field of fields ?? []) {
      const raw = form[field.name] ?? ""
      if (raw === "") continue
      payload[field.name] = field.type === "number" ? Number(raw)
        : field.type === "datetime" ? new Date(raw).toISOString()
        : raw === "true" ? true : raw === "false" ? false : raw
    }
    setSaving(true)
    try {
      await api(path, { method: "POST", body: JSON.stringify(payload) })
      setOpen(false)
      toast.success(t.saved)
      celebrate(document.activeElement)
      await load()
    } catch (reason) {
      setFormError(reason instanceof ApiError ? reason.message : t.error)
    } finally {
      setSaving(false)
    }
  }

  function startCreate() {
    setForm(Object.fromEntries((fields ?? []).map((field) => [field.name, field.value ?? ""])))
    setFormError("")
    setOpen(true)
  }

  return (
    <Card className="table-card">
      {heading ? <CardHead title={heading} sub={sub} icon={Glyph} tone={tone} /> : null}
      <div className="table-tools">
        <div className="ctl">
          <IconSearch size={18} aria-hidden="true" />
          <input value={query} placeholder={t.search} onChange={(event) => setQuery(event.target.value)} aria-label={`${t.search} · ${title}`} type="search" />
        </div>
        <span className="count"><strong>{(server || !query ? total : visible.length).toLocaleString(locale)}</strong> {t.records}</span>
        <span className="spacer" />
        {fields ? <Button variant="primary" icon={IconPlus} onClick={startCreate}>{createLabel ?? t.create}</Button> : null}
      </div>
      {error ? <div style={{ padding: "16px 20px 0" }}><Alert tone="bad">{error}</Alert></div> : null}
      <DataTable
        columns={tableColumns}
        rows={visible}
        loading={loading}
        rowKey={(row, index) => String(row.id ?? index)}
        searching={Boolean(query.trim())}
        emptyScene={/code/.test(page?.to ?? path) ? "ticket" : /student|teacher|employee|institute/.test(page?.to ?? path) ? "people" : "inbox"}
        emptyAction={fields ? <Button variant="primary" icon={IconPlus} onClick={startCreate}>{createLabel ?? t.create}</Button> : undefined}
      />
      {!loading && total > PAGE_SIZE ? <Pagination page={current} pageSize={PAGE_SIZE} total={total} onPage={(next) => { setCurrent(next); void load(next) }} /> : null}

      {fields ? (
        <Dialog open={open} onClose={() => setOpen(false)} title={createLabel ?? `${t.create} · ${title}`} icon={Glyph} tone={tone} size={fields.length > 4 ? "lg" : "md"} onSubmit={submit} busy={saving} footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>{t.cancel}</Button>
            <Button variant="primary" type="submit" busy={saving}>{t.save}</Button>
          </>
        }>
          <div className="form">
            {formError ? <Alert tone="bad">{formError}</Alert> : null}
            <Fields>
              {fields.map((field) => {
                const value = form[field.name] ?? ""
                const set = (next: string) => setForm((prev) => ({ ...prev, [field.name]: next }))
                const isBool = field.type === "select" && field.options?.length === 2 && field.options.every((option) => option === "true" || option === "false")
                if (isBool) return <Segmented key={field.name} label={field.label} value={value} onChange={set} options={[{ value: "true", label: t.yes }, { value: "false", label: t.no }]} />
                if (field.type === "select") return <Select key={field.name} label={field.label} value={value} onChange={set} help={field.help} options={[{ value: "", label: "—" }, ...(field.options ?? []).map((option) => ({ value: option, label: enumText(option, lang) }))]} />
                if (field.type === "textarea") return <TextArea key={field.name} className="span-all" label={field.label} value={value} onChange={(event) => set(event.target.value)} help={field.help} />
                if (field.type === "datetime") return <DateTimeField key={field.name} label={field.label} value={value} onChange={set} help={field.help} />
                return (
                  <TextField
                    key={field.name}
                    label={field.label}
                    help={field.help}
                    type={field.type ?? "text"}
                    inputMode={field.type === "number" ? "decimal" : undefined}
                    minLength={field.type === "password" ? 8 : undefined}
                    autoComplete={field.type === "password" ? "new-password" : undefined}
                    value={value}
                    onChange={(event) => set(event.target.value)}
                  />
                )
              })}
            </Fields>
          </div>
        </Dialog>
      ) : null}
    </Card>
  )
}
