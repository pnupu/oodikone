const { Op } = require('sequelize')

const { facultyCodes } = require('../config/organizationConstants')
const { dbConnections } = require('../database/connection')
const { Organization } = require('../models')

const getOrganizations = () =>
  Organization.findAll({
    where: {
      code: {
        [Op.in]: facultyCodes,
      },
    },
  })

const providersOfFaculty = async facultyCode => {
  const [result] = await dbConnections.sequelize.query(
    `SELECT childOrg.code
     FROM organization parentOrg
     INNER JOIN organization childOrg 
     ON childOrg.parent_id = parentOrg.id
     WHERE parentOrg.code = ?`,
    { replacements: [facultyCode] }
  )
  return result.map(({ code }) => code)
}

const isFaculty = facultyCode => facultyCodes.includes(facultyCode)

module.exports = {
  getOrganizations,
  isFaculty,
  providersOfFaculty,
}
