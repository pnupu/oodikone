import React from 'react'
import { func, arrayOf, object, shape, string, bool } from 'prop-types'
import { Card, Icon, Button } from 'semantic-ui-react'

import styles from './populationQueryCard.css'


const PopulationQueryCard =
  ({ translate, population, query, removeSampleFn, units, updateStudentsFn, updating }) => {
    const { uuid, year, semester, months } = query
    return (
      <Card className={styles.cardContainer}>
        <Card.Header className={styles.cardHeader}>
          <div>{units.map(u => u.name).join(', ')}</div>
          <Icon
            name="remove"
            className={styles.controlIcon}
            onClick={() => removeSampleFn(uuid)}
          />
        </Card.Header>
        <Card.Meta>
          <div className={styles.dateItem}>
            <Icon name="calendar" size="small" /> {`${translate(`populationStatistics.${semester}`)}/${year}, showing ${months} months.`}
          </div>
          <div>
            {`${translate('populationStatistics.sampleSize', { amount: population.length })} `}
          </div>
          {updating ?
            <Button disabled compact floated="left" size="medium" labelPosition="left" onClick={updateStudentsFn} >
              <Icon loading name="refresh" />
              update population
            </Button>
            :
            <Button compact floated="left" size="medium" labelPosition="left" onClick={updateStudentsFn} >
              <Icon name="refresh" />
              update population
            </Button>
          }
        </Card.Meta>
      </Card>


    )
  }

PopulationQueryCard.propTypes = {
  translate: func.isRequired,
  population: shape({ students: arrayOf(object), extents: arrayOf(object) }).isRequired,
  query: shape({
    year: string,
    semester: string,
    studyRights: arrayOf(string),
    uuid: string
  }).isRequired,
  removeSampleFn: func.isRequired,
  units: arrayOf(object).isRequired,
  unit: object, // eslint-disable-line
  updateStudentsFn: func.isRequired,
  updating: bool.isRequired
}

export default PopulationQueryCard
