import {
  type ComponentType,
  Fragment,
  type ReactNode,
  useCallback,
  useEffect,
  useReducer,
} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
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
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
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

type VisibleItem = VisibleSection['visibleItems'][number]

type SectionGroup = {
  id: string
  title: string
  description?: string
  items: VisibleItem[]
}

const sectionIcons: Record<string, ComponentType<SVGIconProps>> = {
  bluesky: SparkleIcon,
  atproto: ShieldIcon,
  nux: WindowIcon,
  statsig: FilterIcon,
}

export function CrackSettingsScreen({}: Props) {
  const {_} = useLingui()
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
        <SettingsList.Container>
          {visibleSections.map((section, sectionIndex) => {
            const Icon = sectionIcons[section.id] ?? WindowIcon

            return (
              <View key={section.id}>
                {sectionIndex > 0 && <SettingsList.Divider style={[a.my_md]} />}
                <SectionHeader
                  icon={Icon}
                  title={section.title}
                  description={getSectionDescription(section.id, _)}
                />

                {section.id === 'statsig' ? (
                  <FeatureGateOverrides />
                ) : (
                  getSectionGroups(section, _).map((group, groupIndex) => (
                    <View key={group.id}>
                      {groupIndex > 0 && <SettingsList.Divider />}
                      <SubcategoryHeader
                        title={group.title}
                        description={group.description}
                      />

                      {group.items.map((item, itemIndex) => (
                        <Fragment key={getItemId(item)}>
                          {itemIndex > 0 && <SettingsList.Divider />}
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
                              onPress={() => onPressButton(item)}
                            />
                          )}
                        </Fragment>
                      ))}
                    </View>
                  ))
                )}
              </View>
            )
          })}
        </SettingsList.Container>
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

function getSectionGroups(
  section: VisibleSection,
  _: ReturnType<typeof useLingui>['_'],
): SectionGroup[] {
  switch (section.id) {
    case 'bluesky':
      return buildSectionGroups(section.visibleItems, [
        {
          id: 'look-and-feel',
          title: _(msg`Look and feel`),
          description: _(msg`Branding, language, and profile readouts.`),
          itemIds: ['kawaiiMode', 'renamePostsToSkeets', 'expandProfileMetrics'],
        },
        {
          id: 'feed-and-profile',
          title: _(msg`Feed and profile`),
          description: _(msg`Reduce visual noise in the main app surfaces.`),
          itemIds: ['hideSuggestedAccounts', 'disableInlineComposer'],
        },
        {
          id: 'power-tools',
          title: _(msg`Power tools`),
          description: _(msg`Overrides and profile-layer extras.`),
          itemIds: ['alwaysShowGermDmButton', 'hijackHideLabels', 'openAlterEgo'],
        },
      ])
    case 'atproto':
      return buildSectionGroups(section.visibleItems, [
        {
          id: 'moderation',
          title: _(msg`Moderation setup`),
          description: _(msg`Choose which verifier and labeler systems you trust.`),
          itemIds: ['openVerificationSettings', 'removeAppLabelers'],
        },
        {
          id: 'limits',
          title: _(msg`Limits`),
          description: _(msg`Remove protocol-side caps when you need to test edge cases.`),
          itemIds: ['uncapLabelerLimit'],
        },
      ])
    case 'nux':
      return buildSectionGroups(section.visibleItems, [
        {
          id: 'welcome',
          title: _(msg`Welcome surfaces`),
          description: _(msg`Replay the main introductory entry points.`),
          itemIds: ['openSettingsHelpModal', 'openWelcomeModal'],
        },
        {
          id: 'announcements',
          title: _(msg`Announcements`),
          description: _(msg`Open specific onboarding and release dialogs directly.`),
          itemIds: [
            'openNux:InitialVerificationAnnouncement',
            'openNux:FindContactsAnnouncement',
            'openNux:BookmarksAnnouncement',
            'openNux:ActivitySubscriptions',
            'openNux:DraftsAnnouncement',
            'openNux:LiveNowBetaDialog',
          ],
        },
      ])
    default:
      return [
        {
          id: `${section.id}-default`,
          title: section.title,
          items: section.visibleItems,
        },
      ]
  }
}

function buildSectionGroups(
  items: VisibleItem[],
  groups: Array<{
    id: string
    title: string
    description?: string
    itemIds: string[]
  }>,
): SectionGroup[] {
  return groups
    .map(group => ({
      id: group.id,
      title: group.title,
      description: group.description,
      items: items.filter(item => group.itemIds.includes(getItemId(item))),
    }))
    .filter(group => group.items.length > 0)
}

function getItemId(item: VisibleItem) {
  return item.type === 'toggle' ? item.key : item.id
}

function getItemIcon(item: VisibleItem) {
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

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<SVGIconProps>
  title: string
  description?: string
}) {
  const t = useTheme()

  return (
    <View style={[a.px_xl, a.pb_sm, a.gap_2xs]}>
      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        <Icon width={20} style={{color: t.atoms.text_contrast_medium.color}} />
        <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>{title}</Text>
      </View>
      {description ? (
        <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
          {description}
        </Text>
      ) : null}
    </View>
  )
}

function SubcategoryHeader({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  const t = useTheme()

  return (
    <View style={[a.px_xl, a.pt_xs, a.pb_sm, a.gap_2xs]}>
      <Text
        style={[a.text_sm, a.font_semi_bold, a.leading_snug, t.atoms.text]}>
        {title}
      </Text>
      {description ? (
        <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
          {description}
        </Text>
      ) : null}
    </View>
  )
}

function SettingBody({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  const t = useTheme()

  return (
    <View style={[a.flex_1, a.gap_2xs]}>
      <Text style={[a.text_md, a.leading_snug, t.atoms.text]}>{title}</Text>
      {description ? (
        <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
          {description}
        </Text>
      ) : null}
      {children}
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
}: {
  icon: ComponentType<SVGIconProps>
  title: string
  description: string
  name: string
  value: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  status?: string
}) {
  const t = useTheme()

  return (
    <SettingsList.Item style={[a.align_start]}>
      <SettingsList.ItemIcon icon={Icon} color={t.atoms.text_contrast_medium.color} />
      <SettingBody title={title} description={description}>
        {status ? (
          <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
            {status}
          </Text>
        ) : null}
      </SettingBody>
      <Toggle.Item
        label={title}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}>
        <Toggle.Switch />
      </Toggle.Item>
    </SettingsList.Item>
  )
}

function ActionRow({
  icon: Icon,
  title,
  description,
  onPress,
  disabled = false,
}: {
  icon: ComponentType<SVGIconProps>
  title: string
  description: string
  onPress: () => void
  disabled?: boolean
}) {
  const t = useTheme()

  return (
    <SettingsList.PressableItem
      label={title}
      onPress={onPress}
      disabled={disabled}
      contentContainerStyle={[a.align_start]}>
      <SettingsList.ItemIcon icon={Icon} color={t.atoms.text_contrast_medium.color} />
      <SettingBody title={title} description={description} />
      <SettingsList.Chevron />
    </SettingsList.PressableItem>
  )
}

const FEATURE_GATES: GrowthbookFeatures[] = [
  GrowthbookFeatures.DebugFeedContext,
  GrowthbookFeatures.IsBskyTeam,
  GrowthbookFeatures.ImportContactsOnboardingDisable,
  GrowthbookFeatures.ImportContactsSettingsDisable,
  GrowthbookFeatures.LiveNowBetaDisable,
]

function FeatureGateOverrides() {
  const {_} = useLingui()
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
      <SubcategoryHeader
        title={_(msg`Overrides`)}
        description={_(
          msg`Override remote feature flags locally, then clear them to return to default behavior.`,
        )}
      />

      {FEATURE_GATES.map((gate, index) => {
        const value = ax.features.enabled(gate)
        const status = value ? _(msg`Enabled`) : _(msg`Disabled`)

        return (
          <Fragment key={gate}>
            {index > 0 && <SettingsList.Divider />}
            <ToggleRow
              icon={FilterIcon}
              title={gate}
              description=""
              status={status}
              name={gate}
              value={value}
              onChange={next => setOverride(gate, next)}
            />
          </Fragment>
        )
      })}

      <SettingsList.Divider />
      <ActionRow
        icon={FilterIcon}
        title={_(msg`Clear gate overrides`)}
        description={_(msg`Revert to remote gate values.`)}
        onPress={handleClearOverrides}
        disabled={!hasOverrides}
      />
    </View>
  )
}
