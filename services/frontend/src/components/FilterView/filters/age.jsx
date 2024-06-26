import { max, min } from 'lodash'
import { useCallback, useMemo } from 'react'

import { useDebounce } from '@/common/hooks'
import { RangeSelector } from '@/components/common/RangeSelector'
import { getAge } from '@/util/timeAndDate'
import { createFilter } from './createFilter'

const AgeFilterCard = ({ options, onOptionsChange, bounds }) => {
  const { min, max } = bounds

  const onChange = useCallback(
    ([min, max]) => {
      onOptionsChange({ min, max })
    },
    [onOptionsChange]
  )

  const value = useMemo(() => [options.min ?? min, options.max ?? max], [options.min, options.max, min, max])

  const [range, setRange] = useDebounce(value, 1000, onChange)

  return (
    <div>
      <p>Valitse ikähaitari, jolle asettuvat opiskelijat näytetään:</p>
      <div className="card-content">
        {min < max && <RangeSelector max={max} min={min} onChange={setRange} value={range} />}
      </div>
    </div>
  )
}

export const ageFilter = createFilter({
  key: 'Age',

  defaultOptions: {
    min: null,
    max: null,
  },

  isActive: ({ min, max }) => min !== null || max !== null,

  precompute: ({ students }) => {
    const ages = students.map(student => getAge(student.birthdate)).filter(age => !Number.isNaN(age))

    return {
      min: min(ages),
      max: max(ages),
    }
  },

  filter: (student, { min, max }) => {
    const age = getAge(student.birthdate)

    if (min !== null && min > age) {
      return false
    }

    if (max !== null && max < age) {
      return false
    }

    return true
  },

  render: (props, { precomputed }) => <AgeFilterCard {...props} bounds={precomputed} />,
})
