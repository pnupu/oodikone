import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Table, Form, Input, Popup, Button, Icon } from 'semantic-ui-react'
import { func, arrayOf, object, number, shape } from 'prop-types'
import { getTranslate } from 'react-localize-redux'
import _ from 'lodash'

import { setPopulationFilter, removePopulationFilterOfCourse } from '../../redux/populationFilters'
import { courseParticipation } from '../../populationFilters'

const formatGradeDistribution = grades => _.replace(JSON.stringify(grades, null, 1), /{\n*|[^\S\r\n[^:\s]]|}|"|,/g, '')

class PopulationCourseStats extends Component {
  static propTypes = {
    courses: shape({
      coursestatistics: arrayOf(object).isRequired,
      coursetypes: shape({}).isRequired,
      disciplines: shape({}).isRequired
    }).isRequired,
    translate: func.isRequired,
    setPopulationFilter: func.isRequired,
    populationSize: number.isRequired,
    selectedCourses: arrayOf(object).isRequired,
    removePopulationFilterOfCourse: func.isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      sortBy: 'students',
      reversed: false,
      limit: parseInt(this.props.populationSize * 0.15, 10),
      showGradeDistribution: false
    }
  }

  active = course =>
    this.props.selectedCourses
      .find(c => course.name === c.name && course.code === c.code) !== undefined

  limitPopulationToCourse = course => () => {
    if (!this.active(course.course)) {
      const params = { course, field: 'all' }
      this.props.setPopulationFilter(courseParticipation(params))
    } else {
      this.props.removePopulationFilterOfCourse(course.course)
    }
  }

  sortBy(criteria) {
    return () => {
      let { reversed } = this.state
      if (this.state.sortBy === 'percentage' && criteria === 'percentage') {
        reversed = !reversed
      }
      this.setState({ sortBy: criteria, reversed })
    }
  }

  criteria = () => (c1, c2) => {
    const orderByCode = (code1, code2) =>
      (code1.course.code < code2.course.code ? -1 : 1)

    if (this.state.reversed) {
      const val = c1.stats[this.state.sortBy] - c2.stats[this.state.sortBy]
      return (val !== 0 ? val : orderByCode(c1, c2))
    }
    const val = c2.stats[this.state.sortBy] - c1.stats[this.state.sortBy]
    return (val !== 0 ? val : orderByCode(c1, c2))
  }

  limit = () => (course) => {
    if (this.state.limit === 0) {
      return true
    }
    return course.stats.students >= this.state.limit
  }
  renderGradeDistributionTable = ({ translate, sortBy, courses }) => (
    <Table celled sortable>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>
            {translate('populationCourses.course')}
          </Table.HeaderCell>
          <Table.HeaderCell>{translate('populationCourses.code')}</Table.HeaderCell>
          <Table.HeaderCell
            sorted={sortBy === 'students' ? 'descending' : null}
            onClick={this.sortBy('students')}
          >
            {translate('populationCourses.students')}
          </Table.HeaderCell>
          <Table.HeaderCell>
            {translate('populationCourses.passed')}
          </Table.HeaderCell>
          <Table.HeaderCell>
            1
          </Table.HeaderCell>
          <Table.HeaderCell>
            2
          </Table.HeaderCell>
          <Table.HeaderCell>
            3
          </Table.HeaderCell>
          <Table.HeaderCell>
            4
          </Table.HeaderCell>
          <Table.HeaderCell>
            5
          </Table.HeaderCell>
          <Table.HeaderCell>
            Other
          </Table.HeaderCell>
          <Table.HeaderCell>
            {translate('populationCourses.failed')}
          </Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {courses.coursestatistics.sort(this.criteria()).filter(this.limit()).map(course => (
          <Popup
            key={course.course.code}
            trigger={
              <Table.Row active={this.active(course.course)}>
                <Table.Cell onClick={this.limitPopulationToCourse(course)}>
                  {course.course.name.fi}
                </Table.Cell>
                <Table.Cell>{course.course.code}</Table.Cell>
                <Table.Cell>
                  {course.stats.passed + course.stats.failed}
                </Table.Cell>
                <Table.Cell>
                  {course.stats.passed}
                </Table.Cell>
                <Table.Cell>
                  {course.grades ? course.grades[1] || 0 : 0}
                </Table.Cell>
                <Table.Cell>
                  {course.grades ? course.grades[2] || 0 : 0}
                </Table.Cell>
                <Table.Cell>
                  {course.grades ? course.grades[3] || 0 : 0}
                </Table.Cell>
                <Table.Cell>
                  {course.grades ? course.grades[4] || 0 : 0}
                </Table.Cell>
                <Table.Cell>
                  {course.grades ? course.grades[5] || 0 : 0}
                </Table.Cell>
                <Table.Cell>
                  {course.grades ?
                    _.sum(Object.values(_.omit(course.grades, [1, 2, 3, 4, 5])))
                    || 0 : 0}
                </Table.Cell>
                <Table.Cell>
                  {course.stats.failed}
                </Table.Cell>
              </Table.Row>}
            flowing
            hoverable
            inverted
            position="top right"
            hideOnScroll
            content={course.grades ? <pre>{formatGradeDistribution(course.grades)}</pre> : 'Nothing to see here'}
          />
        ))}
      </Table.Body>
    </Table>
  )
  renderBasicTable = ({ translate, sortBy, direction, courses }) => (
    <Table celled sortable>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell colSpan="2">
            {translate('populationCourses.course')}
          </Table.HeaderCell>
          <Table.HeaderCell
            rowSpan="2"
            sorted={sortBy === 'students' ? 'descending' : null}
            onClick={this.sortBy('students')}
          >
            {translate('populationCourses.students')}
          </Table.HeaderCell>
          <Table.HeaderCell
            colSpan="3"
          >
            {translate('populationCourses.passed')}
          </Table.HeaderCell>
          <Table.HeaderCell
            colSpan="2"
          >
            {translate('populationCourses.failed')}
          </Table.HeaderCell>
          <Table.HeaderCell colSpan="2">{translate('populationCourses.attempts')}</Table.HeaderCell>
          <Table.HeaderCell colSpan="2">{translate('populationCourses.percentageOfPopulation')}</Table.HeaderCell>
        </Table.Row>
        <Table.Row>
          <Table.HeaderCell>{translate('populationCourses.name')}</Table.HeaderCell>
          <Table.HeaderCell>{translate('populationCourses.code')}</Table.HeaderCell>
          <Table.HeaderCell
            sorted={sortBy === 'passed' ? 'descending' : null}
            onClick={this.sortBy('passed')}
          >
            {translate('populationCourses.number')}
          </Table.HeaderCell>
          <Table.HeaderCell
            sorted={sortBy === 'retryPassed' ? 'descending' : null}
            onClick={this.sortBy('retryPassed')}
          >
            {translate('populationCourses.passedAfterRetry')}
          </Table.HeaderCell>
          <Table.HeaderCell
            sorted={sortBy === 'percentage' ? direction : null}
            onClick={this.sortBy('percentage')}
          >
            {translate('populationCourses.percentage')}
          </Table.HeaderCell>

          <Table.HeaderCell
            sorted={sortBy === 'failed' ? 'descending' : null}
            onClick={this.sortBy('failed')}
          >
            {translate('populationCourses.number')}
          </Table.HeaderCell>
          <Table.HeaderCell
            rowSpan="2"
            sorted={sortBy === 'failedMany' ? 'descending' : null}
            onClick={this.sortBy('failedMany')}
          >
            {translate('populationCourses.failedManyTimes')}
          </Table.HeaderCell>
          <Table.HeaderCell>{translate('populationCourses.number')}</Table.HeaderCell>
          <Table.HeaderCell>
            {translate('populationCourses.perStudent')}
          </Table.HeaderCell>
          <Table.HeaderCell>{translate('populationCourses.passed')}</Table.HeaderCell>
          <Table.HeaderCell>{translate('populationCourses.attempted')}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {courses.coursestatistics.sort(this.criteria()).filter(this.limit()).map(course => (
          <Table.Row key={course.course.code} active={this.active(course.course)}>
            <Table.Cell onClick={this.limitPopulationToCourse(course)}>
              {course.course.name.fi}
            </Table.Cell>
            <Table.Cell>{course.course.code}</Table.Cell>
            <Table.Cell>
              {course.stats.passed + course.stats.failed}
            </Table.Cell>
            <Table.Cell>
              {course.stats.passed}
            </Table.Cell>
            <Table.Cell>
              {course.stats.retryPassed}
            </Table.Cell>
            <Table.Cell>{course.stats.percentage} %</Table.Cell>
            <Table.Cell>
              {course.stats.failed}
            </Table.Cell>
            <Table.Cell>
              {course.stats.failedMany}
            </Table.Cell>
            <Table.Cell>{course.stats.attempts}</Table.Cell>
            <Table.Cell>
              {(course.stats.attempts / (course.stats.passed + course.stats.failed)).toFixed(2)}
            </Table.Cell>
            <Table.Cell>{course.stats.passedOfPopulation} %</Table.Cell>
            <Table.Cell>{course.stats.triedOfPopulation} %</Table.Cell>
          </Table.Row>))}
      </Table.Body>
    </Table>
  )

  render() {
    const { courses, translate } = this.props
    const { reversed } = this.state
    const direction = reversed ? 'descending' : 'ascending'
    if (courses.length === 0) return null
    return (
      <div>
        <Form>
          <Form.Field inline>
            <label>{translate('populationCourses.limit')}</label>
            <Input
              value={this.state.limit}
              onChange={e => this.setState({ limit: e.target.value })}
            />
            <Button icon floated="right" onClick={() => this.setState({ showGradeDistribution: !this.state.showGradeDistribution })}>
              <Icon color="black" size="big" name="chart bar" />
            </Button>
          </Form.Field>
        </Form>
        {this.state.showGradeDistribution ?
          this.renderGradeDistributionTable(this.props, this.state)
          :
          this.renderBasicTable(this.props, this.state, direction)
        }
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  const courseFilters = state.populationFilters.filters.filter(f => f.type === 'CourseParticipation')
  const selectedCourses = courseFilters.map(f => f.params.course.course)
  return {
    translate: getTranslate(state.locale),
    selectedCourses,
    populationSize: state.populations.data.length > 0 ? state.populations.data.length : 0
  }
}

export default connect(
  mapStateToProps,
  { setPopulationFilter, removePopulationFilterOfCourse }
)(PopulationCourseStats)
