import React, { useState, useEffect } from 'react'
import { Header, Segment, Tab } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { bool, shape, func, string } from 'prop-types'
import './courseStatistics.css'
import SearchForm from './SearchForm'
import SingleCourseTab from './SingleCourseTab'
import FacultyLevelStatistics from './FacultyLevelStatistics'
import SummaryTab from './SummaryTab'
import ProgressBar from '../ProgressBar'
import { useProgress, useTitle } from '../../common/hooks'
import { clearCourseStats } from '../../redux/coursestats'

const MENU = {
  SUM: 'Summary',
  COURSE: 'Course',
  QUERY: 'New query',
  FACULTY: 'Faculty statistics'
}

const CourseStatistics = props => {
  const { singleCourseStats, clearCourseStats, history, statsIsEmpty, loading, initCourseCode } = props

  const [activeIndex, setActiveIndex] = useState(0)
  const [selected, setSelected] = useState(initCourseCode)
  const { onProgress, progress } = useProgress(loading)
  useTitle('Course statistics')

  useEffect(() => {
    if (statsIsEmpty) {
      setSelected(initCourseCode)
      setActiveIndex(0)
    }
  }, [statsIsEmpty])

  const switchToCourse = coursecode => {
    setActiveIndex(1)
    setSelected(coursecode)
  }

  const getPanes = () => {
    const panes = [
      {
        menuItem: MENU.SUM,
        render: () => <SummaryTab onClickCourse={switchToCourse} />
      },
      {
        menuItem: MENU.COURSE,
        render: () => <SingleCourseTab selected={selected || initCourseCode} />
      },
      {
        menuItem: MENU.FACULTY,
        render: () => <FacultyLevelStatistics />
      },
      {
        menuItem: {
          key: 'query',
          content: MENU.QUERY,
          icon: 'search',
          position: 'right',
          onClick: () => {
            history.push('/coursestatistics')
            clearCourseStats()
          }
        },
        render: () => null
      }
    ]
    return !singleCourseStats ? panes : panes.filter(p => p.menuItem !== MENU.SUM)
  }

  const handleTabChange = (e, { activeIndex, panes }) => {
    if (panes[activeIndex].menuItem.key !== 'query') {
      setActiveIndex(activeIndex)
    }
  }

  const panes = getPanes()
  return (
    <div className="container">
      <Header className="segmentTitle" size="large">
        Course Statistics
      </Header>
      <Segment className="contentSegment">
        {statsIsEmpty || history.location.search === '' ? (
          <SearchForm onProgress={onProgress} />
        ) : (
          <Tab
            menu={{ attached: false, borderless: false }}
            panes={panes}
            activeIndex={activeIndex}
            onTabChange={handleTabChange}
          />
        )}
        <ProgressBar fixed progress={progress} />
      </Segment>
    </div>
  )
}

CourseStatistics.propTypes = {
  statsIsEmpty: bool.isRequired,
  singleCourseStats: bool.isRequired,
  history: shape({}).isRequired,
  clearCourseStats: func.isRequired,
  loading: bool.isRequired,
  initCourseCode: string.isRequired
}

const mapStateToProps = ({ courseStats }) => {
  const courses = Object.keys(courseStats.data)
  return {
    pending: courseStats.pending,
    error: courseStats.error,
    statsIsEmpty: courses.length === 0,
    singleCourseStats: courses.length === 1,
    loading: courseStats.pending,
    initCourseCode: courses[0] || ''
  }
}

export default withRouter(
  connect(
    mapStateToProps,
    { clearCourseStats }
  )(CourseStatistics)
)
