import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { Button, Radio, Icon, Header, Segment, Confirm, Loader, Label } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { func, shape, string, bool, arrayOf, number } from 'prop-types'
import { getTranslate, getActiveLanguage } from 'react-localize-redux'
import { getUsers, sendEmail } from '../../redux/users'
import { getUnits } from '../../redux/units'
import { getElementDetails } from '../../redux/elementdetails'
import { makeSortUsers } from '../../selectors/users'
import { copyToClipboard, getTextIn } from '../../common'
import UserPageNew from '../UserPage'
import SortableTable from '../SortableTable'

class EnableUsers extends Component {
  state = {
    confirm: false,
    email: '',
    enabledOnly: true
  }

  componentDidMount() {
    if (this.props.elementdetails.length === 0) this.props.getElementDetails()
    if (this.props.units.length === 0) this.props.getUnits()
    if (this.props.users.length === 0) this.props.getUsers()
  }

  toggleEnabledOnly() {
    if (this.props.enabledOnly) this.props.getUsers()
    const { enabledOnly } = this.state
    this.setState({ enabledOnly: !enabledOnly })
  }

  sendMailPopup = user => () => {
    this.setState({ confirm: true, email: user.email })
  }

  openEditUserPage = userid => () => {
    const { history } = this.props
    history.push(`users/${userid}`)
  }

  openUsersPage = () => {
    const { history } = this.props
    history.push('/users')
  }

  copyEmailsToClippoard = () => {
    const clipboardString = this.props.users
      .filter(u => u.is_enabled && u.email)
      .map(u => u.email).join('; ')
    copyToClipboard(clipboardString)
  }

  renderUserPage = (userid) => {
    const { users } = this.props
    const user = users.find(u => u.id === userid)
    return !user
      ? <Loader active />
      : (
        <UserPageNew
          userid={userid}
          user={user}
          goBack={this.openUsersPage}
        />
      )
  }

  renderUserSearchList = () => {
    const { enabledOnly } = this.state
    const { users, error, elementdetails } = this.props
    let usersToRender
    if (enabledOnly) {
      usersToRender = users.filter(u => u.is_enabled)
    } else {
      usersToRender = users
    }
    return error ? null : (
      <div>
        {this.state.confirm ? <Confirm
          style={{
            marginTop: 'auto !important',
            display: 'inline-block !important',
            position: 'relative'
            // top: '20%',
            // left: '33%'
          }}
          open={this.state.confirm}
          cancelButton="no"
          confirmButton="send"
          content="Do you want to notify this person by email about receiving access to oodikone?"
          onCancel={() => { this.setState({ confirm: false }) }}
          onConfirm={() => {
            this.setState({ confirm: false })
            this.props.sendEmail(this.state.email)
          }}
          size="small"
        /> : null}
        <SortableTable
          getRowKey={user => user.id}
          tableProps={{ celled: true, structured: true }}
          columns={[
            {
              key: 'NAME',
              title: 'Name',
              getRowVal: (user) => {
                const nameparts = user.full_name.split(' ')
                return nameparts[nameparts.length - 1]
              },
              getRowContent: user => user.full_name
            }, {
              key: 'USERNAME',
              title: 'Username',
              getRowVal: user => user.username
            }, {
              key: 'ROLE',
              title: 'Role',
              getRowContent: user => (
                <Label.Group>
                  {user.accessgroup.map(ag => ag.group_code).sort().map(code => <Label key={code} content={code} />)}
                </Label.Group>
              ),
              getRowVal: user => (
                user.accessgroup.map(ag => ag.group_code).sort()
              )
            }, {
              key: 'PROGRAMMES',
              title: 'Programmes',
              getRowVal: (user) => {
                const nameInLanguage = (code) => {
                  const elem = elementdetails.find(e => e.code === code)
                  if (!elem) return null
                  return getTextIn(elem.name, this.props.language)
                }

                if (!user.elementdetails || user.elementdetails.length === 0) return null
                const name = nameInLanguage(user.elementdetails[0])
                if (!name) return `${user.elementdetails.length} programmes`
                if (user.elementdetails.length >= 2) {
                  return `${nameInLanguage(user.elementdetails[0])} +${user.elementdetails.length - 1} others`
                }
                return name
              }
            }, {
              key: 'OODIACCESS',
              title: 'Has access',
              getRowVal: user => user.is_enabled,
              getRowContent: user => (
                <Icon
                  style={{ margin: 'auto' }}
                  color={user.is_enabled ? 'green' : 'red'}
                  name={user.is_enabled ? 'check' : 'remove'}
                />
              )
            }, {
              key: 'SENDMAIL',
              title: '',
              getRowVal: user => user.is_enabled,
              getRowContent: user => (
                <Button onClick={this.sendMailPopup(user)} basic fluid size="mini">Send mail</Button>
              ),
              headerProps: { onClick: null, sorted: null }
            }, {
              key: 'EDIT',
              title: '',
              getRowVal: user => (
                <Button.Group compact widths={2}>
                  <Button basic size="mini" onClick={this.openEditUserPage(user.id)}>
                    Edit
                  </Button>
                </Button.Group>
              ),
              headerProps: { onClick: null, sorted: null }
            }
          ]}
          data={usersToRender}
        />
      </div>
    )
  }

  render() {
    const { match, pending } = this.props
    const { enabledOnly } = this.state
    const { userid } = match.params
    return (
      <div className="segmentContainer">
        <Header className="segmentTitle" size="large">
          Oodikone users
        </Header>
        <Radio label={`Showing ${enabledOnly ? 'only enabled' : 'all'} users`} toggle onClick={() => this.toggleEnabledOnly()} />
        <Segment loading={pending} className="contentSegment">
          {!userid ? this.renderUserSearchList() : this.renderUserPage(userid)}
        </Segment>
        <Icon
          link
          name="envelope"
          onClick={this.copyEmailsToClippoard}
          style={{ float: 'right' }}
        />
      </div>
    )
  }
}

EnableUsers.propTypes = {
  match: shape({
    params: shape({
      studentNumber: string
    })
  }).isRequired,
  language: string.isRequired,
  getUsers: func.isRequired,
  pending: bool.isRequired,
  getUnits: func.isRequired,
  sendEmail: func.isRequired,
  enabledOnly: bool.isRequired,
  users: arrayOf(shape({
    id: string,
    full_name: string,
    is_enabled: bool,
    username: string,
    units: arrayOf(shape({
      id: string,
      name: shape({}).isRequired
    }))
  })).isRequired,
  error: bool.isRequired,
  units: arrayOf(shape({})).isRequired,
  elementdetails: arrayOf(shape({ code: string, type: number, name: shape({}) })).isRequired,
  getElementDetails: func.isRequired,
  history: shape({}).isRequired
}

const sortUsers = makeSortUsers()

const mapStateToProps = ({ localize, users, units, elementdetails }) => ({
  language: getActiveLanguage(localize).code,
  translate: getTranslate(localize),
  units: units.data,
  elementdetails: elementdetails.data,
  enabledOnly: users.enabledOnly,
  users: sortUsers(users),
  pending: (typeof (users.pending) === 'boolean') ? users.pending : true,
  error: users.error || false
})

export default withRouter(connect(mapStateToProps, {
  getUsers,
  getUnits,
  sendEmail,
  getElementDetails
})(EnableUsers))
