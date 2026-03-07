import {Fragment, useMemo} from 'react'
import {View} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {type AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {useQuery} from '@tanstack/react-query'
import chunk from 'lodash.chunk'

import {makeProfileLink} from '#/lib/routes/links'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useAlterEgoProfileFields} from '#/state/crack/alter-ego'
import {useCrackSettings, useCrackSettingsApi} from '#/state/preferences'
import {
  APPVIEW_DEFAULT_VERIFIERS,
  LABELER_NEG_VERIFIERS,
} from '#/state/preferences/crack-settings-api'
import {useMyLabelersQuery} from '#/state/queries/preferences/moderation'
import {useAgent, useSession} from '#/state/session'
import {useCustomVerificationTrustedList} from '#/state/verification/custom-verifiers'
import * as Toast from '#/view/com/util/Toast'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import * as Layout from '#/components/Layout'
import {InlineLinkText, Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {AgField} from '../crack/AgField'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'CrackVerificationSettings'
>

type ProfileMap = Map<string, AppBskyActorDefs.ProfileViewDetailed>

const QUERY_KEY_ROOT = 'custom-verifier-profiles'

export function CrackVerificationSettingsScreen({}: Props) {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const agent = useAgent()
  const {currentAccount} = useSession()
  const {trusted, setTrustedList, addTrusted, removeTrusted} =
    useCustomVerificationTrustedList()
  const {customVerificationsEnabled} = useCrackSettings()
  const {update} = useCrackSettingsApi()
  const labelers = useMyLabelersQuery()

  const orderedVerifierDids = useMemo(() => trusted, [trusted])

  const profilesQuery = useQuery<ProfileMap>({
    enabled: orderedVerifierDids.length > 0,
    queryKey: [QUERY_KEY_ROOT, orderedVerifierDids],
    queryFn: async (): Promise<ProfileMap> => {
      const profilesByDid: ProfileMap = new Map()
      for (const didChunk of chunk(orderedVerifierDids, 25)) {
        const res = await agent.getProfiles({actors: didChunk})
        for (const profile of res.data.profiles) {
          profilesByDid.set(profile.did, profile)
        }
      }
      return profilesByDid
    },
  })

  const negatedByMap = useMemo(() => {
    const map = new Map<
      string,
      Array<{did: string; handle: string; handleRaw?: string}>
    >()

    for (const labeler of labelers.data ?? []) {
      const negated = LABELER_NEG_VERIFIERS[labeler.creator.did]
      if (!negated?.length) continue

      const handleRaw = labeler.creator.handle
      const handle = handleRaw
        ? sanitizeHandle(handleRaw, '') // <-- keep ''
        : labeler.creator.did

      for (const did of negated) {
        const existing = map.get(did) ?? []
        map.set(did, [
          ...existing,
          {did: labeler.creator.did, handle, handleRaw},
        ])
      }
    }

    return map
  }, [labelers.data])

  const canCopy = trusted.length > 0

  const onCopyDids = async () => {
    if (!trusted.length) return
    await Clipboard.setStringAsync(trusted.join('\n'))
    Toast.show(_(msg`Copied verifier DIDs to clipboard`))
  }

  const onResetList = () => {
    setTrustedList([...APPVIEW_DEFAULT_VERIFIERS])
    Toast.show(_(msg`Reset trusted verifiers to defaults`))
  }

  return (
    <Layout.Screen testID="crackVerificationSettingsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Verification settings</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <View style={[a.pt_2xl, a.px_lg, gtMobile && a.px_2xl]}>
          <Text
            style={[a.text_md, a.font_semi_bold, t.atoms.text_contrast_high]}>
            <Trans>Verification settings</Trans>
          </Text>

          <View
            style={[
              a.w_full,
              a.rounded_md,
              a.overflow_hidden,
              t.atoms.bg_contrast_25,
              a.mt_lg,
            ]}>
            <ToggleRow
              title={_(msg`Use custom verifiers`)}
              description={_(
                msg`Use your own trusted verifiers instead of defaults.`,
              )}
              name="customVerificationsEnabled"
              value={Boolean(customVerificationsEnabled)}
              onChange={next => update({customVerificationsEnabled: next})}
            />
            <Divider />
            <ToggleRow
              title={_(msg`Become a trusted verifier`)}
              description={_(
                msg`Add your account to your trusted verifier list.`,
              )}
              name="becomeTrustedVerifier"
              value={Boolean(
                currentAccount?.did && trusted.includes(currentAccount.did),
              )}
              disabled={!currentAccount?.did}
              onChange={next => {
                if (!currentAccount?.did) return
                next
                  ? addTrusted(currentAccount.did)
                  : removeTrusted(currentAccount.did)
              }}
            />
          </View>

          <View
            style={[
              a.flex_row,
              a.align_center,
              a.justify_between,
              a.gap_md,
              a.pt_2xl,
            ]}>
            <Text
              style={[a.text_md, a.font_semi_bold, t.atoms.text_contrast_high]}>
              <Trans>Trusted verifiers</Trans>
            </Text>
            <View style={[a.flex_row, a.align_center, a.gap_sm]}>
              <Button
                label="Copy DIDs"
                size="tiny"
                shape="rectangular"
                variant="outline"
                color="secondary"
                disabled={!canCopy}
                onPress={onCopyDids}>
                <ButtonText>
                  <Trans>Copy DIDs</Trans>
                </ButtonText>
              </Button>
              <Button
                label="Reset to AppView defaults"
                size="tiny"
                shape="rectangular"
                variant="outline"
                color="secondary"
                onPress={onResetList}>
                <ButtonText>
                  <Trans>Reset to AppView defaults</Trans>
                </ButtonText>
              </Button>
            </View>
          </View>

          <View
            style={[
              a.w_full,
              a.rounded_md,
              a.overflow_hidden,
              t.atoms.bg_contrast_25,
              a.mt_lg,
            ]}>
            {orderedVerifierDids.length === 0 ? (
              <View style={[a.p_lg]}>
                <Text style={[t.atoms.text_contrast_medium]}>
                  <Trans>No trusted verifiers yet.</Trans>
                </Text>
              </View>
            ) : (
              orderedVerifierDids.map((did, index) => (
                <TrustedVerifierRow
                  key={did}
                  did={did}
                  index={index}
                  profilesQuery={profilesQuery}
                  negatedByMap={negatedByMap}
                />
              ))
            )}
          </View>
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}

function TrustedVerifierRow({
  did,
  index,
  profilesQuery,
  negatedByMap,
}: {
  did: string
  index: number
  profilesQuery: ReturnType<typeof useQuery<ProfileMap>>
  negatedByMap: Map<string, any[]>
}) {
  const t = useTheme()
  const profile = profilesQuery?.data?.get(did)
  const displayProfile = useAlterEgoProfileFields({did})

  const handle = profile?.handle ?? did
  const safeHandle = profile?.handle
    ? sanitizeHandle(profile.handle, '')
    : handle
  const displayName = profile?.displayName?.trim() || safeHandle
  const negatedBy = negatedByMap.get(did)

  const to = makeProfileLink({
    did,
    handle: profile?.handle ?? did,
  })

  return (
    <Fragment>
      {index > 0 && <Divider />}
      <Link label={displayName} to={to}>
        {state => (
          <View
            style={[
              a.w_full,
              a.flex_row,
              a.align_center,
              a.justify_between,
              a.p_lg,
              a.gap_sm,
              (state.hovered || state.pressed) && t.atoms.bg_contrast_50,
            ]}>
            <View style={[a.flex_row, a.align_center, a.gap_md, a.flex_1]}>
              <UserAvatar
                type="user"
                size={40}
                avatar={displayProfile.avatar ?? profile?.avatar}
              />
              <View style={[a.flex_1, a.gap_2xs]}>
                <Text style={[a.text_md, a.font_semi_bold]}>
                  <AgField field="displayName" value={displayName} did={did} />
                </Text>

                {negatedBy?.length ? (
                  <Text style={[a.text_sm, a.flex_wrap]}>
                    <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                      {safeHandle}
                    </Text>
                    {' · '}
                    <Text
                      style={{color: t.palette.negative_600, paddingRight: 3}}>
                      <Trans>Negated by</Trans>
                    </Text>
                    {negatedBy.map((entry, i) => {
                      const toNegator = makeProfileLink({
                        did: entry.did,
                        handle: entry.handleRaw ?? entry.did,
                      })
                      return (
                        <Fragment key={entry.did}>
                          {i > 0 && <Text>, </Text>}
                          <InlineLinkText
                            to={toNegator}
                            label={entry.handle}
                            style={{color: t.palette.primary_500}}>
                            @
                            <AgField
                              field="handle"
                              value={entry.handle}
                              did={entry.did}
                            />
                          </InlineLinkText>
                        </Fragment>
                      )
                    })}
                  </Text>
                ) : (
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    {safeHandle}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}
      </Link>
    </Fragment>
  )
}

function ToggleRow({
  title,
  description,
  name,
  value,
  disabled,
  onChange,
}: {
  title: string
  description: string
  name: string
  value: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.w_full,
        a.flex_row,
        a.align_center,
        a.justify_between,
        a.p_lg,
        a.gap_sm,
      ]}>
      <View style={[a.flex_1, a.gap_2xs]}>
        <Text style={[a.text_md, a.font_semi_bold]}>{title}</Text>
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          {description}
        </Text>
      </View>
      <Toggle.Item
        label={title}
        name={name}
        value={value}
        disabled={disabled}
        onChange={onChange}>
        <Toggle.Switch />
      </Toggle.Item>
    </View>
  )
}
