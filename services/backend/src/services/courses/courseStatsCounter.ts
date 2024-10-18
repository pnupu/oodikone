import { EnrollmentState, Name } from '../../types'
import { lengthOf, percentageOf } from '../../util'

const fall: string[] = []
const spring: string[] = []
for (let i = 0; i < 7; i++) {
  fall[i] = `${i}-FALL`
  spring[i] = `${i}-SPRING`
}

const initializePassingSemesters = () => {
  const initialValue = 0
  const passingSemesters: Record<string, number> = {
    BEFORE: initialValue,
    LATER: initialValue,
  }
  for (let i = 0; i < 7; i++) {
    passingSemesters[fall[i]] = initialValue
    passingSemesters[spring[i]] = initialValue
  }
  return passingSemesters
}

const getEnrolledStudents = (enrollments: DynamicEnrollments) => {
  if (enrollments) {
    return Object.keys(enrollments)
      .filter(key => key !== EnrollmentState.ENROLLED && key !== 'semesters')
      .reduce((acc, key) => [...acc, ...[...enrollments[key]].map(studentNumber => studentNumber)], [] as string[])
  }
  return []
}

const getFilteredEnrolledNoGrade = (
  enrollments: DynamicEnrollments,
  enrolledStudents: string[],
  allStudents: string[]
) => {
  if (enrollments[EnrollmentState.ENROLLED]) {
    return [...enrollments[EnrollmentState.ENROLLED]]
      .filter(student => !enrolledStudents.includes(student) && !allStudents.includes(student))
      .reduce((acc, student) => ({ ...acc, [student]: true }), {} as Record<string, boolean>)
  }
  return {} as Record<string, boolean>
}

type DynamicEnrollments = {
  [state in EnrollmentState]?: Set<string>
} & {
  semesters: {
    [semester: string]: {
      [state in EnrollmentState]?: Set<string>
    }
  }
}

type Stats = {
  students: number
  passed: number
  failed: number
  attempts: number
  improvedPassedGrade: number
  percentage: number | undefined
  passedOfPopulation: number | undefined
  triedOfPopulation: number | undefined
  perStudent: number | undefined
  passingSemesters: Record<string, number>
  passingSemestersCumulative?: Record<string, number>
  totalStudents?: number
  totalEnrolledNoGrade?: number
  percentageWithEnrollments?: number
}

type Students = {
  all: Record<string, boolean>
  passed: Record<string, boolean>
  failed: Record<string, boolean>
  improvedPassedGrade: Record<string, boolean>
  markedToSemester: Record<string, boolean>
  enrolledNoGrade: Record<string, boolean>
}

type Course = {
  code: string
  name: Name
  substitutions: string[]
}

type Grades = {
  [grade: string]: {
    count: number
    status: {
      passingGrade: boolean
      improvedGrade: boolean
      failingGrade: boolean
    }
  }
}

export type CourseStatistics = {
  stats: Stats
  students: Students
  course: Course
  grades: Grades
}

export class CourseStatsCounter {
  private studentsInTotal: number
  private course: Course
  private students: Students
  private stats: Stats
  private enrollments: DynamicEnrollments
  private grades: Grades

  constructor(code: string, name: Name, studentsInTotal: number) {
    this.studentsInTotal = studentsInTotal
    this.course = {
      code,
      name,
      substitutions: [],
    }
    this.students = {
      all: {},
      passed: {},
      failed: {},
      improvedPassedGrade: {},
      markedToSemester: {},
      enrolledNoGrade: {},
    }
    this.stats = {
      students: 0,
      passed: 0,
      failed: 0,
      attempts: 0,
      improvedPassedGrade: 0,
      percentage: undefined,
      passedOfPopulation: undefined,
      triedOfPopulation: undefined,
      perStudent: undefined,
      passingSemesters: initializePassingSemesters(),
    }
    this.enrollments = {
      semesters: {},
    }
    this.grades = {}
  }

  private markAttempt() {
    this.stats.attempts += 1
  }

  private markToAll(studentNumber: string) {
    this.students.all[studentNumber] = true
  }

  private markPassedSemester(semester: string) {
    this.stats.passingSemesters[semester]++
  }

  private markToSemester(studentNumber: string) {
    this.students.markedToSemester[studentNumber] = true
  }

  public markCredit(
    studentNumber: string,
    grade: string,
    passed: boolean,
    failed: boolean,
    improved: boolean,
    semester: string
  ) {
    this.markAttempt()
    this.markGrade(grade, passed, failed, improved)
    this.markToAll(studentNumber)
    if (passed) {
      if (!this.students.markedToSemester[studentNumber]) {
        this.markPassedSemester(semester)
        this.markToSemester(studentNumber)
      }
      this.markPassingGrade(studentNumber)
    } else if (improved) {
      this.markImprovedGrade(studentNumber)
    } else if (failed) {
      this.markFailedGrade(studentNumber)
    }
  }

  public markEnrollment(studentNumber: string, state: EnrollmentState, semester: string) {
    if (!this.enrollments[state]) {
      this.enrollments[state] = new Set()
    }
    this.enrollments[state].add(studentNumber)
    if (!this.enrollments.semesters[semester]) {
      this.enrollments.semesters[semester] = {}
    }
    if (!this.enrollments.semesters[semester][state]) {
      this.enrollments.semesters[semester][state] = new Set()
    }
    this.enrollments.semesters[semester][state].add(studentNumber)
  }

  private failedBefore(studentNumber: string) {
    return this.students.failed[studentNumber] !== undefined
  }

  private passedBefore(studentNumber: string) {
    return this.students.passed[studentNumber] !== undefined
  }

  private removeFromFailed(studentNumber: string) {
    delete this.students.failed[studentNumber]
  }

  private markPassingGrade(studentNumber: string) {
    this.students.passed[studentNumber] = true
    if (this.failedBefore(studentNumber)) {
      this.removeFromFailed(studentNumber)
    }
  }

  private markImprovedGrade(studentNumber: string) {
    this.removeFromFailed(studentNumber)
    this.students.improvedPassedGrade[studentNumber] = true
    this.students.passed[studentNumber] = true
  }

  private markFailedGrade(studentNumber: string) {
    if (this.passedBefore(studentNumber)) {
      this.removeFromFailed(studentNumber)
    } else {
      this.students.failed[studentNumber] = true
    }
  }

  private markGrade(grade: string, passingGrade: boolean, failingGrade: boolean, improvedGrade: boolean) {
    const gradeCount = this.grades[grade] ? this.grades[grade].count || 0 : 0
    this.grades[grade] = { count: gradeCount + 1, status: { passingGrade, improvedGrade, failingGrade } }
  }

  public addCourseSubstitutions(substitutions: string[]) {
    this.course.substitutions = substitutions
  }

  private getPassingSemestersCumulative() {
    const { passingSemesters } = this.stats
    const attemptStats: Record<string, number> = {
      BEFORE: passingSemesters.BEFORE,
    }

    attemptStats['0-FALL'] = passingSemesters.BEFORE + passingSemesters['0-FALL']
    attemptStats['0-SPRING'] = attemptStats['0-FALL'] + passingSemesters['0-SPRING']

    for (let i = 1; i < 7; i++) {
      attemptStats[fall[i]] = attemptStats[spring[i - 1]] + passingSemesters[fall[i]]
      attemptStats[spring[i]] = attemptStats[fall[i]] + passingSemesters[spring[i]]
    }

    attemptStats.LATER = attemptStats['6-SPRING'] + passingSemesters.LATER

    return attemptStats
  }

  public getFinalStats() {
    const { stats, students } = this
    const enrolledStudents = getEnrolledStudents(this.enrollments)
    const allStudents = Object.keys(students.all).map(student => student)
    const filteredEnrolledNoGrade = getFilteredEnrolledNoGrade(this.enrollments, enrolledStudents, allStudents)

    students.all = { ...students.all, ...filteredEnrolledNoGrade }
    students.enrolledNoGrade = filteredEnrolledNoGrade
    stats.students = lengthOf(students.all)
    stats.passed = lengthOf(students.passed)
    stats.failed = lengthOf(students.failed)
    stats.improvedPassedGrade = lengthOf(students.improvedPassedGrade)
    stats.percentage = percentageOf(stats.passed, stats.students)
    stats.passedOfPopulation = percentageOf(stats.passed, this.studentsInTotal)
    stats.triedOfPopulation = percentageOf(stats.students, this.studentsInTotal)
    stats.perStudent = percentageOf(stats.attempts, stats.passed + stats.failed) / 100
    stats.passingSemestersCumulative = this.getPassingSemestersCumulative()
    stats.totalStudents = stats.students
    stats.totalEnrolledNoGrade = lengthOf(filteredEnrolledNoGrade)
    stats.percentageWithEnrollments = percentageOf(stats.passed, stats.totalStudents)

    return { stats, students, course: this.course, grades: this.grades } as CourseStatistics
  }
}
