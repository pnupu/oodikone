import { Box, Container, Tab, Tabs, Typography } from '@mui/material'
import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table'
import { useMemo, useState } from 'react'

import { closeToGraduationToolTips } from '@/common/InfoToolTips'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { CheckIconWithTitle } from '@/components/material/CheckIconWithTitle'
import { ExportToExcelDialog } from '@/components/material/ExportToExcelDialog'
import { InfoBox } from '@/components/material/InfoBox'
import { PageTitle } from '@/components/material/PageTitle'
import { StudentInfoItem } from '@/components/material/StudentInfoItem'
import { TableHeaderWithTooltip } from '@/components/material/TableHeaderWithTooltip'
import { getSemestersPresentFunctions } from '@/components/PopulationStudents/StudentTable/GeneralTab/columnHelpers/semestersPresent'
import { ISO_DATE_FORMAT, LONG_DATE_TIME_FORMAT } from '@/constants/date'
import { useGetStudentsCloseToGraduationQuery } from '@/redux/closeToGraduation'
import { useGetSemestersQuery } from '@/redux/semesters'
import { getDefaultMRTOptions } from '@/util/getDefaultMRTOptions'
import { reformatDate } from '@/util/timeAndDate'

const NUMBER_OF_DISPLAYED_SEMESTERS = 6

export const CloseToGraduation = () => {
  const { data: students } = useGetStudentsCloseToGraduationQuery()
  const { data: semesterData } = useGetSemestersQuery()
  const [selectedTab, setSelectedTab] = useState(0)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportData, setExportData] = useState<Record<string, unknown>[]>([])
  const { getTextIn, language } = useLanguage()
  const allSemesters = Object.values(semesterData?.semesters ?? {})
  const allSemestersMap = allSemesters.reduce<Record<string, (typeof allSemesters)[number]>>((acc, cur) => {
    acc[cur.semestercode] = cur
    return acc
  }, {})
  const { getSemesterEnrollmentsContent, getSemesterEnrollmentsVal } = getSemestersPresentFunctions({
    getTextIn,
    allSemesters,
    allSemestersMap,
    filteredStudents: students,
    year: `${new Date().getFullYear() - Math.floor(NUMBER_OF_DISPLAYED_SEMESTERS / 2)}`,
    programmeCode: null,
    studentToSecondStudyrightEndMap: null,
    studentToStudyrightEndMap: null,
    semestersToAddToStart: null,
  })

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'student.studentNumber',
        header: 'Student number',
        Cell: ({ cell }) => (
          <StudentInfoItem
            sisPersonId={cell.row.original.student.sis_person_id}
            studentNumber={cell.getValue<string>()}
          />
        ),
        filterFn: 'startsWith',
      },
      {
        accessorKey: 'student.name',
        header: 'Name',
        filterFn: 'startsWith',
      },
      {
        accessorKey: 'student.phoneNumber',
        header: 'Phone number',
      },
      {
        accessorKey: 'student.email',
        header: 'Email',
      },
      {
        accessorKey: 'student.secondaryEmail',
        header: 'Secondary email',
      },
      {
        accessorFn: row => getTextIn(row.faculty),
        header: 'Faculty',
        id: 'faculty',
        filterVariant: 'multi-select',
      },
      {
        accessorFn: row => getTextIn(row.programme.name),
        header: 'Programme',
        id: 'programme',
        filterVariant: 'multi-select',
      },
      {
        accessorFn: row => getTextIn(row.programme.studyTrack),
        id: 'studyTrack',
        header: 'Study track',
        filterVariant: 'multi-select',
      },
      {
        accessorFn: row => new Date(row.studyright.startDate),
        id: 'startOfStudyRight',
        Cell: ({ cell }) => reformatDate(cell.getValue<Date>(), ISO_DATE_FORMAT),
        header: 'Start of study right',
        filterVariant: 'date-range',
      },
      {
        accessorFn: row => new Date(row.programme.startedAt),
        id: 'startedInProgramme',
        Cell: ({ cell }) => reformatDate(cell.getValue<Date>(), ISO_DATE_FORMAT),
        header: 'Started in programme',
        Header: (
          <TableHeaderWithTooltip
            header="Started in programme"
            tooltipText="For students with only a study right in the master’s programme, this date is the same as 'Start of study right'. For students with study rights in both the bachelor’s and master’s programmes, this date represents when they started in the master’s programme (i.e. one day after graduating from the bachelor’s programme)."
          />
        ),
        filterVariant: 'date-range',
      },
      {
        header: 'Completed credits – HOPS',
        accessorKey: 'credits.hops',
        filterVariant: 'range',
      },
      {
        header: 'Completed credits – Total',
        accessorKey: 'credits.all',
        filterVariant: 'range',
      },
      {
        header: 'BSc & MSc study right',
        accessorKey: 'studyright.isBaMa',
        filterVariant: 'checkbox',
        Cell: ({ cell }) => <CheckIconWithTitle visible={cell.getValue<boolean>()} />,
        Header: (
          <TableHeaderWithTooltip
            header="BSc & MSc study right"
            tooltipText="Indicates whether the student has been granted the study right to complete both a bachelor's and a master's degree."
          />
        ),
      },
      {
        header: 'Curriculum period',
        accessorKey: 'curriculumPeriod',
        Header: (
          <TableHeaderWithTooltip
            header="Curriculum period"
            tooltipText="The curriculum period the student has chosen for their primary study plan"
          />
        ),
      },
      {
        header: 'Semester enrollments',
        accessorFn: row => getSemesterEnrollmentsVal(row.student, row.studyright),
        Cell: ({ row }) => getSemesterEnrollmentsContent(row.original.student, row.original.studyright),
        id: 'semesterEnrollments',
      },
      {
        header: 'Semesters absent',
        accessorKey: 'numberOfAbsentSemesters',
        filterVariant: 'range',
        Header: (
          <TableHeaderWithTooltip
            header="Semesters absent"
            tooltipText="The number of semesters the student has been absent (both statutory and non-statutory absences) during their study right"
          />
        ),
      },
      {
        header: 'Thesis completed',
        accessorFn: row => row.thesisInfo != null,
        id: 'thesisCompleted',
        filterVariant: 'checkbox',
        Cell: ({ cell, row }) => (
          <CheckIconWithTitle
            title={
              cell.getValue()
                ? [
                    `Attainment date: ${reformatDate(row.original.thesisInfo.attainmentDate, ISO_DATE_FORMAT)}`,
                    `Course code: ${row.original.thesisInfo.courseCode}`,
                    `Grade: ${row.original.thesisInfo.grade}`,
                  ].join('\n')
                : undefined
            }
            visible={cell.getValue<boolean>()}
          />
        ),
        Header: (
          <TableHeaderWithTooltip
            header="Thesis completed"
            tooltipText="The thesis attainment must be linked to the correct study right. You can see the attainment date, course code, and grade by hovering over the check mark."
          />
        ),
      },
      {
        header: 'Latest attainment date – HOPS',
        accessorFn: row => new Date(row.attainmentDates.latestHops),
        id: 'latestAttainmentDateHops',
        Cell: ({ cell }) => reformatDate(cell.getValue<Date>(), ISO_DATE_FORMAT),
        Header: (
          <TableHeaderWithTooltip
            header="Latest attainment date – HOPS"
            tooltipText="The date when the student last completed a course in their primary study plan"
          />
        ),
        filterVariant: 'date-range',
      },
      {
        header: 'Latest attainment date – Total',
        accessorFn: row => new Date(row.attainmentDates.latestTotal),
        id: 'latestAttainmentDateTotal',
        Cell: ({ cell }) => reformatDate(cell.getValue<Date>(), ISO_DATE_FORMAT),
        Header: (
          <TableHeaderWithTooltip
            header="Latest attainment date – Total"
            tooltipText="The date when the student last completed any course at the university"
          />
        ),
        filterVariant: 'date-range',
      },
      {
        header: 'Earliest attainment date – HOPS',
        accessorFn: row => new Date(row.attainmentDates.earliestHops),
        id: 'earlistAttainmentDateHops',
        Cell: ({ cell }) => reformatDate(cell.getValue<Date>(), ISO_DATE_FORMAT),
        Header: (
          <TableHeaderWithTooltip
            header="Earliest attainment date – HOPS"
            tooltipText="The date when the student first completed a course in their primary study plan"
          />
        ),
        filterVariant: 'date-range',
      },
    ],
    [getSemesterEnrollmentsContent, getSemesterEnrollmentsVal, getTextIn]
  )

  const displayedData = (selectedTab === 0 ? students?.bachelor : students?.masterAndLicentiate) ?? []

  const defaultOptions = getDefaultMRTOptions(setExportData, setExportModalOpen, language)

  const table = useMaterialReactTable({
    ...defaultOptions,
    columns,
    data: displayedData,
    initialState: {
      ...defaultOptions.initialState,
      sorting: [{ id: 'programme', desc: false }],
      columnVisibility: {
        'student.name': false,
        'student.phoneNumber': false,
        'student.email': false,
        'student.secondaryEmail': false,
        semesterEnrollments: false,
      },
    },
  })

  return (
    <Container maxWidth="xl">
      <ExportToExcelDialog
        exportColumns={columns}
        exportData={exportData}
        featureName="students_close_to_graduation"
        onClose={() => setExportModalOpen(false)}
        open={exportModalOpen}
      />
      <PageTitle title="Students close to graduation" />
      <Box sx={{ my: 3, textAlign: 'center' }}>
        <InfoBox content={closeToGraduationToolTips} />
      </Box>
      <Tabs centered onChange={(_event, value) => setSelectedTab(value)} value={selectedTab}>
        <Tab label="Bachelor's programmes" />
        <Tab label="Master's and licentiate's programmes" />
      </Tabs>
      <Box sx={{ minHeight: '1.25rem' }}>
        {students?.lastUpdated ? (
          <Typography color="textSecondary" variant="body2">
            Last updated: {reformatDate(students.lastUpdated, LONG_DATE_TIME_FORMAT)}
          </Typography>
        ) : null}
      </Box>
      <MaterialReactTable key={selectedTab} table={table} />
    </Container>
  )
}
