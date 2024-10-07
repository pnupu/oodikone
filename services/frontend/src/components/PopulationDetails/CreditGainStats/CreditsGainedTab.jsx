import { Divider, Grid } from 'semantic-ui-react'

import { ADMISSION_TYPES } from '@/common'
import { filter as admissionTypeFilter } from '@/components/FilterView/filters/admissionType'
import { CreditsGainedTable } from './CreditsGainedTable'

const admissionTypes = Object.values(ADMISSION_TYPES)

export const CreditsGainedTab = ({ allStudents, programmeGoalTime, query, year }) => {
  if (!allStudents || !allStudents.length || !query) return null

  const { studyRights } = query

  const getCreditsGainedTable = type => {
    const filteredStudents = allStudents.filter(admissionTypeFilter(studyRights?.programme)(type))

    return (
      <CreditsGainedTable
        filteredStudents={filteredStudents}
        key={`creditsgainedtable-admissiontype-${type}`}
        programmeGoalTime={programmeGoalTime}
        type={type || 'Ei valintatapaa'}
        year={year}
      />
    )
  }

  const admissionTypesAvailable =
    allStudents.length !== allStudents.filter(admissionTypeFilter(studyRights?.programme)(null)).length

  return (
    <Grid centered padded>
      <Grid.Row data-cy="credits-gained-main-table">
        <CreditsGainedTable
          filteredStudents={allStudents}
          programmeGoalTime={programmeGoalTime}
          type="All students of the class"
          year={year}
        />
      </Grid.Row>
      {admissionTypesAvailable && (
        <>
          <Divider horizontal>By admission type</Divider>
          <Grid.Row>{admissionTypes.map(type => getCreditsGainedTable(type))}</Grid.Row>
        </>
      )}
    </Grid>
  )
}
