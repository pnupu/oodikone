import { Includeable, Op, col, fn } from 'sequelize'

import {
  ElementDetail,
  Studyright,
  Student,
  StudyrightElement,
  SISStudyRight,
  SISStudyRightElement,
  Credit,
} from '../../models'
import { CreditTypeCode, ElementDetailType, Name } from '../../types'
import { formatStudyright } from './format'

export const getStudyRightsInProgramme = async (
  programmeCode: string,
  onlyGraduated: boolean,
  includeStudentsAndCredits = false
) => {
  const where: Record<string, any> = { code: programmeCode }
  if (onlyGraduated) {
    where.graduated = true
  }

  const studyRights = await SISStudyRight.findAll({
    attributes: ['id'],
    include: {
      model: SISStudyRightElement,
      as: 'studyRightElements',
      attributes: [],
      where,
    },
  })

  const include: Includeable[] = [
    {
      model: SISStudyRightElement,
      as: 'studyRightElements',
      attributes: ['phase', 'code', 'name', 'startDate', 'endDate', 'graduated', 'studyTrack'],
    },
  ]

  if (includeStudentsAndCredits) {
    include.push({
      model: Student,
      attributes: ['gender_code', 'home_country_en'],
      include: [
        {
          model: Credit,
          attributes: ['attainment_date', 'credits'],
          where: {
            isStudyModule: false,
            credittypecode: {
              [Op.in]: [CreditTypeCode.PASSED, CreditTypeCode.APPROVED],
            },
          },
          required: false,
        },
      ],
    })
  }

  return (
    await SISStudyRight.findAll({
      attributes: ['id', 'extentCode', 'semesterEnrollments', 'studentNumber'],
      include,
      where: {
        id: {
          [Op.in]: studyRights.map(studyRight => studyRight.toJSON().id),
        },
      },
    })
  ).map(studyRight => studyRight.toJSON())
}

export const getStudyTracksForProgramme = async (studyProgramme: string) => {
  const result: Array<Pick<SISStudyRightElement, 'studyTrack'>> = await SISStudyRightElement.findAll({
    attributes: [[fn('DISTINCT', col('study_track')), 'studyTrack']],
    where: {
      code: studyProgramme,
    },
    raw: true,
  })

  return result
    .map(studyTrack => studyTrack.studyTrack)
    .filter(studyTrack => studyTrack != null)
    .reduce<Record<string, Name | 'All students of the programme'>>(
      (acc, track) => {
        acc[track.code] = track.name
        return acc
      },
      { [studyProgramme]: 'All students of the programme' }
    )
}

export const getStudyRights = async students =>
  (
    await Studyright.findAll({
      attributes: [
        'studyrightid',
        'startdate',
        'studystartdate',
        'enddate',
        'graduated',
        'prioritycode',
        'extentcode',
        'cancelled',
        'facultyCode',
        'actual_studyrightid',
        'semesterEnrollments',
      ],
      where: {
        student_studentnumber: students,
      },
      include: [
        {
          model: StudyrightElement,
          include: [
            {
              model: ElementDetail,
              where: {
                type: ElementDetailType.PROGRAMME,
              },
            },
          ],
        },
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
    })
  ).map(formatStudyright)
