import {useRef} from 'react'

import {AccordionAnimation} from '#/lib/custom-animations/AccordionAnimation'
import {useCrackSettings} from '#/state/preferences'
import {useSuggestedFollowsByActorWithDismiss} from '#/state/queries/suggested-follows'
import {ProfileGrid} from '#/components/FeedInterstitials'
import {IS_ANDROID} from '#/env'

export function ProfileHeaderSuggestedFollows({
  isExpanded,
  actorDid,
  onRequestHide,
}: {
  isExpanded: boolean
  actorDid: string
  onRequestHide: () => void
}) {
  const {hideSuggestedAccounts} = useCrackSettings()
  const totalProfileCountRef = useRef(0)
  const {profiles, onDismiss, isLoading, error} =
    useSuggestedFollowsByActorWithDismiss({did: actorDid})

  if (hideSuggestedAccounts) return null
  if (profiles.length > totalProfileCountRef.current) {
    totalProfileCountRef.current = profiles.length
  }
  if (!profiles.length && !isLoading) return null

  /* NOTE (caidanw):
   * Android does not work well with this feature yet.
   * This issue stems from Android not allowing dragging on clickable elements in the profile header.
   * Blocking the ability to scroll on Android is too much of a trade-off for now.
   **/
  if (IS_ANDROID) return null

  return (
    <AccordionAnimation isExpanded={isExpanded}>
      <ProfileGrid
        isSuggestionsLoading={isLoading}
        profiles={profiles}
        totalProfileCount={totalProfileCountRef.current}
        error={error}
        viewContext="profileHeader"
        onDismiss={onDismiss}
        isVisible={isExpanded}
        onRequestHide={onRequestHide}
      />
    </AccordionAnimation>
  )
}
