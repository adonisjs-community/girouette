import { Get, Group } from '@adonisjs-community/girouette'

@Group({ name: 'test' })
export default class TestController {
  @Get('/')
  home() {
    return 'Homepage eee'
  }
}
