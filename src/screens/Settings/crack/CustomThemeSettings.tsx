import {Pressable, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useCrackSettings, useCrackSettingsApi} from '#/state/preferences'
import {atoms as a, useTheme} from '#/alf'
import {
  BLACKSKY_PALETTE,
  BLUESKY_PALETTE,
  CATPPUCIN_PALETTE,
  type CustomThemeScheme,
  DEER_PALETTE,
  DEFAULT_PALETTE,
  EVERGARDEN_PALETTE,
  KITTY_PALETTE,
  REDDWARF_PALETTE,
  ZEPPELIN_PALETTE,
} from '#/alf/crack/customThemes'
import {ColorPalette_Stroke2_Corner0_Rounded as ColorPaletteIcon} from '#/components/icons/ColorPalette'
import {
  Heart2_Filled_Stroke2_Corner0_Rounded as HeartIconFilled,
  Heart2_Stroke2_Corner0_Rounded as HeartIconOutline,
} from '#/components/icons/Heart2'
import {Text} from '#/components/Typography'
import * as SettingsList from '../components/SettingsList'

type ColorSchemeOption = {
  name: CustomThemeScheme
  label: string
  primary: string
}

export function CustomThemeSettings() {
  const {_} = useLingui()
  const t = useTheme()
  const {customThemeScheme} = useCrackSettings()
  const {update} = useCrackSettingsApi()

  const colorSchemes: ColorSchemeOption[] = [
    {
      name: 'witchsky',
      label: _(msg`Witchsky`),
      primary: DEFAULT_PALETTE.primary_500,
    },
    {
      name: 'bluesky',
      label: _(msg`Bluesky`),
      primary: BLUESKY_PALETTE.primary_500,
    },
    {
      name: 'blacksky',
      label: _(msg`Blacksky`),
      primary: BLACKSKY_PALETTE.primary_500,
    },
    {
      name: 'deer',
      label: _(msg`Deer`),
      primary: DEER_PALETTE.primary_500,
    },
    {
      name: 'zeppelin',
      label: _(msg`Zeppelin`),
      primary: ZEPPELIN_PALETTE.primary_500,
    },
    {
      name: 'kitty',
      label: _(msg`Kitty`),
      primary: KITTY_PALETTE.primary_500,
    },
    {
      name: 'reddwarf',
      label: _(msg`Red Dwarf`),
      primary: REDDWARF_PALETTE.primary_500,
    },
    {
      name: 'catppuccin',
      label: _(msg`Catppuccin`),
      primary: CATPPUCIN_PALETTE.primary_500,
    },
    {
      name: 'evergarden',
      label: _(msg`Evergarden`),
      primary: EVERGARDEN_PALETTE.primary_500,
    },
  ]

  return (
    <SettingsList.Group>
      <SettingsList.ItemIcon icon={ColorPaletteIcon} />
      <SettingsList.ItemText>
        <Trans>Color Theme</Trans>
      </SettingsList.ItemText>
      <View style={[a.w_full, a.gap_md]}>
        <Text style={[a.flex_1, t.atoms.text_contrast_medium]}>
          <Trans>Choose which color scheme to use:</Trans>
        </Text>
        <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
          {colorSchemes.map(({name, label, primary}) => {
            const isSelected = customThemeScheme === name
            const HeartIcon = isSelected ? HeartIconFilled : HeartIconOutline
            return (
              <Pressable
                accessibilityRole="button"
                key={name}
                onPress={() => update({customThemeScheme: name})}
                style={[
                  a.flex_1,
                  a.rounded_md,
                  a.overflow_hidden,
                  {minWidth: '30%'},
                  a.border,
                  {
                    borderColor: isSelected
                      ? primary
                      : t.atoms.border_contrast_low.borderColor,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}>
                <View
                  style={[
                    a.p_sm,
                    a.gap_xs,
                    {backgroundColor: t.atoms.bg.backgroundColor},
                  ]}>
                  <View
                    style={[
                      a.w_full,
                      a.rounded_xs,
                      {backgroundColor: primary, height: 24},
                    ]}
                  />
                  <View
                    style={[
                      a.flex_row,
                      a.align_center,
                      a.justify_center,
                      a.gap_xs,
                    ]}>
                    <Text style={[a.text_sm, a.font_bold, t.atoms.text]}>
                      {label}
                    </Text>
                    <HeartIcon size="xs" style={[{color: primary}]} />
                  </View>
                </View>
              </Pressable>
            )
          })}
        </View>
      </View>
    </SettingsList.Group>
  )
}
