import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { Formik } from 'formik'
import { Form, Button, Icon } from 'semantic-ui-react'
import Datetime from 'react-datetime'
import SortableTable from '../SortableTable'
import { getTextIn, textAndDescriptionSearch } from '../../common'
import StyledMessage from './StyledMessage'
import { changeStudyGuidanceGroupTags } from '../../redux/studyGuidanceGroups'
import { getElementDetails } from '../../redux/elementdetails'
import { useToggle } from '../../common/hooks'

const LinkToGroup = ({ group, language }) => (
  <Link
    style={{
      color: 'black',
      display: 'inline-block',
      width: '100%',
      height: '100%',
      padding: '.78571429em .78571429em',
    }}
    to={`/studyguidancegroups/${group.id}`}
  >
    {getTextIn(group.name, language)}
  </Link>
)

const prettifyCamelCase = str => {
  const splitted = str.match(/[A-Za-z][a-z]*/g) || []
  return splitted.map(w => w.charAt(0).toLowerCase() + w.substring(1)).join(' ')
}

const AssociateTagForm = ({ group, tagName, toggleEdit, selectFieldItems }) => {
  const dispatch = useDispatch()

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Formik
        initialValues={{ [tagName]: '' }}
        onSubmit={values => {
          dispatch(changeStudyGuidanceGroupTags(group.id, values))
        }}
        validate={values => (!values[tagName] ? { [tagName]: `${tagName} is required` } : {})}
      >
        {formik => (
          <Form onSubmit={formik.handleSubmit} style={{ display: 'flex', gap: '8px' }}>
            {tagName === 'studyProgramme' ? (
              <Form.Select
                name={tagName}
                search={textAndDescriptionSearch}
                fluid
                placeholder={
                  group.tags?.[tagName]
                    ? selectFieldItems.find(p => p.value === group.tags[tagName]).text
                    : 'Select study programme'
                }
                options={selectFieldItems}
                closeOnChange
                value={formik.values[tagName]}
                onChange={(_, value) => formik.setFieldValue(tagName, value?.value)}
              />
            ) : (
              <Datetime
                name={tagName}
                dateFormat="YYYY"
                timeFormat={false}
                renderYear={(props, selectableYear) => <td {...props}>{selectableYear}</td>}
                closeOnSelect
                value={formik.values[tagName]}
                onChange={value => formik.setFieldValue(tagName, value?.format('YYYY'))}
              />
            )}
            <Button type="submit" style={{ margin: '0 0 1em 0' }}>
              Add {prettifyCamelCase(tagName)}
            </Button>
          </Form>
        )}
      </Formik>

      {group.tags?.[tagName] ? (
        <Button icon style={{ margin: '0 0 1em 0' }} onClick={() => toggleEdit()}>
          Close
          <Icon name="close" />
        </Button>
      ) : null}
    </div>
  )
}

const TagCell = ({ tagName, value, toggleEdit, studyProgrammes }) => {
  const text = tagName === 'studyProgramme' ? studyProgrammes.find(p => p.value === value).text : value
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
      <p>{text}</p>
      <Button type="button" onClick={() => toggleEdit()}>
        Edit {prettifyCamelCase(tagName)}
      </Button>
    </div>
  )
}

const StudyGuidanceGroupOverview = () => {
  const dispatch = useDispatch()
  const { language } = useSelector(({ settings }) => settings)
  const { data: groups } = useSelector(({ studyGuidanceGroups }) => studyGuidanceGroups)
  const { data: elementDetails } = useSelector(({ elementdetails }) => elementdetails)
  const [showEditStudyProgramme, toggleShowEditStudyProgramme] = useToggle()
  const [showEditYear, toggleShowEditYear] = useToggle()

  useEffect(() => {
    if (elementDetails && elementDetails.length > 0) return
    dispatch(getElementDetails())
  }, [dispatch])

  const studyProgrammesFilteredForDropdown =
    elementDetails
      ?.filter(elem => elem.code.startsWith('KH') || elem.code.startsWith('MH'))
      .map(elem => ({
        key: elem.code,
        value: elem.code,
        description: elem.code,
        text: getTextIn(elem.name, language),
      })) || []

  const headers = [
    {
      key: 'name',
      title: 'name',
      getRowVal: group => getTextIn(group.name, language),
      getRowContent: group => <LinkToGroup group={group} language={language} />,
      cellProps: {
        style: {
          padding: '0',
        },
      },
    },
    {
      key: 'studyProgramme',
      title: 'Study programme',
      getRowVal: () => 'studyProgramme',
      headerProps: { onClick: null, sorted: null },
      getRowContent: group =>
        group.tags?.studyProgramme && !showEditStudyProgramme ? (
          <TagCell
            tagName="studyProgramme"
            value={group.tags.studyProgramme}
            toggleEdit={toggleShowEditStudyProgramme}
            studyProgrammes={studyProgrammesFilteredForDropdown}
          />
        ) : (
          <AssociateTagForm
            group={group}
            tagName="studyProgramme"
            toggleEdit={toggleShowEditStudyProgramme}
            selectFieldItems={studyProgrammesFilteredForDropdown}
          />
        ),
    },
    {
      key: 'associatedyear',
      title: 'Associated year',
      getRowVal: () => 'associatedYear',
      headerProps: { onClick: null, sorted: null },
      getRowContent: group =>
        group.tags?.year && !showEditYear ? (
          <TagCell tagName="year" value={group.tags.year} toggleEdit={toggleShowEditYear} />
        ) : (
          <AssociateTagForm group={group} tagName="year" toggleEdit={toggleShowEditYear} />
        ),
    },
  ]

  if (groups.length === 0) {
    return <StyledMessage>You do not have access to any study guidance groups.</StyledMessage>
  }
  return (
    <>
      <StyledMessage>
        <p>
          Tällä sivulla pääset tarkastemaan ohjattavien opiskelijoidesi etenemistä ohjausryhmittäin. Voit halutessasi
          lisätä ohjausryhmään aloitusvuoden ja koulutusohjelman, jolloin yksittäisen ohjausryhmän näkymään avautuu
          lisäominaisuuksia.{' '}
        </p>
      </StyledMessage>
      <SortableTable columns={headers} getRowKey={group => group.id} data={groups} />
    </>
  )
}

export default StudyGuidanceGroupOverview
