import { useMemo, useState, type ReactNode } from "react"
import { IconArrowsSort, IconChevronLeft, IconChevronRight, IconSortAscending, IconSortDescending } from "@tabler/icons-react"
import { useI18n } from "./i18n"
import { EmptyState } from "./ui"

export type Column<T> = {
  key: string
  label: string
  render?: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  align?: "start" | "end"
  lead?: boolean
  sortable?: boolean
}

export function DataTable<T>({ columns, rows, loading, rowKey, actions, emptyTitle, emptyHint, emptyScene, emptyAction, searching }: {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  rowKey: (row: T, index: number) => string
  actions?: (row: T) => ReactNode
  emptyTitle?: string
  emptyHint?: string
  emptyScene?: "inbox" | "books" | "people" | "calendar" | "search" | "error" | "live" | "chart" | "ticket"
  emptyAction?: ReactNode
  searching?: boolean
}) {
  const { t, locale } = useI18n()
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null)
  const sorted = useMemo(() => {
    if (!sort) return rows
    const column = columns.find((item) => item.key === sort.key)
    if (!column) return rows
    const value = column.sortValue ?? ((row: T) => {
      const raw = (row as Record<string, unknown>)[column.key]
      return typeof raw === "number" ? raw : String(raw ?? "")
    })
    return [...rows].sort((a, b) => {
      const x = value(a), y = value(b)
      if (typeof x === "number" && typeof y === "number") return (x - y) * sort.dir
      return String(x).localeCompare(String(y), locale, { numeric: true }) * sort.dir
    })
  }, [rows, sort, columns, locale])

  if (!loading && rows.length === 0) {
    return searching
      ? <EmptyState title={t.noMatch} hint={t.noMatchHint} scene="search" compact />
      : <EmptyState title={emptyTitle ?? t.empty} hint={emptyHint ?? t.emptyHint} scene={emptyScene} action={emptyAction} />
  }

  return (
    <div className="table-scroll">
      <table className="dt cards">
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort?.key === column.key
              const canSort = column.sortable !== false
              return (
                <th key={column.key} scope="col" className={column.align === "end" ? "num" : undefined} aria-sort={active ? (sort!.dir === 1 ? "ascending" : "descending") : undefined}>
                  {canSort ? (
                    <button type="button" title={t.pageSorted} onClick={() => setSort(active ? (sort!.dir === 1 ? { key: column.key, dir: -1 } : null) : { key: column.key, dir: 1 })}>
                      {column.label}
                      {active ? (sort!.dir === 1 ? <IconSortAscending size={14} aria-hidden="true" /> : <IconSortDescending size={14} aria-hidden="true" />) : <IconArrowsSort size={13} aria-hidden="true" opacity={0.45} />}
                    </button>
                  ) : column.label}
                </th>
              )
            })}
            {actions ? <th className="actions"><span className="sr-only">{t.actions}</span></th> : null}
          </tr>
        </thead>
        <tbody>
          {loading ? Array.from({ length: 6 }).map((_, index) => (
            <tr key={index}>
              {columns.map((column, c) => <td key={column.key} data-label={column.label}><div className={`skel ${c === 0 ? "w80" : index % 2 ? "w60" : "w40"}`} /></td>)}
              {actions ? <td className="actions" /> : null}
            </tr>
          )) : sorted.map((row, index) => (
            <tr key={rowKey(row, index)}>
              {columns.map((column) => (
                <td key={column.key} data-label={column.label} className={[column.align === "end" ? "num" : "", column.lead ? "lead" : ""].filter(Boolean).join(" ") || undefined}>
                  {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "—")}
                </td>
              ))}
              {actions ? <td className="actions">{actions(row)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (page: number) => void }) {
  const { t, dir, locale } = useI18n()
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const numbers: (number | "gap")[] = []
  for (let n = 1; n <= pages; n++) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 1) numbers.push(n)
    else if (numbers[numbers.length - 1] !== "gap") numbers.push("gap")
  }
  const Prev = dir === "rtl" ? IconChevronRight : IconChevronLeft
  const Next = dir === "rtl" ? IconChevronLeft : IconChevronRight
  return (
    <nav className="pager" aria-label={t.page}>
      <span className="num">{from.toLocaleString(locale)}–{to.toLocaleString(locale)} {t.of} {total.toLocaleString(locale)}</span>
      <div className="pages">
        <button type="button" className="pg" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label={t.previous}><Prev size={18} /></button>
        {numbers.map((n, index) => n === "gap"
          ? <span key={`g${index}`} className="gap">…</span>
          : <button key={n} type="button" className={n === page ? "pg n on" : "pg n"} aria-current={n === page ? "page" : undefined} onClick={() => onPage(n)}>{n.toLocaleString(locale)}</button>)}
        <button type="button" className="pg" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label={t.next}><Next size={18} /></button>
      </div>
    </nav>
  )
}
