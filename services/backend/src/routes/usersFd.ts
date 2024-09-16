import { Request, Response, Router } from 'express'

import { isDev } from '../config'
import * as auth from '../middleware/auth'
import * as userService from '../services/userService'

const router = Router()

interface NewUserEppnRequest extends Request {
  params: {
    newUserEppn: string
  }
}

router.get('/from-sisu-by-eppn/:newUserEppn', auth.roles(['admin']), async (req: NewUserEppnRequest, res: Response) => {
  let { username: requesterEppn } = req.user
  const { newUserEppn } = req.params
  // In order to test this feature in the dev environment we need to set an eppn that demo sisu will recognize
  if (isDev && requesterEppn === 'mluukkai') {
    requesterEppn = newUserEppn
  }
  const person = await userService.getUserFromSisuByEppn(requesterEppn, newUserEppn)
  res.json(person)
})

interface AddUserRequest extends Request {
  body: {
    user: any // TODO: Funidata, what is the type of user?
  }
}

interface DeleteUserRequest extends Request {
  body: {
    userId: string // TODO: Funidata, what is the type of user?
  }
}

router.post('/add', auth.roles(['admin']), async (req: AddUserRequest, res: Response) => {
  const { user } = req.body
  const person = await userService.addNewUser(user)
  res.json(person)
})

router.post('/delete', auth.roles(['admin']), async (req: DeleteUserRequest, res: Response) => {
  const { userId } = req.body
  try {
    await userService.deleteUserById(userId)
    res.json({ deleted: userId })
  } catch (error) {
    return res.status(400).json({ error: 'Deletion was unsuccessful with the user id included in the request' })
  }
})

export default router
