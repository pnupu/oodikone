import React from 'react'
import { Divider, Loader } from 'semantic-ui-react'

import { useGetCreditStatsQuery } from 'redux/facultyStats'
import StackedBarChart from 'components/StudyProgramme/BasicOverview/StackedBarChart'
import DataTable from 'components/StudyProgramme/BasicOverview/DataTable'
import Toggle from '../../StudyProgramme/Toggle'
import InfoBox from '../../Info/InfoBox'
import InfotoolTips from '../../../common/InfoToolTips'
import '../faculty.css'

const Overview = ({ faculty, academicYear, setAcademicYear, specialGroups, setSpecialGroups }) => {
  const toolTips = InfotoolTips.Studyprogramme
  const yearType = academicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR'
  const special = specialGroups ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const credits = useGetCreditStatsQuery({ id: faculty?.code, yearType, specialGroups: special })

  const getDivider = (title, toolTipText) => (
    <>
      <div className="divider">
        <Divider data-cy={`Section-${toolTipText}`} horizontal>
          {title}
        </Divider>
      </div>
      <InfoBox content="Sisältää opintopisteet suoritusvuosittain. Suoritukset on jaoteltu Sisussa näkyvän kurssin suorituspäivän mukaan." />
      {/* <InfoBox content={toolTips[toolTipText]} /> */}
    </>
  )
  const isFetchingOrLoading = credits.isLoading || credits.isFetching

  const isError = credits.isError || (credits.isSuccess && !credits.data)

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

  return (
    <div className="faculty-overview">
      <div className="toggle-container">
        <Toggle
          cypress="YearToggle"
          toolTips={toolTips.YearToggle}
          firstLabel="Calendar year"
          secondLabel="Academic year"
          value={academicYear}
          setValue={setAcademicYear}
        />
        <Toggle
          cypress="StudentToggle"
          toolTips={toolTips.StudentToggle}
          firstLabel="All studyrights"
          secondLabel="Special studyrights excluded"
          value={specialGroups}
          setValue={setSpecialGroups}
        />
      </div>

      {isFetchingOrLoading ? (
        <Loader active style={{ marginTop: '10em' }} />
      ) : (
        <>
          {credits.isSuccess && credits.data && (
            <>
              {getDivider('Credits produced by the faculty', 'CreditsProducedByTheFaculty')}
              <div className="section-container">
                <StackedBarChart
                  cypress="CreditsProducedByTheSFaculty"
                  data={credits?.data?.graphStats}
                  labels={credits?.data?.years}
                />
                <DataTable
                  cypress="CreditsProducedByTheFaculty"
                  data={credits?.data?.tableStats}
                  titles={credits?.data?.titles}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default Overview
