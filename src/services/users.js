const Sequelize = require('sequelize')
const jwt = require('jsonwebtoken')
const { User, ElementDetails } = require('../models')
const ElementService = require('./studyelements')
const Op = Sequelize.Op

const generateToken = async (uid, asUser) => {
  const user = await byUsername(uid)
  const elementdetails = user.admin && asUser ? await getUserElementDetails(asUser) : await getUserElementDetails(user.username)
  const elements = elementdetails.map(element => element.code)

  const payload = {
    userId: uid,
    name: user.full_name,
    enabled: user.is_enabled,
    language: user.language,
    admin: user.admin,
    czar: user.czar,
    asuser: user.admin ? asUser : null,
    rights: elements
  }
  const token = jwt.sign(payload, process.env.TOKEN_SECRET)

  // return the information including token as JSON
  return token
}

const login = async (uid, full_name, mail) => {
  let user = await byUsername(uid)
  let isNew = false
  if (!user) {
    console.log('New user')
    user = await createUser(uid, full_name, mail)
    isNew = true
  } else {
    user = await updateUser(user, { full_name })
  }
  console.log('Generating token')
  const token = await generateToken(uid)
  console.log('Token done')
  return({ token, isNew })

}
const superlogin = async (uid, asUser) => {
  const user = await byUsername(uid)
  if (user.admin) {
    const token = await generateToken(uid, asUser)
    return token
  }
  return undefined
}
const byUsername = async (username) => {
  return User.findOne({
    where: {
      username: {
        [Op.eq]: username
      }
    }
  })
}

const createUser = async (username, fullname, email) => {
  return User.create({
    username: username,
    full_name: fullname,
    is_enabled: false,
    czar: false,
    email
  })
}

const updateUser = async (userObject, values) => {
  return userObject.update(values)
}


const byId = async (id) => {
  return User.findOne({
    where: {
      id: {
        [Op.eq]: id
      }
    },
    include: [{
      model: ElementDetails,
      as: 'elementdetails'
    }]
  })
}

const getUnitsFromElementDetails = async username => {
  const user = await byUsername(username)
  const elementDetails = await user.getElementdetails()
  return elementDetails.map(element => UnitService.parseUnitFromElement(element))
}

const getUserElementDetails = async username => {
  const user = await byUsername(username)
  return await user.getElementdetails()
}

const findAll = async () => {
  return User.findAll({
    include: [{
      model: ElementDetails,
      as: 'elementdetails'
    }]
  })
}

const enableElementDetails = async (uid, codes) => {
  const user = await byId(uid)
  const elements = await ElementService.byCodes(codes)
  await user.addElementdetails(elements)
}


module.exports = {
  byUsername,
  createUser,
  updateUser,
  findAll,
  byId,
  getUnitsFromElementDetails,
  getUserElementDetails,
  enableElementDetails,
  login,
  superlogin

}