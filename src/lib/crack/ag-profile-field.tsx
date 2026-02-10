import {useEffect} from 'react'

import {
  type AlterEgoProfileOverlay,
  applyAlterEgoProfile,
  parseAlterEgoUri,
} from '#/lib/crack/alter-ego'
import {useCrackSettings} from '#/state/preferences'

type AlterEgoOverlayByDid = Record<string, AlterEgoProfileOverlay>

let alterEgoOverlayByDid: AlterEgoOverlayByDid = {}

function setAlterEgoOverlayByDid(next: AlterEgoOverlayByDid) {
  alterEgoOverlayByDid = next
}

export function getAlterEgoOverlayByDid(): AlterEgoOverlayByDid {
  return alterEgoOverlayByDid
}

export function getAlterEgoOverlayForDid(
  did: string,
): AlterEgoProfileOverlay | undefined {
  return alterEgoOverlayByDid[did]
}

function buildAlterEgoOverlayByDid({
  alterEgoByDid,
  alterEgoRecords,
  alterEgoUri,
}: {
  alterEgoByDid?: Record<string, string>
  alterEgoRecords?: Record<string, AlterEgoProfileOverlay>
  alterEgoUri?: string
}): AlterEgoOverlayByDid {
  const records = alterEgoRecords ?? {}
  const byDid = alterEgoByDid ?? {}
  const next: AlterEgoOverlayByDid = {}

  for (const [did, uri] of Object.entries(byDid)) {
    const record = records[uri]
    if (record) {
      next[did] = record
    }
  }

  if (alterEgoUri && !Object.values(byDid).includes(alterEgoUri)) {
    const parsed = parseAlterEgoUri(alterEgoUri)
    if (parsed) {
      const record = records[alterEgoUri]
      if (record) {
        next[parsed.repo] = record
      }
    }
  }

  return next
}

export function AlterEgoProfileFieldBootstrap() {
  const settings = useCrackSettings()

  useEffect(() => {
    setAlterEgoOverlayByDid(
      buildAlterEgoOverlayByDid({
        alterEgoByDid: settings.alterEgoByDid,
        alterEgoRecords: settings.alterEgoRecords,
        alterEgoUri: settings.alterEgoUri,
      }),
    )
  }, [settings.alterEgoByDid, settings.alterEgoRecords, settings.alterEgoUri])

  return null
}

type ProfileOverlayTarget = {
  did: string
  handle: string
  avatar?: string
  banner?: string
  displayName?: string
  description?: string
}

function isProfileOverlayTarget(value: unknown): value is ProfileOverlayTarget {
  if (!value || typeof value !== 'object') return false
  return (
    typeof (value as ProfileOverlayTarget).did === 'string' &&
    typeof (value as ProfileOverlayTarget).handle === 'string'
  )
}

export function applyAlterEgoOverlaysToResponseData(data: unknown) {
  const overlays = getAlterEgoOverlayByDid()
  if (!Object.keys(overlays).length) return

  const visited = new WeakSet<object>()

  const walk = (value: unknown) => {
    if (!value || typeof value !== 'object') return
    if (visited.has(value as object)) return
    visited.add(value as object)

    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item)
      }
      return
    }

    if (isProfileOverlayTarget(value)) {
      const overlay = overlays[value.did]
      if (overlay) {
        Object.assign(value, applyAlterEgoProfile(value, overlay))
      }
    }

    for (const key of Object.keys(value as Record<string, unknown>)) {
      walk((value as Record<string, unknown>)[key])
    }
  }

  walk(data)
}
