import { type HotHookMessage } from '@adonisjs/assembler/types'
import stringHelpers from '@adonisjs/core/helpers/string'

export function isHotHookMessage(message: unknown): message is HotHookMessage {
  return (
    message !== null &&
    typeof message === 'object' &&
    'type' in message &&
    typeof message.type === 'string' &&
    message.type.startsWith('hot-hook:')
  )
}

export function deepEqual<T>(a: T, b: T) {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function prettifyGroupName(name: string) {
  return stringHelpers.create(name).removeSuffix('Controller').snakeCase().toString()
}
