export const controllers = {
  Api: () => import('#app/controllers/api_controller'),
  NewAccount: () => import('#app/controllers/new_account_controller'),
  Session: () => import('#app/controllers/session_controller'),
  Test: () => import('#app/controllers/test_controller'),
  features: {
    users: {
      Users: () => import('#app/features/users/controllers/users_controller'),
    },
  },
}
