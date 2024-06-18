const { Op } = require('sequelize')

const { codes } = require('../../../config/programmeCodes')
const { faculties } = require('../organisations')

const getFacultyList = async () => {
  const ignore = ['Y', 'H99', 'Y01', 'H92', 'H930']
  const facultyList = (await faculties()).filter(faculty => !ignore.includes(faculty.code))
  facultyList.sort((a, b) => (a.name.fi > b.name.fi ? 1 : -1))
  return facultyList
}

const findRightProgramme = (studyrightElements, code) => {
  let programme = ''
  let programmeName = ''
  let studyRightElement = null

  if (studyrightElements) {
    studyRightElement = studyrightElements
      .filter(sre => sre.element_detail.type === 20)
      .filter(sre => sre.code === code)

    if (studyRightElement.length > 0) {
      programme = studyRightElement[0].code
      programmeName = studyRightElement[0].element_detail.name
    }
  }
  return { programme, programmeName }
}

const facultyFormatStudyright = studyright => {
  const {
    studyrightid,
    studystartdate,
    enddate,
    givendate,
    graduated,
    active,
    prioritycode,
    extentcode,
    studentStudentnumber,
    studyright_elements,
    startdate,
    facultyCode,
  } = studyright

  return {
    studyrightid,
    studystartdate,
    startdate,
    enddate,
    givendate,
    graduated,
    active,
    prioritycode,
    extentcode,
    facultyCode,
    studentnumber: studentStudentnumber,
    studyrightElements: studyright_elements,
  }
}
const facultyProgrammeStudents = student => {
  const { studentnumber, home_country_en, gender_code, semester_enrollments } = student
  return {
    stundetNumber: studentnumber,
    homeCountryEn: home_country_en,
    genderCode: gender_code,
    semesters: semester_enrollments.map(s => s.dataValues),
  }
}
const formatFacultyTransfer = transfer => {
  const { sourcecode, targetcode, transferdate, studyrightid, studentnumber } = transfer
  return {
    sourcecode,
    targetcode,
    transferdate,
    studyrightid,
    studentnumber,
  }
}

const facultyFormatProgramme = programme => {
  const { code, name } = programme
  return { code, name }
}

const formatFacultyThesisWriter = credit => {
  const { course_code, credits, attainment_date, student_studentnumber, course } = credit
  return {
    course_code,
    credits,
    attainment_date,
    student_studentnumber,
    courseUnitType: course.course_unit_type,
  }
}

const formatOrganization = org => {
  const { id, name, code, parent_id } = org
  return { id, name, code, parentId: parent_id }
}

const newProgrammes = [/^KH/, /^MH/, /^T/, /^LI/, /^K-/, /^FI/, /^00901$/, /^00910$/]

const isNewProgramme = code => {
  for (let i = 0; i < newProgrammes.length; i++) {
    if (newProgrammes[i].test(code)) {
      return true
    }
  }
  return false
}

const checkTransfers = (studyright, insideTransfersStudyrights, transfersToOrAwayStudyrights) => {
  const allTransfers = [
    ...insideTransfersStudyrights.map(studyright => studyright.studentnumber),
    ...transfersToOrAwayStudyrights.map(studyright => studyright.studentnumber),
  ]
  return allTransfers.includes(studyright.studentnumber)
}

const commissionedProgrammes = ['KH50_009', 'MH50_015', 'T923103-N']

const checkCommissioned = studyright => {
  return studyright.studyrightElements.some(element => commissionedProgrammes.includes(element.code))
}

const getExtentFilter = includeAllSpecials => {
  const filteredExtents = [16] // always filter out secondary subject students
  if (!includeAllSpecials) {
    filteredExtents.push(6, 7, 9, 13, 14, 18, 22, 23, 34, 99)
  }
  const studyrightWhere = {
    extentcode: {
      [Op.notIn]: filteredExtents,
    },
  }
  return studyrightWhere
}

const mapCodesToIds = data => {
  // Add programme id e.g. TKT
  const keys = Object.keys(codes)
  for (const prog of data) {
    if (keys.includes(prog.code)) {
      prog.progId = codes[prog.code]
    } else {
      prog.progId = prog.code
    }
  }
}

module.exports = {
  getFacultyList,
  findRightProgramme,
  facultyFormatStudyright,
  facultyFormatProgramme,
  formatFacultyTransfer,
  formatFacultyThesisWriter,
  formatOrganization,
  isNewProgramme,
  checkTransfers,
  checkCommissioned,
  getExtentFilter,
  mapCodesToIds,
  facultyProgrammeStudents,
}
