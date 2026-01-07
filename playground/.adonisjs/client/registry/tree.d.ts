/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  NewAccount: {
    store: typeof routes['NewAccount.store']
  }
  session: {
    index: typeof routes['session.index']
    create: typeof routes['session.create']
    destroy: typeof routes['session.destroy']
  }
  test: {
    home: typeof routes['test.home']
  }
}
