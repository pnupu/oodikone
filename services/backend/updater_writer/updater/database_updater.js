const { sequelize, } = require('../database/connection')

const {
  Student, Credit, Course, CreditTeacher, Teacher,
  Organisation, CourseRealisationType,
  Semester, CreditType, CourseType, Discipline,
  CourseDisciplines, SemesterEnrollment, Provider,
  CourseProvider, Studyright, StudyrightExtent,
  ElementDetails, StudyrightElement, Transfers
} = require('../models/index')
const { updateAttainmentDates } = require('./update_attainment_dates')

const updateAttainments = async (studyAttainments, transaction) => {
  for (const { course } of studyAttainments) {
    await Course.upsert(course, { transaction })
  }
  for (const { course } of studyAttainments) {
    const { disciplines } = course
    disciplines && disciplines.length > 0 && await Promise.all(disciplines.map(courseDiscipline => CourseDisciplines.upsert(courseDiscipline, { transaction })))
  }
  for (const { course } of studyAttainments) {
    const { providers } = course
    providers.length > 0 && await Promise.all(providers.map(provider => Provider.upsert(provider, { transaction })))
  }
  for (const { course } of studyAttainments) {
    const { courseproviders } = course
    courseproviders.length > 0 && await Promise.all(courseproviders.map(courseProvider => CourseProvider.upsert(courseProvider, { transaction })))
  }
  for (const { credit } of studyAttainments) {
    await Credit.upsert(credit, { transaction })
  }
  for (const { teachers } of studyAttainments) {
    teachers && teachers.length > 0 && await Promise.all(teachers.map(teacher => Teacher.upsert(teacher, { transaction })))
  }
  // must be after teachers inserted
  for (const { creditTeachers } of studyAttainments) {
    creditTeachers.length > 0 && await Promise.all(creditTeachers.map(cT => CreditTeacher.upsert(cT, { transaction })))
  }
}

const updateStudyRights = async (studyRights, transaction) => {
  for (const { studyRightExtent } of studyRights) {
    await StudyrightExtent.upsert(studyRightExtent, { transaction })
  }
  for (const { studyright } of studyRights) {
    await Studyright.create(studyright, { transaction })
  }
  for (const { elementDetails } of studyRights) {
    await Promise.all(elementDetails.map(elementdetails => ElementDetails.upsert(elementdetails, { transaction })))
  }
  for (const { studyRightElements } of studyRights) {
    await Promise.all(studyRightElements.map(StudyRightElement => StudyrightElement.create(StudyRightElement, { transaction })))
  }
  for (const { transfers } of studyRights) {
    await Promise.all(transfers.map(transfer => Transfers.upsert(transfer, { transaction })))
  }
}

const deleteStudentStudyrights = async (studentnumber, transaction) => {
  await Studyright.destroy({ where: { student_studentnumber: studentnumber } }, { transaction })
  await StudyrightElement.destroy({ where: { studentnumber } }, { transaction })
}

const updateStudent = async (student) => {
  const { studentInfo, studyAttainments, semesterEnrollments, studyRights } = student
  const transaction = await sequelize.transaction()
  try {
    console.time(studentInfo.studentnumber)
    await deleteStudentStudyrights(studentInfo.studentnumber, transaction) // this needs to be done because Oodi just deletes deprecated studyrights from students ( big yikes )

    await Student.upsert(studentInfo, { transaction })
    await Promise.all(semesterEnrollments.map(SE => SemesterEnrollment.upsert(SE, { transaction })))

    if (studyAttainments) await updateAttainments(studyAttainments, transaction)

    if (studyRights) await updateStudyRights(studyRights, transaction)
    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

const updateAttainmentMeta = async () => {
  await updateAttainmentDates()
}

const updateMeta = async ({
  faculties, courseRealisationsTypes,
  semesters, creditTypeCodes, courseTypeCodes,
  disciplines,
}) => {
  const transaction = await sequelize.transaction()

  try {
    await Promise.all(
      courseTypeCodes.map(cT => CourseType.upsert(cT, { transaction }))
    )
    await Promise.all(
      faculties.map(org => Organisation.upsert(org, { transaction }))
    )
    await Promise.all(
      courseRealisationsTypes.map(cR => CourseRealisationType.upsert(cR, { transaction }))
    )
    await Promise.all(
      semesters.map(s => Semester.upsert(s, { transaction }))
    )
    await Promise.all(
      creditTypeCodes.map(cTC => CreditType.upsert(cTC, { transaction }))
    )
    await Promise.all(
      disciplines.map(d => Discipline.upsert(d, { transaction }))
    )
    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

module.exports = {
  updateStudent, updateMeta, updateAttainmentMeta
}