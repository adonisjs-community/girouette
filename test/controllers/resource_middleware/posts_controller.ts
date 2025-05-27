import { Resource, ResourceMiddleware } from '../../../index.js'
import { HttpContext } from '@adonisjs/core/http'
import { fakeMiddleware } from '../../../src/utils.js'

@Resource('/posts')
@ResourceMiddleware('*', [fakeMiddleware])
export default class PostsController {
  async index({}: HttpContext) {}

  async store({}: HttpContext) {}

  async show({}: HttpContext) {}

  async update({}: HttpContext) {}

  async destroy({}: HttpContext) {}
}
