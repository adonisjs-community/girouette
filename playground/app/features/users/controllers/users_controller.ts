import { Get, Where } from '@adonisjs-community/girouette'
import router from '@adonisjs/core/services/router'

export default class UsersController {
  @Get('/users/:userId')
  @Where('userId', router.matchers.slug())
  async show() {
    return 'testest hello'
  }
}
