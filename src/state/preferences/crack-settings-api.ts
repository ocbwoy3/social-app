import {type Schema} from '#/state/persisted/schema'
import {IS_WEB} from '#/env'

export type CrackSettings = NonNullable<Schema['crackSettings']>
export type CrackSettingKey = keyof CrackSettings

export const crackSettingsDefaults: CrackSettings = {
  kawaiiMode: false,
  showWelcomeModal: true,
  customVerificationsEnabled: false,
  uncapLabelerLimit: false,
  removeAppLabelers: false,
  hijackHideLabels: false,
  hideSuggestedAccounts: false,
  renamePostsToSkeets: false,
  expandProfileMetrics: false,
  alwaysShowGermDmButton: false,
  alterEgoEnabled: true,
  disableInlineComposer: false,
  alterEgoUri: undefined,
  alterEgoByDid: {},
  alterEgoRecords: {},
  statsigGateOverrides: {},
}

export type CrackSettingsToggleItem = {
  type: 'toggle'
  key: CrackSettingKey
  label: string
  description: string
}

export type CrackSettingsButtonItem = {
  type: 'button'
  id: string
  label: string
  description: string
  buttonLabel: string
}

export type CrackSettingsItem =
  | CrackSettingsToggleItem
  | CrackSettingsButtonItem

export type CrackSettingsItemWithPredicate = CrackSettingsItem & {
  predicate?: () => boolean
}

export type CrackSettingsSection = {
  id: string
  title: string
  description: string
  items: CrackSettingsItemWithPredicate[]
}

/**
 * Bluesky AppView's trusted verifiers
 * https://blu.ski/trusted
 */
export const APPVIEW_DEFAULT_VERIFIERS: string[] = [
  'did:plc:z72i7hdynmk6r22z27h6tvur', // Bluesky
  'did:plc:eclio37ymobqex2ncko63h4r', // The New York Times
  'did:plc:inz4fkbbp7ms3ixufw6xuvdi', // WIRED
  'did:plc:b2kutgxqlltwc6lhs724cfwr', // The Athletic
  'did:plc:wmho6q2uiyktkam3jsvrms3s', // NBC News
  'did:plc:sqbswn3lalcc2dlh2k7zdpuw', // Yahoo Finance
  'did:plc:y3xrmnwvkvsq4tqcsgwch4na', // The Globe and Mail
  'did:plc:d2jith367s6ybc3ldsusgdae', // Los Angeles Times
  'did:plc:dzezcmpb3fhcpns4n4xm4ur5', // CNN
  'did:plc:5u54z2qgkq43dh2nzwzdbbhb', // Financial Times
  'did:plc:xwqgusybtrpm67tcwqdfmzvy', // IGN
  'did:plc:k5nskatzhyxersjilvtnz4lh', // The Washington Post
  'did:plc:fivojrvylkim4nuo3pfqcf3k', // Microsoft

  // not listed in blu.ski:
  'did:plc:2w45zyhuklwihpdc7oj3mi63', // Forbes
  'did:plc:oxo226vi7t2btjokm2buusoy', // European Commision
]

/**
 * Labeler verifier negation list
 * (e.g. unverifying transphobic news outlets such as the new york times and washington post)
 */
export const LABELER_NEG_VERIFIERS: {[did: string]: string[]} = {
  // asukafield.xyz
  'did:plc:4ugewi6aca52a62u62jccbl7': [
    'did:plc:eclio37ymobqex2ncko63h4r', // nyt
    'did:plc:k5nskatzhyxersjilvtnz4lh', // washington post
  ],
}

export const crackSettingsSections: CrackSettingsSection[] = [
  {
    id: 'tools',
    title: 'Tools',
    description: 'Feature-specific tools and editors.',
    items: [
      {
        type: 'button',
        id: 'openVerificationSettings',
        label: 'Verification settings',
        description: 'Manage trusted verifiers and negations.',
        buttonLabel: 'Manage',
      },
      {
        type: 'button',
        id: 'openAlterEgo',
        label: 'Alter ego',
        description: 'Overlay a profile on top.',
        buttonLabel: 'Configure',
      },
    ],
  },
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Small visual tweaks.',
    items: [
      {
        type: 'toggle',
        key: 'kawaiiMode',
        label: 'Kawaii mode',
        description: 'Swap in the cute logo.',
      },
      {
        type: 'toggle',
        key: 'renamePostsToSkeets',
        label: 'Rename posts to skeets',
        description: 'Only affects English UI labels.',
      },
    ],
  },
  {
    id: 'profiles',
    title: 'Profiles',
    description: 'Profile and messaging tweaks.',
    items: [
      {
        type: 'toggle',
        key: 'hideSuggestedAccounts',
        label: 'Hide suggested follows',
        description: 'Declutter profiles.',
      },
      {
        type: 'toggle',
        key: 'expandProfileMetrics',
        label: 'Expand profile metrics',
        description: 'Show full counts like 1,284 instead of 1.2K.',
      },
      {
        type: 'toggle',
        key: 'alwaysShowGermDmButton',
        label: 'Always show Germ DM',
        description: 'Ignore the "Allow DMs from" option.',
      },
    ],
  },
  {
    id: 'feed',
    title: 'Feed',
    description: 'Timeline cleanup.',
    items: [
      {
        type: 'toggle',
        key: 'disableInlineComposer',
        label: 'Disable composer prompt',
        description: 'Declutter home.',
      },
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Power-user and protocol overrides.',
    items: [
      {
        type: 'toggle',
        key: 'hijackHideLabels',
        label: 'Bypass !hide',
        description: 'Lets you view hidden users and lists.',
      },
      {
        type: 'toggle',
        key: 'uncapLabelerLimit',
        label: 'Remove labeler limit',
        description: 'Remove 20 labeler limit. Might break the app.',
      },
      {
        type: 'toggle',
        key: 'removeAppLabelers',
        label: 'Unsubscribe from Bluesky Moderation',
        description: 'Disables AppLabelers on next app restart.',
      },
    ],
  },
  {
    id: 'nux',
    title: 'NUX',
    description: 'New user stuff',
    items: [
      {
        type: 'button',
        id: 'openSettingsHelpModal',
        label: 'Settings - Welcome',
        description: "What you'd see by default.",
        buttonLabel: 'Open',
      },
      {
        type: 'button',
        id: 'openWelcomeModal',
        label: 'Welcome',
        description: 'Web only',
        buttonLabel: 'Open',
        predicate: () => Boolean(IS_WEB),
      },
      {
        type: 'button',
        id: 'openNux:InitialVerificationAnnouncement',
        label: 'InitialVerificationAnnouncement',
        description: 'Open NUX dialog.',
        buttonLabel: 'Open',
      },
      {
        type: 'button',
        id: 'openNux:FindContactsAnnouncement',
        label: 'FindContactsAnnouncement',
        description: 'Open NUX dialog.',
        buttonLabel: 'Open',
      },
      {
        type: 'button',
        id: 'openNux:BookmarksAnnouncement',
        label: 'BookmarksAnnouncement',
        description: 'Open NUX dialog.',
        buttonLabel: 'Open',
      },
      {
        type: 'button',
        id: 'openNux:ActivitySubscriptions',
        label: 'ActivitySubscriptions',
        description: 'Open NUX dialog.',
        buttonLabel: 'Open',
      },
      {
        type: 'button',
        id: 'openNux:DraftsAnnouncement',
        label: 'DraftsAnnouncement',
        description: 'Open NUX dialog.',
        buttonLabel: 'Open',
      },
      {
        type: 'button',
        id: 'openNux:LiveNowBetaDialog',
        label: 'LiveNowBetaDialog',
        description: 'Open NUX dialog.',
        buttonLabel: 'Open',
      },
    ],
  },
  {
    id: 'statsig',
    title: 'Feature gates',
    description: 'Feature gate editor',
    items: [],
  },
]
