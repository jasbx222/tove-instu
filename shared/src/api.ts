const base = import.meta.env.VITE_API_URL ?? ""

export type SessionUser = {
  id: string
  ownerId: string
  portal: string
  type: string
  name: string
  phone: string
  instituteName?: string
  permissions: string[]
  subscriptionEndsAt?: string | null
  approved?: boolean
}

const arabic: Record<string, string> = {
  payments_paused: "الدفع الإلكتروني متوقف مؤقتاً. تواصل مع الإدارة للاشتراك.",
  already_linked: "هذا المعلم مرتبط بالمعهد مسبقاً.",
  phone_taken: "رقم الهاتف مسجّل مسبقاً.",
  hour_subscription_required: "تحتاج باقة ساعات فعّالة ورصيداً متبقياً لفتح قاعة.",
  livekit_unconfigured: "خدمة البث غير مضبوطة على الخادم. أخبر الإدارة.",
  outside_window: "الحصة لم تفتح بعد. تفتح الغرفة قبل موعدها بعشر دقائق.",
  pool_missing: "رصيد ساعات المعهد فارغ.",
  invalid_count: "العدد يجب أن يكون بين 1 و100.",
  invalid_expiry: "تاريخ الانتهاء يجب أن يكون في المستقبل.",
  forbidden: "لا تملك صلاحية لهذا الإجراء.",
  not_found: "العنصر غير موجود.",
}

function friendly(code: string, message: string) {
  const ar = typeof document !== "undefined" && (document.documentElement.lang || "ar").startsWith("ar")
  if (ar && arabic[code]) return arabic[code]
  if (/invalid api key|could not establish signal/i.test(message))
    return ar ? "تعذّر الاتصال بخادم البث. مفاتيح LiveKit غير صحيحة على الخادم." : message
  return message
}

export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function token() {
  return localStorage.getItem("tovi-token") ?? ""
}

export function setToken(value: string) {
  if (value) localStorage.setItem("tovi-token", value)
  else localStorage.removeItem("tovi-token")
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (token()) headers.set("Authorization", `Bearer ${token()}`)
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json")
  const response = await fetch(`${base}${path}`, { ...init, headers })
  if (response.status === 204) return undefined as T
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) throw new ApiError(response.status, data?.error ?? "error", data?.message ?? "Request failed")
  return data as T
}

export async function download(path: string, filename: string) {
  const response = await fetch(`${base}${path}`, { headers: { Authorization: `Bearer ${token()}` } })
  if (!response.ok) throw new ApiError(response.status, "export_failed", "Export failed")
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/** Public URL of a stored file, such as a course cover. */
export function fileUrl(id: string | null | undefined) {
  return id ? `${base}/api/files/${id}` : ""
}
