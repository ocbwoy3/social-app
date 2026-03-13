import {Fragment} from 'react'
import {type StyleProp, type ViewStyle} from 'react-native'
import {
  type ComAtprotoLabelDefs,
  type ModerationCause,
  type ModerationUI,
} from '@atproto/api'

import {getModerationCauseKey, unique} from '#/lib/moderation'
import {useCrackSettings} from '#/state/preferences'
import {
  ConsolidatedAccountLabels,
  isAccountLabelCause,
} from '#/components/moderation/crack/ConsolidatedAccountLabels'
import * as Pills from '#/components/Pills'

export function PostAlerts({
  modui,
  size = 'sm',
  style,
  additionalCauses,
  accountLabels,
}: {
  modui: ModerationUI
  size?: Pills.CommonProps['size']
  includeMute?: boolean
  style?: StyleProp<ViewStyle>
  additionalCauses?: ModerationCause[] | Pills.AppModerationCause[]
  accountLabels?: ComAtprotoLabelDefs.Label[]
}) {
  const {consolidateAccountLabels} = useCrackSettings()
  const causes = [
    ...modui.alerts.filter(unique),
    ...modui.informs.filter(unique),
    ...(additionalCauses ?? []),
  ]

  if (!causes.length) {
    return null
  }

  const accountLabelCauses = causes.filter((cause): cause is ModerationCause =>
    isAccountLabelCause(cause),
  )
  const seenAccountLabelerDids = new Set<string>()
  const uniqueAccountLabelCauses = accountLabelCauses.filter(cause => {
    if (seenAccountLabelerDids.has(cause.label.src)) {
      return false
    }
    seenAccountLabelerDids.add(cause.label.src)
    return true
  })
  const renderedCauses = causes.filter(cause => {
    if (!isAccountLabelCause(cause)) {
      return true
    }
    return uniqueAccountLabelCauses.includes(cause)
  })
  const previewAccountLabelCauses = uniqueAccountLabelCauses.slice(0, 2)
  const previewAccountLabelDids = previewAccountLabelCauses.map(
    cause => cause.label.src,
  )
  const normalizedAccountLabels = accountLabels?.filter(
    label => !label.val.startsWith('!'),
  )
  const accountLabelsForOverflow =
    normalizedAccountLabels && normalizedAccountLabels.length > 0
      ? normalizedAccountLabels
      : accountLabelCauses.map(cause => cause.label)
  const shouldConsolidate =
    consolidateAccountLabels &&
    causes.length > 3 &&
    accountLabelsForOverflow.length > 0

  return (
    <Pills.Row size={size} style={[size === 'sm' && {marginLeft: -3}, style]}>
      {shouldConsolidate ? (
        <>
          {(() => {
            const renderedPreviewDids = new Set<string>()
            const overflowCount =
              accountLabelsForOverflow.length - previewAccountLabelDids.length
            let renderedOverflow = false

            const items = causes.map(cause => {
              if (!isAccountLabelCause(cause)) {
                return (
                  <Pills.Label
                    key={getModerationCauseKey(cause)}
                    cause={cause}
                    size={size}
                    noBg={size === 'sm'}
                  />
                )
              }

              if (
                previewAccountLabelDids.includes(cause.label.src) &&
                !renderedPreviewDids.has(cause.label.src)
              ) {
                renderedPreviewDids.add(cause.label.src)
                const shouldRenderOverflowAfterPreview =
                  !renderedOverflow &&
                  overflowCount > 0 &&
                  renderedPreviewDids.size === previewAccountLabelDids.length
                if (shouldRenderOverflowAfterPreview) {
                  renderedOverflow = true
                }
                return (
                  <Fragment key={getModerationCauseKey(cause)}>
                    <Pills.Label
                      cause={cause}
                      size={size}
                      noBg={size === 'sm'}
                      textOverride=""
                    />
                    {shouldRenderOverflowAfterPreview ? (
                      <ConsolidatedAccountLabels
                        causes={previewAccountLabelCauses}
                        labels={accountLabelsForOverflow}
                        visibleCount={previewAccountLabelDids.length}
                        size={size}
                      />
                    ) : null}
                  </Fragment>
                )
              }

              return null
            })

            if (!renderedOverflow && overflowCount > 0) {
              items.push(
                <ConsolidatedAccountLabels
                  key="consolidated-account-labels"
                  causes={previewAccountLabelCauses}
                  labels={accountLabelsForOverflow}
                  visibleCount={previewAccountLabelDids.length}
                  size={size}
                />,
              )
            }

            return items
          })()}
        </>
      ) : (
        <>
          {renderedCauses.map(cause => (
            <Pills.Label
              key={getModerationCauseKey(cause)}
              cause={cause}
              size={size}
              noBg={size === 'sm'}
            />
          ))}
        </>
      )}
    </Pills.Row>
  )
}
