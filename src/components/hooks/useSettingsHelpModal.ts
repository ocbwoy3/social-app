import {useCallback, useEffect, useMemo, useRef} from 'react'

import {listenOpenSettingsHelpModal} from '#/state/events'
import {useSession} from '#/state/session'
import {useDialogControl} from '#/components/Dialog'
import {account, useStorage} from '#/storage'

const FALLBACK_ACCOUNT_SCOPE = 'pwi'

export function useSettingsHelpModal() {
  const {hasSession, currentAccount} = useSession()
  const control = useDialogControl()
  const scope = currentAccount?.did ?? FALLBACK_ACCOUNT_SCOPE
  const [seen = false, setSeen] = useStorage(account, [
    scope,
    'settingsHelpSeen',
  ] as const)
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    hasTriggeredRef.current = false
  }, [scope])

  useEffect(() => {
    if (hasSession && !seen && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true
      const timer = setTimeout(() => {
        control.open()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [control, hasSession, seen])

  const close = useCallback(
    (cb?: () => void) => {
      setSeen(true)
      control.close(cb)
    },
    [control, setSeen],
  )

  const open = useCallback(() => {
    control.open()
  }, [control])

  useEffect(() => {
    return listenOpenSettingsHelpModal(() => open())
  }, [open])

  return useMemo(
    () => ({
      ...control,
      open,
      close,
    }),
    [control, open, close],
  )
}
