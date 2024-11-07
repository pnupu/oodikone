const { eachLimit } = require('async')
const crypto = require('crypto')
const { chunk } = require('lodash')

const {
  NATS_GROUP,
  SIS_UPDATER_SCHEDULE_CHANNEL,
  SIS_MISC_SCHEDULE_CHANNEL,
  CHUNK_SIZE,
  isDev,
  DEV_SCHEDULE_COUNT,
  REDIS_TOTAL_META_KEY,
  REDIS_TOTAL_STUDENTS_KEY,
  REDIS_LAST_HOURLY_SCHEDULE,
  REDIS_LATEST_MESSAGE_RECEIVED,
  LATEST_MESSAGE_RECEIVED_THRESHOLD,
  ENABLE_WORKER_REPORTING,
} = require('./config')
const { knexConnection } = require('./db/connection')
const { startPrePurge, startPurge } = require('./purge')
const { logger } = require('./utils/logger')
const { redisClient } = require('./utils/redis')
const { stan, opts } = require('./utils/stan')

const IMPORTER_TABLES = {
  attainments: 'attainments',
  organisations: 'organisations',
  studyLevels: 'study_levels',
  educationTypes: 'education_types',
  studyYears: 'study_years',
  courseUnits: 'course_units',
  modules: 'modules',
  persons: 'persons',
  studyrights: 'studyrights',
  termRegistrations: 'term_registrations',
  studyRightPrimalities: 'study_right_primalities',
  curriculumPeriods: 'curriculum_periods',
}

const schedule = async (args, channel = SIS_UPDATER_SCHEDULE_CHANNEL) => {
  if (!ENABLE_WORKER_REPORTING) {
    stan.publish(channel, JSON.stringify(args))
    return
  }

  const id = crypto.randomUUID()

  const completionChannel = stan.subscribe(`SIS_COMPLETED_CHANNEL-${id}`, NATS_GROUP, opts)

  return new Promise((resolve, reject) => {
    const messageHandler = msg => {
      let data = null

      try {
        data = JSON.parse(msg.getData())
      } catch (error) {
        logger.error({
          message: 'Unable to parse completion message.',
          meta: error.stack,
        })

        return
      }

      if (data.id === id) {
        if (data.success) {
          resolve()
        } else {
          logger.error(`Job failed: ${data.message}`)
          reject(data.message)
        }

        completionChannel.off('message', messageHandler)
        completionChannel.unsubscribe()
      }

      msg.ack()
    }

    completionChannel.on('message', messageHandler)

    stan.publish(channel, JSON.stringify({ ...args, id }))
  })
}

const createJobs = async (entityIds, type, channel = SIS_UPDATER_SCHEDULE_CHANNEL) => {
  const redisKey = type === 'students' ? REDIS_TOTAL_STUDENTS_KEY : REDIS_TOTAL_META_KEY
  await redisClient.incrBy(redisKey, entityIds.length)
  await schedule({ entityIds, type }, channel)
}

const scheduleFromDb = async ({
  table,
  distinct,
  pluck = 'id',
  whereNotNull,
  scheduleId,
  limit,
  whereIn,
  clean = true,
}) => {
  const { knex } = knexConnection
  const knexBuilder = knex(table)
  if (distinct) knexBuilder.distinct(distinct)
  if (pluck) knexBuilder.pluck(pluck)
  if (whereNotNull) knexBuilder.whereNotNull(whereNotNull)
  if (limit) knexBuilder.limit(limit)
  if (whereIn) knexBuilder.whereIn(...whereIn)
  if (!clean) {
    const lastHourlyScheduleFromRedis = await redisClient.get(REDIS_LAST_HOURLY_SCHEDULE)
    const lastHourlySchedule = lastHourlyScheduleFromRedis ?? new Date(new Date().setHours(0, 0, 0, 0))
    knexBuilder.where('updated_at', '>=', new Date(lastHourlySchedule))
  }
  const entities = await knexBuilder
  await eachLimit(chunk(entities, CHUNK_SIZE), 10, async entity => await createJobs(entity, scheduleId || table))
  return entities.length
}

const scheduleMeta = async (clean = true) => {
  logger.info('Scheduled meta')
  await scheduleFromDb({
    table: IMPORTER_TABLES.organisations,
    clean,
  })

  await scheduleFromDb({
    table: IMPORTER_TABLES.studyLevels,
    clean,
  })

  await scheduleFromDb({
    table: IMPORTER_TABLES.educationTypes,
    clean,
  })

  const creditTypes = [4, 7, 9, 10]
  await createJobs(creditTypes, 'credit_types')

  await scheduleFromDb({
    table: IMPORTER_TABLES.courseUnits,
    distinct: 'group_id',
    pluck: 'group_id',
    limit: isDev ? DEV_SCHEDULE_COUNT : null,
    clean,
  })

  await scheduleFromDb({
    scheduleId: 'study_modules',
    table: IMPORTER_TABLES.modules,
    whereIn: ['type', ['StudyModule', 'DegreeProgramme']],
    distinct: 'group_id',
    pluck: 'group_id',
    limit: isDev ? DEV_SCHEDULE_COUNT : null,
    clean,
  })

  await scheduleFromDb({
    table: IMPORTER_TABLES.curriculumPeriods,
    clean,
  })
}

const scheduleStudents = async () => {
  logger.info('Scheduled students')
  await scheduleFromDb({
    scheduleId: 'students',
    table: IMPORTER_TABLES.persons,
    whereNotNull: 'student_number',
    pluck: 'id',
    limit: isDev ? DEV_SCHEDULE_COUNT : null,
  })
}

const getHourlyPersonsToUpdate = async () => {
  logger.info('Getting hourly persons to update')
  const { knex } = knexConnection
  const lastHourlyScheduleFromRedis = await redisClient.get(REDIS_LAST_HOURLY_SCHEDULE)
  const lastHourlySchedule = lastHourlyScheduleFromRedis ?? new Date(new Date().setHours(0, 0, 0, 0))
  const getUpdatedFrom = (table, pluck) => {
    const builder = knex(table).pluck(pluck)
    if (lastHourlySchedule) builder.where('updated_at', '>=', new Date(lastHourlySchedule))
    if (isDev) builder.limit(DEV_SCHEDULE_COUNT)
    return builder
  }

  const [
    updatedPersons,
    updatedAttainmentStudents,
    updatedStudyrightStudents,
    updatedTermRegistrationStudents,
    updatedStudyRightPrimalitiesStudents,
  ] = await Promise.all([
    getUpdatedFrom(IMPORTER_TABLES.persons, 'id').whereNotNull('student_number'),
    getUpdatedFrom(IMPORTER_TABLES.attainments, 'person_id'),
    getUpdatedFrom(IMPORTER_TABLES.studyrights, 'person_id'),
    getUpdatedFrom(IMPORTER_TABLES.termRegistrations, 'student_id'),
    getUpdatedFrom(IMPORTER_TABLES.studyRightPrimalities, 'student_id'),
  ])

  return Array.from(
    new Set([
      ...updatedPersons,
      ...updatedAttainmentStudents,
      ...updatedStudyrightStudents,
      ...updatedTermRegistrationStudents,
      ...updatedStudyRightPrimalitiesStudents,
    ])
  )
}

const scheduleByStudentNumbers = async studentNumbers => {
  logger.info('Scheduling by student numbers')
  const { knex } = knexConnection
  const personsToUpdate = await knex('persons').column('id', 'student_number').whereIn('student_number', studentNumbers)

  await eachLimit(
    chunk(personsToUpdate, CHUNK_SIZE),
    10,
    async s => await createJobs(s, 'students', SIS_MISC_SCHEDULE_CHANNEL)
  )
}

const scheduleByCourseCodes = async courseCodes => {
  logger.info('Scheduling course codes')
  const { knex } = knexConnection
  const coursesToUpdate = await knex(IMPORTER_TABLES.courseUnits)
    .whereIn('code', courseCodes)
    .distinct('group_id')
    .pluck('group_id')

  await eachLimit(
    chunk(coursesToUpdate, CHUNK_SIZE),
    10,
    async course => await createJobs(course, IMPORTER_TABLES.courseUnits)
  )
}

const isUpdaterActive = async () => {
  const latestUpdaterHandledMessage = await redisClient.get(REDIS_LATEST_MESSAGE_RECEIVED)
  return (
    latestUpdaterHandledMessage &&
    new Date().getTime() - new Date(latestUpdaterHandledMessage).getTime() <= LATEST_MESSAGE_RECEIVED_THRESHOLD
  )
}

const scheduleHourly = async () => {
  try {
    // Update meta that have changed between now and the last update
    await scheduleMeta(false)

    // Update persons whose attainments, studyrights etc. have changed
    // between now and the last update
    const personsToUpdate = await getHourlyPersonsToUpdate()

    await eachLimit(chunk(personsToUpdate, CHUNK_SIZE), 10, async students => await createJobs(students, 'students'))
  } catch (error) {
    logger.error({ message: 'Hourly scheduling failed', meta: error.stack })
    throw error
  }
}

const scheduleProgrammes = async () => {
  logger.info('Scheduling programmes')
  const { knex } = knexConnection

  const modules = await knex('modules').where({ type: 'DegreeProgramme' })

  const entityIds = modules.map(module => module.id)

  try {
    await createJobs(entityIds, 'programme_modules')
  } catch (error) {
    logger.error({ message: 'Programme module scheduling failed', meta: error.stack })
    throw error
  }
}

const scheduleWeekly = async () => {
  try {
    await scheduleMeta()
    await scheduleProgrammes()
    await scheduleStudents()
  } catch (error) {
    logger.error({ message: 'Weekly scheduling failed', meta: error.stack })
    throw error
  }
}

const schedulePrePurge = async () => {
  try {
    await startPrePurge()
  } catch (error) {
    logger.error({ message: 'Purge failed', meta: error.stack })
    throw error
  }
}

const schedulePurge = async () => {
  try {
    await startPurge()
  } catch (error) {
    logger.error({ message: 'Purge failed', meta: error.stack })
    throw error
  }
}

module.exports = {
  scheduleMeta,
  scheduleStudents,
  scheduleProgrammes,
  scheduleHourly,
  scheduleWeekly,
  schedulePrePurge,
  schedulePurge,
  scheduleByStudentNumbers,
  scheduleByCourseCodes,
  isUpdaterActive,
}
