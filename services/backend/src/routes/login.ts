import { Response, Router } from 'express'
import { omit } from 'lodash'

import { OodikoneRequest } from '../types'
import { ApplicationError } from '../util/customErrors'

const router = Router()

router.get('/', async (req: OodikoneRequest, res: Response) => {
  const { user, logoutUrl } = req

  if (!user) {
    throw new ApplicationError('User not found', 404)
  }

  res.send({
    user: omit(user, ['studentsUserCanAccess']),
    logoutUrl,
  })
})

export default router
