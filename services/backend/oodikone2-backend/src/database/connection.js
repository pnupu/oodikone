const Sequelize = require('sequelize')
const Umzug = require('umzug')
const conf = require('../conf-backend')

const sequelize = new Sequelize(conf.DB_URL, {
  schema: conf.DB_SCHEMA,
  searchPath: conf.DB_SCHEMA,
  logging: false,
  operatorsAliases: false
})
sequelize.query(`SET SESSION search_path to ${conf.DB_SCHEMA}`)

const sequelizeKone = new Sequelize(conf.DB_URL, {
  schema: conf.DB_SCHEMA_KONE,
  searchPath: conf.DB_SCHEMA_KONE,
  logging: false,
  operatorsAliases: false
})
sequelizeKone.query(`SET SESSION search_path to ${conf.DB_SCHEMA_KONE}`) // See https://github.com/sequelize/sequelize/issues/10875

const runMigrations = async () => {
  try {
    const migrator = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: sequelize,
        tableName: 'migrations'
      },
      logging: console.log,
      migrations: {
        params: [
          sequelize.getQueryInterface(),
          Sequelize
        ],
        path: `${process.cwd()}/src/database/migrations`,
        pattern: /\.js$/,
        schema: conf.DB_SCHEMA
      }
    })
    const migrations = await migrator.up()

    console.log('Migrations up to date', migrations)
  } catch (e) {
    console.log('Migration error, message:', e)
  }
}

const runMigrationsKone = async () => {
  try {
    const migrator = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: sequelizeKone,
        tableName: 'migrations',
        schema: conf.DB_SCHEMA_KONE
      },
      logging: console.log,
      migrations: {
        params: [
          sequelizeKone.getQueryInterface(),
          Sequelize
        ],
        path: `${process.cwd()}/src/database/migrations_kone`,
        pattern: /\.js$/,
        schema: conf.DB_SCHEMA_KONE
      },
    })
    const migrations = await migrator.up()

    console.log('Kone Migrations up to date', migrations)
  } catch (e) {
    console.log('Kone Migration error, message:', e)
  }
}

const migrationPromise = !conf.isTest ? runMigrations().then(() => runMigrationsKone()) : Promise.resolve()

const forceSyncDatabase = async () => {
  try {
    await sequelize.getQueryInterface().createSchema(conf.DB_SCHEMA)
  } catch (e) {
    // console.log(e)
  }
  try {
    await sequelizeKone.getQueryInterface().createSchema(conf.DB_SCHEMA_KONE)
  } catch (e) {
    // console.log(e)
  }
  await sequelize.sync({ force: true })
  await sequelizeKone.sync({ force: true })
}

module.exports = {
  sequelize,
  sequelizeKone,
  migrationPromise,
  forceSyncDatabase
}