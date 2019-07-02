import React, { Fragment } from 'react'
import { arrayOf, bool, func, number, shape } from 'prop-types'
import { Form } from 'semantic-ui-react'

const YearFilter = ({ years, fromYear, toYear, handleChange, separate, onToggleCheckbox, showCheckbox }) => (
  <Fragment>
    <Form.Group widths="equal" inline>
      <Form.Dropdown
        label="From:"
        name="fromYear"
        options={years}
        selection
        inline
        placeholder="Select academic year"
        onChange={handleChange}
        value={fromYear}
      />
      <Form.Dropdown
        label="To:"
        name="toYear"
        options={years}
        inline
        selection
        placeholder="Select academic year"
        onChange={handleChange}
        value={toYear}
      />
    </Form.Group>
    {
      showCheckbox && (
        <Form.Checkbox
          label="Separate statistics for Spring and Fall semesters"
          name="separate"
          onChange={onToggleCheckbox}
          checked={separate}
        />
      )
    }
  </Fragment>
)

YearFilter.propTypes = {
  years: arrayOf(shape({})).isRequired,
  fromYear: number,
  toYear: number,
  handleChange: func.isRequired,
  onToggleCheckbox: func,
  separate: bool.isRequired,
  showCheckbox: bool.isRequired
}

YearFilter.defaultProps = {
  fromYear: undefined,
  toYear: undefined,
  onToggleCheckbox: () => null
}

export default YearFilter
