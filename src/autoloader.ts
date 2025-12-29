import Emittery from 'emittery'
import { globby } from 'globby'
import { hot } from 'hot-hook'

export type AutoloaderOptions = {
  path: string

  /**
   * File suffixes for file matching.
   *
   * @example ['controller']
   */
  suffixes: string[]

  /**
   * File extensions to match.
   *
   * @default ['ts', 'tsx', 'js', 'jsx']
   */
  extensions?: string[]
}

export type AutoloaderEvents = {
  added: { path: string; module: any }
  updated: { path: string; module: any }
}

export class Autoloader extends Emittery<AutoloaderEvents> {
  options: AutoloaderOptions

  cache = new Map<string, boolean>()

  constructor(options: AutoloaderOptions) {
    super()
    this.options = options
  }

  /**
   * List matching files for autoloading.
   */
  async discover() {
    const matches = await globby(this.options.path, {
      absolute: true,
      expandDirectories: {
        files: this.options.suffixes.map((suffix) => `*_${suffix}`),
        extensions: ['ts', 'tsx', 'js', 'jsx'],
      },
    })

    return matches
  }

  /**
   * Starts the autoloader.
   * It first discover matching files for autoloading and then hook into hot-hook for HMR support.
   */
  async autoload() {
    const matches = await this.discover()
    await Promise.all(matches.map((path) => this.loadModule(path)))
  }

  async loadModule(path: string) {
    const module = await import(path, import.meta.hot?.boundary)

    if (this.cache.has(path)) {
      await this.emit('updated', { path: path, module })
    } else {
      await this.emit('added', { path: path, module })
    }

    if (import.meta.hot) {
      this.cache.set(path, true)

      hot.dispose(`file://${path}`, () => {
        this.loadModule(path)
      })
    }
  }
}
