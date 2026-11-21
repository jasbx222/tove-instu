import { useEffect, useState } from "react"
import { IconCash, IconReceipt2 } from "@tabler/icons-react"
import { api } from "./api"
import { useI18n } from "./i18n"
import { Alert, Badge, Card, CardHead, EmptyState, Skeleton, formatDate } from "./ui"

type Row = Record<string, any>

/** True while online payment is switched on at the server. Defaults to true until the server answers. */
export function usePaymentsOnline() {
  const [online, setOnline] = useState(true)
  useEffect(() => { api<{ online: boolean }>("/api/payments/status").then((value) => setOnline(value.online)).catch(() => undefined) }, [])
  return online
}

export function PaymentsPaused() {
  const { tr } = useI18n()
  return (
    <Alert tone="wait" title={tr("الدفع الإلكتروني متوقف مؤقتاً", "Online payment is paused")}>
      <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><IconCash size={16} aria-hidden="true" />{tr("للاشتراك تواصل مع الإدارة، وهي تفعّل الباقة لك نقداً.", "To subscribe, contact the administration. They activate the plan for you in cash.")}</span>
    </Alert>
  )
}

const statusTone: Record<string, "ok" | "wait" | "bad" | "info"> = { Active: "ok", Waiting: "wait", Expired: "bad", Consumed: "info" }

/** The account's own subscriptions with their real status, from the server. */
export function SubscriptionsCard({ path, plans }: { path: string; plans: Row[] | null }) {
  const { tr, locale } = useI18n()
  const [rows, setRows] = useState<Row[] | null>(null)
  useEffect(() => { api<Row[]>(path).then(setRows).catch(() => setRows([])) }, [path])
  const labels: Record<string, string> = { Active: tr("فعّال", "Active"), Waiting: tr("بانتظار الدفع", "Awaiting payment"), Expired: tr("منتهي", "Expired"), Consumed: tr("نفدت الأكواد", "Codes used up") }
  return (
    <Card>
      <CardHead title={tr("اشتراكاتي", "My subscriptions")} icon={IconReceipt2} tone="sky" sub={rows ? `${rows.length}` : undefined} />
      {rows === null ? <div className="card-body"><Skeleton lines={3} /></div> : rows.length === 0 ? <EmptyState compact scene="ticket" title={tr("لا يوجد اشتراك بعد", "No subscription yet")} /> : (
        <div className="list">
          {rows.map((row) => {
            const status = String(row.status)
            const plan = plans?.find((item) => item.id === row.planId)
            return (
              <div key={row.id} className="list-item">
                <div className="li-main">
                  <strong>{plan?.title ?? tr("باقة", "Plan")}</strong>
                  <small>{row.endsAt ? `${tr("ينتهي", "Ends")} ${formatDate(row.endsAt, locale)}` : tr("لم تبدأ بعد", "Not started")} · {tr("أكواد", "codes")} <span className="num">{row.codesIssued}/{row.planCodesCount}</span></small>
                </div>
                <Badge tone={statusTone[status] ?? "info"}>{labels[status] ?? status}</Badge>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
