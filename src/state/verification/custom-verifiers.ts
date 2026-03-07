import {useCallback, useMemo} from 'react'

import {useCrackSettings} from '#/state/preferences'
import {LABELER_NEG_VERIFIERS} from '#/state/preferences/crack-settings-api'
import {useMyLabelersQuery} from '#/state/queries/preferences/moderation'
import {useSession} from '#/state/session'
import {clearCustomVerificationCache} from '#/state/verification/custom-verification'
import {account, useStorage} from '#/storage'

const FALLBACK_ACCOUNT_SCOPE = 'pwi'

export function useCustomVerificationEnabled() {
  const {customVerificationsEnabled} = useCrackSettings()
  return Boolean(customVerificationsEnabled)
}

export function useCustomVerificationTrustedList() {
  const {currentAccount} = useSession()
  const scope = currentAccount?.did ?? FALLBACK_ACCOUNT_SCOPE
  const [trusted = [], setTrusted] = useStorage(account, [
    scope,
    'trustedVerifiers',
  ] as const)

  const addTrusted = useCallback(
    (did: string) => {
      if (!did) return
      const next = new Set(trusted)
      next.add(did)
      setTrusted(Array.from(next))
      clearCustomVerificationCache()
    },
    [setTrusted, trusted],
  )

  const removeTrusted = useCallback(
    (did: string) => {
      setTrusted(trusted.filter(entry => entry !== did))
      clearCustomVerificationCache()
    },
    [setTrusted, trusted],
  )

  const toggleTrusted = useCallback(
    (did: string) => {
      if (trusted.includes(did)) {
        removeTrusted(did)
      } else {
        addTrusted(did)
      }
    },
    [addTrusted, removeTrusted, trusted],
  )

  const setTrustedList = useCallback(
    (next: string[]) => {
      setTrusted(next)
      clearCustomVerificationCache()
    },
    [setTrusted],
  )

  const clearTrusted = useCallback(() => {
    setTrustedList([])
  }, [setTrustedList])

  const trustedSet = useMemo(() => new Set(trusted), [trusted])

  return {
    trusted,
    trustedSet,
    addTrusted,
    removeTrusted,
    toggleTrusted,
    setTrustedList,
    clearTrusted,
  }
}

export function useCustomVerificationTrusted(mandatoryDid?: string) {
  const {trustedSet} = useCustomVerificationTrustedList()
  const labelers = useMyLabelersQuery()
  const negated = useMemo(() => {
    const next = new Set<string>()
    for (const labeler of labelers.data ?? []) {
      const negatedDids = LABELER_NEG_VERIFIERS[labeler.creator.did]
      if (!negatedDids?.length) continue
      negatedDids.forEach(did => next.add(did))
    }
    return next
  }, [labelers.data])

  return useMemo(() => {
    const next = new Set(
      Array.from(trustedSet).filter(did => !negated.has(did)),
    )
    if (mandatoryDid && !negated.has(mandatoryDid)) {
      next.add(mandatoryDid)
    }
    return next
  }, [mandatoryDid, trustedSet, negated])
}
