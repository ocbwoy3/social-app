import EventEmitter from 'eventemitter3'

import {type Nux} from '#/state/queries/nuxs/definitions'

type UnlistenFn = () => void

const emitter = new EventEmitter()

// a "soft reset" typically means scrolling to top and loading latest
// but it can depend on the screen
export function emitSoftReset() {
  emitter.emit('soft-reset')
}
export function listenSoftReset(fn: () => void): UnlistenFn {
  emitter.on('soft-reset', fn)
  return () => emitter.off('soft-reset', fn)
}

export function emitSessionDropped() {
  emitter.emit('session-dropped')
}
export function listenSessionDropped(fn: () => void): UnlistenFn {
  emitter.on('session-dropped', fn)
  return () => emitter.off('session-dropped', fn)
}

export function emitNetworkConfirmed() {
  emitter.emit('network-confirmed')
}
export function listenNetworkConfirmed(fn: () => void): UnlistenFn {
  emitter.on('network-confirmed', fn)
  return () => emitter.off('network-confirmed', fn)
}

export function emitNetworkLost() {
  emitter.emit('network-lost')
}
export function listenNetworkLost(fn: () => void): UnlistenFn {
  emitter.on('network-lost', fn)
  return () => emitter.off('network-lost', fn)
}

export function emitPostCreated() {
  emitter.emit('post-created')
}
export function listenPostCreated(fn: () => void): UnlistenFn {
  emitter.on('post-created', fn)
  return () => emitter.off('post-created', fn)
}

export function emitOpenWelcomeModal() {
  emitter.emit('open-welcome-modal')
}
export function listenOpenWelcomeModal(fn: () => void): UnlistenFn {
  emitter.on('open-welcome-modal', fn)
  return () => emitter.off('open-welcome-modal', fn)
}

export function emitOpenNuxDialog(id: Nux) {
  emitter.emit('open-nux-dialog', id)
}
export function listenOpenNuxDialog(fn: (id: Nux) => void): UnlistenFn {
  emitter.on('open-nux-dialog', fn)
  return () => emitter.off('open-nux-dialog', fn)
}
