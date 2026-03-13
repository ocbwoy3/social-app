import {type AppBskyLabelerDefs} from '@atproto/api'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {z} from 'zod'

import {MAX_LABELERS} from '#/lib/constants'
import * as persisted from '#/state/persisted'
import {useCrackSettings} from '#/state/preferences'
import {
  PERSISTED_QUERY_GCTIME,
  PERSISTED_QUERY_ROOT,
  STALE,
} from '#/state/queries'
import {
  preferencesQueryKey,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'

const labelerInfoQueryKeyRoot = 'labeler-info'
export const labelerInfoQueryKey = (did: string) => [
  labelerInfoQueryKeyRoot,
  did,
]

const labelersInfoQueryKeyRoot = 'labelers-info'
export const labelersInfoQueryKey = (dids: string[]) => [
  labelersInfoQueryKeyRoot,
  dids.slice().sort(),
]

const persistedLabelersDetailedInfoQueryKey = (dids: string[]) => [
  PERSISTED_QUERY_ROOT,
  'labelers-detailed-info',
  dids,
]

function findCachedLabelerInfo(
  queryClient: ReturnType<typeof useQueryClient>,
  did: string,
) {
  const direct =
    queryClient.getQueryData<AppBskyLabelerDefs.LabelerViewDetailed>(
      labelerInfoQueryKey(did),
    )
  if (direct) {
    return direct
  }

  const detailedQueryDatas = queryClient.getQueriesData<
    AppBskyLabelerDefs.LabelerViewDetailed[]
  >({
    queryKey: [PERSISTED_QUERY_ROOT, 'labelers-detailed-info'],
  })
  for (const [_queryKey, queryData] of detailedQueryDatas) {
    const labeler = queryData?.find(view => view.creator.did === did)
    if (labeler) {
      queryClient.setQueryData(labelerInfoQueryKey(did), labeler)
      return labeler
    }
  }
}

function findCachedLabelersCoverage(
  queryClient: ReturnType<typeof useQueryClient>,
  dids: string[],
) {
  if (!dids.length) {
    return new Set<string>()
  }

  const detailedQueryDatas = queryClient.getQueriesData<
    AppBskyLabelerDefs.LabelerViewDetailed[]
  >({
    queryKey: [PERSISTED_QUERY_ROOT, 'labelers-detailed-info'],
  })

  for (const [queryKey, queryData] of detailedQueryDatas) {
    if (!queryData) {
      continue
    }

    const requestedDids = Array.isArray(queryKey) ? queryKey[2] : undefined
    if (!Array.isArray(requestedDids)) {
      continue
    }

    if (!dids.every(did => requestedDids.includes(did))) {
      continue
    }

    return new Set(queryData.map(view => view.creator.did))
  }
}

async function getOrFetchLabelerInfo({
  agent,
  queryClient,
  did,
}: {
  agent: ReturnType<typeof useAgent>
  queryClient: ReturnType<typeof useQueryClient>
  did: string
}) {
  const cached = findCachedLabelerInfo(queryClient, did)
  if (cached) {
    return cached
  }

  const res = await agent.app.bsky.labeler.getServices({
    dids: [did],
    detailed: true,
  })
  const labeler = res.data.views[0] as
    | AppBskyLabelerDefs.LabelerViewDetailed
    | undefined
  if (labeler) {
    queryClient.setQueryData(labelerInfoQueryKey(did), labeler)
  }
  return labeler
}

export function useLabelerInfoQuery({
  did,
  enabled,
}: {
  did?: string
  enabled?: boolean
}) {
  const agent = useAgent()
  return useQuery({
    enabled: !!did && enabled !== false,
    queryKey: labelerInfoQueryKey(did as string),
    queryFn: async () => {
      const res = await agent.app.bsky.labeler.getServices({
        dids: [did!],
        detailed: true,
      })
      return res.data.views[0] as AppBskyLabelerDefs.LabelerViewDetailed
    },
  })
}

export function useLabelersInfoQuery({dids}: {dids: string[]}) {
  const agent = useAgent()
  return useQuery({
    enabled: !!dids.length,
    queryKey: labelersInfoQueryKey(dids),
    queryFn: async () => {
      const res = await agent.app.bsky.labeler.getServices({dids})
      return res.data.views as AppBskyLabelerDefs.LabelerView[]
    },
  })
}

export function useLabelersDetailedInfoQuery({dids}: {dids: string[]}) {
  const agent = useAgent()
  const queryClient = useQueryClient()
  return useQuery({
    enabled: !!dids.length,
    queryKey: persistedLabelersDetailedInfoQueryKey(dids),
    gcTime: PERSISTED_QUERY_GCTIME,
    staleTime: STALE.MINUTES.ONE,
    queryFn: async () => {
      const res = await agent.app.bsky.labeler.getServices({
        dids,
        detailed: true,
      })
      const views = res.data.views as AppBskyLabelerDefs.LabelerViewDetailed[]
      for (const view of views) {
        queryClient.setQueryData(labelerInfoQueryKey(view.creator.did), view)
      }
      return views
    },
  })
}

export function useRemoveLabelersMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()

  return useMutation({
    async mutationFn({dids}: {dids: string[]}) {
      await Promise.all(dids.map(did => agent.removeLabeler(did)))
    },
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}

export function useLabelerSubscriptionMutation() {
  const queryClient = useQueryClient()
  const agent = useAgent()
  const preferences = usePreferencesQuery()
  const {uncapLabelerLimit} = useCrackSettings()

  return useMutation({
    async mutationFn({did, subscribe}: {did: string; subscribe: boolean}) {
      const allowUncapped =
        uncapLabelerLimit ||
        persisted.get('crackSettings')?.uncapLabelerLimit === true

      // TODO
      z.object({
        did: z.string(),
        subscribe: z.boolean(),
      }).parse({did, subscribe})

      /**
       * If a user has invalid/takendown/deactivated labelers, we need to
       * remove them. We don't have a great way to do this atm on the server,
       * so we do it here.
       *
       * We also need to push validation into this method, since we need to
       * check {@link MAX_LABELERS} _after_ we've removed invalid or takendown
       * labelers.
       */
      const labelerDids = (
        preferences.data?.moderationPrefs?.labelers ?? []
      ).map(l => l.did)
      const cachedLabelerCoverage = findCachedLabelersCoverage(
        queryClient,
        labelerDids,
      )
      const invalidLabelers = cachedLabelerCoverage
        ? labelerDids.filter(did => !cachedLabelerCoverage.has(did))
        : []
      if (invalidLabelers.length) {
        await Promise.all(invalidLabelers.map(did => agent.removeLabeler(did)))
      }

      if (subscribe) {
        const labeler = await getOrFetchLabelerInfo({agent, queryClient, did})
        if (!labeler) {
          throw new Error('LABELER_NOT_FOUND')
        }

        const labelerCount = labelerDids.length - invalidLabelers.length
        if (!allowUncapped && labelerCount >= MAX_LABELERS) {
          throw new Error('MAX_LABELERS')
        }
        await agent.addLabeler(did)
      } else {
        await agent.removeLabeler(did)
      }
    },
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}
