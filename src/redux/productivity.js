import itemreducer from './common/itemreducer'
import { callController } from '../apiConnection/index'

const prefix = 'STUDYPROGRAMME_PRODUCTIVITY_'

export const getProductivity = (studyprogrammeId) => {
  const route = `v2/studyprogrammes/${studyprogrammeId}/productivity`
  return callController(route, prefix, [], 'get')
}

export const clearProductivity = () => ({
  type: `${prefix}_CLEAR`
})


const reducer = itemreducer(prefix, { data: [] })

export default reducer
