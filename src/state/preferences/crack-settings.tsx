import React from 'react'

import {parseAlterEgoUri} from '#/lib/crack/alter-ego'
import * as persisted from '#/state/persisted'
import {
  type CrackSettings,
  crackSettingsDefaults,
} from '#/state/preferences/crack-settings-api'
import {IS_WEB} from '#/env'

const defaultSettings = crackSettingsDefaults

const stateContext = React.createContext<CrackSettings>(defaultSettings)
stateContext.displayName = 'CrackSettingsStateContext'

const apiContext = React.createContext<{
  set: (next: CrackSettings) => void
  update: (patch: Partial<CrackSettings>) => void
}>({
  set: () => {},
  update: () => {},
})
apiContext.displayName = 'CrackSettingsApiContext'

function resolveSettings(settings?: persisted.Schema['crackSettings']) {
  const legacyKawaii = persisted.get('kawaii')
  const alterEgoByDid = {...(settings?.alterEgoByDid ?? {})}
  const alterEgoRecords = {...(settings?.alterEgoRecords ?? {})}
  if (
    settings?.alterEgoUri &&
    Object.keys(alterEgoByDid).length === 0 &&
    !alterEgoRecords[settings.alterEgoUri]
  ) {
    const parsed = parseAlterEgoUri(settings.alterEgoUri)
    if (parsed) {
      alterEgoByDid[parsed.repo] = settings.alterEgoUri
    }
  }
  return {
    ...defaultSettings,
    ...settings,
    kawaiiMode:
      settings?.kawaiiMode ??
      (typeof legacyKawaii === 'boolean'
        ? legacyKawaii
        : defaultSettings.kawaiiMode),
    alterEgoByDid,
    alterEgoRecords,
  }
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState<CrackSettings>(() =>
    resolveSettings(persisted.get('crackSettings')),
  )
  const persistState = React.useCallback(
    (next: CrackSettings) => {
      setState(next)
      persisted.write('crackSettings', next)
      if (typeof next.kawaiiMode === 'boolean') {
        persisted.write('kawaii', next.kawaiiMode)
      }
    },
    [setState],
  )

  const queueRemoteSync = React.useCallback((_next: CrackSettings) => {}, [])

  const set = React.useCallback(
    (next: CrackSettings) => {
      persistState(next)
      queueRemoteSync(next)
    },
    [persistState, queueRemoteSync],
  )

  const update = React.useCallback(
    (patch: Partial<CrackSettings>) => {
      setState(prev => {
        const next = {...prev, ...patch}
        persisted.write('crackSettings', next)
        if (typeof next.kawaiiMode === 'boolean') {
          persisted.write('kawaii', next.kawaiiMode)
        }
        queueRemoteSync(next)
        return next
      })
    },
    [queueRemoteSync],
  )

  React.useEffect(() => {
    return persisted.onUpdate('crackSettings', next => {
      setState(resolveSettings(next))
    })
  }, [])

  React.useEffect(() => {
    if (!persisted.get('crackSettings')) {
      persistState(resolveSettings(undefined))
    }
  }, [persistState])

  React.useEffect(() => {
    if (!IS_WEB || typeof window === 'undefined') return
    const kawaiiParam = new URLSearchParams(window.location.search).get(
      'kawaii',
    )
    if (kawaiiParam === 'true' || kawaiiParam === 'false') {
      update({kawaiiMode: kawaiiParam === 'true'})
    }
  }, [update])

  const api = React.useMemo(() => ({set, update}), [set, update])

  return (
    <stateContext.Provider value={state}>
      <apiContext.Provider value={api}>{children}</apiContext.Provider>
    </stateContext.Provider>
  )
}

export function useCrackSettings() {
  return React.useContext(stateContext)
}

export function useCrackSettingsApi() {
  return React.useContext(apiContext)
}
