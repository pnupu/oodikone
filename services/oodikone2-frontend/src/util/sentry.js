import * as Sentry from '@sentry/browser'
import { isProduction, SENTRY_RELEASE, TAG } from '../conf'
import { BASE_PATH } from '../constants'

const initializeSentry = () => {
  if (!isProduction || BASE_PATH !== '/' || TAG !== 'staging' || TAG !== 'latest') return

  Sentry.init({
    dsn: 'https://020b79f0cbb14aad94cc9d69a1ea9d52@sentry.cs.helsinki.fi/2',
    environment: TAG,
    release: SENTRY_RELEASE
  })
}

export default initializeSentry
