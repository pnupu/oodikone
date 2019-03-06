require('dotenv').config()

const { NODE_ENV } = process.env
let DB_URL = process.env.DB_URL
if (NODE_ENV === 'test') {
  DB_URL = process.env.TEST_DB
}
else if (NODE_ENV === 'anon') {
  DB_URL = process.env.ANON_DB
}
const frontend_addr = process.env.FRONT_URL
const redis = process.env.REDIS
const TOKEN_SECRET = process.env.TOKEN_SECRET
const DB_SCHEMA = process.env.DB_SCHEMA || 'public'
const CERT_PATH = process.env.CERT_PATH // production/staging only
const KEY_PATH = process.env.KEY_PATH // production/staging only
const OODILEARN_URL = process.env.OODILEARN_URL
const USERSERVICE_URL = process.env.USERSERVICE_URL
const PORT = process.env.NODE_ENV === 'test' ? 8079 : 8080

const FEATURES = {
  ERROR_HANDLER: false
}

const formatURL = url => {
  return (!!url && !url.startsWith('http')) ? `http://${url}` : url
}

if (process.env.NODE_ENV === 'dev' && process.env.FEATURES) {
  const toggled = process.env.FEATURES.split(',')
  toggled.map(toggle => toggle.trim()).forEach(feature => {
    if (FEATURES[feature] !== undefined) {
      FEATURES[feature] = true
    }
  })
}

const OODI = {
  test: 'http://localhost',
  anon: process.env.OODI_ADDR_ANON
}

const OODI_ADDR = OODI[process.env.NODE_ENV] || process.env.OODI_ADDR
const ACCESS_TOKEN_HEADER_KEY = 'x-access-token'

let requiredGroup = 'grp-oodikone-users'
if (process.env.NODE_ENV === 'staging') {
  requiredGroup = 'grp-oodikone-staging-users'
}
if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'test') {
  requiredGroup = null
}

module.exports = {
  frontend_addr, DB_URL, redis, TOKEN_SECRET, DB_SCHEMA, OODI_ADDR, CERT_PATH, KEY_PATH, FEATURES, OODILEARN_URL,
  USERSERVICE_URL: formatURL(USERSERVICE_URL), ACCESS_TOKEN_HEADER_KEY, PORT,
  requiredGroup
}