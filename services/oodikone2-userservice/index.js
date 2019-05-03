const express = require('express')

const User = require('./src/services/users')
const AccessGroup = require('./src/services/accessgroups')

const app = express()
const port = 4567
const bodyParser = require('body-parser')
const checkSecret = require('./src/middlewares/secret')
const { requiredGroup } = require('./src/conf')

app.use(bodyParser.json())
app.use(checkSecret)

app.get('/ping', (req, res) => res.json({ message: 'pong '}))

app.get('/findall', async (req, res) => {
  const users = await User.findAll()
  const returnedUsers = users.map(u => {
    const enabled = requiredGroup === null || u.hy_group.some(e => e.code === requiredGroup)
    return {...u.get(), is_enabled: enabled, hy_group: null}
  })
  res.json(returnedUsers)
})

app.get('/findallenabled', async (req, res) => {
  const users = await User.findAll()
  const returnedUsers = users.filter(u => (
    requiredGroup === null || u.hy_group.some(e => e.code === requiredGroup)
  )).map(u => {
    const enabled = requiredGroup === null || u.hy_group.some(e => e.code === requiredGroup)
    return {...u.get(), is_enabled: enabled, hy_group: null}
  })
  res.json(returnedUsers)
})

app.get('/user/:uid', async (req, res) => {
  const uid = req.params.uid
  const user = await User.byUsername(uid)

  console.log(JSON.stringify(user))

  res.json(user)
})

app.get('/user/elementdetails/:username', async (req, res) => {
  const username = req.params.username
  const elementdetails = await User.getUserElementDetails(username)

  console.log(JSON.stringify(elementdetails))

  res.json(elementdetails)
})

app.get('/user/id/:id', async (req, res) => {
  const id = req.params.id
  const user = await User.byId(id)

  console.log(JSON.stringify(user))

  res.json(user)
})

app.post('/user', async (req, res) => {
  console.log('POST')
  const { username, full_name, email } = req.body
  console.log(username, full_name, email)

  const user = await User.createUser(username, full_name, email)

  res.json(user)
})
app.post('/login', async (req, res) => {
  const { uid, full_name, hyGroups, affiliations, email } = req.body
  console.log(uid, full_name, 'logging in!')
  const { token, isNew } = await User.login(uid, full_name, hyGroups, affiliations, email)
  res.status(200).json({ token, isNew })
})

app.post('/superlogin', async (req, res) => {
  const { uid, asUser  } = req.body
  console.log(`${uid} superlogging`)
  const token = await User.superlogin(uid, asUser)
  if (token) {
    res.status(200).json(token)
  }
  res.status(400)
})

app.put('/user/:uid', async (req, res) => {
  const uid = req.params.uid
  const user = await User.byUsername(uid)
  if (!user) {
    return res.status(400).json({ error: "invalid username given" })
  }
  await User.updateUser(user, req.body)
  const returnedUser = await User.byUsername(uid)
  res.json(returnedUser)
})

app.post('/modifyaccess', async (req, res) => {
  const { uid, accessgroups } = req.body
  try {
    await User.modifyRights(uid, accessgroups)
    const user = await User.byId(uid)
    res.status(200).json(user)
  } catch (e) {
    res.status(400).json({ e })
  }

})
app.post('/add_rights', async (req, res) => {
  const { uid, codes } = req.body
  console.log("adding rights to ", uid)
  try {
    await User.enableElementDetails(uid, codes)
    const user = await User.byId(uid)
    res.status(200).json({ user })

  } catch (e) {
    res.status(400).json({ e })
  }
})
app.post('/remove_rights', async (req, res) => {
  const { uid, codes } = req.body
  console.log("removing rights from ", uid)
  try {
    await User.removeElementDetails(uid, codes)
    const user = await User.byId(uid)
    res.status(200).json({ user })

  } catch (e) {
    res.status(400).json({ e })
  }
})
app.get('/access_groups', async (req, res) => {
  try {
    const groups = await AccessGroup.findAll()
    res.status(200).json(groups)
  } catch (e) {
    res.status(400)
  }
})

app.get('/get_roles/:user', async (req, res) => {
  const user = req.params.user
  try {
    const roles = await User.getRoles(user)
    res.status(200).json(roles)
  } catch (e) {
    res.status(400).json({ e })
  }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))