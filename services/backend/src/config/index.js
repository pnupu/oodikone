// Node env to use
const isDev = process.env.NODE_ENV === 'development'
const isStaging = process.env.REACT_APP_STAGING === 'true'
const isProduction = !isStaging && process.env.NODE_ENV === 'production'

// Sentry
const sentryRelease = process.env.SENTRY_RELEASE || ''
const sentryEnvironment = process.env.SENTRY_ENVIRONMENT || ''
const sentryDSN = process.env.SENTRY_DSN || ''
const runningInCI = process.env.CI === 'true'

// IAM group
const requiredGroup = isStaging
  ? ['grp-oodikone-staging-users', 'grp-oodikone-basic-staging-users']
  : ['grp-oodikone-users', 'grp-oodikone-basic-users']

// Pate
const pateToken = process.env.PATE_API_TOKEN || ''

// Jami
const jamiUrl = process.env.JAMI_URL || ''

// Importer client
const importerUrl = process.env.IMPORTER_DB_API_URL || ''
const importerToken = process.env.IMPORTER_DB_API_TOKEN || ''

// Sisu
const sisUrl = process.env.SIS_HOST
const sisGrapqlAppAccount = process.env.SIS_GRAPHQL_APPLICATION_ACCOUNT
const sisGrapqlAppKey = process.env.SIS_GRAPHQL_APPLICATION_KEY

// Networking: Urls & ports
const baseUrl = isDev ? '/api' : ''
const frontUrl = process.env.FRONT_URL
const backendPort = 8080

// System run in whose environment
const serviceProvider = process.env.SERVICE_PROVIDER ? process.env.SERVICE_PROVIDER.toLowerCase() : 'toska'

// Optional logout-url configuration
const configLogoutUrl = serviceProvider === 'toska' ? undefined : process.env.LOGOUT_URL

// Other stuff
const { DB_URL_KONE, DB_URL_USER, SECRET_TOKEN, SIS_DB_URL, SIS_UPDATER_URL, CRYPT_KEY } = process.env

let DB_MAX_CONNECTIONS = parseInt(process.env.DB_MAX_CONNECTIONS, 10)
if (Number.isNaN(DB_MAX_CONNECTIONS)) {
  DB_MAX_CONNECTIONS = 5 // sequelize's default
}
let DB_MAX_CRON_CONNECTIONS = DB_MAX_CONNECTIONS - 5
if (DB_MAX_CRON_CONNECTIONS < 1) {
  DB_MAX_CRON_CONNECTIONS = 1
}

const redis = process.env.REDIS
const DB_SCHEMA_KONE = process.env.DB_SCHEMA_KONE || 'public'

const KONE_PASSWORD = process.env.KONE_PASSWORD || 'postgres'
const USER_PASSWORD = process.env.USER_PASSWORD || 'postgres'
const SIS_PASSWORD = process.env.SIS_PASSWORD || 'postgres'

module.exports = {
  DB_URL_USER,
  CRYPT_KEY,
  DB_URL_KONE,
  DB_MAX_CONNECTIONS,
  DB_MAX_CRON_CONNECTIONS,
  redis,
  SECRET_TOKEN,
  DB_SCHEMA_KONE,
  KONE_PASSWORD,
  USER_PASSWORD,
  SIS_PASSWORD,
  requiredGroup,
  SIS_DB_URL,
  SIS_UPDATER_URL,
  runningInCI,
  sentryRelease,
  sentryEnvironment,
  sentryDSN,
  isProduction,
  pateToken,
  jamiUrl,
  baseUrl,
  frontUrl,
  backendPort,
  importerUrl,
  importerToken,
  isDev,
  isStaging,
  serviceProvider,
  configLogoutUrl,
  sisUrl,
  sisGrapqlAppAccount,
  sisGrapqlAppKey,
}
