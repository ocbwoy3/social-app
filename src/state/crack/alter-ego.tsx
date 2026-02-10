import {useEffect, useMemo, useState} from 'react'
import {type BskyAgent} from '@atproto/api'

import {
  ALTER_EGO_COLLECTION,
  type AlterEgoProfileOverlay,
  type AlterEgoRecord,
  parseAlterEgoUri,
  validateAlterEgoRecord,
} from '#/lib/crack/alter-ego'
import {logger} from '#/logger'
import {
  type CrackSettings,
  useCrackSettings,
  useCrackSettingsApi,
} from '#/state/preferences'
import {useAgent} from '#/state/session'

type AlterEgoCacheListener = () => void

const alterEgoOverlayCache = new Map<string, AlterEgoProfileOverlay>()
const alterEgoOverlayRequests = new Map<
  string,
  Promise<AlterEgoProfileOverlay | undefined>
>()
const alterEgoOverlayListeners = new Set<AlterEgoCacheListener>()

function notifyAlterEgoOverlayListeners() {
  for (const listener of alterEgoOverlayListeners) {
    listener()
  }
}

export function primeAlterEgoOverlay(overlay: AlterEgoProfileOverlay) {
  alterEgoOverlayCache.set(overlay.uri, overlay)
  notifyAlterEgoOverlayListeners()
}

export function getCachedAlterEgoOverlay(uri: string) {
  return alterEgoOverlayCache.get(uri)
}

async function loadAlterEgoOverlay({
  agent,
  uri,
}: {
  agent: BskyAgent
  uri: string
}) {
  const cached = alterEgoOverlayCache.get(uri)
  if (cached) {
    return cached
  }

  const inflight = alterEgoOverlayRequests.get(uri)
  if (inflight) {
    return inflight
  }

  const request = fetchAlterEgoProfile({agent, uri})
    .then(overlay => {
      primeAlterEgoOverlay(overlay)
      return overlay
    })
    .catch(error => {
      logger.error('Failed to fetch alter ego overlay', {error})
      return undefined
    })
    .finally(() => {
      alterEgoOverlayRequests.delete(uri)
    })

  alterEgoOverlayRequests.set(uri, request)
  return request
}

export function useAlterEgoOverlay(uri?: string) {
  const agent = useAgent()
  const [_version, setVersion] = useState(0)

  useEffect(() => {
    const onUpdate = () => setVersion(prev => prev + 1)
    alterEgoOverlayListeners.add(onUpdate)
    return () => {
      alterEgoOverlayListeners.delete(onUpdate)
    }
  }, [])

  useEffect(() => {
    if (!uri) return
    if (alterEgoOverlayCache.has(uri)) return
    loadAlterEgoOverlay({agent, uri})
  }, [agent, uri])

  // Note: we intentionally read from the cache directly so updates propagate
  // when the internal `_version` state is bumped by cache listeners.
  return uri ? alterEgoOverlayCache.get(uri) : undefined
}

export function useAlterEgoOverlays(uris: string[]) {
  const agent = useAgent()
  const [_version, setVersion] = useState(0)
  const uniqueUris = useMemo(
    () => Array.from(new Set(uris.filter(Boolean))),
    [uris],
  )

  useEffect(() => {
    const onUpdate = () => setVersion(prev => prev + 1)
    alterEgoOverlayListeners.add(onUpdate)
    return () => {
      alterEgoOverlayListeners.delete(onUpdate)
    }
  }, [])

  useEffect(() => {
    if (uniqueUris.length === 0) return
    let cancelled = false
    const fetchAll = async () => {
      await Promise.all(
        uniqueUris.map(uri => loadAlterEgoOverlay({agent, uri})),
      )
      if (cancelled) return
    }
    fetchAll()
    return () => {
      cancelled = true
    }
  }, [agent, uniqueUris])

  // Same reasoning as `useAlterEgoOverlay`.
  const overlays: Record<string, AlterEgoProfileOverlay | undefined> = {}
  for (const uri of uris) {
    overlays[uri] = alterEgoOverlayCache.get(uri)
  }
  return overlays
}

export function resolveAlterEgoBlobRefToUrl({
  agent,
  did,
  blob,
}: {
  agent: BskyAgent
  did: string
  blob: AlterEgoRecord['avatar']
}): string | undefined {
  if (!blob) return undefined
  const ref = blob.ref as unknown as {toString?: () => string; $link?: string}
  const cid = ref.$link || ref.toString?.()
  if (!cid) {
    throw new Error('Invalid blob reference.')
  }
  const baseUrl = agent.pdsUrl?.toString() ?? agent.serviceUrl.toString()
  return `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(
    did,
  )}&cid=${encodeURIComponent(cid)}`
}

export async function fetchAlterEgoProfile({
  agent,
  uri,
}: {
  agent: BskyAgent
  uri: string
}): Promise<AlterEgoProfileOverlay> {
  const parsed = parseAlterEgoUri(uri)
  if (!parsed) {
    throw new Error('Invalid alter ego URI.')
  }

  const {repo, rkey} = parsed
  const recordResponse = await agent.com.atproto.repo.getRecord({
    repo,
    collection: ALTER_EGO_COLLECTION,
    rkey,
  })
  const record = recordResponse.data.value

  if (!validateAlterEgoRecord(record)) {
    throw new Error('Alter ego record failed client validation.')
  }

  let avatar: string | undefined
  let banner: string | undefined

  try {
    avatar = resolveAlterEgoBlobRefToUrl({
      agent,
      did: repo,
      blob: record.avatar,
    })
  } catch (error) {
    logger.error('Failed to resolve alter ego avatar', {error})
  }

  try {
    banner = resolveAlterEgoBlobRefToUrl({
      agent,
      did: repo,
      blob: record.banner,
    })
  } catch (error) {
    logger.error('Failed to resolve alter ego banner', {error})
  }

  return {
    uri,
    avatar,
    banner,
    displayName: record.displayName,
    description: record.description,
    handle: record.handle,
  }
}

export function useActiveAlterEgo(did: string) {
  const settings = useCrackSettings()
  const parsedGlobal = settings.alterEgoUri
    ? parseAlterEgoUri(settings.alterEgoUri)
    : null
  const activeUri =
    settings.alterEgoByDid?.[did] ||
    (parsedGlobal?.repo === did ? settings.alterEgoUri : undefined)
  const overlay = useAlterEgoOverlay(activeUri)
  if (!settings.alterEgoEnabled) {
    return undefined
  }
  return activeUri
    ? (overlay ?? settings.alterEgoRecords?.[activeUri])
    : undefined
}

export function useAlterEgoProfileFields<T extends {did: string}>(
  profile: T,
): T & {
  avatar?: string
  banner?: string
  displayName?: string
  description?: string
  handle?: string
} {
  const alter = useActiveAlterEgo(profile.did)
  return {
    ...profile,
    avatar: alter?.avatar ?? (profile as {avatar?: string}).avatar,
    banner: alter?.banner ?? (profile as {banner?: string}).banner,
    displayName:
      alter?.displayName ?? (profile as {displayName?: string}).displayName,
    description:
      alter?.description ?? (profile as {description?: string}).description,
    handle: alter?.handle ?? (profile as {handle?: string}).handle,
  }
}

export function useAlterEgoProfileFieldsOfManyDids(dids: string[]): {
  avatar?: string
  banner?: string
  displayName?: string
  description?: string
  handle?: string
}[] {
  const settings = useCrackSettings()
  const {alterEgoEnabled, alterEgoByDid, alterEgoRecords} = settings
  return useMemo(() => {
    if (!alterEgoEnabled) {
      return dids.map(() => ({}))
    }
    return dids.map(did => {
      const uri = alterEgoByDid?.[did]
      const overlay = uri ? alterEgoRecords?.[uri] : undefined
      return {
        avatar: overlay?.avatar,
        banner: overlay?.banner,
        displayName: overlay?.displayName,
        description: overlay?.description,
        handle: overlay?.handle,
      }
    })
  }, [dids, alterEgoByDid, alterEgoEnabled, alterEgoRecords])
}

export function useSetActiveAlterEgo() {
  const settings = useCrackSettings()
  const {update} = useCrackSettingsApi()
  return (did: string, uri: string | null, options?: {skipUri?: boolean}) => {
    const nextByDid = {...(settings.alterEgoByDid ?? {})}
    if (uri) {
      nextByDid[did] = uri
    } else {
      delete nextByDid[did]
    }
    const patch: Partial<CrackSettings> = {
      alterEgoByDid: nextByDid,
    }
    if (!options?.skipUri) {
      patch.alterEgoUri = uri ?? undefined
    }
    update(patch)
  }
}
