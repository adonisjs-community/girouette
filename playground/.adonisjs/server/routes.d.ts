import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'NewAccount.store': { paramsTuple?: []; params?: {} }
    'session.index': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'test.home': { paramsTuple?: []; params?: {} }
    'users.list': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'NewAccount.store': { paramsTuple?: []; params?: {} }
    'session.index': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'test.home': { paramsTuple?: []; params?: {} }
    'users.list': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'session.index': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'session.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}