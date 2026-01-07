/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'NewAccount.store': {
    methods: ["GET"],
    pattern: '/welcome',
    tokens: [{"old":"/welcome","type":0,"val":"welcome","end":""}],
    types: placeholder as Registry['NewAccount.store']['types'],
  },
  'session.index': {
    methods: ["GET","HEAD"],
    pattern: '/session',
    tokens: [{"old":"/session","type":0,"val":"session","end":""}],
    types: placeholder as Registry['session.index']['types'],
  },
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/session/create',
    tokens: [{"old":"/session/create","type":0,"val":"session","end":""},{"old":"/session/create","type":0,"val":"create","end":""}],
    types: placeholder as Registry['session.create']['types'],
  },
  'session.destroy': {
    methods: ["DELETE"],
    pattern: '/session/:id',
    tokens: [{"old":"/session/:id","type":0,"val":"session","end":""},{"old":"/session/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['session.destroy']['types'],
  },
  'test.home': {
    methods: ["GET"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['test.home']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
