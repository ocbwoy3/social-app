import {IS_E2E} from '#/env'
import {createIsEnabledCheck} from './utils'

export const isSettingsHowToAnnouncementEnabled = createIsEnabledCheck(() => {
  return !IS_E2E
})
