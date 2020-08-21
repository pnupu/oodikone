import React, { useEffect } from 'react'
import GraduatedFromProgramme from './filters/GraduatedFromProgramme'
import TransferredToProgramme from './filters/TransferredToProgramme'
import EnrollmentStatus from './filters/EnrollmentStatus'
import CreditsEarned from './filters/CreditsEarned'
import Gender from './filters/Gender'
import StartYearAtUni from './filters/StartYearAtUni'
import Courses from './filters/Courses'
import useAnalytics from './useAnalytics'
import Grade from './filters/Grade'

export const PopulationStatisticsFilters = () => {
  const analytics = useAnalytics()

  useEffect(() => {
    analytics.setTarget('Population Statistics')
  })

  return (
    <>
      <GraduatedFromProgramme />
      <TransferredToProgramme />
      <EnrollmentStatus />
      <CreditsEarned />
      <Gender />
      <StartYearAtUni />
      <Courses />
    </>
  )
}

export const CoursePopulationFilters = () => {
  const analytics = useAnalytics()

  useEffect(() => {
    analytics.setTarget('Course Population')
  })

  return (
    <>
      <Grade />
      <EnrollmentStatus />
      <Gender />
      <StartYearAtUni />
    </>
  )
}

export const CustomPopulationFilters = () => {
  const analytics = useAnalytics()

  useEffect(() => {
    analytics.setTarget('Custom Population')
  })

  return (
    <>
      <EnrollmentStatus />
      <Gender />
      <StartYearAtUni />
      <Courses />
    </>
  )
}
