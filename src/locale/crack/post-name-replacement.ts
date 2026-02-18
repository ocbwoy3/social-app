import {type Messages} from '@lingui/core'

import {AppLanguage} from '#/locale/languages'
import * as persisted from '#/state/persisted'

function replaceInString(text: string): string {
  return text
    .replaceAll('Posts', 'Skeets')
    .replaceAll('posts', 'skeets')
    .replaceAll('Post', 'Skeet')
    .replaceAll('post', 'skeet')
}

function replaceInValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return replaceInString(value)
  }

  if (Array.isArray(value)) {
    return value.map(replaceInValue)
  }

  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, nestedValue] of Object.entries(value)) {
      out[key] = replaceInValue(nestedValue)
    }
    return out
  }

  return value
}

export function applyPostNameReplacements(
  messages: Messages,
  locale: AppLanguage,
): Messages {
  const isEnglish = locale === AppLanguage.en || locale === AppLanguage.en_GB
  if (!isEnglish) return messages

  const renamePostsToSkeets = Boolean(
    persisted.get('crackSettings')?.renamePostsToSkeets,
  )
  if (!renamePostsToSkeets) return messages

  return replaceInValue(messages) as Messages
}
