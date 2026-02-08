import {useCallback, useMemo} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, select, useTheme, utils, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useNuxDialogContext} from '#/components/dialogs/nuxs'
import {
  createIsEnabledCheck,
  isExistingUserAsOf,
} from '#/components/dialogs/nuxs/utils'
import {Beaker_Stroke2_Corner2_Rounded as BeakerIcon} from '#/components/icons/Beaker'
import {Text} from '#/components/Typography'
import {IS_E2E, IS_WEB} from '#/env'

export const enabled = createIsEnabledCheck(props => {
  return (
    !IS_E2E &&
    isExistingUserAsOf(
      '2026-02-08T00:00:00.000Z',
      props.currentProfile.createdAt,
    )
  )
})

export function CrackPronounsBetaNuxDialog() {
  const t = useTheme()
  const {_} = useLingui()
  const nuxDialogs = useNuxDialogContext()
  const control = Dialog.useDialogControl()

  Dialog.useAutoOpen(control)

  const onClose = useCallback(() => {
    nuxDialogs.dismissActiveNux()
  }, [nuxDialogs])

  const shadowColor = useMemo(() => {
    return select(t.name, {
      light: utils.alpha(t.palette.primary_900, 0.35),
      dark: utils.alpha(t.palette.primary_25, 0.35),
      dim: utils.alpha(t.palette.primary_25, 0.35),
    })
  }, [t])

  return (
    <Dialog.Outer
      control={control}
      onClose={onClose}
      nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle fill={t.palette.primary_700} />

      <Dialog.ScrollableInner
        label={_(msg`Add pronouns to your profile`)}
        style={[web({maxWidth: 440})]}
        contentContainerStyle={[
          {
            paddingTop: 0,
            paddingLeft: 0,
            paddingRight: 0,
          },
        ]}>
        <View
          style={[
            a.align_center,
            a.overflow_hidden,
            {
              gap: 16,
              paddingTop: IS_WEB ? 24 : 40,
              borderTopLeftRadius: a.rounded_md.borderRadius,
              borderTopRightRadius: a.rounded_md.borderRadius,
            },
          ]}>
          <LinearGradient
            colors={[
              t.palette.primary_100,
              utils.alpha(t.palette.primary_100, 0),
            ]}
            locations={[0, 1]}
            start={{x: 0, y: 0}}
            end={{x: 0, y: 1}}
            style={[a.absolute, a.inset_0]}
          />

          <View style={[a.flex_row, a.align_center, a.gap_xs]}>
            <BeakerIcon fill={t.palette.primary_700} size="sm" />
            <Text
              style={[
                a.font_semi_bold,
                {
                  color: t.palette.primary_700,
                },
              ]}>
              <Trans>Beta Feature</Trans>
            </Text>
          </View>

          <View
            style={[
              a.relative,
              a.w_full,
              {
                paddingTop: 8,
                paddingHorizontal: 32,
                paddingBottom: 32,
              },
            ]}>
            <View
              style={[
                {
                  borderRadius: 24,
                  padding: 16,
                  backgroundColor: '#ffffff',
                  // aspectRatio: 276 / 76,
                },
                IS_WEB
                  ? [
                      {
                        boxShadow: `0px 10px 15px -3px ${shadowColor}`,
                      },
                    ]
                  : [
                      t.atoms.shadow_md,
                      {
                        shadowColor,
                        shadowOpacity: 0.18,
                        shadowOffset: {
                          width: 0,
                          height: 10,
                        },
                      },
                    ],
              ]}>
              <Image
                accessibilityIgnoresInvertColors
                source={require('../../../../../assets/images/crack_pronouns_beta_nux.webp')}
                style={[
                  a.w_full,
                  {
                    aspectRatio: 276 / 76,
                  },
                ]}
                alt={_(
                  msg({
                    message:
                      'A screenshot of a profile header showing an account handle with pronouns displayed in parentheses.',
                  }),
                )}
              />
            </View>
          </View>
        </View>

        <View style={[a.align_center, a.px_xl, a.gap_2xl, a.pb_sm]}>
          <View style={[a.gap_sm, a.align_center]}>
            <Text
              style={[
                a.text_3xl,
                a.leading_tight,
                a.font_bold,
                a.text_center,
                {
                  fontSize: IS_WEB ? 28 : 32,
                  maxWidth: 360,
                },
              ]}>
              <Trans>Pronouns</Trans>
            </Text>
            <Text
              style={[
                a.text_md,
                a.leading_snug,
                a.text_center,
                {
                  maxWidth: 340,
                },
              ]}>
              <Trans>
                You can now add pronouns to your profile so that people know how
                to refer to you. You can edit or remove them anytime.
              </Trans>
            </Text>
          </View>

          {!IS_WEB && (
            <Button
              label={_(msg`Close`)}
              size="large"
              color="primary"
              onPress={() => {
                control.close()
              }}
              style={[a.w_full]}>
              <ButtonText>
                <Trans>Got it</Trans>
              </ButtonText>
            </Button>
          )}
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
