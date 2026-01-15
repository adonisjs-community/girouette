import { test } from '@japa/runner'
import { deepEqual } from '../src/utils.ts'

test.group('deepEqual - Basic values', () => {
  test('should return true for equal primitives', ({ assert }) => {
    assert.isTrue(deepEqual('foo', 'foo'))
    assert.isTrue(deepEqual(123, 123))
    assert.isTrue(deepEqual(true, true))
    assert.isTrue(deepEqual(null, null))
  })

  test('should return false for different primitives', ({ assert }) => {
    assert.isFalse(deepEqual('foo', 'bar'))
    assert.isFalse(deepEqual(123, 456))
    assert.isFalse(deepEqual(true, false))
  })

  test('should return true for equal objects', ({ assert }) => {
    assert.isTrue(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 }))
    assert.isTrue(deepEqual({ nested: { value: 'test' } }, { nested: { value: 'test' } }))
  })

  test('should return false for different objects', ({ assert }) => {
    assert.isFalse(deepEqual({ a: 1 }, { a: 2 }))
    assert.isFalse(deepEqual({ a: 1 }, { b: 1 }))
  })
})

test.group('deepEqual - RegExp normalization', () => {
  test('should return true for identical RegExp patterns', ({ assert }) => {
    assert.isTrue(deepEqual(/^[a-z]+$/, /^[a-z]+$/))
    assert.isTrue(deepEqual(/\d+/gi, /\d+/gi))
  })

  test('should return false for different RegExp patterns', ({ assert }) => {
    assert.isFalse(deepEqual(/^[a-z]+$/, /^[a-z0-9]+$/))
    assert.isFalse(deepEqual(/\d+/, /\d+/gi))
  })

  test('should return true for equal objects containing RegExp', ({ assert }) => {
    const a = { key: 'slug', matcher: /^[a-z-]+$/ }
    const b = { key: 'slug', matcher: /^[a-z-]+$/ }
    assert.isTrue(deepEqual(a, b))
  })

  test('should return false for different RegExp in objects', ({ assert }) => {
    const a = { key: 'slug', matcher: /^[a-z-]+$/ }
    const b = { key: 'slug', matcher: /^[a-z0-9-]+$/ }
    assert.isFalse(deepEqual(a, b))
  })

  test('should handle nested RegExp in where constraints', ({ assert }) => {
    const a = { where: [{ key: 'id', matcher: { match: /^\d+$/ } }] }
    const b = { where: [{ key: 'id', matcher: { match: /^\d+$/ } }] }
    assert.isTrue(deepEqual(a, b))

    const c = { where: [{ key: 'id', matcher: { match: /^[a-f0-9-]+$/ } }] }
    assert.isFalse(deepEqual(a, c))
  })
})

test.group('deepEqual - Function normalization', () => {
  test('should return true for identical functions', ({ assert }) => {
    const fn1 = (v: string) => Number.parseInt(v)
    const fn2 = (v: string) => Number.parseInt(v)
    assert.isTrue(deepEqual(fn1, fn2))
  })

  test('should return false for different functions', ({ assert }) => {
    const fn1 = (v: string) => Number.parseInt(v)
    const fn2 = (v: string) => Number(v)
    assert.isFalse(deepEqual(fn1, fn2))
  })

  test('should return true for equal objects containing functions', ({ assert }) => {
    const a = { cast: (v: string) => Number.parseInt(v) }
    const b = { cast: (v: string) => Number.parseInt(v) }
    assert.isTrue(deepEqual(a, b))
  })

  test('should return false for different functions in objects', ({ assert }) => {
    const a = { cast: (v: string) => Number.parseInt(v) }
    const b = { cast: (v: string) => Number.parseFloat(v) }
    assert.isFalse(deepEqual(a, b))
  })

  test('should handle RouteMatcher-like objects with match and cast', ({ assert }) => {
    const a = {
      where: [
        {
          key: 'id',
          matcher: {
            match: /^\d+$/,
            cast: (v: string) => Number.parseInt(v),
          },
        },
      ],
    }
    const b = {
      where: [
        {
          key: 'id',
          matcher: {
            match: /^\d+$/,
            cast: (v: string) => Number.parseInt(v),
          },
        },
      ],
    }
    assert.isTrue(deepEqual(a, b))
  })

  test('should detect changes in cast function', ({ assert }) => {
    const a = {
      where: [
        {
          key: 'id',
          matcher: {
            match: /^\d+$/,
            cast: (v: string) => Number.parseInt(v),
          },
        },
      ],
    }
    const b = {
      where: [
        {
          key: 'id',
          matcher: {
            match: /^\d+$/,
            cast: (v: string) => Number(v),
          },
        },
      ],
    }
    assert.isFalse(deepEqual(a, b))
  })
})

test.group('deepEqual - Mixed scenarios', () => {
  test('should handle controller metadata with where constraints', ({ assert }) => {
    const metadataA = {
      group: { prefix: '/api' },
      routes: {
        show: {
          pattern: '/posts/:slug',
          methods: ['GET'],
          where: [{ key: 'slug', matcher: /^[a-z0-9-]+$/ }],
        },
      },
    }
    const metadataB = {
      group: { prefix: '/api' },
      routes: {
        show: {
          pattern: '/posts/:slug',
          methods: ['GET'],
          where: [{ key: 'slug', matcher: /^[a-z0-9-]+$/ }],
        },
      },
    }
    assert.isTrue(deepEqual(metadataA, metadataB))
  })

  test('should detect regex change in controller metadata', ({ assert }) => {
    const metadataA = {
      group: { prefix: '/api' },
      routes: {
        show: {
          pattern: '/posts/:slug',
          methods: ['GET'],
          where: [{ key: 'slug', matcher: /^[a-z]+$/ }],
        },
      },
    }
    const metadataB = {
      group: { prefix: '/api' },
      routes: {
        show: {
          pattern: '/posts/:slug',
          methods: ['GET'],
          where: [{ key: 'slug', matcher: /^[a-z0-9-]+$/ }],
        },
      },
    }
    assert.isFalse(deepEqual(metadataA, metadataB))
  })
})
