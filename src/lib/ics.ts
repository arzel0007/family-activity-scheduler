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
    const kidNames = activity.activity_kids
      .map((ak: any) => kids.find((k: any) => k.id === ak.kid_id)?.name)
      .filter(Boolean)
      .join(', ')

    const dtstart = activity.due_date
      ? `${activity.due_date.replace(/-/g, '')}${activity.due_time ? `T${activity.due_time.replace(/:/g, '')}00` : 'T000000'}`
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
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  
  if (isIOS) {
    // For iOS, create a data URL and open it
    const dataUrl = 'data:text/calendar;base64,' + btoa(ics)
    window.location.href = dataUrl
  } else {
    // For other devices, download as file
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}
