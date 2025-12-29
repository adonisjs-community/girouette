import { Resource, ResourceMiddleware } from '../../../index.js'
import { type HttpContext } from '@adonisjs/core/http'
import { fakeMiddleware } from '../../utils.js'

@Resource({ name: 'posts' })
@ResourceMiddleware('*', [fakeMiddleware])
export default class PostsController {
  async index({}: HttpContext) {}

  async store({}: HttpContext) {}

  async show({}: HttpContext) {}

  async update({}: HttpContext) {}

  async destroy({}: HttpContext) {}
}
