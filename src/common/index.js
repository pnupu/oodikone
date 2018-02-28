import moment from 'moment';
import { API_BASE_PATH, API_DATE_FORMAT, DISPLAY_DATE_FORMAT } from '../constants';

const toJSON = res =>
  (res.status !== 204 ? res.json() : res);

const catchErrorsIntoJSON = (err, catchRejected) => {
  if (err.status === 401) throw err;

  try {
    return err.json().then((data) => {
      data.code = err.status;
      data.url = err.url;
      data.catchRejected = catchRejected;
      return data;
    }).catch(() => err);
    // fallback for fetch errors
  } catch (e) {
    if (err instanceof TypeError) {
      return {
        code: 503,
        error: `${err.message} ${err.stack}`,
        catchRejected
      };
    }
  }
  return err;
};

const checkForErrors = (res) => {
  if (!res.ok) {
    throw res;
  }

  return res;
};

export const get = path =>
  fetch(`${API_BASE_PATH}${path}`, {
    credentials: 'same-origin',
    'Cache-Control': 'no-cache'
  })
    .then(checkForErrors);

export const getJson = (path, catchRejected = true) => fetch(`${API_BASE_PATH}${path}`, {
  credentials: 'same-origin',
  'Cache-Control': 'no-cache'
})
  .then(checkForErrors)
  .then(toJSON).catch(err => catchErrorsIntoJSON(err, catchRejected));

export const deleteItem = (path, data, catchRejected = true) => fetch(`${API_BASE_PATH}${path}`, {
  method: 'DELETE',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  },
  credentials: 'same-origin',
  body: JSON.stringify(data)
})
  .then(checkForErrors)
  .then(toJSON).catch(err => catchErrorsIntoJSON(err, catchRejected));

export const postJson = (path, data, catchRejected = true) => fetch(`${API_BASE_PATH}${path}`, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  },
  credentials: 'same-origin',
  body: JSON.stringify(data)
})
  .then(checkForErrors)
  .then(toJSON).catch(err => catchErrorsIntoJSON(err, catchRejected));

export const containsOnlyNumbers = str => str.match('^\\d+$');

export const momentFromFormat = (date, format) => moment(date, format);

export const reformatDate = (date, outputFormat) => moment(date).format(outputFormat);

export const isInDateFormat = (date, format) => moment(date, format, true).isValid();

export const dateFromApiToDisplay = date =>
  moment(date, API_DATE_FORMAT).format(DISPLAY_DATE_FORMAT);

export const sortDatesWithFormat = (d1, d2, dateFormat) =>
  moment(d1, dateFormat) - moment(d2, dateFormat);

/* This should be done in backend */
export const removeInvalidCreditsFromStudent = student => ({
  ...student,
  courses: student.courses.map((course) => {
    if (course.credits > 25) {
      course.credits = 0;
    }
    return course;
  })
});

export const removeInvalidCreditsFromStudents = students =>
  students.map(student => removeInvalidCreditsFromStudent(student));

export const flattenAndCleanSamples = samples =>
  Object.keys(samples).map(sample => removeInvalidCreditsFromStudents(samples[sample]));

export const getStudentTotalCredits = student => student.courses.reduce((a, b) => a + b.credits, 0);
/* ******************** */

export const postJsonGetJson = (path, json, catchRejected = true) =>
  fetch(`${API_BASE_PATH}${path}`, {
    method: 'POST',
    credentials: 'same-origin',
    'Cache-Control': 'no-cache',
    headers: new Headers({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(json)
  })
    .then(checkForErrors)
    .then(toJSON).catch(err => catchErrorsIntoJSON(err, catchRejected));
