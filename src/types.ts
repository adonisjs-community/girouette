/**
 * Represents a constructor function (class)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = any> = new (...args: any[]) => T

/**
 * Represents a value that can be either a single item or an array of items
 */
export type OneOrMore<T> = T | T[]

export interface GirouetteConfig {
  controllersGlob: RegExp
}
