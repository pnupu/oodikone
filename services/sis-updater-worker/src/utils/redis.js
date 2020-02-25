const redis = require('redis')
const redisLock = require('redis-lock')
const { promisify } = require('util')

const redisPromisify = async (func, ...params) =>
  new Promise((res, rej) => {
    func.call(client, ...params, (err, data) => {
      if (err) rej(err)
      else res(data)
    })
  })

const client = redis.createClient({
  url: process.env.REDIS_URI
})

const lock = promisify(redisLock(client))

const get = async key => await redisPromisify(client.get, key)

const incrby = async (key, val) => await redisPromisify(client.incrby, key, val)

module.exports = {
  lock,
  get,
  incrby
}
