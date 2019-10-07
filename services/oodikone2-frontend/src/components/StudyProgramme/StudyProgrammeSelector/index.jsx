import React, { Component } from 'react'
import { connect } from 'react-redux'
import { arrayOf, func, string, bool, shape } from 'prop-types'
import { Loader, Message, Header, Form } from 'semantic-ui-react'
import { getDegreesAndProgrammes } from '../../../redux/populationDegreesAndProgrammes'
import { getTextIn } from '../../../common'
import SortableTable from '../../SortableTable'

class StudyProgrammeSelector extends Component {
  static propTypes = {
    getDegreesAndProgrammes: func.isRequired,
    handleSelect: func.isRequired,
    studyprogrammes: arrayOf(shape({ name: shape({}), code: string })),
    selected: bool.isRequired,
    language: string.isRequired
  }

  constructor() {
    super()
    this.state = {
      filter: ''
    }
    this.timer = null
  }

  static defaultProps = {
    studyprogrammes: null
  }

  componentDidMount() {
    if (!this.props.studyprogrammes) {
      this.props.getDegreesAndProgrammes()
    }
  }

  handleFilterChange = value => {
    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.setState({ filter: value })
    }, 250)
  }

  render() {
    const { studyprogrammes, selected, language } = this.props
    const { filter } = this.state
    if (selected) return null
    if (!studyprogrammes) return <Loader active>Loading</Loader>

    const headers = [
      {
        key: 'programmecode',
        title: 'code',
        getRowVal: prog => prog.code
      },
      {
        key: 'programmename',
        title: 'name',
        getRowVal: prog => getTextIn(prog.name, language)
      }
    ]
    if (studyprogrammes == null) {
      return <Message>You do not have access to any programmes</Message>
    }
    const bachelorProgrammes = []
    const masterProgrammes = []
    const otherProgrammes = []
    const filteredStudyprogrammes = studyprogrammes.filter(
      programme =>
        programme.code.toLowerCase().includes(filter) || programme.name[language].toLowerCase().includes(filter)
    )

    filteredStudyprogrammes.forEach(programme => {
      if (programme.code.includes('MH')) {
        masterProgrammes.push(programme)
      } else if (programme.code.includes('KH')) {
        bachelorProgrammes.push(programme)
      } else {
        otherProgrammes.push(programme)
      }
    })
    return (
      <>
        {studyprogrammes.length > 10 ? (
          <Form>
            Filter programmes:
            <Form.Input onChange={e => this.handleFilterChange(e.target.value)} width="4" />
          </Form>
        ) : null}
        {bachelorProgrammes.length > 0 ? (
          <>
            <Header>Bachelor programmes</Header>
            <SortableTable
              columns={headers}
              getRowKey={programme => programme.code}
              getRowProps={programme => ({
                onClick: () => this.props.handleSelect(programme.code),
                style: { cursor: 'pointer' }
              })}
              data={bachelorProgrammes}
            />
          </>
        ) : null}
        {masterProgrammes.length > 0 ? (
          <>
            <Header>Master programmes</Header>
            <SortableTable
              columns={headers}
              getRowKey={programme => programme.code}
              getRowProps={programme => ({
                onClick: () => this.props.handleSelect(programme.code),
                style: { cursor: 'pointer' }
              })}
              data={masterProgrammes}
            />
          </>
        ) : null}

        {otherProgrammes.length > 0 ? (
          <>
            <Header>Doctoral programmes and old programmes</Header>
            <SortableTable
              columns={headers}
              getRowKey={programme => programme.code}
              getRowProps={programme => ({
                onClick: () => this.props.handleSelect(programme.code),
                style: { cursor: 'pointer' }
              })}
              data={otherProgrammes}
            />
          </>
        ) : null}
      </>
    )
  }
}

const mapStateToProps = ({ populationDegreesAndProgrammes, settings }) => {
  const { programmes } = populationDegreesAndProgrammes.data
  const { language } = settings

  return {
    studyprogrammes: programmes ? Object.values(programmes) : programmes,
    language
  }
}

export default connect(
  mapStateToProps,
  { getDegreesAndProgrammes }
)(StudyProgrammeSelector)
