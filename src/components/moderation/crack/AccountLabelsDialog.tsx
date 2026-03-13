import {View} from 'react-native'
import {type ComAtprotoLabelDefs} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {useLabelInfo} from '#/lib/moderation/useLabelInfo'
import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeHandle} from '#/lib/strings/handles'
import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

export interface AccountLabelsDialogProps {
  control: Dialog.DialogOuterProps['control']
  labels: ComAtprotoLabelDefs.Label[]
}

export function AccountLabelsDialog(props: AccountLabelsDialogProps) {
  return (
    <Dialog.Outer
      control={props.control}
      nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <AccountLabelsDialogInner {...props} />
    </Dialog.Outer>
  )
}

function AccountLabelsDialogInner({control, labels}: AccountLabelsDialogProps) {
  const {_} = useLingui()

  return (
    <Dialog.ScrollableInner
      label={_(msg`The following labels were applied to this account.`)}>
      <Text style={[a.text_2xl, a.font_bold, a.pb_xs, a.leading_tight]}>
        <Trans>Labels on this account</Trans>
      </Text>
      <Text style={[a.text_md, a.leading_snug]}>
        <Trans>The following labels were applied to this account.</Trans>
      </Text>

      <View style={[a.py_lg, a.gap_md]}>
        {labels.map(label => (
          <AccountLabelCard
            key={`${label.val}-${label.src}`}
            control={control}
            label={label}
          />
        ))}
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

function AccountLabelCard({
  control,
  label,
}: {
  control: Dialog.DialogOuterProps['control']
  label: ComAtprotoLabelDefs.Label
}) {
  const t = useTheme()
  const {labeler, strings} = useLabelInfo(label)
  const timeDiff = useGetTimeAgo({future: true})
  const isSelfLabel = label.src === label.uri
  const sourceName = labeler
    ? sanitizeHandle(labeler.creator.handle, '@')
    : label.src

  return (
    <View
      style={[
        a.border,
        t.atoms.border_contrast_low,
        a.rounded_sm,
        a.overflow_hidden,
      ]}>
      <View style={[a.p_md, a.gap_sm, a.flex_row]}>
        <View style={[a.flex_1, a.gap_xs]}>
          <Text emoji style={[a.font_semi_bold, a.text_md]}>
            {strings.name}
          </Text>
          <Text emoji style={[t.atoms.text_contrast_medium, a.leading_snug]}>
            {strings.description}
          </Text>
        </View>
      </View>

      <Divider />

      <View style={[a.px_md, a.py_sm, t.atoms.bg_contrast_25]}>
        {isSelfLabel ? (
          <Text style={[t.atoms.text_contrast_medium]}>
            <Trans>This label was applied by this account.</Trans>
          </Text>
        ) : (
          <View
            style={[
              a.flex_row,
              a.justify_between,
              a.gap_xl,
              {paddingBottom: 1},
            ]}>
            <Text
              style={[a.flex_1, a.leading_snug, t.atoms.text_contrast_medium]}
              numberOfLines={1}>
              <Trans>
                Source:{' '}
                <InlineLinkText
                  label={sourceName}
                  to={makeProfileLink(
                    labeler ? labeler.creator : {did: label.src, handle: ''},
                  )}
                  onPress={() => control.close()}>
                  {sourceName}
                </InlineLinkText>
              </Trans>
            </Text>
            {label.exp && (
              <View>
                <Text
                  style={[
                    a.leading_snug,
                    a.text_sm,
                    a.italic,
                    t.atoms.text_contrast_medium,
                  ]}>
                  <Trans>Expires in {timeDiff(Date.now(), label.exp)}</Trans>
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  )
}
