import {useEffect, useMemo, useState} from 'react'
import {type AppBskyActorDefs} from '@atproto/api'
import {TID} from '@atproto/common-web'
import EventEmitter from 'eventemitter3'

import {logger} from '#/logger'
import {useSession} from '#/state/session'
import type * as bsky from '#/types/bsky'
import {
  useCustomVerificationEnabled,
  useCustomVerificationTrusted,
} from './custom-verifiers'

export const DEFAULT_CONSTELLATION_INSTANCE =
  'https://constellation.microcosm.blue'

type ConstellationLink = {
  did: string
  collection: string
  rkey: string
}

type ConstellationLinksResponse = {
  linking_records?: ConstellationLink[]
  cursor?: string | null
}

const verificationStateCache = new Map<
  string,
  AppBskyActorDefs.VerificationState
>()
const verificationStateInFlight = new Map<
  string,
  Promise<AppBskyActorDefs.VerificationState>
>()
const verificationCacheIndex = new Map<string, Set<string>>()
const verificationCacheEmitter = new EventEmitter()

function emitVerificationCacheUpdate(did?: string) {
  verificationCacheEmitter.emit('update', did ?? '*')
}

export function clearCustomVerificationCache() {
  verificationStateCache.clear()
  verificationStateInFlight.clear()
  verificationCacheIndex.clear()
  emitVerificationCacheUpdate()
}

export function clearCustomVerificationCacheForProfile(did: string) {
  const keys = verificationCacheIndex.get(did)
  if (!keys) return
  for (const key of keys) {
    verificationStateCache.delete(key)
    verificationStateInFlight.delete(key)
  }
  verificationCacheIndex.delete(did)
  emitVerificationCacheUpdate(did)
}

function buildRecordUri(link: ConstellationLink) {
  return `at://${link.did}/${link.collection}/${link.rkey}`
}

async function* constellationLinks({
  instance,
  params,
}: {
  instance: string
  params: {
    target: string
    collection: string
    path: string
    from_dids?: string[]
    did?: string
  }
}) {
  const base = instance.endsWith('/') ? instance : `${instance}/`
  let cursor: string | null | undefined

  do {
    const url = new URL('links', base)
    const search = new URLSearchParams()
    search.set('target', params.target)
    search.set('collection', params.collection)
    search.set('path', params.path)
    if (params.from_dids?.length) {
      params.from_dids.forEach(did => search.append('did', did))
    }
    if (params.did) {
      search.set('did', params.did)
    }
    if (cursor) {
      search.set('cursor', cursor)
    }
    url.search = search.toString()

    const res = await fetch(url.toString())
    if (!res.ok) {
      throw new Error(`Constellation request failed: ${res.status}`)
    }
    const data = (await res.json()) as ConstellationLinksResponse
    for (const link of data.linking_records ?? []) {
      yield link
    }
    cursor = data.cursor
  } while (cursor)
}

async function getTrustedConstellationVerifications({
  instance,
  did,
  trusted,
}: {
  instance: string
  did: string
  trusted: Set<string>
}): Promise<ConstellationLink[]> {
  if (!trusted.size) return []
  const linkedRecords = new Map<string, ConstellationLink>()
  const trustedList = Array.from(trusted)
  const batchSize = 50

  const batches: string[][] = []
  for (let i = 0; i < trustedList.length; i += batchSize) {
    batches.push(trustedList.slice(i, i + batchSize))
  }

  await Promise.all(
    batches.map(async batch => {
      const links = constellationLinks({
        instance,
        params: {
          target: did,
          collection: 'app.bsky.graph.verification',
          path: '.subject',
          from_dids: batch,
        },
      })

      for await (const link of links) {
        if (!trusted.has(link.did)) continue
        linkedRecords.set(`${link.did}:${link.collection}:${link.rkey}`, link)
      }
    }),
  )

  return Array.from(linkedRecords.values())
}

function createdAtFromRkey(rkey: string) {
  if (TID.is(rkey)) {
    const micros = TID.fromStr(rkey).timestamp()
    return new Date(Math.floor(micros / 1000)).toISOString()
  }
  // Constellation links do not include createdAt; use a deterministic fallback.
  return new Date(0).toISOString()
}

function createVerificationViews(
  linkedRecords: ConstellationLink[],
): AppBskyActorDefs.VerificationView[] {
  return linkedRecords.map(link => ({
    issuer: link.did,
    isValid: true,
    createdAt: createdAtFromRkey(link.rkey),
    uri: buildRecordUri(link),
  }))
}

function createVerificationState(
  verifications: AppBskyActorDefs.VerificationView[],
  profile: bsky.profile.AnyProfileView,
  trusted: Set<string>,
): AppBskyActorDefs.VerificationState {
  const verifiedStatus =
    verifications.length > 0
      ? verifications.findIndex(v => v.isValid) !== -1
        ? 'valid'
        : 'invalid'
      : 'none'
  const trustedVerifierStatus = trusted.has(profile.did) ? 'valid' : 'none'
  return {
    $type: 'app.bsky.actor.defs#verificationState',
    verifications,
    verifiedStatus,
    trustedVerifierStatus,
  }
}

export function applyOptimisticCustomVerificationState({
  profile,
  trusted,
  verification,
}: {
  profile: bsky.profile.AnyProfileView
  trusted: Set<string>
  verification: AppBskyActorDefs.VerificationView
}): AppBskyActorDefs.VerificationState | undefined {
  if (!trusted.has(verification.issuer)) return
  const customKey = createStateCacheKey(profile, trusted)
  if (!customKey) return
  const existing = verificationStateCache.get(customKey)?.verifications ?? []
  const next = existing.some(v => v.uri === verification.uri)
    ? existing
    : [...existing, verification]
  next.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const nextState = createVerificationState(next, profile, trusted)
  verificationStateCache.set(customKey, nextState)
  indexCacheKey(profile.did, customKey)
  emitVerificationCacheUpdate(profile.did)
  return nextState
}

export async function fetchCustomVerificationState({
  profile,
  trusted,
  instance = DEFAULT_CONSTELLATION_INSTANCE,
}: {
  profile: bsky.profile.AnyProfileView
  trusted: Set<string>
  instance?: string
}): Promise<AppBskyActorDefs.VerificationState> {
  const linkedRecords = await getTrustedConstellationVerifications({
    instance,
    did: profile.did,
    trusted,
  })
  const verifications = createVerificationViews(linkedRecords).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
  return createVerificationState(verifications, profile, trusted)
}

function createTrustedKey(trusted: Set<string>) {
  return Array.from(trusted).sort().join(',')
}

function createStateCacheKey(
  profile: bsky.profile.AnyProfileView,
  trusted: Set<string>,
) {
  const displayName = profile.displayName ?? ''
  return `${profile.did}|${profile.handle}|${displayName}|${createTrustedKey(
    trusted,
  )}`
}

function indexCacheKey(profileDid: string, key: string) {
  const existing = verificationCacheIndex.get(profileDid)
  if (existing) {
    existing.add(key)
  } else {
    verificationCacheIndex.set(profileDid, new Set([key]))
  }
}

export function useVerificationState(profile?: bsky.profile.AnyProfileView) {
  const customEnabled = useCustomVerificationEnabled()
  const {currentAccount} = useSession()
  const trusted = useCustomVerificationTrusted(
    customEnabled ? currentAccount?.did : undefined,
  )
  const [state, setState] = useState<AppBskyActorDefs.VerificationState>()
  const [isLoading, setIsLoading] = useState(false)
  const [cacheBuster, setCacheBuster] = useState(0)

  const customKey = useMemo(() => {
    if (!customEnabled || !profile) return undefined
    return createStateCacheKey(profile, trusted)
  }, [customEnabled, profile, trusted])

  useEffect(() => {
    if (!profile) return
    function onCacheUpdate(did: string) {
      //@ts-expect-error
      if (did === profile.did || did === '*') {
        setCacheBuster(value => value + 1)
      }
    }
    verificationCacheEmitter.addListener('update', onCacheUpdate)
    return () => {
      verificationCacheEmitter.removeListener('update', onCacheUpdate)
    }
  }, [profile])

  useEffect(() => {
    if (!customEnabled || !profile) {
      setState(undefined)
      setIsLoading(false)
      return
    }

    if (!trusted.size) {
      setState(createVerificationState([], profile, trusted))
      setIsLoading(false)
      return
    }

    if (customKey && verificationStateCache.has(customKey)) {
      setState(verificationStateCache.get(customKey))
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setState(createVerificationState([], profile, trusted))

    const inFlight =
      customKey && verificationStateInFlight.get(customKey)
        ? verificationStateInFlight.get(customKey)
        : fetchCustomVerificationState({
            profile,
            trusted,
          })

    if (customKey && inFlight) {
      verificationStateInFlight.set(customKey, inFlight)
    }

    //@ts-expect-error
    inFlight
      .then(nextState => {
        if (cancelled) return
        if (customKey) {
          verificationStateCache.set(customKey, nextState)
          indexCacheKey(profile.did, customKey)
        }
        setState(nextState)
      })
      .catch(error => {
        logger.error('Failed to load custom verifications', {
          safeMessage: error,
          did: profile.did,
        })
        if (!cancelled) {
          setState(
            profile.verification ??
              createVerificationState([], profile, trusted),
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
        if (customKey) {
          verificationStateInFlight.delete(customKey)
        }
      })

    return () => {
      cancelled = true
    }
  }, [customEnabled, customKey, profile, trusted, cacheBuster])

  if (!customEnabled) {
    return {state: profile?.verification, isCustom: false, isLoading: false}
  }

  return {state, isCustom: true, isLoading}
}
