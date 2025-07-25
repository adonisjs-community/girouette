import { ApiOnly, Resource } from '../../../index.js'
import { HttpContext } from '@adonisjs/core/http'

@Resource('posts')
@ApiOnly()
export default class PostsController {
  async store({}: HttpContext) {}

  async index({}: HttpContext) {}

  async show({}: HttpContext) {}

  async update({}: HttpContext) {}

  async destroy({}: HttpContext) {}
}
