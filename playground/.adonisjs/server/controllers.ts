export const controllers = {
  NewAccount: () => import('#controllers/new_account_controller'),
  Session: () => import('#controllers/session_controller'),
  Test: () => import('#controllers/test_controller'),
}
