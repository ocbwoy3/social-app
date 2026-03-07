import {
  type ComponentType,
  Fragment,
  type ReactNode,
  useCallback,
  useEffect,
  useReducer,
} from 'react'
import {View} from 'react-native'
import {msg, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {
  type CommonNavigatorParams,
  type NavigationProp,
} from '#/lib/routes/types'
import {
  useSetStatsigGateOverride,
  useStatsigGateOverrides,
} from '#/state/crack/statsig-overrides'
import {
  emitOpenNuxDialog,
  emitOpenSettingsHelpModal,
  emitOpenWelcomeModal,
} from '#/state/events'
import {
  type CrackSettings,
  type CrackSettingsButtonItem,
  type CrackSettingsSection,
  crackSettingsSections,
  useCrackSettings,
  useCrackSettingsApi,
} from '#/state/preferences'
import {type Nux, nuxNames} from '#/state/queries/nuxs/definitions'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheckIcon} from '#/components/icons/CircleCheck'
import {CircleX_Stroke2_Corner0_Rounded as CircleXIcon} from '#/components/icons/CircleX'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Filter_Stroke2_Corner0_Rounded as FilterIcon} from '#/components/icons/Filter'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Window_Stroke2_Corner2_Rounded as WindowIcon} from '#/components/icons/Window'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {
  Features as GrowthbookFeatures,
  features as growthbook,
} from '#/analytics/features'
import {ShieldCheck_Stroke2_Corner0_Rounded as ShieldIcon} from '../icons/Shield'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'CrackSettings'>

type VisibleSection = CrackSettingsSection & {
  visibleItems: CrackSettingsSection['items']
}

type BadgeTone = 'accent' | 'default' | 'positive'

const sectionIcons: Record<string, ComponentType<SVGIconProps>> = {
  bluesky: SparkleIcon,
  atproto: ShieldIcon,
  nux: WindowIcon,
  statsig: FilterIcon,
}

export function CrackSettingsScreen({}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const settings = useCrackSettings()
  const {update} = useCrackSettingsApi()
  const navigation = useNavigation<NavigationProp>()

  const visibleSections: VisibleSection[] = crackSettingsSections.reduce(
    (acc, section) => {
      const visibleItems = section.items.filter(
        item => !item.predicate || item.predicate(),
      )
      if (!visibleItems.length && section.id !== 'statsig') return acc
      acc.push({
        ...section,
        visibleItems,
      })
      return acc
    },
    [] as VisibleSection[],
  )

  const enabledToggleCount = visibleSections.reduce((count, section) => {
    return (
      count +
      section.visibleItems.filter(
        item => item.type === 'toggle' && Boolean(settings[item.key]),
      ).length
    )
  }, 0)

  const actionCount = visibleSections.reduce((count, section) => {
    return count + section.visibleItems.filter(item => item.type === 'button').length
  }, 0)

  const gateOverrideCount = Object.keys(settings.statsigGateOverrides ?? {}).length

  const onToggleSetting = (key: keyof CrackSettings, value: boolean) => {
    update({[key]: value} as Partial<CrackSettings>)
  }

  const onPressButton = (item: CrackSettingsButtonItem) => {
    switch (item.id) {
      case 'openWelcomeModal':
        emitOpenWelcomeModal()
        break
      case 'openSettingsHelpModal':
        emitOpenSettingsHelpModal()
        break
      case 'openVerificationSettings':
        navigation.navigate('CrackVerificationSettings')
        break
      case 'openAlterEgo':
        navigation.navigate('CrackAlterEgoSettings')
        break
      default: {
        if (item.id.startsWith('openNux:')) {
          const rawId = item.id.replace('openNux:', '') as Nux
          if (nuxNames.has(rawId)) {
            emitOpenNuxDialog(rawId)
          }
        }
      }
    }
  }

  return (
    <Layout.Screen testID="crackSettingsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>TV Time</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <View style={[a.pt_2xl, a.px_lg, a.gap_xl, gtMobile && a.px_2xl]}>
          <View
            style={[
              a.rounded_lg,
              a.border,
              a.p_xl,
              a.gap_lg,
              t.atoms.bg,
              t.atoms.border_contrast_medium,
              t.atoms.shadow_sm,
            ]}>
            <View style={[a.gap_sm]}>
              <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
                <InlineBadge
                  label={_(msg`TV Time settings`)}
                  tone="accent"
                />
              </View>
              <Text
                style={[
                  a.text_xl,
                  a.font_bold,
                  a.leading_snug,
                  t.atoms.text_contrast_high,
                ]}>
                <Trans>
                  Tune the app without turning settings into a scavenger hunt.
                </Trans>
              </Text>
              <Text
                style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
                <Trans>
                  Everyday tweaks, power-user controls, and debug tools are split
                  into clearer groups so you can find what matters quickly.
                </Trans>
              </Text>
            </View>

            <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
              <MetricCard
                value={enabledToggleCount}
                label={_(msg`Enabled tweaks`)}
                tone="accent"
              />
              <MetricCard value={actionCount} label={_(msg`Tools`)} />
              <MetricCard
                value={gateOverrideCount}
                label={_(msg`Gate overrides`)}
              />
            </View>
          </View>

          <View style={[a.gap_xl]}>
            {visibleSections.map(section => {
              const Icon = sectionIcons[section.id] ?? WindowIcon

              return (
                <SectionPanel
                  key={section.id}
                  icon={Icon}
                  title={section.title}
                  description={getSectionDescription(section.id, _)}
                  summary={getSectionSummaryLabel({
                    _,
                    section,
                    settings,
                    gateOverrideCount,
                  })}>
                  {section.id === 'statsig' ? (
                    <FeatureGateOverrides />
                  ) : (
                    section.visibleItems.map((item, itemIndex) => (
                      <Fragment
                        key={item.type === 'toggle' ? item.key : item.id}>
                        {itemIndex > 0 && <Divider />}
                        {item.type === 'toggle' ? (
                          <ToggleRow
                            icon={getItemIcon(item)}
                            title={item.label}
                            description={item.description}
                            name={item.key}
                            value={Boolean(settings[item.key])}
                            onChange={next => onToggleSetting(item.key, next)}
                          />
                        ) : (
                          <ActionRow
                            icon={getItemIcon(item)}
                            title={item.label}
                            description={item.description}
                            buttonLabel={item.buttonLabel}
                            onPress={() => onPressButton(item)}
                          />
                        )}
                      </Fragment>
                    ))
                  )}
                </SectionPanel>
              )
            })}
          </View>
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}

function getSectionDescription(
  sectionId: string,
  _: ReturnType<typeof useLingui>['_'],
) {
  switch (sectionId) {
    case 'bluesky':
      return _(msg`Quality-of-life tweaks for the core app experience.`)
    case 'atproto':
      return _(
        msg`Protocol and moderation controls that can change how the app behaves.`,
      )
    case 'nux':
      return _(msg`Replay onboarding surfaces and first-run dialogs.`)
    case 'statsig':
      return _(msg`Local feature-flag overrides for testing and debugging.`)
    default:
      return ''
  }
}

function getSectionSummaryLabel({
  _,
  section,
  settings,
  gateOverrideCount,
}: {
  _: ReturnType<typeof useLingui>['_']
  section: VisibleSection
  settings: CrackSettings
  gateOverrideCount: number
}) {
  if (section.id === 'statsig') {
    return _(plural(gateOverrideCount, {one: '# override', other: '# overrides'}))
  }

  const enabledToggleCount = section.visibleItems.filter(
    item => item.type === 'toggle' && Boolean(settings[item.key]),
  ).length
  const toggleCount = section.visibleItems.filter(item => item.type === 'toggle').length
  const buttonCount = section.visibleItems.filter(item => item.type === 'button').length

  if (toggleCount > 0) {
    return _(plural(enabledToggleCount, {one: '# enabled', other: '# enabled'}))
  }

  return _(plural(buttonCount, {one: '# tool', other: '# tools'}))
}

function getItemIcon(item: CrackSettingsSection['items'][number]) {
  if (item.type === 'toggle') {
    if (item.key === 'kawaiiMode') return SparkleIcon
    if (item.key === 'customVerificationsEnabled') return CircleCheckIcon
    if (item.key === 'hijackHideLabels') return CircleXIcon
    if (item.key === 'uncapLabelerLimit') return ShieldIcon
    if (item.key === 'removeAppLabelers') return ShieldIcon
    return FilterIcon
  }

  if (item.id === 'openVerificationSettings') return CircleCheckIcon
  if (item.id === 'openAlterEgo') return SparkleIcon
  return WindowIcon
}

function SectionPanel({
  icon: Icon,
  title,
  description,
  summary,
  children,
}: {
  icon: ComponentType<SVGIconProps>
  title: string
  description: string
  summary?: string
  children: ReactNode
}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.rounded_lg,
        a.border,
        a.overflow_hidden,
        t.atoms.bg,
        t.atoms.border_contrast_low,
      ]}>
      <View
        style={[
          a.p_lg,
          a.gap_sm,
          {
            backgroundColor: t.palette.primary_25,
            borderBottomColor: t.palette.primary_100,
            borderBottomWidth: 1,
          },
        ]}>
        <View
          style={[a.flex_row, a.flex_wrap, a.align_center, a.justify_between, a.gap_md]}>
          <View style={[a.flex_row, a.align_center, a.gap_md, a.flex_1]}>
            <IconBadge icon={Icon} />
            <View style={[a.flex_1, a.gap_2xs]}>
              <Text
                style={[
                  a.text_md,
                  a.font_semi_bold,
                  a.leading_snug,
                  t.atoms.text_contrast_high,
                ]}>
                {title}
              </Text>
              <Text
                style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
                {description}
              </Text>
            </View>
          </View>

          {summary ? <InlineBadge label={summary} /> : null}
        </View>
      </View>

      <View style={[t.atoms.bg_contrast_25]}>{children}</View>
    </View>
  )
}

function MetricCard({
  value,
  label,
  tone = 'default',
}: {
  value: number
  label: string
  tone?: BadgeTone
}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.rounded_md,
        a.border,
        a.p_md,
        a.gap_2xs,
        tone === 'accent'
          ? {
              minWidth: 132,
              flexGrow: 1,
              backgroundColor: t.palette.primary_25,
              borderColor: t.palette.primary_100,
            }
          : [
              t.atoms.bg_contrast_25,
              t.atoms.border_contrast_low,
              {
                minWidth: 132,
                flexGrow: 1,
              },
            ],
      ]}>
      <Text
        style={[
          a.text_xl,
          a.font_bold,
          tone === 'accent'
            ? {color: t.palette.primary_700}
            : t.atoms.text_contrast_high,
        ]}>
        {value}
      </Text>
      <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
        {label}
      </Text>
    </View>
  )
}

function IconBadge({icon: Icon}: {icon: ComponentType<SVGIconProps>}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.align_center,
        a.justify_center,
        a.rounded_md,
        {
          width: 36,
          height: 36,
          backgroundColor: t.palette.primary_50,
        },
      ]}>
      <Icon size="md" style={{color: t.palette.primary_600}} />
    </View>
  )
}

function InlineBadge({
  label,
  tone = 'default',
}: {
  label: string
  tone?: BadgeTone
}) {
  const t = useTheme()

  const colors =
    tone === 'accent'
      ? {
          backgroundColor: t.palette.primary_50,
          borderColor: t.palette.primary_100,
          color: t.palette.primary_700,
        }
      : tone === 'positive'
        ? {
            backgroundColor: t.palette.positive_50,
            borderColor: t.palette.positive_100,
            color: t.palette.positive_700,
          }
        : {
            backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
            borderColor: t.atoms.border_contrast_low.borderColor,
            color: t.atoms.text_contrast_medium.color,
          }

  return (
    <View
      style={[
        a.rounded_full,
        a.border,
        a.px_sm,
        a.py_xs,
        a.self_start,
        colors,
      ]}>
      <Text style={[a.text_xs, a.font_semi_bold, {color: colors.color}]}>
        {label}
      </Text>
    </View>
  )
}

function ToggleRow({
  icon: Icon,
  title,
  description,
  name,
  value,
  onChange,
  disabled = false,
  status,
  statusTone = 'default',
}: {
  icon: ComponentType<SVGIconProps>
  title: string
  description: string
  name: string
  value: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  status?: string
  statusTone?: BadgeTone
}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.w_full,
        a.flex_row,
        a.align_start,
        a.justify_between,
        a.p_lg,
        a.gap_md,
      ]}>
      <View style={[a.flex_row, a.align_start, a.gap_md, a.flex_1]}>
        <IconBadge icon={Icon} />
        <View style={[a.flex_1, a.gap_xs]}>
          <View style={[a.flex_row, a.flex_wrap, a.align_center, a.gap_xs]}>
            <Text
              style={[
                a.text_md,
                a.font_semi_bold,
                a.leading_snug,
                t.atoms.text_contrast_high,
              ]}>
              {title}
            </Text>
            {status ? <InlineBadge label={status} tone={statusTone} /> : null}
          </View>
          {description ? (
            <Text
              style={[
                a.text_sm,
                a.leading_snug,
                t.atoms.text_contrast_medium,
              ]}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>

      <Toggle.Item
        label={title}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}>
        <Toggle.Switch />
      </Toggle.Item>
    </View>
  )
}

function ActionRow({
  icon: Icon,
  title,
  description,
  buttonLabel,
  onPress,
  disabled = false,
}: {
  icon: ComponentType<SVGIconProps>
  title: string
  description: string
  buttonLabel?: string
  onPress: () => void
  disabled?: boolean
}) {
  const t = useTheme()

  return (
    <Button
      label={title}
      variant="ghost"
      color="secondary"
      style={[a.w_full, a.bg_transparent]}
      onPress={onPress}
      disabled={disabled}>
      {state => (
        <View
          style={[
            a.w_full,
            a.flex_row,
            a.align_start,
            a.justify_between,
            a.p_lg,
            a.gap_md,
            !state.disabled &&
              (state.hovered || state.pressed) && [t.atoms.bg_contrast_50],
          ]}>
          <View style={[a.flex_row, a.align_start, a.gap_md, a.flex_1]}>
            <IconBadge icon={Icon} />
            <View style={[a.flex_1, a.gap_xs]}>
              <View style={[a.flex_row, a.flex_wrap, a.align_center, a.gap_xs]}>
                <Text
                  style={[
                    a.text_md,
                    a.font_semi_bold,
                    a.leading_snug,
                    t.atoms.text_contrast_high,
                  ]}>
                  {title}
                </Text>
                {buttonLabel ? (
                  <InlineBadge label={buttonLabel} tone="accent" />
                ) : null}
              </View>
              <Text
                style={[
                  a.text_sm,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                {description}
              </Text>
            </View>
          </View>

          <ChevronRight
            size="sm"
            style={[t.atoms.text_contrast_low, a.self_start, a.mt_sm]}
          />
        </View>
      )}
    </Button>
  )
}

// DO NOT ADD DESCRIPTION OR LABEL. USE RAW LABEL ONLY
const FEATURE_GATES: GrowthbookFeatures[] = [
  GrowthbookFeatures.DebugFeedContext,
  GrowthbookFeatures.IsBskyTeam,
  GrowthbookFeatures.ImportContactsOnboardingDisable,
  GrowthbookFeatures.ImportContactsSettingsDisable,
  GrowthbookFeatures.LiveNowBetaDisable,
]

function FeatureGateOverrides() {
  const {_} = useLingui()
  const t = useTheme()
  const overrides = useStatsigGateOverrides()
  const setOverride = useSetStatsigGateOverride()
  const {update} = useCrackSettingsApi()
  const [, forceUpdate] = useReducer(count => count + 1, 0)

  useEffect(() => {
    return growthbook.subscribe(() => {
      forceUpdate()
    })
  }, [])

  const gateOverrides = overrides ?? {}
  const hasOverrides = Object.keys(gateOverrides).length > 0

  const handleClearOverrides = useCallback(() => {
    update({statsigGateOverrides: {}})
  }, [update])

  const ax = useAnalytics()

  return (
    <View>
      <View style={[a.p_lg, a.pb_md]}>
        <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
          <Trans>
            Override remote feature flags locally, then clear them when you want
            to go back to default behavior.
          </Trans>
        </Text>
      </View>

      {FEATURE_GATES.map((gate, index) => {
        const value = ax.features.enabled(gate)
        const status = value ? _(msg`Enabled`) : _(msg`Disabled`)

        return (
          <Fragment key={gate}>
            <Divider />
            <ToggleRow
              icon={FilterIcon}
              title={gate}
              description=""
              status={status}
              statusTone={value ? 'positive' : 'default'}
              name={gate}
              value={value}
              onChange={next => setOverride(gate, next)}
            />
            {index === FEATURE_GATES.length - 1 ? <Divider /> : null}
          </Fragment>
        )
      })}

      <ActionRow
        icon={FilterIcon}
        title={_(msg`Clear gate overrides`)}
        description={_(msg`Revert to remote gate values.`)}
        buttonLabel={_(msg`Reset`)}
        onPress={handleClearOverrides}
        disabled={!hasOverrides}
      />
    </View>
  )
}
