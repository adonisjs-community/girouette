/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  api: {
    expensiveOperation: typeof routes['api.expensive_operation']
  }
  newAccount: {
    store: typeof routes['new_account.store']
  }
  session: {
    index: typeof routes['session.index']
    create: typeof routes['session.create']
    destroy: typeof routes['session.destroy']
  }
  test: {
    home: typeof routes['test.home']
  }
  users: {
    show: typeof routes['users.show']
  }
}
