const logger = require('../../util/logger')
const { setBasicStats, setCreditStats, setGraduationStats, setStudytrackStats } = require('../analyticsService')
const { computeCreditsProduced } = require('../providerCredits')
const { getBasicStatsForStudytrack } = require('./studyprogrammeBasics')
const { getGraduationStatsForStudytrack } = require('./studyprogrammeGraduations')
const { getStudytrackStatsForStudyprogramme } = require('./studytrackStats')

const updateBasicView = async (code, combinedProgramme) => {
  const specialCalendar = {
    yearType: 'CALENDAR_YEAR',
    specialGroups: 'SPECIAL_INCLUDED',
  }
  const specialAcademic = {
    yearType: 'ACADEMIC_YEAR',
    specialGroups: 'SPECIAL_INCLUDED',
  }
  const specialExcludedCalendar = {
    yearType: 'CALENDAR_YEAR',
    specialGroups: 'SPECIAL_EXCLUDED',
  }

  const specialExcludedAcademic = {
    yearType: 'ACADEMIC_YEAR',
    specialGroups: 'SPECIAL_EXCLUDED',
  }

  const options = [specialCalendar, specialAcademic, specialExcludedCalendar, specialExcludedAcademic]
  for (const option of options) {
    try {
      const basicStats = await getBasicStatsForStudytrack({
        studyprogramme: code,
        combinedProgramme,
        settings: {
          isAcademicYear: option.yearType === 'ACADEMIC_YEAR',
          includeAllSpecials: option.specialGroups === 'SPECIAL_INCLUDED',
        },
      })
      await setBasicStats(basicStats, option.yearType, option.specialGroups)

      const creditStats = await computeCreditsProduced(
        code,
        option.yearType === 'ACADEMIC_YEAR',
        option.specialGroups === 'SPECIAL_INCLUDED'
      )

      await setCreditStats(
        creditStats,
        option.yearType === 'ACADEMIC_YEAR',
        option.specialGroups === 'SPECIAL_INCLUDED'
      )

      const graduationStats = await getGraduationStatsForStudytrack({
        studyprogramme: code,
        combinedProgramme,
        settings: {
          isAcademicYear: option.yearType === 'ACADEMIC_YEAR',
          includeAllSpecials: option.specialGroups === 'SPECIAL_INCLUDED',
        },
      })
      await setGraduationStats(graduationStats, option.yearType, option.specialGroups)
    } catch (e) {
      logger.error(`Programme basic stats failed: ${e}`)
      logger.error(`Stack: ${e.stack}`)
    }
  }
  return 'OK'
}

const updateStudytrackView = async (code, combinedProgramme, associations) => {
  const specialGraduated = {
    graduated: 'GRADUATED_INCLUDED',
    specialGroups: 'SPECIAL_INCLUDED',
  }
  const specialExcludedGraduated = {
    graduated: 'GRADUATED_INCLUDED',
    specialGroups: 'SPECIAL_EXCLUDED',
  }
  const specialGraduatedExcluded = {
    graduated: 'GRADUATED_EXCLUDED',
    specialGroups: 'SPECIAL_INCLUDED',
  }
  const specialExcludedGraduatedExcluded = {
    graduated: 'GRADUATED_EXCLUDED',
    specialGroups: 'SPECIAL_EXCLUDED',
  }

  const options = [
    specialGraduated,
    specialExcludedGraduated,
    specialGraduatedExcluded,
    specialExcludedGraduatedExcluded,
  ]

  for (const option of options) {
    try {
      const stats = await getStudytrackStatsForStudyprogramme({
        studyprogramme: code,
        combinedProgramme,
        settings: {
          specialGroups: option.specialGroups === 'SPECIAL_INCLUDED',
          graduated: option.graduated === 'GRADUATED_INCLUDED',
        },
        associations,
      })
      await setStudytrackStats(stats, option.graduated, option.specialGroups)
    } catch (e) {
      logger.error(`Studytrack stats update failed ${e}`)
    }
  }

  return 'OK'
}

module.exports = {
  updateBasicView,
  updateStudytrackView,
}
