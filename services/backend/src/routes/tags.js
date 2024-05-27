const router = require('express').Router()
const { difference } = require('lodash')

const Students = require('../services/students')
const Tags = require('../services/tags')
const { getFullStudyProgrammeRights } = require('../util/utils')

const filterRelevantTags = (tags, userId) => {
  return tags.filter(tag => !tag.personal_user_id || tag.personal_user_id === userId)
}

const filterRelevantStudentTags = (studentTags, userId) => {
  return studentTags.filter(({ tag }) => !tag.personal_user_id || tag.personal_user_id === userId)
}

const userIsUnauthorized = (programmeRights, programmeCodes, roles) =>
  !programmeRights.includes(programmeCodes[0]) &&
  !programmeRights.includes(programmeCodes[1]) &&
  !roles?.includes('admin')

router.get('/tags/:studytrack', async (req, res) => {
  const { studytrack } = req.params
  const {
    user: { roles, id, programmeRights },
  } = req
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  const programmeCodes = studytrack.includes('KH') && studytrack.includes('MH') ? studytrack.split('-') : [studytrack]

  // Respond with null and 200 instead of 403 if the user isn't authorized to view the tags. This is to avoid unnecessary noise in Sentry
  if (userIsUnauthorized(fullStudyProgrammeRights, programmeCodes, roles)) return res.json(null)

  const tags = await Tags.findTagsByStudytrack(studytrack)
  res.status(200).json(filterRelevantTags(tags, id))
})

router.post('/tags', async (req, res) => {
  const {
    tag: { studytrack, tagname, year, personal_user_id },
  } = req.body
  const {
    user: { roles, id, programmeRights },
  } = req
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  const programmeCodes = studytrack.includes('KH') && studytrack.includes('MH') ? studytrack.split('-') : [studytrack]
  if (userIsUnauthorized(fullStudyProgrammeRights, programmeCodes, roles)) return res.status(403).end()

  await Tags.createNewTag({ studytrack, tagname, year, personal_user_id })
  const tags = await Tags.findTagsByStudytrack(studytrack)
  res.status(200).json(filterRelevantTags(tags, id))
})

router.delete('/tags', async (req, res) => {
  const { tag } = req.body
  const {
    user: { roles, id, programmeRights },
  } = req

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  const programmeCodes =
    tag.studytrack.includes('KH') && tag.studytrack.includes('MH') ? tag.studytrack.split('-') : [tag.studytrack]

  if (userIsUnauthorized(fullStudyProgrammeRights, programmeCodes, roles) && !(tag.personal_user_id === id))
    return res.status(403).end()

  await Tags.deleteTag(tag)
  const t = await Tags.findTagsByStudytrack(tag.studytrack)
  res.status(200).json(filterRelevantTags(t, id))
})

router.get('/studenttags/:studytrack', async (req, res) => {
  const { studytrack } = req.params
  const {
    user: { roles, id, programmeRights },
  } = req

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  const programmeCodes = studytrack.includes('KH') && studytrack.includes('MH') ? studytrack.split('-') : [studytrack]

  // Respond with null and 200 instead of 403 if the user isn't authorized to view the tags. This is to avoid unnecessary noise in Sentry
  if (
    !fullStudyProgrammeRights.includes(programmeCodes[0]) &&
    !fullStudyProgrammeRights.includes(programmeCodes[1]) &&
    !roles?.includes('admin')
  )
    return res.json(null)

  const result = await Tags.getStudentTagsByStudytrack(studytrack)
  res.status(200).json(filterRelevantStudentTags(result, id))
})

router.post('/studenttags', async (req, res) => {
  const { tags, studytrack, combinedProgramme } = req.body
  const {
    user: { roles, id, programmeRights },
  } = req

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  if (userIsUnauthorized(fullStudyProgrammeRights, [studytrack, combinedProgramme], roles)) return res.status(403).end()

  const studytrackCode = combinedProgramme ? `${studytrack}-${combinedProgramme}` : studytrack
  const existingTags = await Tags.findTagsByStudytrack(studytrackCode)
  const existingTagids = existingTags.map(t => t.tag_id)
  const tagids = [...new Set(tags.map(t => t.tag_id))]
  if (!tagids.find(t => existingTagids.includes(t))) return res.status(400).json({ error: 'The tag does not exist' })

  const studentnumbers = tags.map(t => t.studentnumber)
  const studentFromProgrammes = combinedProgramme ? [studytrack, combinedProgramme] : [studytrack]
  const students = await Students.filterStudentnumbersByAccessrights(studentnumbers, studentFromProgrammes)
  const missingStudents = difference(studentnumbers, students)
  if (missingStudents.length !== 0)
    return res
      .status(400)
      .json({ error: `Could not find the following students from the programme: ${missingStudents.join(', ')}` })

  await Tags.createMultipleStudentTags(tags)
  const result = await Tags.getStudentTagsByStudytrack(studytrackCode)
  res.status(200).json(filterRelevantStudentTags(result, id))
})

router.delete('/studenttags', async (req, res) => {
  const { tagId, studentnumbers, studytrack, combinedProgramme } = req.body
  const {
    user: { roles, id, programmeRights },
  } = req

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  if (userIsUnauthorized(fullStudyProgrammeRights, [studytrack, combinedProgramme], roles)) return res.status(403).end()

  const studytrackCode = combinedProgramme ? `${studytrack}-${combinedProgramme}` : studytrack
  const tags = await Tags.findTagsFromStudytrackById(studytrackCode, [tagId])
  if (tags.length === 0) return res.status(403).json({ error: 'The tag does not exist' })

  await Tags.deleteMultipleStudentTags(tagId, studentnumbers)
  const result = await Tags.getStudentTagsByStudytrack(studytrackCode)
  res.status(200).json(filterRelevantStudentTags(result, id))
})

module.exports = router
