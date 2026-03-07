import type React from 'react'

import {Provider as AltTextRequiredProvider} from './alt-text-required'
import {Provider as AutoplayProvider} from './autoplay'
import {Provider as CrackSettingsProvider} from './crack-settings'
import {Provider as DisableHapticsProvider} from './disable-haptics'
import {Provider as ExternalEmbedsProvider} from './external-embeds-prefs'
import {Provider as HiddenPostsProvider} from './hidden-posts'
import {Provider as InAppBrowserProvider} from './in-app-browser'
import {Provider as KawaiiProvider} from './kawaii'
import {Provider as LanguagesProvider} from './languages'
import {Provider as LargeAltBadgeProvider} from './large-alt-badge'
import {Provider as SubtitlesProvider} from './subtitles'
import {Provider as TrendingSettingsProvider} from './trending'
import {Provider as UsedStarterPacksProvider} from './used-starter-packs'

export {
  useRequireAltTextEnabled,
  useSetRequireAltTextEnabled,
} from './alt-text-required'
export {useAutoplayDisabled, useSetAutoplayDisabled} from './autoplay'
export {useCrackSettings, useCrackSettingsApi} from './crack-settings'
export {
  type CrackSettingKey,
  type CrackSettings,
  type CrackSettingsButtonItem,
  crackSettingsDefaults,
  type CrackSettingsItem,
  type CrackSettingsSection,
  crackSettingsSections,
  type CrackSettingsToggleItem,
} from './crack-settings-api'
export {useHapticsDisabled, useSetHapticsDisabled} from './disable-haptics'
export {
  useExternalEmbedsPrefs,
  useSetExternalEmbedPref,
} from './external-embeds-prefs'
export * from './hidden-posts'
export {useLabelDefinitions} from './label-defs'
export {useLanguagePrefs, useLanguagePrefsApi} from './languages'
export {useSetSubtitlesEnabled, useSubtitlesEnabled} from './subtitles'

export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <CrackSettingsProvider>
      <LanguagesProvider>
        <AltTextRequiredProvider>
          <LargeAltBadgeProvider>
            <ExternalEmbedsProvider>
              <HiddenPostsProvider>
                <InAppBrowserProvider>
                  <DisableHapticsProvider>
                    <AutoplayProvider>
                      <UsedStarterPacksProvider>
                        <SubtitlesProvider>
                          <TrendingSettingsProvider>
                            <KawaiiProvider>{children}</KawaiiProvider>
                          </TrendingSettingsProvider>
                        </SubtitlesProvider>
                      </UsedStarterPacksProvider>
                    </AutoplayProvider>
                  </DisableHapticsProvider>
                </InAppBrowserProvider>
              </HiddenPostsProvider>
            </ExternalEmbedsProvider>
          </LargeAltBadgeProvider>
        </AltTextRequiredProvider>
      </LanguagesProvider>
    </CrackSettingsProvider>
  )
}
