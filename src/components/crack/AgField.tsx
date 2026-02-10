import {type ReactNode} from 'react'

import {useActiveAlterEgo} from '#/state/crack/alter-ego'

type AlterEgoField =
  | 'displayName'
  | 'handle'
  | 'description'
  | 'avatar'
  | 'banner'

type AgFieldProps<T> = {
  field: AlterEgoField
  value: T
  did: string
  children?: (value: T) => ReactNode
}

export function AgField<T>({field, value, did, children}: AgFieldProps<T>) {
  const alter = useActiveAlterEgo(did)
  const nextValue =
    alter && field in alter
      ? ((alter[field as keyof typeof alter] ?? value) as T)
      : value

  if (children) {
    return <>{children(nextValue)}</>
  }

  return <>{nextValue as ReactNode}</>
}
