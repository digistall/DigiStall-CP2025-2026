// Event Bus using mitt for Vue 3 compatibility
import mitt from 'mitt'

export const eventBus = mitt()

// Event constants
export const EVENTS = {
  STALL_ADDED: 'stall:added',
  STALL_DELETED: 'stall:deleted',
  STALL_UPDATED: 'stall:updated',
  STALL_STATUS_CHANGED: 'stall:statusChanged',
  DATA_REFRESH: 'data:refresh',
  USER_LOGOUT: 'user:logout',
  USER_LOGIN: 'user:login',
  NOTIFICATION: 'notification',
  ERROR: 'error'
}

export default eventBus
