import {View} from 'react-native'
import {Image} from 'expo-image'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

export {useDialogControl} from '#/components/Dialog'

export function SettingsHowToDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Inner control={control} />
      <Dialog.Close />
    </Dialog.Outer>
  )
}

function Inner({control}: {control: Dialog.DialogControlProps}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const label = _(msg`Welcome! Please read!`)

  return (
    <Dialog.ScrollableInner
      label={label}
      style={[
        gtMobile ? {width: 'auto', maxWidth: 400, minWidth: 200} : a.w_full,
      ]}>
      <View style={[a.gap_lg]}>
        <View
          style={[
            a.w_full,
            a.rounded_md,
            a.overflow_hidden,
            t.atoms.bg_contrast_25,
            {minHeight: 100},
          ]}>
          <Image
            accessibilityIgnoresInvertColors
            source={require('../../../assets/images/bigshot_settins_nux.gif')}
            style={[
              {
                aspectRatio: 450 / 544, // <-- do not change this
              },
            ]}
            alt={_(
              msg`An animated illustration showing how to open Crack Settings on Desktop.`,
            )}
          />
        </View>
        <View style={[a.gap_sm]}>
          <Text
            style={[a.text_2xl, a.font_semi_bold, a.pr_4xl, a.leading_tight]}>
            {label}
          </Text>
          <Text
            style={[
              a.text_md,
              a.leading_snug,
              t.atoms.text_contrast_medium,
              a.italic,
            ]}>
            {/**
             * Plz tell kris to stop putting deltarune references everywhere PLEASE!!!!
             * wait.. is the alter ego name a deltarune reference too???
             */}
            <Trans>
              This app is basically just Bluesky, but on steroids. Ascend into
              the magical realm that is the AT Protocol, and you'll finally have
              a chance at being a [[BIG SHOT]]! Just like Spamton!
            </Trans>
          </Text>
          <Text style={[a.text_md, a.leading_snug]}>
            <Trans>
              Jokes (and Deltarune references) aside, at its core, this is still
              the same Bluesky, just with a couple of extra features. Think of
              it as like Vencord or similar.
            </Trans>
          </Text>
        </View>
        <View
          style={[
            a.w_full,
            a.gap_sm,
            a.justify_end,
            gtMobile ? [a.flex_row, a.justify_end] : [a.flex_col],
          ]}>
          <Button
            label={_(msg`Close dialog`)}
            size="small"
            variant="solid"
            color="secondary"
            onPress={() => {
              control.close()
            }}>
            <ButtonText>
              <Trans>Close</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
