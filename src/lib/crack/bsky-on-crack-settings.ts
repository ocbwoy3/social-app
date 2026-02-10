import {Lexicons} from '@atproto/lexicon'

const lex = new Lexicons()

// update from BlueskyOnCrack/lexicon
lex.add({
  id: 'dev.ocbwoy3.crack.defs',
  defs: {
    bskyOnCrackSettings: {
      type: 'record',
      record: {
        type: 'object',
        description: 'Private preferences for Bluesky on Crack.',
        required: ['version', 'settings'],
        properties: {
          version: {
            type: 'integer',
            minimum: 1,
          },
          settings: {
            // TODO: Fix
            // @ts-expect-error Type '"object"' is not assignable to type
            type: 'object',
            properties: {
              kawaiiMode: {
                type: 'boolean',
              },
              showWelcomeModal: {
                type: 'boolean',
              },
              customVerificationsEnabled: {
                type: 'boolean',
              },
              uncapLabelerLimit: {
                type: 'boolean',
              },
              hijackHideLabels: {
                type: 'boolean',
              },
              hideSuggestedAccounts: {
                type: 'boolean',
              },
              alterEgoEnabled: {
                type: 'boolean',
              },
              alterEgoUri: {
                type: 'string',
                format: 'at-uri',
              },
              alterEgoByDid: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['did', 'uri'],
                  properties: {
                    did: {
                      type: 'string',
                      format: 'did',
                    },
                    uri: {
                      type: 'string',
                      format: 'at-uri',
                    },
                  },
                },
              },
              alterEgoRecords: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['uri'],
                  properties: {
                    uri: {
                      type: 'string',
                      format: 'at-uri',
                    },
                    avatar: {
                      type: 'string',
                    },
                    banner: {
                      type: 'string',
                    },
                    handle: {
                      type: 'string',
                    },
                    description: {
                      type: 'string',
                    },
                    displayName: {
                      type: 'string',
                    },
                  },
                },
              },
              statsigGateOverrides: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['gate', 'value'],
                  properties: {
                    gate: {
                      type: 'string',
                    },
                    value: {
                      type: 'boolean',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  lexicon: 1,
})

export const CRACK_SETTINGS_PREF_TYPE =
  'dev.ocbwoy3.crack#bskyOnCrackSettings' as const

export type CrackSettingsPreference = {
  $type: typeof CRACK_SETTINGS_PREF_TYPE
  version: number
  settings: {
    kawaiiMode?: boolean
    showWelcomeModal?: boolean
    customVerificationsEnabled?: boolean
    uncapLabelerLimit?: boolean
    hijackHideLabels?: boolean
    hideSuggestedAccounts?: boolean
    alterEgoEnabled?: boolean
    alterEgoUri?: string
    alterEgoByDid?: Array<{did: string; uri: string}>
    alterEgoRecords?: Array<{
      uri: string
      avatar?: string
      banner?: string
      handle?: string
      description?: string
      displayName?: string
    }>
    statsigGateOverrides?: Array<{gate: string; value: boolean}>
  }
}

export function validateCrackSettingsPreference(
  record: unknown,
): record is CrackSettingsPreference {
  try {
    const result = lex.validate(CRACK_SETTINGS_PREF_TYPE, record)
    return result.success
  } catch {
    return false
  }
}
