import {useEffect} from 'react'

import {useCrackSettings, useCrackSettingsApi} from '#/state/preferences'
import {features as growthbook} from '#/analytics/features'

type Gate = string

export function useStatsigGateOverrides(): Record<Gate, boolean> {
  const settings = useCrackSettings()
  return (settings.statsigGateOverrides ?? {}) as Record<Gate, boolean>
}

export function useSetStatsigGateOverride() {
  const settings = useCrackSettings()
  const {update} = useCrackSettingsApi()
  return (gate: Gate, value: boolean | null) => {
    const nextOverrides = {...(settings.statsigGateOverrides ?? {})} as Record<
      Gate,
      boolean
    >
    if (value === null) {
      delete nextOverrides[gate]
    } else {
      nextOverrides[gate] = value
    }
    update({statsigGateOverrides: nextOverrides})
  }
}

export function StatsigGateOverridesBootstrap() {
  const settings = useCrackSettings()

  useEffect(() => {
    const overrides = settings.statsigGateOverrides ?? {}
    const forced = new Map<string, boolean>()
    Object.entries(overrides).forEach(([gate, value]) => {
      forced.set(gate, value)
    })
    growthbook.setForcedFeatures(forced)
  }, [settings.statsigGateOverrides])

  return null
}
