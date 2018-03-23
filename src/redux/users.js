import { callController } from '../apiConnection'

export const getUsers = () => {
  const route = '/users'
  const prefix = 'GET_USERS_'
  return callController(route, prefix)
}

export const enableUser = (id) => {
  const route = '/users/enable'
  const prefix = 'ENABLE_USER_'
  const data = { id }
  const method = 'post'
  return callController(route, prefix, data, method)
}

const reducer = (state = [], action) => {
  switch (action.type) {
    case 'GET_USERS_ATTEMPT':
      return {
        pending: true,
        error: state.error,
        data: state.data
      }
    case 'GET_USERS_FAILURE':
      return {
        pending: false,
        error: true,
        data: action.response
      }
    case 'GET_USERS_SUCCESS':
      return {
        pending: false,
        error: false,
        data: action.response
      }
    case 'ENABLE_USER_ATTEMPT':
      return {
        pending: true,
        error: state.error,
        data: state.data
      }
    case 'ENABLE_USER_FAILURE':
      return {
        pending: false,
        error: true,
        data: action.response
      }
    case 'ENABLE_USER_SUCCESS':
      return {
        ...state,
        data: state.data.filter(a => a.id !== action.response.id)
          .concat(action.response)
      }
    default:
      return state
  }
}

export default reducer
