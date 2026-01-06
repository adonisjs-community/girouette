import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'Session.test': { paramsTuple?: []; params?: {} }
    'Test.home': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'Session.test': { paramsTuple?: []; params?: {} }
    'Test.home': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}