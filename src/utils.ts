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

/**
 * JSON replacer that normalizes RegExp and Function values to their string representation.
 * This ensures proper comparison of matchers in @Where decorators.
 */
function normalizeReplacer(_key: string, value: unknown): unknown {
  if (value instanceof RegExp) {
    return `__RegExp:${value.toString()}`
  }
  if (typeof value === 'function') {
    return `__Function:${value.toString()}`
  }
  return value
}

export function deepEqual<T>(a: T, b: T) {
  return JSON.stringify(a, normalizeReplacer) === JSON.stringify(b, normalizeReplacer)
}

export function prettifyGroupName(name: string) {
  return stringHelpers.create(name).removeSuffix('Controller').snakeCase().toString()
}

export function prettifyRouteName(name: string) {
  return stringHelpers.create(name).snakeCase().toString()
}
