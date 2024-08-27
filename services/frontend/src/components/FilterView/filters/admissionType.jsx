import { Form, Dropdown } from 'semantic-ui-react'

import { ADMISSION_TYPES } from '@/common'
import { createFilter } from './createFilter'

const findAllStudyRightsForProgramme = (student, programme) =>
  student.studyRights.filter(studyRight => studyRight.studyRightElements.some(el => el.code === programme))

export const filter = code => value => student => {
  const programmeStudyRights = findAllStudyRightsForProgramme(student, code)
  const fixedValue = value !== 'Valintakoe' ? value : 'Koepisteet'

  if (programmeStudyRights.length === 0) return false

  if (programmeStudyRights.length === 1) {
    return value === null || value === 'Ei valintatapaa'
      ? !programmeStudyRights[0].admissionType
      : programmeStudyRights[0].admissionType === fixedValue
  }

  return programmeStudyRights.some(
    studyRight =>
      !studyRight.cancelled &&
      (value === null || value === 'Ei valintatapaa'
        ? !studyRight.admissionType
        : studyRight.admissionType === fixedValue)
  )
}

const AdmissionTypeFilterCard = ({ options, onOptionsChange, withoutSelf, code }) => {
  const { selected } = options
  const name = 'admissionTypeFilter'

  const count = admissionType => withoutSelf().filter(filter(code)(admissionType)).length

  const dropdownOptions = Object.entries(ADMISSION_TYPES)
    .map(([key, admissionType]) => {
      const value = admissionType || 'Ei valintatapaa'
      const numberOfStudents = count(admissionType)
      if (numberOfStudents === 0) return null
      return {
        key,
        text: `${value} (${numberOfStudents})`,
        value,
        numberOfStudents,
      }
    })
    .filter(a => a !== null)
    .sort((a, b) => b.numberOfStudents - a.numberOfStudents)

  return (
    <div className="card-content">
      <Form>
        <Dropdown
          button
          className="mini"
          clearable
          data-cy={`${name}-dropdown`}
          fluid
          onChange={(_, { value }) => onOptionsChange({ selected: value })}
          options={dropdownOptions}
          placeholder="Choose admission type"
          selectOnBlur={false}
          selection
          value={selected}
        />
      </Form>
    </div>
  )
}

export const admissionTypeFilter = createFilter({
  key: 'AdmissionType',

  title: 'Admission type',

  defaultOptions: {
    selected: null,
  },

  isActive: ({ selected }) => !!selected,

  filter(student, { selected }, { args }) {
    return filter(args.programme)(selected)(student)
  },

  render: (props, { args }) => <AdmissionTypeFilterCard {...props} code={args.programme} />,
})
