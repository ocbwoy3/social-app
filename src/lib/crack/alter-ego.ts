import {AtUri} from '@atproto/api'
import {type BlobRef} from '@atproto/lex-data'
import {Lexicons} from '@atproto/lexicon'

const lex = new Lexicons()

// update from BlueskyOnCrack/lexicon
lex.add({
  id: 'dev.ocbwoy3.crack.alterego',
  defs: {
    main: {
      key: 'tid',
      type: 'record',
      record: {
        type: 'object',
        required: [],
        properties: {
          avatar: {
            type: 'blob',
            accept: ['image/png', 'image/jpeg'],
            maxSize: 1048576,
            description: 'New profile picture',
          },
          banner: {
            type: 'blob',
            accept: ['image/png', 'image/jpeg'],
            maxSize: 1048576,
            description: 'New profile banner',
          },
          handle: {
            type: 'string',
            maxLength: 64,
            minLength: 1,
            description:
              'New profile handle (e.g. spamton.bigshot), can have ANY DOMAIN.',
          },
          description: {
            type: 'string',
            maxLength: 3000,
            description: 'New profile bio (e.g. [[#1 Rated Salesman1997]])',
          },
          displayName: {
            type: 'string',
            maxLength: 64,
            minLength: 1,
            description: 'New display name (e.g. Spamton G. Spamton)',
          },
        },
      },
      description: 'An alter ego profile record for use on "Bluesky on Crack".',
    },
  },
  lexicon: 1,
})

export const ALTER_EGO_COLLECTION = 'dev.ocbwoy3.crack.alterego'

export type AlterEgoRecord = {
  avatar?: BlobRef
  banner?: BlobRef
  handle?: string
  description?: string
  displayName?: string
}

export type AlterEgoProfileOverlay = {
  uri: string
  avatar?: string
  banner?: string
  handle?: string
  description?: string
  displayName?: string
}

export function parseAlterEgoUri(uri: string): {
  repo: string
  rkey: string
} | null {
  try {
    const parsed = new AtUri(uri)
    if (parsed.collection !== ALTER_EGO_COLLECTION || !parsed.rkey) {
      return null
    }
    return {repo: parsed.host, rkey: parsed.rkey}
  } catch {
    return null
  }
}

export function validateAlterEgoRecord(
  record: unknown,
): record is AlterEgoRecord {
  try {
    lex.assertValidRecord(ALTER_EGO_COLLECTION, record)
  } catch {
    return false
  }
  return true
}

export function applyAlterEgoProfile<
  T extends {
    handle: string
    avatar?: string
    banner?: string
    displayName?: string
    description?: string
  },
>(profile: T, overlay: AlterEgoProfileOverlay): T {
  return {
    ...profile,
    avatar: overlay.avatar ?? profile.avatar,
    banner: overlay.banner ?? profile.banner,
    displayName: overlay.displayName ?? profile.displayName,
    description: overlay.description ?? profile.description,
    handle: overlay.handle ?? profile.handle,
  }
}
