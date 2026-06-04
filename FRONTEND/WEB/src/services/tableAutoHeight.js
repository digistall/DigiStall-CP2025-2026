const TABLE_SELECTOR =
  '.main-content .table-wrapper, .main-content .scrollable-table-wrapper, .main-content .table-body, .main-content .v-data-table__wrapper'
const DASHBOARD_SELECTOR = '.dashboard-container, .system-admin-dashboard'
const MIN_TABLE_HEIGHT = 160

const parsePixels = (value) => {
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const getRootVarPixels = (name) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name)
  return parsePixels(value)
}

const shouldSkipElement = (element) => Boolean(element.closest(DASHBOARD_SELECTOR))

const computeMaxHeight = (element) => {
  if (!element || shouldSkipElement(element)) return

  const rect = element.getBoundingClientRect()
  if (!rect || rect.width === 0 || rect.height === 0) return

  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
  const bottomGap = getRootVarPixels('--table-scroll-bottom-gap')
  const layoutBottom = getRootVarPixels('--v-layout-bottom')

  const available = viewportHeight - rect.top - bottomGap - layoutBottom
  const safeHeight = Math.max(MIN_TABLE_HEIGHT, Math.floor(available))

  element.style.setProperty('max-height', `${safeHeight}px`, 'important')
}

let rafId = null
const updateAll = () => {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    document.querySelectorAll(TABLE_SELECTOR).forEach((element) => computeMaxHeight(element))
  })
}

const startTableAutoHeight = () => {
  if (typeof window === 'undefined') return () => {}

  updateAll()
  window.addEventListener('resize', updateAll)
  window.addEventListener('orientationchange', updateAll)

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateAll)
  }

  const observer = new MutationObserver(updateAll)
  observer.observe(document.body, { childList: true, subtree: true })

  return () => {
    window.removeEventListener('resize', updateAll)
    window.removeEventListener('orientationchange', updateAll)
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', updateAll)
    }
    observer.disconnect()
  }
}

export default startTableAutoHeight
