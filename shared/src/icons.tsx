import {
  IconAdjustmentsHorizontal, IconBellRinging, IconBook, IconBook2, IconBuilding, IconBuildingCommunity, IconCalendarStats,
  IconCalendarTime, IconCategory, IconChalkboard, IconChartBar, IconClipboardCheck, IconClockHour4, IconCompass,
  IconCreditCard, IconHelpCircle, IconHome2, IconHourglass, IconId, IconLayoutDashboard, IconMapPin, IconMessages, IconNotes,
  IconPackage, IconPresentation, IconReceipt2, IconSchool, IconSettings, IconSpeakerphone, IconStairs, IconTicket,
  IconUserCircle, IconUserStar, IconUsers, IconUsersGroup, IconVideo, type Icon,
} from "@tabler/icons-react"

export type Tone = "green" | "sky" | "yellow" | "coral" | "purple" | "navy"

// Every route gets one icon and one tone so a page reads the same in the menu, the header, and the palette.
const routeIcons: [RegExp, Icon, Tone][] = [
  [/^\/$/, IconLayoutDashboard, "green"],
  [/^\/home/, IconHome2, "green"],
  [/teachers/, IconUsers, "sky"],
  [/institutes/, IconBuildingCommunity, "purple"],
  [/students/, IconSchool, "yellow"],
  [/employees/, IconId, "navy"],
  [/assistants/, IconUserStar, "purple"],
  [/sections/, IconCategory, "sky"],
  [/grades/, IconStairs, "purple"],
  [/subjects/, IconBook2, "green"],
  [/domains/, IconCompass, "yellow"],
  [/governorates/, IconMapPin, "coral"],
  [/plans/, IconPackage, "purple"],
  [/subscriptions/, IconCreditCard, "sky"],
  [/invoices/, IconReceipt2, "green"],
  [/codes/, IconTicket, "yellow"],
  [/hours|pool/, IconHourglass, "sky"],
  [/ads/, IconSpeakerphone, "coral"],
  [/guides/, IconBook, "green"],
  [/faq/, IconHelpCircle, "sky"],
  [/scheduled/, IconCalendarTime, "purple"],
  [/notifications/, IconBellRinging, "yellow"],
  [/reports/, IconChartBar, "sky"],
  [/parameters|settings/, IconAdjustmentsHorizontal, "navy"],
  [/courses/, IconPresentation, "green"],
  [/summaries/, IconNotes, "yellow"],
  [/exams/, IconClipboardCheck, "coral"],
  [/groups/, IconUsersGroup, "sky"],
  [/classrooms/, IconChalkboard, "purple"],
  [/sessions|meetings/, IconVideo, "coral"],
  [/chat/, IconMessages, "sky"],
  [/profile/, IconUserCircle, "navy"],
  [/schools/, IconBuilding, "purple"],
  [/calendar/, IconCalendarStats, "sky"],
  [/clock/, IconClockHour4, "sky"],
  [/gear/, IconSettings, "navy"],
]

export function routeVisual(to: string): { Icon: Icon; tone: Tone } {
  const hit = routeIcons.find(([pattern]) => pattern.test(to))
  return hit ? { Icon: hit[1], tone: hit[2] } : { Icon: IconLayoutDashboard, tone: "green" }
}
