export function exportToJSON(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function importFromJSON(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        resolve(data)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export async function exportActivitiesAndKids(activities: any[], kids: any[]) {
  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    activities,
    kids
  }
  exportToJSON(backup, `family-scheduler-backup-${Date.now()}.json`)
}

export async function importActivitiesAndKids(file: File) {
  const data = await importFromJSON(file)
  if (!data.activities || !data.kids) {
    throw new Error('Invalid backup file format')
  }
  return data
}
