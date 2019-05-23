const { stan } = require('./src/nats_connection')
const cron = require('node-cron');
const Schedule = require('./models')
const fs = require('fs');
const logger = require('./logger')
const { updateStudentNumberList } = require('./src/student_list_updater')
const { scheduleActiveStudents, scheduleAllStudentsAndMeta } = require('./src/schedule_students')

let updatedCount = 0
let scheduledCount = 0
let fetchedCount = 0

const TIMEZONE = 'Europe/Helsinki'

const updateTask = async (task, status, type) => {
  if (type) {
    await Schedule.findOneAndUpdate({ task }, { task, status, updatedAt: new Date(), type }, { upsert: true })

  } else {
    await Schedule.findOneAndUpdate({ task }, { task, status, updatedAt: new Date(), type: 'other', active: true }, { upsert: true })
  }
}

stan.on('connect', async () => {
  cron.schedule('0 0 1 * *', async () => {
    // Update ALL students and meta every month
    scheduleAllStudentsAndMeta()
  }, { TIMEZONE })

  cron.schedule('20 4 1 1,3,8,10 *', async () => {
    // At 04:20 on day-of-month 1 in January, March, August, and October.”
    updateStudentNumberList()
  })
  cron.schedule('0 23 * * *', async () => {
    // Update ACTIVE students every night
    scheduleActiveStudents()
  }, { TIMEZONE })

  cron.schedule('0 0-9 * * *', async () => {
    // Just log some statistics about updater during nights
    logger.info(`${updatedCount} TASKS DONE IN LAST HOUR\n ${scheduledCount} TASKS SCHEDULED IN LAST HOUR\n ${fetchedCount} TASKS FETCHED FROM API IN LAST HOUR`)
    updatedCount = 0
    fetchedCount = 0
    scheduledCount = 0
  }, { TIMEZONE })
  cron.schedule('0 7 * * *', async () => {
    stan.publish('RefreshOverview', null, (err, guid) => {
      if (err) {
        console.log('publish failed', 'RefreshOverview')
      } else {
        console.log('published', 'RefreshOverview')
      }
    })
    stan.publish('RefreshStudyrightAssociations', null, (err, guid) => {
      if (err) {
        console.log('publish failed', 'RefreshStudyrightAssociations')
      } else {
        console.log('published', 'RefreshStudyrightAssociations')
      }
    })
    stan.publish('updateAttainmentDates', null, (err, guid) => {
      if (err) {
        console.log('publish failed', 'UpdateAttainmentDates')
      } else {
        console.log('published', 'UpdateAttainmentDates')
      }
    })
  }, { TIMEZONE })

  const statusSub = stan.subscribe('status')

  statusSub.on('message', async (msg) => {
    const message = msg.getData().split(':')
    if (message[1]) {
      return
    }
    switch (message[1]) {
      case 'DONE':
        updatedCount = updatedCount + 1
        break
      case 'FETCHED':
        fetchedCount = fetchedCount + 1
        break
      case 'SCHEDULED':
        scheduledCount = scheduledCount + 1
        break
    }
    const isValidStudentId = (id) => {
      if (/^0\d{8}$/.test(id)) {
        // is a 9 digit number
        const multipliers = [7, 1, 3, 7, 1, 3, 7]
        const checksum = id
          .substring(1, 8)
          .split('')
          .reduce((sum, curr, index) => {
            return (sum + curr * multipliers[index]) % 10
          }, 0)
        return (10 - checksum) % 10 == id[8]
      }
      return false
    }
    await updateTask(message[0], message[1], !!isValidStudentId(message[0]) ? 'student' : 'other')
  })
 
})

