import {type StyleProp, type TextStyle} from 'react-native'
import {type AppBskyActorGetProfile} from '@atproto/api'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {STALE} from '#/state/queries'
import {useProfileQuery} from '#/state/queries/profile'
import {atoms as a} from '#/alf'
import {AgField} from '#/components/crack/AgField'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {LoadingPlaceholder} from './LoadingPlaceholder'

export function UserInfoText({
  did,
  attr,
  failed,
  prefix,
  style,
}: {
  did: string
  attr?: keyof AppBskyActorGetProfile.OutputSchema
  loading?: string
  failed?: string
  prefix?: string
  style?: StyleProp<TextStyle>
}) {
  attr = attr || 'handle'
  failed = failed || 'user'

  const {data: profile, isError} = useProfileQuery({
    did,
    staleTime: STALE.INFINITY,
  })

  if (isError) {
    return (
      <Text style={style} numberOfLines={1}>
        {failed}
      </Text>
    )
  } else if (profile) {
    const fallbackText = sanitizeHandle(profile.handle)
    const rawValue =
      typeof profile[attr] === 'string' && profile[attr]
        ? (profile[attr] as string)
        : fallbackText
    const field =
      attr === 'displayName'
        ? 'displayName'
        : attr === 'handle'
          ? 'handle'
          : attr === 'description'
            ? 'description'
            : undefined

    const renderText = (value: string) => {
      const text = `${prefix || ''}${sanitizeDisplayName(value)}`
      return (
        <InlineLinkText
          emoji
          label={text}
          style={style}
          numberOfLines={1}
          to={makeProfileLink(profile)}>
          {text}
        </InlineLinkText>
      )
    }

    if (!field) {
      return renderText(rawValue)
    }

    return (
      <InlineLinkText
        emoji
        label={`${prefix || ''}${sanitizeDisplayName(rawValue)}`}
        style={style}
        numberOfLines={1}
        to={makeProfileLink(profile)}>
        <AgField field={field} value={rawValue} did={profile.did}>
          {value => `${prefix || ''}${sanitizeDisplayName(value)}`}
        </AgField>
      </InlineLinkText>
    )
  }

  // eslint-disable-next-line bsky-internal/avoid-unwrapped-text
  return (
    <LoadingPlaceholder
      width={80}
      height={8}
      style={[a.relative, {top: 1, left: 2}]}
    />
  )
}
