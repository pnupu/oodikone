/* eslint-disable no-console */
import React from 'react'
import { Container, Header, Image, Divider, List } from 'semantic-ui-react'
import moment from 'moment'
import { connect } from 'react-redux'
import propTypes from 'prop-types'
import { isEqual } from 'lodash'
import { images, getUserRoles, checkUserAccess } from '../common'
import { useTitle } from '../common/hooks'
import { builtAt } from '../conf'
import oodis from '../static/oodis.json'

const OodiToOodikone = () => (
  <div style={{ margin: 'auto', width: '50%' }}>
    {oodis.oodis[Math.floor(Math.random() * oodis.oodis.length)].split('\n').map((l, index) => (
      // eslint-disable-next-line react/no-array-index-key
      <p key={index} style={{ textAlign: 'center', fontStyle: 'italic', margin: 0 }}>
        {l}
      </p>
    ))}
    <p style={{ marginTop: '1.3em', textAlign: 'center' }}>
      - <a href="http://www.helsinki.fi/discovery">{oodis.author}</a>
    </p>
  </div>
)

const FrontPage = props => {
  const { userRoles, rights } = props
  useTitle()
  console.log('oodi pituus: ', oodis.oodis.length)
  const showItems = {
    populations: userRoles.includes('admin') || rights.length !== 0,
    studyProgramme: userRoles.includes('admin') || rights.length !== 0,
    students: userRoles.includes('admin') || rights.length !== 0,
    courseStatistics: checkUserAccess(['courseStatistics', 'admin'], userRoles) || rights.length > 0,
    teachers: userRoles.includes('admin') || userRoles.includes('teachers'),
    trends: true,
    feedback: true,
  }

  return (
    <div>
      <Container text style={{ paddingTop: 50 }} textAlign="justified">
        <Header as="h1" textAlign="center">
          Oodikone
        </Header>
        <Header as="h3" style={{ textAlign: 'center' }}>
          Exploratory Research on Study Data
        </Header>
        <OodiToOodikone />

        {showItems.populations && (
          <>
            <Divider section />
            <Header as="h4">Study Programme</Header>
            <List bulleted>
              <List.Item>
                <i>Search by Class:</i> Query a student population specified by a starting year and a study right.
                Oodikone will show you interactive statistics and visualizations for the population to be explored.
              </List.Item>
              <List.Item>
                <i>Overview:</i> View student progress and annual productivity for a given study programme.
              </List.Item>
            </List>
          </>
        )}
        {showItems.students && (
          <>
            <Divider section />
            <Header as="h4">Student Statistics</Header>
            <p>View detailed information for a given student.</p>
          </>
        )}
        {showItems.courseStatistics && (
          <>
            <Divider section />
            <Header as="h4">Course Statistics</Header>
            <p>View statistics by course and year.</p>
          </>
        )}
        <Divider section />
        <Header as="h4">Trends</Header>
        <p>View many kinds visualizations of study progress and study programme status.</p>

        <Divider section />
        <Header as="h4">Feedback</Header>
        <p>
          For questions and suggestions, use either the feedback form or shoot an e-mail to{' '}
          <a href="mailto:grp-toska@helsinki.fi">grp-toska@helsinki.fi</a>.
        </p>

        <Divider section />
        {builtAt ? <p>Oodikone was last updated on: {moment(builtAt).toDate().toLocaleString()}</p> : null}
      </Container>
      <Image src={images.toskaLogo} size="medium" centered style={{ bottom: 0 }} />
    </div>
  )
}

FrontPage.propTypes = {
  userRoles: propTypes.arrayOf(propTypes.string),
  rights: propTypes.arrayOf(propTypes.string),
}

FrontPage.defaultProps = {
  userRoles: [],
  rights: [],
}

const mapStateToProps = ({
  auth: {
    token: { roles, rights },
  },
}) => ({
  userRoles: getUserRoles(roles),
  rights,
})

export default connect(mapStateToProps, null, null, {
  areStatePropsEqual: isEqual,
})(FrontPage)
