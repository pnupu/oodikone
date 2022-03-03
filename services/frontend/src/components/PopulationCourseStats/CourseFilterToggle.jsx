import React from 'react'
import { Popup } from 'semantic-ui-react'
import { useSelector } from 'react-redux'
import { isCourseSelected, toggleCourseSelection } from 'components/FilterView/filters/courses'
import FilterToggleIcon from 'components/FilterToggleIcon'
import useFilters from 'components/FilterView/useFilters'
import { getTextIn } from '../../common'

const CourseFilterToggle = ({ course }) => {
  const { language } = useSelector(({ settings }) => settings)
  const { useFilterSelector, filterDispatch } = useFilters()

  const isActive = useFilterSelector(isCourseSelected(course.code))

  return (
    <Popup
      trigger={
        <FilterToggleIcon
          style={{ cursor: 'pointer' }}
          isActive={isActive}
          onClick={() => filterDispatch(toggleCourseSelection(course.code))}
        />
      }
      content={
        isActive ? (
          <span>
            Poista rajaus kurssin <b>{getTextIn(course.name, language)}</b> perusteella
          </span>
        ) : (
          <span>
            Rajaa opiskelijat kurssin <b>{getTextIn(course.name, language)}</b> perusteella
          </span>
        )
      }
      position="top right"
    />
  )
}

export default CourseFilterToggle
