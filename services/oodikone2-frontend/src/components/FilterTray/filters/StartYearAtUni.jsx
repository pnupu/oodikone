import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Card, Form, Dropdown, Button, Icon } from 'semantic-ui-react'
import ClearFilterButton from '../ClearFilterButton'

const StartYearAtUni = ({ filterControl }) => {
  const { addFilter, removeFilter, withoutFilter } = filterControl

  const [value, setValue] = useState([])
  const name = 'startYearAtUni'
  const isActive = () => value.length > 0

  useEffect(() => {
    if (!isActive()) {
      removeFilter(name)
    } else {
      addFilter(name, student => value.some(year => year === new Date(student.started).getFullYear()))
    }
  }, [value])

  const countsByYear = {}
  withoutFilter(name).forEach(student => {
    const year = new Date(student.started).getFullYear()
    countsByYear[year] = countsByYear[year] ? countsByYear[year] + 1 : 1
  })

  const options = Object.keys(countsByYear).map(year => ({
    key: `year-${year}`,
    text: `${year} (${countsByYear[year]})`,
    value: Number(year)
  }))

  return (
    <Card>
      <Card.Content>
        <Card.Header>Starting Year at University</Card.Header>
        <Card.Description>
          <Form>
            <Dropdown
              multiple
              selection
              fluid
              options={options}
              button
              className="mini"
              placeholder="No Filter"
              onChange={(_, { value: inputValue }) => setValue(inputValue)}
              value={value}
            />
          </Form>
        </Card.Description>
      </Card.Content>
      <Card.Content extra>
        <ClearFilterButton disabled={!isActive()} onClick={() => setValue([])} />
      </Card.Content>
    </Card>
  )
}

StartYearAtUni.propTypes = {
  filterControl: PropTypes.shape({
    addFilter: PropTypes.func.isRequired,
    removeFilter: PropTypes.func.isRequired,
    withoutFilter: PropTypes.func.isRequired
  }).isRequired
}

export default StartYearAtUni
