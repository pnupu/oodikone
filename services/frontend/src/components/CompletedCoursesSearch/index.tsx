import { useState } from 'react'
import { Icon, Message } from 'semantic-ui-react'

import { useTitle } from '@/common/hooks'
import { CompletedCoursesSearch } from './CompletedCoursesSearch'
import { CompletedCoursesSearchResults } from './CompletedCoursesSearchResults'

export const CompletedCourses = () => {
  useTitle('Search completed courses')
  const [searchValues, setValues] = useState({ courseList: [], studentList: [] })

  return (
    <div className="segmentContainer">
      <Message style={{ maxWidth: '800px', fontSize: '16px' }}>
        <Message.Header>Check completed courses</Message.Header>
        <p>
          Here you can search by a list of student and course numbers to see whether students have completed certain
          courses yet. The tool will also show if students have enrolled on the course, if they have not yet completed
          it. Course substitutions are taken into account.
        </p>
        <p>
          <Icon color="green" fitted name="check" />: Student has completed the course with a passing grade. <br />
          <Icon color="yellow" fitted name="minus" />: Student has not completed the course, but has an active
          enrollment from less than 6 months ago. <br />
          <Icon color="grey" fitted name="minus" />: Student has not completed the course, but has an enrollment from
          more than 6 months ago. <br />
          <b>Empty cell</b>: Student has no completion or enrollment for the course.
        </p>
      </Message>
      <CompletedCoursesSearch setValues={setValues} />
      <div style={{ paddingTop: '25px' }}>
        {searchValues && searchValues.courseList?.length > 0 && searchValues.studentList?.length > 0 && (
          <CompletedCoursesSearchResults searchValues={searchValues} />
        )}
      </div>
    </div>
  )
}
