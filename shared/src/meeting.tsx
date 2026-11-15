import { useEffect, useMemo, useRef, useState } from "react"
import { LiveKitRoom, RoomAudioRenderer, useLocalParticipant, useParticipants, useRoomContext } from "@livekit/components-react"
import { RoomEvent, Track, type TrackPublication } from "livekit-client"
import { IconDoorExit, IconHandStop, IconMicrophone, IconMicrophoneOff, IconScreenShare, IconSend, IconSpeakerphone, IconUserMinus, IconVideo, IconVideoOff, IconVolumeOff } from "@tabler/icons-react"
import "@livekit/components-styles"
import { api, ApiError } from "./api"
import { EmptyArt } from "./art"
import { useI18n } from "./i18n"
import { Avatar, Badge, Card, ErrorState, IconButton, Skeleton } from "./ui"

type TokenResponse = { url: string; token: string; room: string; identity: string }
type ChatResponse = { environment: string; path: string }

export function Meeting({ sessionId, role }: { sessionId: string; role: "teacher" | "student" }) {
  const [token, setToken] = useState<TokenResponse | null>(null)
  const [chat, setChat] = useState<ChatResponse | null>(null)
  const [error, setError] = useState("")
  const base = role === "teacher" ? "/api/teacher" : "/api/student"

  useEffect(() => {
    let gone = false
    api<TokenResponse>(`${base}/sessions/${sessionId}/token`, { method: "POST" })
      .then((value) => { if (!gone) setToken(value) })
      .catch((reason) => { if (!gone) setError(reason instanceof ApiError ? reason.message : "LiveKit") })
    api<ChatResponse>(`${base}/sessions/${sessionId}/chat`).then((value) => {
      if (gone) return
      if (value.environment === "production" && import.meta.env.DEV) {
        setError("This development build cannot enter a production meeting.")
        return
      }
      setChat(value)
    }).catch(() => setChat(null))
    return () => { gone = true }
  }, [sessionId, base])

  if (error) return <Card><ErrorState message={error} /></Card>
  if (!token) return <Card pad><Skeleton lines={4} block /></Card>
  return (
    <LiveKitRoom serverUrl={token.url} token={token.token} connect audio={role === "teacher"} video={role === "teacher"} onError={(reason) => setError(reason.message)}>
      <RoomAudioRenderer />
      <Stage sessionId={sessionId} role={role} chat={chat} />
    </LiveKitRoom>
  )
}

function Stage({ sessionId, role, chat }: { sessionId: string; role: "teacher" | "student"; chat: ChatResponse | null }) {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const people = useParticipants()
  const { tr } = useI18n()
  const [hands, setHands] = useState<string[]>([])
  const [announcements, setAnnouncements] = useState<string[]>([])
  const [note, setNote] = useState("")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<string[]>([])
  const [started] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [rail, setRail] = useState<"people" | "hands" | "chat">("people")

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000)
    const onData = (payload: Uint8Array) => {
      const data = JSON.parse(new TextDecoder().decode(payload)) as { type: string; from?: string; text?: string; raised?: boolean }
      if (data.type === "hand" && data.from) setHands((list) => data.raised ? Array.from(new Set([...list, data.from!])) : list.filter((item) => item !== data.from))
      if (data.type === "announcement" && data.text) setAnnouncements((list) => [data.text!, ...list].slice(0, 8))
      if (data.type === "chat" && data.text) setMessages((list) => [...list, data.text!].slice(-40))
    }
    room.on(RoomEvent.DataReceived, onData)
    return () => { window.clearInterval(timer); room.off(RoomEvent.DataReceived, onData) }
  }, [room, started])

  const tiles = useMemo(() => people.flatMap((person) => {
    const camera = person.getTrackPublication(Track.Source.Camera)
    const screen = person.getTrackPublication(Track.Source.ScreenShare)
    return [camera, screen].flatMap((publication) => publication?.track ? [{ key: person.identity + publication.source, track: publication.track, name: person.identity }] : [])
  }), [people])

  function send(payload: object) {
    const bytes = new TextEncoder().encode(JSON.stringify(payload))
    void localParticipant.publishData(bytes, { reliable: true })
  }

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0")
  const seconds = String(elapsed % 60).padStart(2, "0")
  const qualityTone = (value: string) => value === "excellent" || value === "good" ? "ok" : value === "poor" ? "wait" : value === "lost" ? "bad" : "info"
  const mic = localParticipant.isMicrophoneEnabled
  const cam = localParticipant.isCameraEnabled
  const share = localParticipant.isScreenShareEnabled

  return (
    <div className="meet">
      <section className="stage" aria-label={tr("البث", "Stage")}>
        <div className="stage-top">
          <Badge tone="live">{tr("مباشر", "Live")}</Badge>
          <Badge>{room.state}</Badge>
          <Badge plain><span className="num">{minutes}:{seconds}</span></Badge>
          <Badge tone={mic ? "ok" : undefined}>{mic ? tr("المايك مفتوح", "Mic on") : tr("المايك مغلق", "Mic off")}</Badge>
        </div>
        <div className="stage-grid">
          {tiles.length === 0 ? (
            <div className="stage-wait"><EmptyArt scene="live" /><p>{tr("بانتظار أن يفتح أحد الكاميرا", "Waiting for a camera")}</p></div>
          ) : tiles.map((tile) => <Tile key={tile.key} track={tile.track} name={tile.name} />)}
        </div>
        <div className="dock">
          <button type="button" className={mic ? "on" : ""} aria-pressed={mic} onClick={() => localParticipant.setMicrophoneEnabled(!mic)}>{mic ? <IconMicrophone size={22} /> : <IconMicrophoneOff size={22} />}{tr("المايك", "Mic")}</button>
          <button type="button" className={cam ? "on" : ""} aria-pressed={cam} onClick={() => localParticipant.setCameraEnabled(!cam)}>{cam ? <IconVideo size={22} /> : <IconVideoOff size={22} />}{tr("الكاميرا", "Camera")}</button>
          <button type="button" className={share ? "on" : ""} aria-pressed={share} onClick={() => localParticipant.setScreenShareEnabled(!share)}><IconScreenShare size={22} />{tr("الشاشة", "Share")}</button>
          {role === "teacher" ? <button type="button" onClick={() => api(`/api/teacher/sessions/${sessionId}/participants/mute`, { method: "POST", body: JSON.stringify({ allStudents: true }) })}><IconVolumeOff size={22} />{tr("كتم الطلاب", "Mute students")}</button> : null}
          {role === "student" ? <button type="button" onClick={() => send({ type: "hand", from: localParticipant.identity, raised: true })}><IconHandStop size={22} />{tr("رفع اليد", "Raise hand")}</button> : null}
          <button type="button" className="leave" onClick={() => room.disconnect()}><IconDoorExit size={22} className="flip-rtl" />{tr("مغادرة", "Leave")}</button>
        </div>
      </section>

      <Card as="aside" className="rail">
        <div className="seg block" role="tablist">
          <button type="button" role="tab" aria-selected={rail === "people"} onClick={() => setRail("people")}>{tr("الحضور", "People")} <span className="num">{people.length}</span></button>
          <button type="button" role="tab" aria-selected={rail === "hands"} onClick={() => setRail("hands")}>{tr("الأيدي", "Hands")}{hands.length ? <span className="num"> {hands.length}</span> : null}</button>
          <button type="button" role="tab" aria-selected={rail === "chat"} onClick={() => setRail("chat")}>{tr("المحادثة", "Chat")}</button>
        </div>
        <div className="rail-body" role="tabpanel">
          {rail === "people" ? people.map((person) => (
            <div key={person.identity} className="person-row">
              <Avatar name={person.identity.replace(/^\w+:/, "")} />
              <span className="name" dir="auto">{person.identity}</span>
              <Badge tone={qualityTone(person.connectionQuality)}>{person.connectionQuality}</Badge>
              {role === "teacher" && person.identity.startsWith("student:") ? <IconButton icon={IconUserMinus} size="sm" tone="danger" label={tr("إخراج", "Remove")} onClick={() => api(`/api/teacher/sessions/${sessionId}/participants/remove`, { method: "POST", body: JSON.stringify({ identity: person.identity }) })} /> : null}
            </div>
          )) : null}
          {rail === "hands" ? (
            <>
              {hands.length === 0 ? <p className="fld-help" style={{ padding: 8 }}>{tr("لا توجد أيدٍ مرفوعة", "No raised hands")}</p> : hands.map((hand) => <p key={hand} className="bubble"><IconHandStop size={15} style={{ display: "inline", verticalAlign: "-2px" }} /> {hand}</p>)}
              {announcements.map((item, index) => <p key={index} className="bubble note"><IconSpeakerphone size={15} style={{ display: "inline", verticalAlign: "-2px" }} /> {item}</p>)}
            </>
          ) : null}
          {rail === "chat" ? (
            <>
              <p className="fld-help">{chat ? `${chat.environment} · ${chat.path}` : tr("فايرستور غير مهيأ، القناة المباشرة تبقى متاحة", "Firestore is not configured. The live channel stays available.")}</p>
              <div className="stack" style={{ gap: 6 }}>{messages.map((item, index) => <p key={index} className="bubble">{item}</p>)}</div>
            </>
          ) : null}
        </div>
        {rail === "hands" && role === "teacher" ? (
          <form className="composer-row" onSubmit={(event) => { event.preventDefault(); if (!note.trim()) return; send({ type: "announcement", text: note }); setAnnouncements((list) => [note, ...list]); setNote("") }}>
            <div className="ctl"><input value={note} onChange={(event) => setNote(event.target.value)} placeholder={tr("إعلان للطلاب", "Announcement")} aria-label={tr("إعلان للطلاب", "Announcement")} /></div>
            <IconButton icon={IconSend} type="submit" label={tr("إرسال", "Send")} outlined className="flip-rtl" />
          </form>
        ) : null}
        {rail === "chat" ? (
          <form className="composer-row" onSubmit={(event) => {
            event.preventDefault()
            if (!message.trim()) return
            if (chat?.environment === "production" && import.meta.env.DEV) return
            send({ type: "chat", text: message })
            setMessages((list) => [...list, message])
            setMessage("")
          }}>
            <div className="ctl"><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder={tr("رسالة", "Message")} aria-label={tr("رسالة", "Message")} /></div>
            <IconButton icon={IconSend} type="submit" label={tr("إرسال", "Send")} outlined className="flip-rtl" />
          </form>
        ) : null}
      </Card>
    </div>
  )
}

function Tile({ track, name }: { track: NonNullable<TrackPublication["track"]>; name: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    track.attach(element)
    return () => { track.detach(element) }
  }, [track])
  return (
    <div className="v-tile">
      <video ref={ref} />
      <span dir="auto">{name}</span>
    </div>
  )
}
