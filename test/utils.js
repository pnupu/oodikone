const faker = require('faker')

const numberFromTo = (from, to) => Math.round(Math.random() * (to - from)) + from
const daysAgo = (daysAgo) => new Date((new Date()) - (1000 * 60 * 60 * 24 * daysAgo))
const idFromTwoIds = (a, b) => (1 / 2) * (a + b) * (a + b + 1) + b

const gradeArray = [
  '2', 'CL', 'Eisa', 'L', 'Hyv.', 'TT', 'LUB', 'HT', 'MCLA', '4', '0', 'A', 'NSLA', 'Luop', '5', '3', 'Hyl.', 'ECLA', '1', 'KH',
]
const statusArray = [
  { status: 'Suoritettu', statuscode: 4 },
  { status: 'Korotettu', statuscode: 7 },
  { status: 'Hyväksiluettu', statuscode: 9 },
  { status: 'Hylätty', statuscode: 10 }
]
const teacherRoleArray = ['Responsible', 'Approver', 'Teacher']

const generateCourses = async (amount) => {
  const number = amount || numberFromTo(10, 100)
  const courses = []
  for (let i = 0; i < number; i++) {
    courses.push({
      code: i.toString(10),
      name: faker.lorem.words(3)
    })
  }
  return courses
}

const generateCourseInstances = async (courses, amount) => {
  const instances = []
  let i = 0
  courses.forEach(course => {
    const number = amount || numberFromTo(5, 40)
    for (i; i < number; i++) {
      instances.push({
        id: i,
        coursedate: daysAgo(numberFromTo(10, 365)).toUTCString(),
        course_code: course.code
      })
    }
  })
  return instances
}

const generateStudents = async (amount) => {
  const students = []
  const number = amount || numberFromTo(5, 40)

  const now = new Date()

  for (let i = 0; i < number; i++) {
    const birthdate = daysAgo(numberFromTo(365 * 18, 365 * 70))
    const dateoffirstcredit = faker.date.between(birthdate, now)
    const dateoflastcredit = faker.date.between(dateoffirstcredit, now)
    const dateofuniversityenrollment = faker.date.between(birthdate, dateoflastcredit)
    const lastname = faker.name.lastName()
    const firstnames = faker.name.firstName(2)
    students.push({
      studentnumber: numberFromTo(100000000, 999999999),
      lastname,
      firstnames,
      abbreviatedname: `${lastname} ${firstnames}`,
      birthdate,
      communicationlanguage: ['fi', 'sv', 'en'][numberFromTo(0, 2)],
      country: faker.address.country(),
      creditcount: numberFromTo(0, 600),
      dateoffirstcredit,
      dateoflastcredit,
      dateofuniversityenrollment,
      gradestudent: `${numberFromTo(0, 1)}`,
      matriculationexamination: `${numberFromTo(0, 1)}`,
      nationalities: ['fi', 'sv', 'en'][numberFromTo(0, 2)],
      semesterenrollmenttypecode: [null, '1.0', '2.0'][numberFromTo(0, 2)],
      sex: ['female', 'male'][numberFromTo(0, 1)],
      studentstatuscode: numberFromTo(2, 8),
    })
  }

  return students
}

const generateCredits = async (courseInstances, students, amount) => {
  const credits = []
  students.forEach((student, studentIdx) => {
    courseInstances.forEach((courseInstance) => {
      const number = amount || numberFromTo(5, 40)
      for (let i = 0; i < number; i++) {
        const statusObject = statusArray[numberFromTo(0, statusArray.length - 1)]
        credits.push({
          id: idFromTwoIds(idFromTwoIds(studentIdx, courseInstance.id), i),
          grade: gradeArray[numberFromTo(0, gradeArray.length - 1)],
          student_studentnumber: student.studentnumber,
          credits: [5, 10][numberFromTo(0, 1)],
          ordering: faker.date.between(student.dateoffirstcredit, student.dateoflastcredit),
          status: statusObject.status,
          statuscode: statusObject.statuscode,
          courseinstance_id: courseInstance.id
        })
      }
    })
  })
  return credits
}

const generateTeachers = async (amount) => {
  const teachers = []
  const number = amount || numberFromTo(5, 40)

  for (let i = 0; i < number; i++) {
    teachers.push({
      id: i,
      code: faker.lorem.word(),
      name: `${faker.name.lastName()} ${faker.name.firstName()}`
    })
  }

  return teachers
}

const generateCourseTeachers = async (courseInstances, teachers, maximumAmount) => {
  const courseTeachers = []
  courseInstances.forEach((courseInstance, index) => {
    const number = numberFromTo(0, maximumAmount)
    for (let i = 0; i < number; i++) {
      const teacher = teachers[numberFromTo(0, teachers.length - 1)]
      courseTeachers.push({
        id: idFromTwoIds(index, i),
        teacherrole: teacherRoleArray[numberFromTo(0, teacherRoleArray.length - 1)],
        courseinstance_id: courseInstance.id,
        teacher_id: teacher.id
      })
    }
  })


  return courseTeachers
}

const generateOrganizations = async (amount) => {
  const organizations = []

  const number = amount || numberFromTo(5, 40)
  for (let i = 0; i < number; i++) {
    organizations.push({
      code: faker.lorem.word(),
      name: faker.company.companyName()
    })
  }
  return organizations
}

const generateStudyrights = async (students, organization, date) => {
  const studyrights = []
  students.forEach((student) => {
    studyrights.push({
      studyrightid: student.studentnumber,
      canceldate: null,
      cancelorganisation: null,
      enddate: new Date().toString(),
      extentcode: numberFromTo(2, 99), 
      givendate: daysAgo(365 * numberFromTo(1, 100)),
      graduated: null,
      highlevelname: faker.company.catchPhrase(),
      prioritycode: numberFromTo(0, 30),
      startdate: date,
      studystartdate: null,
      organization_code: organization.code,
      student_studentnumber: student.studentnumber,
    })
  })
  return studyrights
}

module.exports = {
  generateCourses,
  generateCourseInstances,
  generateStudents,
  generateStudyrights,
  generateCredits,
  generateTeachers,
  generateCourseTeachers,
  generateOrganizations,
}