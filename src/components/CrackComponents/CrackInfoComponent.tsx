import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {Logo} from '#/view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '../Typography'

export function CrackCreditsInfo({
  withThirdPartyNotice = true,
}: {
  withThirdPartyNotice?: boolean
}) {
  const t = useTheme()
  return (
    <View
      style={{
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 16,
        gap: withThirdPartyNotice ? 4 : 0,
      }}>
      <Logo width={96} style={[{paddingBottom: 16}]} />
      <Text style={[a.text_3xl]}>Bluesky on Crack</Text>
      {withThirdPartyNotice && (
        <Text style={[a.text_lg, withThirdPartyNotice && {paddingBottom: 16}]}>
          because why not
        </Text>
      )}
      <Text style={[a.text_sm, withThirdPartyNotice && {paddingBottom: 16}]}>
        by @kris.darkworld.download
      </Text>
      {withThirdPartyNotice && (
        <Text style={[a.text_center, t.atoms.text_contrast_low]}>
          <Trans>
            This is a third-party modification of Bluesky's Social App.
            <br />
            We claim no association with Bluesky Social PBC.
            <br />
            Use at your own risk.
          </Trans>
        </Text>
      )}
    </View>
  )
}
