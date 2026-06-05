const KEY = 'licitaya_alerts'

export function getAlerts() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveAlert(alert) {
  const alerts = getAlerts()
  const newAlert = { ...alert, id: Date.now(), creadoEn: new Date().toISOString() }
  localStorage.setItem(KEY, JSON.stringify([newAlert, ...alerts]))
  return newAlert
}

export function deleteAlert(id) {
  const alerts = getAlerts().filter(a => a.id !== id)
  localStorage.setItem(KEY, JSON.stringify(alerts))
}

export function updateAlert(id, patch) {
  const alerts = getAlerts().map(a => a.id === id ? { ...a, ...patch } : a)
  localStorage.setItem(KEY, JSON.stringify(alerts))
}
