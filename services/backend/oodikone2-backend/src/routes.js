const accessLogger = require('./middleware/accesslogger')
const log = require('./routes/log')
const courses = require('./routes/courses')
const students = require('./routes/students')
const population = require('./routes/population')
const login = require('./routes/login')
const superlogin = require('./routes/superlogin')
const language = require('./routes/language')
const users = require('./routes/users')
const elementdetails = require('./routes/elementdetails')
const auth = require('./middleware/auth')
const teachers = require('./routes/teachers')
const usage = require('./routes/usage')
const providers = require('./routes/providers')
const faculties = require('./routes/faculties')
const semesters = require('./routes/semesters')
const oodilearn = require('./routes/oodilearn')
const courseGroups = require('./routes/courseGroups')
const mandatoryCourses = require('./routes/mandatorycourses')
const mandatoryCourseLabels = require('./routes/mandatorycourselabels')
const ping = require('./routes/ping')
const oodi = require('./routes/oodi')
const task = require('./routes/tasks')
const feedback = require('./routes/feedback')
const tags = require('./routes/tags')
const updater = require('./routes/updater')

module.exports = (app, url) => {
  app.use(url, log)
  app.use(url, login)
  app.use(`${url}/superlogin`, superlogin)
  app.use(url, ping)
  app.use(auth.checkAuth, auth.checkRequiredGroup, auth.checkUserBlacklisting, accessLogger)
  app.use(url, elementdetails)
  app.use(url, courses)
  app.use(url, students)
  app.use(url, population)
  app.use(url, language)
  app.use(url, providers)
  app.use(url, faculties)
  app.use(url, semesters)
  app.use(url, tags)
  app.use(`${url}/updater`, auth.roles(['admin']), updater)
  app.use(`${url}/teachers`, auth.roles(['teachers']), teachers)
  app.use(`${url}/users`, auth.roles(['users']), users)
  app.use(`${url}/feedback`, feedback)
  app.use(`${url}/usage`, auth.roles(['usage']), usage)
  app.use(`${url}/oodilearn`, auth.roles(['oodilearn']), oodilearn)
  app.use(`${url}/course-groups`, auth.roles(['coursegroups']), courseGroups)
  app.use(`${url}/mandatory_courses`, mandatoryCourses)
  app.use(`${url}/mandatory-course-labels`, mandatoryCourseLabels)
  app.use(`${url}/oodi`, auth.roles(['dev']), oodi)
  app.use(url, auth.roles(['dev', 'admin']), task)
}