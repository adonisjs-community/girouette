import { Group, Resource } from '../../../index.js'
import { HttpContext } from '@adonisjs/core/http'

@Group({ name: 'api.v1', prefix: '/api/v1' })
@Resource({ name: 'posts' })
export default class PostsController {
  async index({}: HttpContext) {}

  async store({}: HttpContext) {}

  async show({}: HttpContext) {}

  async update({}: HttpContext) {}

  async destroy({}: HttpContext) {}
}
