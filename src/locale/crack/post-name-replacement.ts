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
    // Lingui placeholders are encoded as single-item arrays
    // (e.g. ["reposter"] or ["0"]). Do not replace inside them.
    if (
      value.length === 1 &&
      typeof value[0] === 'string' &&
      (/^\d+$/.test(value[0]) || /^[a-z][a-zA-Z0-9_]*$/.test(value[0]))
    ) {
      return value
    }

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
