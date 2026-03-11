import {View} from 'react-native'

import {Logo} from '#/view/icons/Logo'
import {Logotype} from '#/view/icons/Logotype'
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
      <Logo width={128} style={[{paddingBottom: 16}]} />
      {/* <Text style={[a.text_3xl]}>It's TV Time!</Text> */}
      <Logotype width={128} />
      <Text style={[a.text_sm, withThirdPartyNotice && {paddingBottom: 16}]}>
        Of course Kris did it
      </Text>
      {withThirdPartyNotice && (
        <Text style={[a.text_center, t.atoms.text_contrast_low]}>
          Third-party Bluesky fork, use at your own risk.
        </Text>
      )}
    </View>
  )
}
