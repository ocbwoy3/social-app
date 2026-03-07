import {View} from 'react-native'
import {type AppBskyActorDefs, type ModerationDecision} from '@atproto/api'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {type Shadow} from '#/state/cache/types'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {AgField} from '#/components/crack/AgField'
import {Text} from '#/components/Typography'

export function ProfileHeaderDisplayName({
  profile,
  moderation,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  moderation: ModerationDecision
}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  return (
    <View pointerEvents="none">
      <AgField
        field="displayName"
        value={profile.displayName}
        did={profile.did}>
        {displayNameValue => (
          <AgField field="handle" value={profile.handle} did={profile.did}>
            {handleValue => (
              <Text
                emoji
                testID="profileHeaderDisplayName"
                style={[
                  t.atoms.text,
                  gtMobile ? a.text_4xl : a.text_3xl,
                  a.self_start,
                  a.font_bold,
                ]}>
                {sanitizeDisplayName(
                  displayNameValue || sanitizeHandle(handleValue),
                  moderation.ui('displayName'),
                )}
              </Text>
            )}
          </AgField>
        )}
      </AgField>
    </View>
  )
}
