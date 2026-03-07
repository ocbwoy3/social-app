import {type BskyAgent} from '@atproto/api'

import {
  CRACK_SETTINGS_PREF_TYPE,
  type CrackSettingsPreference,
  validateCrackSettingsPreference,
} from '#/lib/crack/bsky-on-crack-settings'
import {logger} from '#/logger'
import {type CrackSettings} from '#/state/preferences'

const CRACK_SETTINGS_PREF_VERSION = 1

export function createCrackSettingsPreference(
  settings: CrackSettings,
): CrackSettingsPreference {
  return {
    $type: CRACK_SETTINGS_PREF_TYPE,
    version: CRACK_SETTINGS_PREF_VERSION,
    settings: {
      kawaiiMode: settings.kawaiiMode,
      showWelcomeModal: settings.showWelcomeModal,
      customVerificationsEnabled: settings.customVerificationsEnabled,
      uncapLabelerLimit: settings.uncapLabelerLimit,
      hijackHideLabels: settings.hijackHideLabels,
      hideSuggestedAccounts: settings.hideSuggestedAccounts,
      renamePostsToSkeets: settings.renamePostsToSkeets,
      expandProfileMetrics: settings.expandProfileMetrics,
      alterEgoEnabled: settings.alterEgoEnabled,
      alterEgoUri: settings.alterEgoUri,
      alterEgoByDid: Object.entries(settings.alterEgoByDid ?? {}).map(
        ([did, uri]) => ({did, uri}),
      ),
      alterEgoRecords: Object.values(settings.alterEgoRecords ?? {}),
      statsigGateOverrides: Object.entries(
        settings.statsigGateOverrides ?? {},
      ).map(([gate, value]) => ({gate, value})),
    },
  }
}

export function mergeCrackSettingsPreference(
  settings: CrackSettings,
  preference: CrackSettingsPreference,
): CrackSettings {
  const {settings: prefSettings} = preference
  const alterEgoByDid = prefSettings.alterEgoByDid
    ? Object.fromEntries(
        prefSettings.alterEgoByDid.map(entry => [entry.did, entry.uri]),
      )
    : settings.alterEgoByDid
  const alterEgoRecords = prefSettings.alterEgoRecords
    ? Object.fromEntries(
        prefSettings.alterEgoRecords.map(record => [record.uri, record]),
      )
    : settings.alterEgoRecords
  const statsigGateOverrides = prefSettings.statsigGateOverrides
    ? Object.fromEntries(
        prefSettings.statsigGateOverrides.map(entry => [
          entry.gate,
          entry.value,
        ]),
      )
    : settings.statsigGateOverrides

  return {
    ...settings,
    kawaiiMode: prefSettings.kawaiiMode ?? settings.kawaiiMode,
    showWelcomeModal:
      prefSettings.showWelcomeModal ?? settings.showWelcomeModal,
    customVerificationsEnabled:
      prefSettings.customVerificationsEnabled ??
      settings.customVerificationsEnabled,
    uncapLabelerLimit:
      prefSettings.uncapLabelerLimit ?? settings.uncapLabelerLimit,
    hijackHideLabels:
      prefSettings.hijackHideLabels ?? settings.hijackHideLabels,
    hideSuggestedAccounts:
      prefSettings.hideSuggestedAccounts ?? settings.hideSuggestedAccounts,
    renamePostsToSkeets:
      prefSettings.renamePostsToSkeets ?? settings.renamePostsToSkeets,
    expandProfileMetrics:
      prefSettings.expandProfileMetrics ?? settings.expandProfileMetrics,
    alterEgoEnabled: prefSettings.alterEgoEnabled ?? settings.alterEgoEnabled,
    alterEgoUri: prefSettings.alterEgoUri ?? settings.alterEgoUri,
    alterEgoByDid,
    alterEgoRecords,
    statsigGateOverrides,
  }
}

export async function fetchCrackSettingsPreference(agent: BskyAgent) {
  try {
    const res = await agent.app.bsky.actor.getPreferences({})
    const pref = res.data.preferences.find(
      preference => preference.$type === CRACK_SETTINGS_PREF_TYPE,
    )
    if (pref && validateCrackSettingsPreference(pref)) {
      return pref
    }
  } catch (error) {
    logger.error('Failed to fetch crack settings preference', {error})
  }
  return null
}

export async function putCrackSettingsPreference(
  agent: BskyAgent,
  preference: CrackSettingsPreference,
) {
  const res = await agent.app.bsky.actor.getPreferences({})
  const nextPreferences = res.data.preferences.filter(
    pref => pref.$type !== CRACK_SETTINGS_PREF_TYPE,
  )
  nextPreferences.push(preference)
  await agent.app.bsky.actor.putPreferences({
    preferences: nextPreferences,
  })
}
