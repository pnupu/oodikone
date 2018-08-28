const { Op } = require('sequelize')
const { Teacher, Credit, Course, Semester, Provider } = require('../models/index')
const { redisClient } = require('./redis')

const REDIS_TOP_TEACHERS = 'REDIS_TOP_TEACHERS'

const splitByEmptySpace = str => str.replace(/\s\s+/g, ' ').split(' ')

const likefy = term => `%${term}%`

const nameLike = terms => ({
  name: {
    [Op.and]: terms.map(term => ({ [Op.iLike]: likefy(term) }))
  }
})

const codeLike = terms => {
  if (terms.length !== 1) {
    return undefined
  }
  return {
    code: {
      [Op.iLike]: likefy(terms[0])
    }
  }
}

const invalidTerm = searchTerm => !searchTerm.trim()

const bySearchTerm = async searchTerm => {
  if (invalidTerm(searchTerm)) {
    return []
  }
  const terms = splitByEmptySpace(searchTerm)
  return Teacher.findAll({
    attributes: {
      exclude: ['createdAt', 'updatedAt']
    },
    where: {
      [Op.or]: [
        nameLike(terms),
        codeLike(terms)
      ]
    }
  })
}

const findTeacherCredits = teacherid => Teacher.findByPrimary(teacherid, {
  attributes: ['name', 'code', 'id'],
  include: {
    model: Credit,
    attributes: ['credits', 'grade', 'id', 'student_studentnumber', 'credittypecode'],
    include: [
      {
        model: Course,
        attributes: ['name', 'code'],
        required: true
      },
      {
        model: Semester,
        attributes: ['semestercode', 'name', 'yearname', 'yearcode']
      }
    ]
  }
})

const parseCreditInfo = credit => ({
  studentnumber: credit.student_studentnumber,
  credits: credit.credits,
  grade: credit.grade,
  passed: Credit.passed(credit) || Credit.improved(credit),
  failed: Credit.failed(credit),
  course: credit.course,
  semester: credit.semester
})

const markCredit = (stats, passed, failed, credits) => {
  if (!stats) {
    stats = {
      passed: 0,
      failed: 0,
      credits: 0
    }
  }
  if (passed) {
    return {
      ...stats,
      credits: stats.credits + credits,
      passed: stats.passed + 1
    }
  } else if (failed) {
    return {
      ...stats,
      failed: stats.failed + 1
    }
  } else {
    return stats
  }
}

const parseAndMarkCredit = (stats, key, credit) => {
  const { passed, failed, credits } = parseCreditInfo(credit)
  return {
    ...stats,
    [key]: markCredit(stats[key], passed, failed, credits)
  }
}

const markCreditForSemester = (semesters, credit) => {
  const { passed, failed, credits, semester } = parseCreditInfo(credit)
  const { semestercode, name } = semester
  const { stats, ...rest } = semesters[semestercode] || { id: semestercode, name }
  return {
    ...semesters,
    [semestercode]: {
      ...rest,
      stats: markCredit(stats, passed, failed, credits)
    }
  }
}

const markCreditForYear = (years, credit) => {
  const { passed, failed, credits, semester } = parseCreditInfo(credit)
  const { yearcode, yearname } = semester
  const { stats, ...rest } = years[yearcode] || { id: yearcode, name: yearname }
  return {
    ...years,
    [yearcode]: {
      ...rest,
      stats: markCredit(stats, passed, failed, credits)
    }
  }
}

const markCreditForCourse = (courses, credit) => {
  const { passed, failed, credits, course, semester } = parseCreditInfo(credit)
  const { code, name } = course
  const { semestercode } = semester
  const { stats, semesters={}, ...rest } = courses[code] || { id: code, name }
  return {
    ...courses,
    [code]: {
      ...rest,
      semesters: parseAndMarkCredit(semesters, semestercode, credit),
      stats: markCredit(stats, passed, failed, credits)
    }
  }
}

const teacherStats = async teacherid => {
  const teacher = await findTeacherCredits(teacherid)
  const statistics = teacher.credits.reduce(({ semesters, years, courses, ...rest }, credit) => {
    return {
      ...rest,
      semesters: markCreditForSemester(semesters, credit),
      years: markCreditForYear(years, credit),
      courses: markCreditForCourse(courses, credit)
    }
  }, {
    semesters: {},
    courses: {},
    years: {}
  })
  return {
    name: teacher.name,
    code: teacher.code,
    id: teacher.id,
    statistics
  }
}

const activeTeachers = async (providers, semestercodeStart, semestercodeEnd) => {
  const teachers = Teacher.findAll({
    attributes: ['id'],
    include: {
      model: Credit,
      attributes: [],
      required: true,
      include: [
        {
          model: Course,
          attributes: [],
          required: true,
          include: {
            model: Provider,
            attributes: [],
            required: true,
            where: {
              providercode: {
                [Op.in]: providers
              }
            }
          }
        },
        {
          model: Semester,
          required: true,
          attributes: [],
          where: {
            semestercode: {
              [Op.between]: [semestercodeStart, semestercodeEnd]
            }
          }
        }
      ]
    }
  })
  return teachers.map(({ id }) => id)
}

const getCredits = (teacherIds, semestercodeStart, semestercodeEnd) => Teacher.findAll({
  attributes: ['name', 'code', 'id'],
  include: {
    model: Credit,
    attributes: ['credits', 'grade', 'id', 'student_studentnumber', 'credittypecode'],
    include: [
      {
        model: Course,
        required: true
      },
      {
        model: Semester,
        required: true,
        attributes: ['semestercode', 'name', 'yearname', 'yearcode'],
        where: {
          semestercode: {
            [Op.between]: [semestercodeStart, semestercodeEnd]
          }
        }
      }
    ]
  },
  where: {
    id: {
      [Op.in]: teacherIds
    }
  }
})

const isRegularCourse = credit => !credit.course ? true : !credit.course.get().is_study_module

const calculateCreditStatistics = credits => credits.reduce((stats, credit) => {
  if (isRegularCourse(credit)) {
    const { passed, failed, credits } = parseCreditInfo(credit)
    return markCredit(stats, passed, failed, credits)
  } else {
    return stats
  }
}, {
  passed: 0,
  failed: 0,
  credits: 0
})

const yearlyStatistics = async (providers, semestercodeStart, semestercodeEnd) => {
  const ids = await activeTeachers(providers, semestercodeStart, semestercodeEnd)
  const teachers = await getCredits(ids, semestercodeStart, semestercodeEnd)
  const statistics = teachers.reduce((acc, teacher) => {
    return {
      ...acc,
      [teacher.id]: {
        name: teacher.name,
        code: teacher.code,
        id: teacher.id,
        stats: calculateCreditStatistics(teacher.credits)
      }
    }
  }, {})
  return statistics
}

const findTopTeachers = async (yearcode, limit=50) => {
  const credits = await Credit.findAll({
    attributes: ['id', 'credits', 'credittypecode'],
    include: [
      {
        model: Semester,
        attributes: [],
        required: true,
        where: {
          yearcode: {
            [Op.eq]: yearcode
          }
        }
      },
      {
        model: Teacher,
        attributes: ['id', 'name', 'code'],
        required: true
      },
      {
        model: Course,
        attributes: ['code', 'name', 'coursetypecode'],
        required: true
      }
    ]
  })
  const teacherstats = credits
    .filter(isRegularCourse)
    .map(credit => {
      const teachers = credit.teachers.map(({ id, name }) => ({ id, name }))
      const { passed, credits, failed } = parseCreditInfo(credit)
      return { passed, failed, credits, teachers }
    })
    .reduce((stats, data) => {
      data.teachers.forEach(({ id, name }) => {
        const teacher = stats[id] || { id, name }
        stats[id] = {
          ...teacher,
          stats: markCredit(teacher.stats, data.passed, data.failed, data.credits)
        }
      })
      return stats
    }, {})
  const top = Object.values(teacherstats)
    .sort((t1, t2) => t2.stats.credits - t1.stats.credits)
    .slice(0, limit)
    .map(({ stats, ...rest }) => ({
      ...rest,
      stats: {
        ...stats,
        credits: Math.floor(stats.credits)
      }
    }))
  return top
}

const saveTopTeachersToRedis = async (semestercode, data) => {
  await redisClient.hset(REDIS_TOP_TEACHERS, semestercode, JSON.stringify(data))
}

const getTopTeachersFromRedis = async semestercode => {
  const data = await redisClient.hgetAsync(REDIS_TOP_TEACHERS, semestercode)
  return !data ? [] : JSON.parse(data)
}

const topTeachers = async semestercode => {
  const topteachers = await getTopTeachersFromRedis(semestercode)
  return topteachers
}

module.exports = {
  bySearchTerm,
  teacherStats,
  yearlyStatistics,
  findTopTeachers,
  saveTopTeachersToRedis,
  getTopTeachersFromRedis,
  topTeachers
}
