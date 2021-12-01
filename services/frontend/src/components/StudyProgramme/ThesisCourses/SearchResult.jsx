import React from 'react'
import { connect } from 'react-redux'
import { Segment } from 'semantic-ui-react'
import { getCourseSearchResults } from '../../../selectors/courses'
import useLanguage from '../../LanguagePicker/useLanguage'
import SortableTable from '../../SortableTable'

const SearchResult = ({ courses, getCourseActions }) => {
  const { language } = useLanguage()

  if (!courses || courses.length === 0) return <Segment content="No results" />

  return (
    <SortableTable
      getRowKey={c => c.code}
      tableProps={{ celled: true }}
      columns={[
        {
          key: 'code',
          title: 'Code',
          getRowVal: c => c.code,
          headerProps: { width: 2, textAlign: 'center' },
        },
        {
          key: 'name',
          title: 'Name',
          getRowVal: c => c.name[language],
          headerProps: { width: 12, textAlign: 'left' },
        },
        {
          key: 'actions',
          title: 'Action',
          getRowContent: getCourseActions,
          headerProps: { width: 2, textAlign: 'center' },
        },
      ]}
      data={courses}
    />
  )
}

SearchResult.defaultProps = {
  courses: [],
}

const mapStateToProps = state => {
  const { thesisCourses } = state
  const { data } = thesisCourses || null
  const thesisCourseCodes = data.map(c => c.courseCode)
  const searchResults = getCourseSearchResults(state).courses
  const filteredResults = searchResults.filter(c => !thesisCourseCodes.includes(c.code))
  return {
    courses: filteredResults,
  }
}
export default connect(mapStateToProps)(SearchResult)
