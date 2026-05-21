export function generateICS(activities: any[], kids: any[]) {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Family Activity Scheduler//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Family Activities
X-WR-TIMEZONE:UTC
BEGIN:VTIMEZONE
TZID:UTC
BEGIN:STANDARD
DTSTART:19700101T000000
TZOFFSETFROM:+0000
TZOFFSETTO:+0000
TZNAME:UTC
END:STANDARD
END:VTIMEZONE
`

  activities.forEach((activity) => {
    const kidNames = (activity.kidIds || [])
      .map((id: string) => kids.find((k: any) => k.id === id)?.name)
      .filter(Boolean)
      .join(', ')

    const dtstart = activity.dueDate
      ? `${activity.dueDate.replace(/-/g, '')}${activity.dueTime ? `T${activity.dueTime.replace(/:/g, '')}00` : 'T000000'}`
      : timestamp

    const uid = `${activity.id}@familyactivityscheduler.local`
    const dtstamp = timestamp

    ics += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
SUMMARY:${escapeICS(activity.title)}
DESCRIPTION:${escapeICS(`Kids: ${kidNames}\n${activity.description || ''}`)}
END:VEVENT
`
  })

  ics += `END:VCALENDAR`
  return ics
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
}

export function downloadICS(ics: string, filename: string = 'activities.ics') {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
}
