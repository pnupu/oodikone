const CATEGORY = {
  FAIL_FIRST: 'failedFirst',
  PASS_FIRST: 'passedFirst',
  FAIL_RETRY: 'failedRetry',
  PASS_RETRY: 'passedRetry'
}

class CourseYearlyStatsCounter {

  constructor() {
    this.groups = {}
    this.programmes = {}
    this.history = {
      passed: new Set(),
      failed: new Set(),
      attempts: new Set()
    }
  }

  initProgramme(code, name) {
    this.programmes[code] = { name, students: [] }
  }

  initGroup(groupcode, name, coursecode, yearcode) {
    this.groups[groupcode] = {
      code: groupcode,
      name,
      coursecode,
      attempts: {
        grades: {},
        classes: {
          passed: [],
          failed: []
        }
      },
      students: {},
      yearcode
    }
  }

  studentHistory(studentnumber) {
    const attempted = this.history.attempts.has(studentnumber)
    const passed = this.history.passed.has(studentnumber)
    const failed = this.history.failed.has(studentnumber)
    return { attempted, passed, failed }
  }

  markStudyProgramme(code, name, studentnumber) {
    if (!this.programmes[code]) {
      this.initProgramme(code, name)
    }
    if (!this.programmes[code].students.includes(studentnumber)) {
      this.programmes[code].students.push(studentnumber)
    }
  }

  markStudyProgrammes(studentnumber, programmes) {
    programmes.forEach(({ code, name }) => {
      this.markStudyProgramme(code, name, studentnumber)
    })
  }

  markCreditToHistory(studentnumber, passed) {
    const passedBefore = this.history.passed.has(studentnumber)
    if (!passedBefore) {
      this.history.attempts.add(studentnumber)
      if (passed) {
        this.history.passed.add(studentnumber)
        this.history.failed.delete(studentnumber)
      } else {
        this.history.failed.add(studentnumber)
      }
    }
  }

  getCreditCategory(studentnumber, passed, attempted) {
    if (!attempted) {
      return passed ? CATEGORY.PASS_FIRST : CATEGORY.FAIL_FIRST
    } else {
      return passed ? CATEGORY.PASS_RETRY : CATEGORY.FAIL_RETRY
    }
  }

  markCreditToStudents(studentnumber, passed, grade, groupcode) {
    const { students } = this.groups[groupcode]
    const { attempted } = this.studentHistory(studentnumber)
    const category = this.getCreditCategory(studentnumber, passed, attempted)
    const student = students[studentnumber]
    if (!student || passed || student.failed) {
      students[studentnumber] = { passed, category, grade }
    }
  }

  markCreditToGroup(studentnumber, passed, grade, groupcode, groupname, coursecode, yearcode) {
    if (!this.groups[groupcode]) {
      this.initGroup(groupcode, groupname, coursecode, yearcode)
    }
    this.markCreditToStudents(studentnumber, passed, grade, groupcode)
    this.markCreditToAttempts(studentnumber, passed, grade, groupcode)
    this.markCreditToHistory(studentnumber, passed)
  }

  markCreditToAttempts(studentnumber, passed, grade, groupcode) {
    const { attempts } = this.groups[groupcode]
    const { grades, classes } = attempts
    if (!grades[grade]) {
      grades[grade] = []
    }
    grades[grade].push(studentnumber)
    if (passed) {
      classes.passed.push(studentnumber)
    } else {
      classes.failed.push(studentnumber)
    }
  }

  formatStudentStatistics(students) {
    const grades = {}
    const classes = {}
    const studentnumbers = []
    Object.entries(students).forEach(([studentnumber, stat]) => {
      const { grade, category } = stat
      grades[grade] = grades[grade] ? grades[grade].concat(studentnumber) : [studentnumber]
      classes[category] = classes[category] ? classes[category].concat(studentnumber) : [studentnumber]
      studentnumbers.includes(studentnumber) ? null : studentnumbers.push(studentnumber)
    })
    return { grades, classes, studentnumbers }
  }

  formatGroupStatistics() {
    return Object.values(this.groups).map(({ students, ...rest }) => ({
      ...rest,
      students: this.formatStudentStatistics(students)
    }))
  }

  getFinalStatistics() {
    // change students set to list
    const programmes = Object.keys(this.programmes).reduce((acc, code) => {
      acc[code] = { ...this.programmes[code], students: [...this.programmes[code].students] }
      return acc
    }, {})
    return {
      programmes,
      statistics: this.formatGroupStatistics()
    }
  }

}

module.exports = { CourseYearlyStatsCounter, CATEGORY }