import React, { useState } from 'react'
import { Item, Icon, Popup } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import _ from 'lodash'
import moment from 'moment'
import { useSelector } from 'react-redux'
import SortableTable from 'components/SortableTable'
import useFilters from 'components/FilterView/useFilters'
import creditDateFilter from 'components/FilterView/filters/date'
import { getStudentTotalCredits, getTextIn, getNewestProgramme, reformatDate, copyToClipboard } from 'common'
import { useGetStudyGuidanceGroupPopulationQuery } from 'redux/studyGuidanceGroups'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import { PRIORITYCODE_TEXTS } from '../../../constants'
import sendEvent from '../../../common/sendEvent'
import useLanguage from '../../LanguagePicker/useLanguage'

const GeneralTab = ({
  group,
  populations,
  columnKeysToInclude,
  studentToTargetCourseDateMap,
  coursecode,
  filteredStudents,
}) => {
  const { language } = useLanguage()
  const { useFilterSelector } = useFilters()
  const [popupStates, setPopupStates] = useState({})
  const sendAnalytics = sendEvent.populationStudents

  const creditDateFilterOptions = useFilterSelector(creditDateFilter.selectors.selectOptions)

  const { data: populationStatistics, query } = populations

  if (!populationStatistics || !populationStatistics.elementdetails) return null

  const selectedStudents = filteredStudents.map(stu => stu.studentNumber)
  const students = Object.fromEntries(filteredStudents.map(stu => [stu.studentNumber, stu]))
  const queryStudyrights = query ? Object.values(query.studyRights) : []
  const cleanedQueryStudyrights = queryStudyrights.filter(sr => !!sr)
  const programmeCode = cleanedQueryStudyrights[0] || group?.tags?.studyProgramme

  const popupTimeoutLength = 1000
  let timeout = null

  const handlePopupOpen = id => {
    setPopupStates({ [id]: true })

    timeout = setTimeout(() => {
      setPopupStates({ [id]: false })
    }, popupTimeoutLength)
  }

  const handlePopupClose = id => {
    setPopupStates({ [id]: false })
    clearTimeout(timeout)
  }

  const transferFrom = s => getTextIn(populationStatistics.elementdetails.data[s.transferSource].name, language)

  const studyrightCodes = (studyrights, value) => {
    return studyrights
      .filter(sr => {
        const { studyright_elements: studyrightElements } = sr
        return (
          studyrightElements.filter(sre => cleanedQueryStudyrights.includes(sre.code)).length >=
          cleanedQueryStudyrights.length
        )
      })
      .map(a => a[value])
  }

  const studytrack = studyrights => {
    let startdate = '1900-01-01'
    let enddate = '2020-04-20'
    const res = studyrightCodes(studyrights, 'studyright_elements').reduce((acc, elemArr) => {
      elemArr
        .filter(el => populationStatistics.elementdetails.data[el.code].type === 20)
        .forEach(el => {
          if (cleanedQueryStudyrights.includes(el.code)) {
            startdate = el.startdate // eslint-disable-line
            enddate = el.enddate // eslint-disable-line
          }
        })
      elemArr
        .filter(el => populationStatistics.elementdetails.data[el.code].type === 30)
        .forEach(el => {
          if (el.enddate > startdate && el.startdate <= enddate) {
            acc.push({
              name: populationStatistics.elementdetails.data[el.code].name.fi,
              startdate: el.startdate,
              enddate: el.enddate,
            })
          }
        })
      acc.sort((a, b) => new Date(b.startdate) - new Date(a.startdate))
      return acc
    }, [])
    return res
  }

  const priorityText = studyRights => {
    const codes = studyrightCodes(studyRights, 'prioritycode')
    return codes.map(code => (PRIORITYCODE_TEXTS[code] ? PRIORITYCODE_TEXTS[code] : code)).join(', ')
  }

  const extentCodes = studyRights => {
    const codes = studyrightCodes(studyRights, 'extentcode')
    return codes.join(', ')
  }

  const tags = tags => {
    const studentTags = tags.map(t => t.tag.tagname)
    return studentTags.join(', ')
  }

  const mainProgramme = (studyrights, studentNumber) => {
    const programme = getNewestProgramme(
      studyrights,
      studentNumber,
      studentToTargetCourseDateMap,
      populationStatistics.elementdetails.data
    )
    if (programme) {
      return programme.name
    }
    return null
  }

  const studentToStudyrightStartMap = selectedStudents.reduce((res, sn) => {
    const targetStudyright = _.flatten(
      students[sn].studyrights.reduce((acc, curr) => {
        acc.push(curr.studyright_elements)
        return acc
      }, [])
    ).filter(e => e.code === programmeCode)
    res[sn] = targetStudyright[0] ? targetStudyright[0].startdate : null
    return res
  }, {})

  const studentToStudyrightActualStartMap = selectedStudents.reduce((res, sn) => {
    const targetStudyright = students[sn].studyrights.find(studyright =>
      studyright.studyright_elements.some(e => e.code === programmeCode)
    )
    res[sn] = targetStudyright ? targetStudyright.studystartdate : null
    return res
  }, {})

  const studentToStudyrightEndMap = selectedStudents.reduce((res, sn) => {
    const targetStudyright = students[sn].studyrights.find(studyright =>
      studyright.studyright_elements.some(e => e.code === programmeCode)
    )
    res[sn] = targetStudyright && targetStudyright.graduated === 1 ? targetStudyright.enddate : null
    return res
  }, {})

  const getActualStartDate = studentNumber => {
    const studyRightStart = studentToStudyrightStartMap[studentNumber]
    const studyRightStartActual = studentToStudyrightActualStartMap[studentNumber]

    if (!studyRightStart) return studyRightStartActual
    if (!studyRightStartActual) return studyRightStart

    return new Date(studyRightStart).getTime() > new Date(studyRightStartActual).getTime()
      ? studyRightStart
      : studyRightStartActual
  }

  const copyToClipboardAll = () => {
    const studentsInfo = selectedStudents.map(number => students[number])
    const emails = studentsInfo.filter(s => s.email && !s.obfuscated).map(s => s.email)
    const clipboardString = emails.join('; ')
    copyToClipboard(clipboardString)
    sendAnalytics('Copy all student emails to clipboard', 'Copy all student emails to clipboard')
  }

  // Filters to check data for whether to show certain columns
  const containsStudyTracks = selectedStudents
    .map(sn => students[sn])
    .map(st => st.studyrights)
    .map(
      studyrights =>
        studyrightCodes(studyrights, 'studyright_elements').reduce((acc, elemArr) => {
          elemArr
            .filter(el => populationStatistics.elementdetails.data[el.code].type === 30)
            .forEach(el => acc.push(getTextIn(populationStatistics.elementdetails.data[el.code].name, language)))
          return acc
        }, []).length > 0
    )
    .some(el => el === true)

  const containsOption = cleanedQueryStudyrights.some(code => code.startsWith('MH') || code.startsWith('KH'))

  const shouldShowAdmissionType = parseInt(query?.year, 10) >= 2020 || parseInt(group?.tags?.year, 10) >= 2020

  let creditColumnTitle = 'Credits Since Start of Studyright'

  if (creditDateFilterOptions) {
    const { startDate, endDate } = creditDateFilterOptions

    if (startDate && !endDate) {
      creditColumnTitle = `Credits Since ${moment(startDate).format('DD.MM.YYYY')}`
    } else if (endDate && !startDate) {
      creditColumnTitle = `Credits Before ${moment(endDate).format('DD.MM.YYYY')}`
    } else if (endDate && startDate) {
      creditColumnTitle = `Credits Between ${moment(startDate).format('DD.MM.YYYY')} and ${moment(endDate).format(
        'DD.MM.YYYY'
      )}`
    }
  }

  // All columns components user is able to use
  const columnsAvailable = {
    lastname: { key: 'lastname', title: 'last name', getRowVal: s => s.lastname },
    firstname: { key: 'firstname', title: 'given names', getRowVal: s => s.firstnames },
    studentnumber: {
      key: 'studentnumber',
      title: 'Student Number',
      getRowVal: s => (!s.obfuscated ? s.studentNumber : 'hidden'),
      getRowContent: s => (
        <span style={s.obfuscated ? { fontStyle: 'italic', color: 'graytext' } : {}}>
          {!s.obfuscated ? s.studentNumber : 'hidden'}
        </span>
      ),
      headerProps: { colSpan: 2 },
    },
    icon: {
      key: 'icon',
      getRowVal: s =>
        !s.obfuscated && (
          <Item
            as={Link}
            to={`/students/${s.studentNumber}`}
            onClick={() => {
              sendAnalytics('Student details button clicked', 'General tab')
            }}
          >
            <Icon name="level up alternate" />
          </Item>
        ),
      cellProps: { collapsing: true, className: 'iconCellNoPointer' },
    },
    creditsSinceStart: {
      key: 'creditsSinceStart',
      title: creditColumnTitle,
      getRowVal: s => {
        const credits = getStudentTotalCredits(s)
        return credits
      },
    },
    creditsSinceStartByYear: {
      key: 'creditsSinceStartByYear',
      title: `credits since ${group?.tags?.year}`,
      getRowVal: s => {
        const credits = getStudentTotalCredits({
          ...s,
          courses: s.courses.filter(c => new Date(c.date) > new Date(group?.tags?.year, 7, 1)),
        })
        return credits
      },
    },
    gradeForSingleCourse: {
      key: 'gradeForSingleCourse',
      title: 'Grade',
      getRowVal: s => {
        const grade = s.courses.filter(c => coursecode.includes(c.course_code))
        if (grade) {
          grade.sort((a, b) => (moment(a.date).isBefore(b.date) ? 1 : -1))
          return grade[0].grade
        }
        return ''
      },
    },
    allCredits: {
      key: 'allCredits',
      title: 'All Credits',
      getRowVal: s => s.credits,
    },
    transferredFrom: {
      key: 'transferredFrom',
      title: 'Transferred From',
      getRowVal: s => (s.transferredStudyright ? transferFrom(s) : ''),
    },
    studyTrack: containsStudyTracks && {
      key: 'studyTrack',
      title: 'Study Track',
      getRowVal: s => studytrack(s.studyrights).map(st => st.name)[0],
    },
    priority: {
      key: 'priority',
      title: 'priority',
      getRowVal: s => priorityText(s.studyrights),
    },
    extent: {
      key: 'extent',
      title: 'extent',
      getRowVal: s => extentCodes(s.studyrights),
    },
    tags: {
      key: 'tags',
      title: 'Tags',
      getRowVal: s => (!s.obfuscated ? tags(s.tags) : ''),
    },
    studyStartDate: {
      key: 'studyStartDate',
      title: 'start of studyright',
      getRowVal: s => new Date(studentToStudyrightStartMap[s.studentNumber]).getTime(),
      getRowContent: s => reformatDate(studentToStudyrightStartMap[s.studentNumber], 'YYYY-MM-DD'),
    },
    studyStartDateActual: {
      key: 'studyStartDateActual',
      title: 'started in studyright',
      getRowVal: s => new Date(getActualStartDate(s.studentNumber)).getTime(),
      getRowContent: s => reformatDate(getActualStartDate(s.studentNumber), 'YYYY-MM-DD'),
    },
    endDate: {
      key: 'endDate',
      title: 'graduation date',
      getRowVal: s => new Date(studentToStudyrightEndMap[s.studentNumber]).getTime(),
      getRowContent: s =>
        studentToStudyrightEndMap[s.studentNumber]
          ? reformatDate(studentToStudyrightEndMap[s.studentNumber], 'YYYY-MM-DD')
          : '',
    },
    admissionType: shouldShowAdmissionType && {
      key: 'admissionType',
      title: 'admission type',
      getRowVal: s => {
        const studyright = s.studyrights.find(sr => sr.studyright_elements.some(e => e.code === programmeCode))
        return studyright && studyright.admission_type ? studyright.admission_type : 'Ei valintatapaa'
      },
    },
    programme: {
      key: 'programme',
      title: 'Study Programme',
      getRowVal: s => getTextIn(mainProgramme(s.studyrights, s.studentNumber), language) || 'No programme',
    },
    language: {
      key: 'language',
      title: 'Language',
      getRowVal: s => s.courses.find(c => coursecode.includes(c.course_code)).language,
    },
    startYear: {
      key: 'startYear',
      title: 'Start Year at Uni',
      getRowVal: s => (!s.obfuscated ? reformatDate(s.started, 'YYYY') : ''),
    },
    option: containsOption && {
      key: 'option',
      title: cleanedQueryStudyrights.some(code => code.startsWith('MH')) ? 'Bachelor' : 'Master',
      getRowVal: s => (s.option ? getTextIn(s.option.name, language) : ''),
    },
    email: {
      key: 'email',
      title: (
        <>
          email
          <Popup
            trigger={<Icon link name="copy" onClick={copyToClipboardAll} style={{ float: 'right' }} />}
            content="Copied email list!"
            on="click"
            open={popupStates['0']}
            onClose={() => handlePopupClose('0')}
            onOpen={() => handlePopupOpen('0')}
            position="top right"
          />
        </>
      ),
      getRowVal: s => s.email,
      headerProps: { colSpan: 2 },
    },
    copyEmail: {
      key: 'copyEmail',
      getRowVal: s =>
        s.email && !s.obfuscated ? (
          <Popup
            trigger={
              <Icon
                link
                name="copy outline"
                onClick={() => {
                  copyToClipboard(s.email)
                  sendAnalytics("Copy student's email to clipboard", "Copy student's email to clipboard")
                }}
                style={{ float: 'right' }}
              />
            }
            content="Email copied!"
            on="click"
            open={popupStates[s.studentNumber]}
            onClose={() => handlePopupClose(s.studentNumber)}
            onOpen={() => handlePopupOpen(s.studentNumber)}
            position="top right"
          />
        ) : null,
      headerProps: { onClick: null, sorted: null },
      cellProps: { collapsing: true, className: 'iconCellNoPointer' },
    },
    updatedAt: {
      key: 'updatedAt',
      title: 'Last Updated At',
      getRowVal: s => reformatDate(s.updatedAt, 'YYYY-MM-DD  HH:mm:ss'),
    },
  }
  // Columns are shown in order they're declared above. JS guarantees this order of keys
  // to stay for non-integer keys
  const orderOfColumns = Object.keys(columnsAvailable).reduce(
    (acc, curr, ind) => ({
      ...acc,
      [curr]: ind,
    }),
    {}
  )

  const columns = _.chain(columnKeysToInclude)
    .map(colKey => columnsAvailable[colKey])
    .sortBy(col => orderOfColumns[col.key])
    .filter(col => !!col)
    .value()

  return (
    <div style={{ overflowX: 'auto', maxHeight: '80vh' }}>
      <SortableTable
        getRowKey={s => s.studentNumber}
        tableProps={{
          collapsing: true,
          basic: true,
          compact: 'very',
          padded: false,
          celled: true,
        }}
        columns={columns}
        data={selectedStudents.map(sn => students[sn])}
      />
    </div>
  )
}

// study guidance groups -feature uses different population + rtk query, so it needs to
// be rendered differently. TODO: should rafactor this, maybe with using allStudents
// from useFilters and making sure that it contains same students than the population
// backend returns with population query below (so caching works)
const StudyGuidanceGroupGeneralTabContainer = ({ group, ...props }) => {
  const groupStudentNumbers = group?.members?.map(({ personStudentNumber }) => personStudentNumber) || []
  const populations = useGetStudyGuidanceGroupPopulationQuery(groupStudentNumbers)
  return <GeneralTab populations={populations} group={group} {...props} />
}

const GeneralTabContainer = ({ studyGuidanceGroup, variant, ...props }) => {
  const populations = useSelector(({ populations }) => populations)
  const { namesVisible } = useSelector(({ settings }) => settings)
  const { isAdmin } = useGetAuthorizedUserQuery()

  const getStudyGuidanceGroupColumns = () => {
    const cols = ['programme', 'startYear']
    if (studyGuidanceGroup?.tags?.year) cols.push('creditsSinceStartByYear')
    if (studyGuidanceGroup?.tags?.studyProgramme) cols.push('studyStartDate', 'studyStartDateActual', 'endDate')
    if (studyGuidanceGroup?.tags?.studyProgramme && studyGuidanceGroup?.tags?.year) {
      cols.push('admissionType')
    }
    return cols
  }

  const columnsByVariant = {
    customPopulation: ['programme', 'startYear'],
    coursePopulation: ['gradeForSingleCourse', 'programme', 'language', 'startYear'],
    population: [
      'creditsSinceStart',
      'transferredFrom',
      'priority',
      'extent',
      'studyStartDate',
      'studyStartDateActual',
      'endDate',
      'studyTrack',
      'admissionType',
    ],
    studyGuidanceGroupPopulation: getStudyGuidanceGroupColumns(),
  }

  const baseColumns = ['studentnumber', 'icon', 'allCredits', 'tags', 'updatedAt', 'option']
  const nameColumnsToAdd = namesVisible ? ['email', 'copyEmail', 'lastname', 'firstname'] : []
  const adminColumnsToFilter = isAdmin ? [] : ['priority', 'extent', 'studyStartDate', 'updatedAt']

  const columnKeysToInclude = _.chain(baseColumns)
    .union(columnsByVariant[variant])
    .union(nameColumnsToAdd)
    .difference(adminColumnsToFilter)
    .value()

  if (variant === 'studyGuidanceGroupPopulation') {
    return (
      <StudyGuidanceGroupGeneralTabContainer
        group={studyGuidanceGroup}
        columnKeysToInclude={columnKeysToInclude}
        {...props}
      />
    )
  }

  return <GeneralTab populations={populations} columnKeysToInclude={columnKeysToInclude} {...props} />
}

export default GeneralTabContainer
