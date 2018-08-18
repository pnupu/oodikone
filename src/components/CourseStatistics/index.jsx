import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { Form, Button, Header, Checkbox, Message, Transition, List, Dropdown, Segment, Table } from 'semantic-ui-react'
import Datetime from 'react-datetime'
import _ from 'lodash'
import Timeout from '../Timeout'
import CourseStatisticsSearch from '../CourseStatisticsSearch'
import CoursePassRateChart from '../CoursePassRateChart'
import LanguageChooser from '../LanguageChooser'
import { getMultipleCourseStatistics, removeCourseStatistics } from '../../redux/courseStatistics'
import { emptyCourseSearch } from '../../redux/courses'
import { isValidYear, isInDateFormat, reformatDate, momentFromFormat } from '../../common'


import style from './courseStatistics.css'
import sharedStyles from '../../styles/shared'

const { shape, func, array, string } = PropTypes

const INITIAL_YEARS = {
  start: '2017',
  end: '2018'
}

class CourseStatistics extends Component {
  state = {
    selectedCourses: [],
    ...INITIAL_YEARS,
    separate: false,
    validYear: true,
    error: '',
    isLoading: false,
    courseLevel: true,
    selectedProgramme: 'all'
  }

  handleResultSelect = (e, { value, checked }) => {
    if (checked) {
      this.setState({ selectedCourses: [...this.state.selectedCourses, value] })
    } else {
      this.setState({
        selectedCourses:
          [...this.state.selectedCourses].filter(code => code !== value)
      })
    }
  }

  addYear = change => () => {
    const year = this.state[change]
    const nextYear = momentFromFormat(year, 'YYYY').add(1, 'year')
    this.handleYearSelection(nextYear, change)
  }

  subtractYear = change => () => {
    const year = this.state[change]
    const previousYear = momentFromFormat(year, 'YYYY').subtract(1, 'year')
    this.handleYearSelection(previousYear, change)
  }

  fetchCourseStatistics = () => {
    const { start, end, separate, selectedCourses } = this.state
    const { selected } = this.props.courseStatistics
    const { language } = this.props
    const query = {
      codes: selectedCourses,
      start: Number(start),
      end: Number(end),
      separate: String(separate),
      language
    }
    const aa = selected.find(olquery =>
      olquery.separate === query.separate &&
      olquery.end === query.end &&
      olquery.start === query.start &&
      olquery.codes === query.codes)
    if (!aa) {
      this.setState({ isLoading: true })
      this.props.getMultipleCourseStatistics(query)
        .then(() => {
          this.setState({ selected: [], error: '', isLoading: false })
          this.props.emptyCourseSearch()
        })
      this.setState({ error: '' })
    } else this.setState({ error: 'Course with selected parameters already in analysis' })
  }

  removeCourseStatistics = query => () => this.props.removeCourseStatistics(query)

  startBeforeEnd = (year, change) => {
    if (change === 'start') {
      return this.state.end > reformatDate(year, 'YYYY')
    }
    return this.state.start < reformatDate(year, 'YYYY')
  }

  handleYearSelection = (year, change) => {
    this.setState({ error: '' })
    const validYear = isInDateFormat(year, 'YYYY') && isValidYear(year) && this.startBeforeEnd(year, change)
    if (validYear) {
      this.setState({
        validYear,
        [change]: reformatDate(year, 'YYYY')
      })
    } else {
      this.setState({ validYear })
    }
  }

  handleCourseLevelSwitch = () => () => {
    this.setState({ courseLevel: !this.state.courseLevel })
  }

  handleStartYearSelection = (year) => {
    this.handleYearSelection(year, 'start')
  }

  handleEndYearSelection = (year) => {
    this.handleYearSelection(year, 'end')
  }

  handleSemesterSeparate = () => {
    this.setState({ error: '' })
    const bool = this.state.separate
    this.setState({ separate: !bool })
  }
  handleProgrammeChange = (e, { value }) => {
    this.setState({ selectedProgramme: value })
  }

  renderErrorMessage = () => {
    const { error } = this.state
    if (error) {
      return (<Message
        error
        color="red"
        header={error}
      />)
    }
    return error
  }
  renderDropdown = programmeOptions => (
    <Dropdown
      placeholder="Select study programme"
      search
      selection
      value={this.state.selectedProgramme}
      options={programmeOptions}
      onChange={this.handleProgrammeChange}
      closeOnChange
      basic
      header="Select programme"
    />
  )

  renderForm = () => {
    const { validYear, start, end, isLoading } = this.state

    return (
      <Form loading={isLoading}>
        <Form.Group key="year" className={style.yearSelectorGroup}>
          <Form.Field error={!validYear} className={style.yearSelect}>
            <label>Start year</label>
            <Datetime
              className={style.yearSelectInput}
              control={Datetime}
              dateFormat="YYYY"
              timeFormat={false}
              closeOnSelect
              value={start}
              isValidDate={isValidYear}
              onChange={this.handleStartYearSelection}
            />
          </Form.Field>
          <Form.Field className={style.yearControl}>
            <Button.Group basic vertical className={style.yearControlButtonGroup}>
              <Button
                icon="plus"
                className={style.yearControlButton}
                onClick={this.addYear('start')}
              />
              <Button
                icon="minus"
                className={style.yearControlButton}
                onClick={this.subtractYear('start')}
              />
            </Button.Group>
          </Form.Field>
          <Form.Field error={!validYear} className={style.yearSelect}>
            <label>End year</label>
            <Datetime
              className={style.yearSelectInput}
              control={Datetime}
              dateFormat="YYYY"
              timeFormat={false}
              closeOnSelect
              value={end}
              isValidDate={isValidYear}
              onChange={this.handleEndYearSelection}
            />
          </Form.Field>
          <Form.Field className={style.yearControl}>
            <Button.Group basic vertical className={style.yearControlButtonGroup}>
              <Button
                icon="plus"
                className={style.yearControlButton}
                onClick={this.addYear('end')}
              />
              <Button
                icon="minus"
                className={style.yearControlButton}
                onClick={this.subtractYear('end')}
              />
            </Button.Group>
          </Form.Field>
          <Form.Field>
            <Checkbox
              label="Separate Spring/Fall"
              onChange={this.handleSemesterSeparate}
            />
          </Form.Field>
          <Form.Field error={!validYear} className={style.yearSelect}>
            <label>Language</label>
            <LanguageChooser />
          </Form.Field>
        </Form.Group>
      </Form>
    )
  }

  renderQueryTable = () => {
    const { data } = this.props.courseStatistics
    const headers = ['Name', 'Code', 'Time', '']

    return (
      <Table
        style={{
          width: '100%',
          maxWidth: '850px'
        }}
        unstackable
        selectable
      >
        <Table.Header>
          <Table.Row>
            {headers.map(header => (
              <Table.HeaderCell key={`header-${header}`}>
                {header}
              </Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {data.map(course => (
            <Table.Row key={`${course.name}-${course.code}`}>
              <Table.Cell>{course.name}</Table.Cell>
              <Table.Cell>{course.code}</Table.Cell>
              <Table.Cell>{course.start}-{course.end}</Table.Cell>
              <Table.Cell>
                <Button onClick={this.removeCourseStatistics(course)}>Remove</Button>
              </Table.Cell>
            </Table.Row>))}
        </Table.Body>
      </Table>)
  }

  render() {
    const { selectedProgramme } = this.state
    const { language } = this.props
    const { data } = this.props.courseStatistics
    return (
      <div className={style.container}>
        <Header className={sharedStyles.segmentTitle} size="large">
          Course Statistics
        </Header>
        <Segment>
          <Header>Select statistics parameters</Header>
          {this.renderErrorMessage()}
          {this.renderForm()}
          <Header>Select courses to include</Header>
          <CourseStatisticsSearch
            handleResultSelect={this.handleResultSelect}
            fetchCourseStatistics={this.fetchCourseStatistics}
            removeSelectedCourse={this.removeSelectedCourse}
          />
        </Segment>
        {data.length > 0 ? this.renderQueryTable() : null}
        <Transition.Group as={List} duration={700}>
          {data.map((course) => {
            let programmeOptions = Object.keys(course.programmes).map(key => ({
              text: `${course.programmes[key].name[language] ? course.programmes[key].name[language] : course.programmes[key].name.fi} (${course.programmes[key].amount})`,
              value: key,
              amount: course.programmes[key].amount
            }))
            const text = { en: 'all', fi: 'kaikki', sv: 'allt' }
            programmeOptions = _.orderBy(programmeOptions, 'amount', 'desc')
            programmeOptions = programmeOptions.concat({ text: text[language], value: 'all' })
            let filteredstats = course.stats
            if (selectedProgramme !== 'all') {
              filteredstats = filteredstats.map(field =>
                Object.entries(field).reduce((obj, [key, value]) => {
                  switch (key) {
                    case 'time':
                      return ({ ...obj, [key]: value })

                    case 'gradeDistribution':
                      return {
                        ...obj,
                        [key]: Object.entries(value).reduce((distribution, [grade, students]) => ({
                          ...distribution,
                          [grade]: students.filter(({ student }) =>
                            student.studyright_elements.some(e => e.code === selectedProgramme))
                        }), {})
                      }
                    default:
                      return {
                        ...obj,
                        [key]: value.filter(e =>
                          e.studyright_elements.some(element => element.code === selectedProgramme))
                      }
                  }
                }, {}))
            }
            const stats = []
            Object.assign(stats, course)
            const max = course.stats[0].courseLevelPassed.length +
              course.stats[0].courseLevelFailed.length +
              10
            stats.stats = filteredstats
            return (
              <List.Item key={course.code + course.start + course.end + course.separate}>
                <CoursePassRateChart
                  removeCourseStatistics={this.removeCourseStatistics}
                  stats={stats}
                  max={max}
                  altCodes={course.alternativeCodes}
                  courseLevel={this.state.courseLevel}
                  courseLevelSwitch={this.handleCourseLevelSwitch}
                  dropdown={this.renderDropdown}
                  programmeOptions={programmeOptions}
                />
              </List.Item>
            )
          })
          }
        </Transition.Group>
      </div>
    )
  }
}

CourseStatistics.propTypes = {
  language: string.isRequired,
  getMultipleCourseStatistics: func.isRequired,
  removeCourseStatistics: func.isRequired,
  emptyCourseSearch: func.isRequired,
  courseStatistics: shape({
    data: array.isRequired,
    selected: array.isRequired
  }).isRequired
}

const mapStateToProps = ({ settings, courses, courseStatistics }) => ({
  courses,
  courseStatistics,
  language: settings.language
})

const mapDispatchToProps = dispatch => ({
  getMultipleCourseStatistics: query =>
    dispatch(getMultipleCourseStatistics(query)),
  removeCourseStatistics: query =>
    dispatch(removeCourseStatistics(query)),
  emptyCourseSearch: () =>
    dispatch(emptyCourseSearch())
})


export default connect(mapStateToProps, mapDispatchToProps)(Timeout(CourseStatistics))
