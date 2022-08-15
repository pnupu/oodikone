/// <reference types="Cypress" />

const deleteTag = name => {
  cy.contains('td', name).siblings().contains('Delete').click()
  cy.contains('Are you sure you want to delete tag')
  cy.contains('Confirm').click()
  cy.contains('td', name).should('not.exist')
}

const getEmptyYears = isAcademicYear => {
  const thisYear = new Date().getFullYear()
  const years = []
  for (let year = thisYear; year > 2021; year--) {
    if (isAcademicYear) {
      years.push(`${year} - ${year + 1}`)
    } else {
      years.push(year)
    }
  }
  return years
}

describe('Studyprogramme overview', () => {
  /* Basic information overview -tests*/
  describe('Basic information -view works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
      cy.viewport(1536, 960)
    })

    // If the backend breaks for one of the sections, the section header is not rendered and this will fail
    it('Basic information -tab loads', () => {
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('[data-cy=Section-StudentsOfTheStudyprogramme]')
      cy.get('[data-cy=Section-CreditsProducedByTheStudyprogramme]')
      cy.get('[data-cy=Section-GraduatedAndThesisWritersOfTheProgramme]')
      cy.get('[data-cy=Section-ProgrammesBeforeOrAfter]')
      cy.get('[data-cy=Section-AverageGraduationTimes]')
    })

    it('Basic information contains correct students', () => {
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()
      const years = getEmptyYears()
      const tableContents = [
        // [Year, Started, Graduated, Transferred Away, Transferred to]
        ...years.map(year => [year, 0, 0, 0, 0]),
        [2021, 0, 0, 1, 0],
        [2020, 12, 35, 3, 2],
        [2019, 87, 17, 0, 1],
        [2018, 161, 1, 0, 0],
        [2017, 171, 0, 0, 0],
      ]

      cy.checkTableStats(tableContents, 'StudentsOfTheStudyprogramme')
    })

    it('Basic information contains correct credits', () => {
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()
      const years = getEmptyYears()
      const tableContents = [
        // [Year, Total, Major credits, Non-major credits, Non-degree credits, Transferred credits]
        ...years.map(year => [year, 0, 0, 0, 0, 0]),
        [2021, 0, 0, 0, 0, 0],
        [2020, 5860, 5591, 102, 0, 167],
        [2019, 8696, 7737, 587, 23, 349],
        [2018, 7818, 6584, 857, 105, 272],
        [2017, 3085, 2492, 158, 47, 388],
      ]

      cy.checkTableStats(tableContents, 'CreditsProducedByTheStudyprogramme')
    })

    it('Basic information contains correct thesis writers and graduates', () => {
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()
      const years = getEmptyYears()
      const tableContents = [
        // [Year, Graduated, Wrote thesis]
        ...years.map(year => [year, 0, 0]),
        [2021, 0, 0],
        [2020, 35, 35],
        [2019, 17, 25],
        [2018, 1, 5],
        [2017, 0, 0],
      ]

      cy.checkTableStats(tableContents, 'GraduatedAndThesisWritersOfTheProgramme')
    })

    it.skip('Special studyrights can be excluded and basic data changes accordingly', () => {
      cy.contains('a', 'Tietojenkäsittelytieteen maisteriohjelma').click()
      cy.get('[data-cy=StudentToggle]').click()
      const years = getEmptyYears()
      const studentTableContents = [
        // [Year, Started, Graduated]
        ...years.map(year => [year, 0, 0]),
        [2021, 0, 0],
        [2020, 22, 0],
        [2019, 12, 0],
        [2018, 0, 0],
        [2017, 0, 0],
      ]

      cy.checkTableStats(studentTableContents, 'StudentsOfTheStudyprogramme')

      const creditTableContents = [
        // [Year, Total, Major students credits, Transferred credits]
        ...years.map(year => [year, 0, 0, 0]),
        [2021, 0, 0, 0],
        [2020, 117.5, 0, 7.5],
        [2019, 67, 0, 0],
        [2018, 0, 0, 0],
        [2017, 0, 0, 0],
      ]

      cy.checkTableStats(creditTableContents, 'CreditsProducedByTheStudyprogramme')

      const graduatedTableContents = [
        // [Year, Graduated, Wrote thesis]
        ...years.map(year => [year, 0, 0]),
        [2021, 0, 0],
        [2020, 0, 0],
        [2019, 0, 0],
        [2018, 0, 0],
        [2017, 0, 0],
      ]

      cy.checkTableStats(graduatedTableContents, 'GraduatedAndThesisWritersOfTheProgramme')
      cy.get('[data-cy=StudentToggle]').click()
    })

    it('Year can be changed to academic year, and data changes accordingly', () => {
      cy.contains('a', 'Tietojenkäsittelytieteen maisteriohjelma').click()
      cy.get('[data-cy=YearToggle]').click()
      const isAcademicYear = true
      const years = getEmptyYears(isAcademicYear)
      const studentTableContents = [
        // [Year, Started, Graduated, Transferred away, Transferred to]
        ...years.map(year => [year, 0, 0, 0, 0]),
        ['2021 - 2022', 0, 0, 0, 0],
        ['2020 - 2021', 5, 0, 0, 0],
        ['2019 - 2020', 27, 0, 0, 0],
        ['2018 - 2019', 4, 0, 0, 0],
        ['2017 - 2018', 0, 0, 0, 0],
      ]

      cy.checkTableStats(studentTableContents, 'StudentsOfTheStudyprogramme')

      const creditTableContents = [
        // [Year, Total, Major students credits, Non-major students credits, Non-degree credits, Transferred credits]
        ...years.map(year => [year, 0, 0, 0, 0]),
        ['2021 - 2022', 0, 0, 0, 0],
        ['2020 - 2021', 0, 0, 0, 0],
        ['2019 - 2020', 338.5, 177, 154, 0, 7.5],
        ['2018 - 2019', 173, 0, 173, 0, 0],
        ['2017 - 2018', 42, 0, 42, 0, 0],
      ]

      cy.checkTableStats(creditTableContents, 'CreditsProducedByTheStudyprogramme')
      cy.get('[data-cy=YearToggle]').click()
    })

    it('Basic information graphs render', () => {
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()

      cy.get('[data-cy=Graph-StudentsOfTheStudyprogramme')
        .should('contain', 'Started')
        .should('contain', 'Graduated')
        .should('contain', 'Transferred away')

      cy.get('[data-cy=Graph-CreditsProducedByTheStudyprogramme')
        .should('contain', 'Major students credits')
        .should('contain', 'Non-major students credits')
        .should('contain', 'Transferred credits')
        .should('contain', 857)
        .should('contain', 587)

      cy.get('[data-cy=Graph-GraduatedAndThesisWritersOfTheProgramme')
        .should('contain', 'Graduated students')
        .should('contain', 'Wrote thesis')
        .should('contain', 1)
        .should('contain', 5)
        .should('contain', 17)
        .should('contain', 25)
        .should('contain', 35)

      cy.get('[data-cy=Graph-2019-AverageGraduationTimes]')
        .should('contain', '2019')
        .should('contain', 'n = 17')
        .should('contain', '23 kk')

      cy.get('[data-cy=Graph-ProgrammesBeforeOrAfter')
        .should('contain', 'Tietojenkäsittelytieteen maisteriohjelma')
        .should('contain', 'Datatieteen maisteriohjelma')
        .should('contain', 'Matematiikan ja tilastotieteen maisteriohjelma')
        .should('contain', 1)
        .should('contain', 4)
        .should('contain', 13)
    })
  })

  /* Studytrack overview -tests*/
  describe('Studytrack overview works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
    })

    // If the backend breaks for one of the sections, the section header is not rendered and this will fail
    it('Studytracks and student populations -tab loads', () => {
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Studytracks and student populations').click()
      cy.get('[data-cy=Section-StudytrackOverview]')
      cy.get('[data-cy=Section-StudytrackProgress]')
      cy.get('[data-cy=Section-AverageGraduationTimes]')
    })

    it('Students of the studyprogramme are shown correctly', () => {
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Studytracks and student populations').click()
      const tableContents = [
        // [Year, All, Started studying, Currently enrolled, Absent, Cancelled, Graduated, Men, Women, Finnish]
        [
          '2020 - 2021',
          12,
          '100.0 %',
          10,
          '83.3 %',
          0,
          '0 %',
          0,
          '0 %',
          0,
          '0 %',
          0,
          '0 %',
          10,
          '83.3 %',
          2,
          '16.7 %',
          12,
          '100.0 %',
        ],
        [
          '2019 - 2020',
          86,
          '100.0 %',
          86,
          '100.0 %',
          0,
          '0 %',
          0,
          '0 %',
          1,
          '1.2 %',
          1,
          '1.2 %',
          65,
          '75.6 %',
          21,
          '24.4 %',
          86,
          '100.0 %',
        ],
        [
          '2018 - 2019',
          162,
          '100.0 %',
          161,
          '99.4 %',
          0,
          '0 %',
          0,
          '0 %',
          0,
          '0 %',
          11,
          '6.8 %',
          118,
          '72.8 %',
          44,
          '27.2 %',
          161,
          '99.4 %',
        ],
        [
          '2017 - 2018',
          171,
          '100.0 %',
          171,
          '100.0 %',
          0,
          '0 %',
          0,
          '0 %',
          4,
          '2.3 %',
          42,
          '24.6 %',
          135,
          '78.9 %',
          36,
          '21.1 %',
          166,
          '97.1 %',
        ],
        [
          'Total',
          431,
          '100.0 %',
          431,
          '100.0 %',
          0,
          '0 %',
          0,
          '0 %',
          5,
          '1.2 %',
          54,
          '12.5 %',
          328,
          '76.1 %',
          103,
          '23.9 %',
          425,
          '98.6 %',
        ],
      ]

      cy.checkTableStats(tableContents, 'StudytrackOverview')
    })

    it('Student progress data is shown correctly', () => {
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Studytracks and student populations').click()
      const tableContents = [
        ['2020 - 2021', 12, 12, 0, 0, 0, 0, 0, 0],
        ['2019 - 2020', 86, 26, 34, 21, 5, 0, 0, 0],
        ['2018 - 2019', 162, 10, 27, 47, 36, 26, 12, 4],
        ['2017 - 2018', 171, 20, 21, 26, 22, 22, 33, 27],
        ['Total', 431, 51, 64, 97, 79, 55, 51, 34],
      ]

      cy.checkTableStats(tableContents, 'StudytrackProgress')
    })

    it('Studytrack overview graphs render', () => {
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Studytracks and student populations').click()

      cy.get('[data-cy=Graph-StudytrackProgress]')
        .should('contain', 'Less than 30 credits')
        .should('contain', '30-59 credits')
        .should('contain', 'More than 180 credits')
        .should('contain', '11.7%') // The percentage for less than 30 credits in 2017-2018, to check that the graph renders
        .should('contain', '6.2%') // The percentage for less than 30 credits in 2018-2019
        .should('contain', '30.2%') // The percentage for less than 30 credits in 2019-2020

      cy.get('[data-cy=Graph-2018-AverageGraduationTimes]')
        .should('contain', '2018 - 2019')
        .should('contain', 'n = 11 / 162')
        .should('contain', '22 kk')
    })
  })

  /* Programme courses -tests*/
  describe('Programme courses works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Programme courses').click()
    })

    it('content loads', () => {
      cy.get('[data-cy=CoursesYearFilter]')
      cy.get('[data-cy=CourseTabs]')
    })

    it('time range selection works', () => {
      cy.get('[data-cy=fromYear]').click().contains('2018').click()

      cy.get('[data-cy=toYear').click().contains('2019').click()

      cy.get('[data-cy=CoursesSortableTable]').within(() => {
        cy.get('tr').eq(1).contains('684')
      })
    })

    it('calendar year -> academic year toggle works', () => {
      cy.get('[data-cy=fromYear]').click().contains('2018').click()

      cy.get('[data-cy=toYear').click().contains('2019').click()

      cy.get('[data-cy=CoursesSortableTable]').within(() => {
        cy.get('tr').eq(1).contains('684')
      })

      cy.get('[data-cy=calendarAcademicYearToggle]').first().click()

      cy.get('[data-cy=CoursesSortableTable]').within(() => {
        cy.get('tr').eq(1).contains('772')
      })
    })

    it('contains correct courses in alphabetical order', () => {
      cy.get('[data-cy=CoursesSortableTable]').within(() => {
        cy.get('tr').eq(1).contains('Aineopintojen harjoitustyö: Tietokantasovellus')
        cy.get('tr').eq(-1).contains('Äidinkielinen viestintä')
      })
    })

    it('different sorting options work', () => {
      cy.get('[data-cy=CoursesSortableTable]').within(() => {
        // Test sorting by different columns
        cy.get('th').eq(0).click()
        cy.get('tr').eq(1).contains('Tietojenkäsittelytieteen kisälliopetus: Java-ohjelmointi')
        cy.get('th').eq(1).click()
        cy.get('tr').eq(1).contains('Äidinkielinen viestintä')
        cy.get('th').eq(2).click()
        cy.get('tr').eq(1).contains('Tietorakenteet ja algoritmit')
      })
    })

    it('show credits -> show students toggle works', () => {
      cy.get('[data-cy=CoursesSortableTable]').within(() => {
        cy.get('tr').eq(1).contains('1068')
      })

      cy.get('[data-cy=creditsStudentsToggle]').first().click()

      cy.get('[data-cy=CoursesSortableTable]').within(() => {
        cy.get('tr').eq(1).contains('267')
      })
    })
  })

  /* Tag-tests*/
  describe('Basic information -view works for basic user', () => {
    beforeEach(() => {
      cy.init('/study-programme')
    })

    it('can create and delete tags for population', () => {
      const name = `tag-${new Date().getTime()}`
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Tags').click()
      cy.get('.tagNameSelectInput > .ui > input').type(name)
      cy.get('.yearSelectInput').type('2018')
      cy.contains('Create new tag').click()
      cy.contains(name)
      cy.contains('2018')
      deleteTag(name)
    })

    it('can create personal tags', () => {
      const name = `tag-${new Date().getTime()}`
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Tags').click()
      cy.get('.tagNameSelectInput > .ui > input').type(name)
      cy.get('.yearSelectInput').type('2018')

      cy.get('.ui > label').click()
      cy.contains('Create new tag').click()
      cy.contains(name)
      deleteTag(name)
    })

    it('can add tags to students', () => {
      const name = `tag-${new Date().getTime()}`

      const student = '010113437'

      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Tags').click()
      cy.get('.tagNameSelectInput > .ui > input').type(name)
      cy.get('.yearSelectInput').type('2018')
      cy.contains('Create new tag').click()
      cy.contains(name)

      cy.contains('Add tags to students').click()
      cy.get('.form > .field > .dropdown').click().get('.ui > input.search').type(name).click()

      cy.get('.form > .field > .dropdown > .visible').contains(name).click()

      cy.get('textarea').type('010113437')
      cy.get('.positive').click()

      cy.contains('Student statistics').click()
      cy.get('.prompt').type(student)
      cy.contains('a', student).click()
      cy.contains(name)

      cy.go('back')
      cy.go('back')

      deleteTag(name)

      cy.contains('Student statistics').click()
      cy.get('.prompt').type(student)
      cy.contains('a', student).click()
      cy.contains(name).should('not.exist')
    })
  })

  describe('IAM user', () => {
    beforeEach(() => {
      cy.init('/study-programme', 'onlyiamrights')
    })

    it.skip('can access programme and correct tabs are visible', () => {
      cy.reload()

      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()

      cy.contains('Basic information')
      cy.contains('Studytracks and student populations')

      cy.contains('Update statistics').should('not.exist')
      cy.contains('Degree Courses').should('not.exist')
    })

    it.skip('can access basic information', () => {
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()
      cy.contains('Basic information').click()

      cy.get('[data-cy=Section-StudentsOfTheStudyprogramme]')
      cy.get('[data-cy=Section-CreditsProducedByTheStudyprogramme]')
      cy.get('[data-cy=Section-GraduatedAndThesisWritersOfTheProgramme]')
      cy.get('[data-cy=Section-ProgrammesBeforeOrAfter]')
      cy.get('[data-cy=Section-AverageGraduationTimes]')
    })

    it.skip('can access studytracks', () => {
      cy.contains('a', 'Tietojenkäsittelytieteen kandiohjelma').click()
      cy.get('.attached').contains('Studytracks and student populations').click()

      cy.get('[data-cy=Section-StudytrackOverview]')
      cy.get('[data-cy=Section-StudytrackProgress]')
      cy.get('[data-cy=Section-AverageGraduationTimes]')
    })
  })
})
