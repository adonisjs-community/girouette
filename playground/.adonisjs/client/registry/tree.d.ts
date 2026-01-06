/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  Session: {
    test: typeof routes['Session.test']
  }
  Test: {
    home: typeof routes['Test.home']
  }
}
