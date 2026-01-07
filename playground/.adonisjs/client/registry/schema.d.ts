/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractQuery, ExtractQueryForGet } from '@tuyau/core/types'
import type { InferInput } from '@vinejs/vine/types'

export interface Registry {
  'NewAccount.store': {
    methods: ["GET"]
    pattern: '/welcome'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/user').signupValidator)>>
      response: Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>
    }
  }
  'session.index': {
    methods: ["GET","HEAD"]
    pattern: '/session'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: Awaited<ReturnType<import('#controllers/session_controller').default['index']>>
    }
  }
  'session.create': {
    methods: ["GET","HEAD"]
    pattern: '/session/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: Awaited<ReturnType<import('#controllers/session_controller').default['create']>>
    }
  }
  'session.destroy': {
    methods: ["DELETE"]
    pattern: '/session/:id'
    types: {
      body: {}
      paramsTuple: [string]
      params: { id: string }
      query: {}
      response: Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>
    }
  }
  'test.home': {
    methods: ["GET"]
    pattern: '/'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: Awaited<ReturnType<import('#controllers/test_controller').default['home']>>
    }
  }
}
