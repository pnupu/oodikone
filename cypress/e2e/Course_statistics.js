/// <reference types="cypress" />

const checkGradeTable = gradesTableContents => {
  cy.get('[data-cy="Grade distribution"]')
    .parent()
    .siblings('.content.active')
    .get('table > tbody')
    .first()
    .within(() => {
      gradesTableContents.forEach((values, trIndex) => {
        cy.get('tr')
          .eq(trIndex)
          .within(() => {
            values.forEach((value, tdIndex) => {
              if (value === null) return
              cy.get('td').eq(tdIndex).contains(value)
            })
          })
      })
      cy.get('tr').should('have.length', gradesTableContents.length)
    })
}

const checkTableContents = contents => {
  cy.get('#CourseStatPanes table>tbody').within(() => {
    contents.forEach((values, trIndex) => {
      cy.get('tr')
        .eq(trIndex)
        .within(() => {
          values.forEach((value, tdIndex) => {
            if (value === null) return
            cy.get('td').eq(tdIndex).contains(value)
          })
        })
    })
    cy.get('tr').should('have.length', contents.length)
  })
}

const toggleShowGrades = () => {
  cy.get('[data-cy=gradeToggle]', { force: true }).click({ force: true })
}

const toggleSeparateBySemesters = () => {
  cy.get('[data-cy=separateToggle]', { force: true }).click({ force: true })
}

const openAttemptsTab = () => {
  cy.contains('#CourseStatPanes a.item', 'Attempts').click()
}

const searchByCourseName = courseName => {
  cy.get("input[placeholder='Search by course name']").type(courseName)
}

const searchByCourseCode = courseCode => {
  cy.get("input[placeholder='Search by course code']").type(courseCode)
}

describe('Course Statistics tests', () => {
  describe('When using basic user', () => {
    beforeEach(() => {
      cy.init('/coursestatistics')
      cy.url().should('include', '/coursestatistics')
    })

    describe('It shows correct statistics for courses with other grades than 0-5', () => {
      it('Shows correct statistics for courses with scale HT-TT', () => {
        const gradesTableContents = [
          [null, 'TT', 176],
          [null, 'No grade', 10],
          [null, 'Hyl.', 5],
          [null, 'HT', 177],
        ]
        cy.contains('Search for courses')
        searchByCourseCode('KK-RUKIRJ')
        cy.contains('td', /^KK-RUKIRJ,/).click()
        cy.contains('Search for courses').should('not.exist')
        cy.contains('KK-RUKIRJ Toisen kotimaisen kielen kirjallinen taito, ruotsi (CEFR B1)')
        cy.contains('AYKK-RUKIRJ Avoin yo: Toisen kotimaisen kielen kirjallinen taito, ruotsi (CEFR B1)')
        cy.contains('KK-RULAAK2 Toisen kotimaisen kielen kirjallinen taito, ruotsi (CEFR B1)')
        cy.contains(
          'KK-RUHYK Helsingin yliopistossa toiseen tutkintoon suoritettu toisen kotimaisen kielen kirjallinen taito, ruotsi'
        )
        cy.contains('992912 Toisen kotimaisen kielen kirjallinen taito, ruotsi')
        cy.contains('A992912 Avoin yo: Toisen kotimaisen kielen kirjallinen taito, ruotsi')
        cy.contains('2004-2005')
        cy.contains('Show population').should('be.disabled')
        cy.contains('Show population').trigger('mouseover', { force: true })
        cy.contains('The maximum time range to generate a population for this course is 17 years')
        cy.contains('Show population').trigger('mouseleave', { force: true })
        cy.contains('div', '2004-2005').click()
        cy.contains('2019-2020').click()
        cy.contains('Show population').click()
        cy.contains(
          'Population of course Toisen kotimaisen kielen kirjallinen taito, ruotsi (CEFR B1) 2019-2024 (open and normal)'
        )
        cy.contains('368 students out of 368 shown')
        checkGradeTable(gradesTableContents)
      })

      it("Shows correct statistics for old master's thesis grade scales", () => {
        const gradesTableContents = [
          [null, 'NSLA', 1],
          [null, 'L', 3],
          [null, 'ECLA', 5],
          [null, 'CL', 1],
        ]
        cy.contains('Search for courses')
        searchByCourseCode('50131')
        cy.contains('td', '50131').click()
        cy.contains('Search for courses').should('not.exist')
        cy.contains('50131 Pro gradu -tutkielma tietojenkäsittelytieteessä')
        cy.contains('Show population').should('be.enabled').click()
        cy.contains('Population of course Pro gradu -tutkielma tietojenkäsittelytieteessä 2007-2020 (open and normal)')
        cy.contains('10 students out of 10 shown')
        checkGradeTable(gradesTableContents)
      })

      it('Shows correct statistics for courses with scale passed-failed', () => {
        const gradesTableContents = [
          [null, 'Hyv.', 3],
          [null, 'Hyl.', 1],
        ]
        cy.contains('Search for courses')
        searchByCourseCode('200012')
        cy.contains('td', '200012').click()
        cy.contains('Search for courses').should('not.exist')
        cy.contains(
          'ON-310 Tieteellisen kirjoittamisen seminaarin alkuopetus: Tieteellisen kirjallisen työn ja tiedonhankinnan perustaidot'
        )
        cy.contains('200012 Tieteellisen kirjallisen työn ja tiedonhankinnan perustaidot')
        cy.contains('Show population').should('be.enabled').click()
        cy.contains(
          'Population of course Tieteellisen kirjoittamisen seminaarin alkuopetus: Tieteellisen kirjallisen työn ja tiedonhankinnan perustaidot 2011-2018 (open and normal)'
        )
        cy.contains('4 students out of 4 shown')
        checkGradeTable(gradesTableContents)
      })
    })

    it('Searching single course having substitution mappings shows course statistics', () => {
      cy.contains('Search for courses')
      searchByCourseCode('TKT20001')
      cy.contains('td', /^TKT20001/).click()
      cy.contains('Search for courses').should('not.exist')

      cy.contains('Tietorakenteet ja algoritmit')
      cy.contains('TKT20001')
      cy.contains('58131')

      cy.contains('.tabular.menu a', 'Students').click()
      cy.contains('All')
      cy.contains('svg', 'Pass rate')

      cy.contains('.tabular.menu a', 'Attempts').click()
      cy.contains('All')
      cy.contains('svg', 'Pass rate')

      cy.contains('a', 'New query').click()
      cy.contains('Search for courses')
    })

    it('Searching multiple courses having substitution mappings shows course statistics', () => {
      cy.contains('Search for courses')
      cy.cs('select-multiple-courses-toggle').should('not.have.class', 'checked').click()
      cy.cs('select-multiple-courses-toggle').should('have.class', 'checked')
      searchByCourseCode('TKT')
      cy.contains('td', /^TKT20001/).click()
      cy.contains('td', /^TKT10002/).click()
      cy.contains('Fetch statistics').should('be.enabled').click()
      cy.contains('Search for courses').should('not.exist')

      cy.contains('.courseNameCell', 'Tietorakenteet ja algoritmit').contains('TKT20001').click()
      cy.contains('.courseNameCell', 'Ohjelmoinnin perusteet').should('not.exist')
      cy.contains('TKT20001')
      cy.contains('58131')
      cy.contains('Summary').click()

      cy.contains('.courseNameCell', 'Ohjelmoinnin perusteet').contains('TKT10002').click()
      cy.contains('.courseNameCell', 'Käyttöjärjestelmät').should('not.exist')
      cy.contains('TKT10002')
      cy.contains('581325')
      cy.contains('Summary').click()

      cy.contains('a', 'New query').click()
      cy.contains('Search for courses')
    })

    it('On searches with multiple courses, has correct links on the Course tab', () => {
      cy.cs('select-multiple-courses-toggle').click()
      searchByCourseCode('TKT')
      cy.contains('td', /^TKT20001/).click()
      cy.contains('td', /^TKT10002/).click()
      cy.contains('Fetch statistics').click()
      cy.contains('Search for courses').should('not.exist')

      cy.get('.ui.contentSegment .ui.menu').contains('Course').click()
      cy.cs('course-selector').get('.active.selected.item').contains('TKT10002')
      cy.get('#CourseStatPanes table a.item:first').click()
      cy.contains('Population of course Introduction to Programming 2023-2024 (open and normal)')

      cy.go('back')
      cy.get('.ui.contentSegment .ui.menu').contains('Course').click()
      cy.cs('course-selector').click()
      cy.cs('course-selector').contains('TKT20001').click()
      cy.get('#CourseStatPanes table a.item:first').click()
      cy.contains('Population of course Tietorakenteet ja algoritmit')
    })

    it('On consecutive searches should not crash and search should work', () => {
      cy.contains('Search for courses')
      searchByCourseCode('TKT20003')
      cy.contains('td', 'TKT20003').click()
      cy.contains('Show population')
      cy.contains('TKT20003')

      cy.contains('Courses').click()
      cy.contains('Search for courses')
      searchByCourseCode('TKT20001')
      cy.contains('td', 'TKT20001').click()
      cy.contains('Show population')
      cy.contains('TKT20001')
    })

    it('Searching course by name displays right courses', () => {
      cy.contains('Search for courses')
      searchByCourseName('tietokantojen perusteet')

      cy.contains('Tietokantojen perusteet')
      cy.contains('td', 'TKT10004, BSCS2001, 581328, A581328, AYTKT10004').click()

      cy.contains('Search for courses').should('not.exist')

      cy.contains('TKT10004 Tietokantojen perusteet')
      cy.contains('AYTKT10004 Avoin yo: Tietokantojen perusteet')
      cy.contains('BSCS2001 Introduction to Databases')
      cy.contains('581328 Tietokantojen perusteet')
      cy.contains('A581328 Avoin yo: Tietokantojen perusteet')
      cy.get('.right').click()
      cy.contains('No results')
    })

    it('"Select all search results" button is not showing unless "Select multiple courses" toggle is on', () => {
      cy.contains('Search for courses')
      searchByCourseCode('TKT')
      cy.get('[data-cy="select-multiple-courses-toggle"]').should('not.have.class', 'checked')
      cy.contains('TKT10004, BSCS2001, 581328, A581328, AYTKT10004')
      cy.contains('Select all search results').should('not.exist')
      cy.get('[data-cy="select-multiple-courses-toggle"]').click()
      cy.get('[data-cy="select-multiple-courses-toggle"]').should('have.class', 'checked')
      cy.contains('Select all search results')
    })

    it('Provider organization toggle works', () => {
      cy.contains('Search for courses')
      searchByCourseName('tietokantojen perusteet')

      cy.contains('td', /^TKT10004/).click()
      cy.contains('Search for courses').should('not.exist')

      cy.contains('AYTKT10004 Avoin yo: Tietokantojen perusteet')
      cy.contains('A581328 Avoin yo: Tietokantojen perusteet')
      cy.contains('TKT10004 Tietokantojen perusteet')
      cy.contains('BSCS2001 Introduction to Databases')
      cy.contains('581328 Tietokantojen perusteet')
      cy.cs('providerCheckboxUniversity').should('have.class', 'checked').click()
      cy.cs('providerCheckboxOpenUni').should('have.class', 'checked').click()
      cy.contains('TKT10004 Tietokantojen perusteet')
      cy.contains('BSCS2001 Introduction to Databases')
      cy.contains('581328 Tietokantojen perusteet')
    })

    it('Searching course by name displays right courses, 10 credit courses', { retries: 2 }, () => {
      cy.contains('Search for courses')
      searchByCourseName('tietorakenteet ja algoritmit')
      cy.contains('Tietorakenteet ja algoritmit')
      cy.contains('td', 'TKT20001, BSCS1003, 58131, AYTKT20001').click()
      cy.contains('Search for courses').should('not.exist')

      cy.contains('TKT20001 Tietorakenteet ja algoritmit')
      cy.contains('AYTKT20001 Avoin yo: Tietorakenteet ja algoritmit')
      cy.contains('BSCS1003 Data Structures and Algorithms')
      cy.contains('58131 Tietorakenteet')
      cy.get('.right').click()
      cy.contains('No results')
      searchByCourseName('tietorakenteet ja algoritmit')
      cy.contains('td', 'TKT20001, BSCS1003, 58131, AYTKT20001').click()

      cy.contains('Search for courses').should('not.exist')
      cy.contains('TKT20001 Tietorakenteet ja algoritmit')
      cy.contains('AYTKT20001 Avoin yo: Tietorakenteet ja algoritmit')
      cy.contains('BSCS1003 Data Structures and Algorithms')
      cy.contains('58131 Tietorakenteet')
    })

    it('Can find course population', () => {
      cy.contains('Search for courses')
      searchByCourseCode('TKT20003')
      cy.contains('tr', 'TKT20003').click()
      cy.contains('TKT20003 Käyttöjärjestelmät')
      cy.contains('582219 Käyttöjärjestelmät')
      cy.get('tbody > :nth-child(4) > :nth-child(2) .level').click()
      cy.contains('Population of course Käyttöjärjestelmät 2020-2021 (open and normal')
      cy.contains('TKT20003')

      cy.contains('Students (19)').click()
      cy.contains('394776')
      cy.contains('416369')
    })

    it('Population of course shows grades for each student', () => {
      searchByCourseCode('TKT20001')
      cy.contains('td', 'TKT20001, BSCS1003, 58131, AYTKT20001').click()
      cy.contains('TKT20001 Tietorakenteet ja algoritmit')
      cy.contains('AYTKT20001 Avoin yo: Tietorakenteet ja algoritmit')
      cy.contains('BSCS1003 Data Structures and Algorithms')
      cy.contains('58131 Tietorakenteet')
      cy.get('tbody >:nth-child(5) > :nth-child(2) .level').click()
      cy.contains('Population of course Tietorakenteet ja algoritmit 2019-2020 (open and normal)')
      cy.contains('Students (33)').click()
      cy.contains('td', '394776').siblings().eq(2).contains('3')
      cy.contains('td', '497388').siblings().eq(2).contains('2')
    })

    it("In 'Course population' view, student numbers of students that the user isn't allowed to see are hidden", () => {
      searchByCourseCode('TKT20001')
      cy.contains('td', 'TKT20001, BSCS1003, 58131, AYTKT20001').click()
      cy.contains('TKT20001 Tietorakenteet ja algoritmit')
      cy.contains('AYTKT20001 Avoin yo: Tietorakenteet ja algoritmit')
      cy.contains('BSCS1003 Data Structures and Algorithms')
      cy.contains('58131 Tietorakenteet')
      cy.get('tbody >:nth-child(5) > :nth-child(2) .level').click()
      cy.contains('Population of course Tietorakenteet ja algoritmit 2019-2020 (open and normal)')
      cy.contains('Students (33)').click()
      cy.get('table tbody td').filter(':contains("hidden")').should('have.length', 9)
    })

    it('Language distribution is correct', () => {
      searchByCourseCode('TKT20003')
      cy.contains('td', 'TKT20003, 582219').click()
      cy.contains('TKT20003 Käyttöjärjestelmät')
      cy.contains('582219 Käyttöjärjestelmät')
      cy.cs('providerCheckboxOpenUni').click()
      cy.get('tbody > :nth-child(3) > :nth-child(2) .level').click()
      cy.contains('Population of course Käyttöjärjestelmät 2021-2022 (open and normal)')
      cy.contains('Language distribution').click()
      cy.contains('td', 'finnish').siblings().eq(0).contains('5')
      cy.contains('td', 'english').siblings().eq(0).contains('2')
    })

    describe('Single course stats', () => {
      describe('Combine substitutions off', () => {
        beforeEach(() => {
          cy.url().should('include', '/coursestatistics')
          cy.contains('Search for courses')
          cy.get('[data-cy="combine-substitutions-toggle"]').should('have.class', 'checked').click()
          cy.get('[data-cy="combine-substitutions-toggle"]').should('not.have.class', 'checked')
          searchByCourseCode('TKT10002')
          cy.contains('td', /^TKT10002$/).click()
          cy.contains('Search for courses').should('not.exist')
          cy.contains('TKT10002 Ohjelmoinnin perusteet')
        })

        it('Time range', () => {
          const yearRange = { from: '2016-2017', to: '2023-2024' }
          cy.get("div[name='fromYear']").within(() => {
            cy.get("div[role='option']").first().should('have.text', yearRange.to)
            cy.contains("div[role='option']", yearRange.from).should('have.class', 'selected')
            cy.get("div[role='option']").last().should('have.text', '2016-2017')
            cy.get("div[role='option']").should('have.length', 8)
          })
          cy.get("div[name='toYear']").within(() => {
            cy.get("div[role='option']").first().should('have.text', '2023-2024')
            cy.contains("div[role='option']", yearRange.to).should('have.class', 'selected')
            cy.get("div[role='option']").last().should('have.text', yearRange.from)
            cy.get("div[role='option']").should('have.length', 8)
          })
          cy.contains('Show population').should('be.enabled')
        })

        describe('Students tab', () => {
          it('Show grades off, Separate by semesters off', () => {
            const tableContents = [
              // [Time, --, Total students, Passed, Failed, Enrolled no grade, Pass rate, Fail rate]
              ['Total', null, 187, 140, 11, 36, '74.87 %', '25.13 %'],
              ['2023-2024', null, 7, 1, 0, 6, '14.29 %', '85.71 %'],
              ['2022-2023', null, 33, 27, 0, 6, '81.82 %', '18.18 %'],
              ['2021-2022', null, 39, 15, 0, 24, '38.46 %', '61.54 %'],
              ['2020-2021', null, 23, 23, 0, null, '100.00 %', '0.00 %'],
              ['2019-2020', null, 28, 28, 0, null, '100.00 %', '0.00 %'],
              ['2018-2019', null, 30, 26, 4, null, '86.67 %', '13.33 %'],
              ['2017-2018', null, 26, 19, 7, null, '73.08 %', '26.92 %'],
              ['2016-2017', null, 1, 1, 0, null, '100.00 %', '0.00 %'],
            ]
            checkTableContents(tableContents)
          })

          it('Show grades off, Separate by semesters on', () => {
            const tableContents = [
              // [Time, --, Total students, Passed, Failed, Enrolled no grade, Pass rate, Fail rate]
              ['Total', null, 191, 140, 13, 38, '73.30 %', '26.70 %'],
              ['Syksy 2023', null, 7, 1, 0, 6, '14.29 %', '85.71 %'],
              ['Kevät 2023', null, 10, 9, 0, 1, '90.00 %', '10.00 %'],
              ['Syksy 2022', null, 23, 18, 0, 5, '78.26 %', '21.74 %'],
              ['Kevät 2022', null, 26, 9, 0, 17, '34.62 %', '65.38 %'],
              ['Syksy 2021', null, 15, 6, 0, 9, '40.00 %', '60.00 %'],
              ['Kevät 2021', null, 4, 4, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2020', null, 19, 19, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2020', null, 4, 4, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2019', null, 25, 24, 1, null, '96.00 %', '4.00 %'],
              ['Kevät 2019', null, 8, 8, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2018', null, 22, 18, 4, null, '81.82 %', '18.18 %'],
              ['Kevät 2018', null, 19, 12, 7, null, '63.16 %', '36.84 %'],
              ['Syksy 2017', null, 8, 7, 1, null, '87.50 %', '12.50 %'],
              ['Syksy 2016', null, 1, 1, 0, null, '100.00 %', '0.00 %'],
            ]
            toggleSeparateBySemesters()
            checkTableContents(tableContents)
          })

          it('Show grades on, Separate by semesters off', () => {
            const tableContents = [
              // [Time, --, Total students, Failed, 0, 1, 2, 3, 4, 5, Other passed, Enrolled no grade, Pass rate, Fail rate]
              ['Total', null, 187, 11, 3, 8, 5, 24, 99, 1, 36, '74.87 %', '25.13 %'],
              ['2023-2024', null, 7, 0, 0, 0, 0, 0, 1, 0, 6, '14.29 %', '85.71 %'],
              ['2022-2023', null, 33, 0, 0, 0, 0, 6, 21, 0, 6, '81.82 %', '18.18 %'],
              ['2021-2022', null, 39, 0, 0, 0, 0, 2, 13, 0, 24, '38.46 %', '61.54 %'],
              ['2020-2021', null, 23, 0, 0, 2, 0, 2, 18, 1, null, '100.00 %', '0.00 %'],
              ['2019-2020', null, 28, 0, 1, 4, 1, 5, 17, 0, null, '100.00 %', '0.00 %'],
              ['2018-2019', null, 30, 4, 2, 1, 2, 3, 18, 0, null, '86.67 %', '13.33 %'],
              ['2017-2018', null, 26, 7, 0, 1, 2, 5, 11, 0, null, '73.08 %', '26.92 %'],
              ['2016-2017', null, 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
            ]
            toggleShowGrades()
            checkTableContents(tableContents)
          })

          it('Show grades on, Separate by semesters on', () => {
            const tableContents = [
              // [Time, --, Total students, Failed, 0, 1, 2, 3, 4, 5, Other passed, Enrolled no grade, Pass rate, Fail rate]
              ['Total', null, 191, 13, 3, 8, 5, 24, 99, 1, 38, '73.30 %', '26.70 %'],
              ['Syksy 2023', null, 7, 0, 0, 0, 0, 0, 1, 0, 6, '14.29 %', '85.71 %'],
              ['Kevät 2023', null, 10, 0, 0, 0, 0, 3, 6, 0, 1, '90.00 %', '10.00 %'],
              ['Syksy 2022', null, 23, 0, 0, 0, 0, 3, 15, 0, 5, '78.26 %', '21.74 %'],
              ['Kevät 2022', null, 26, 0, 0, 0, 0, 2, 7, 0, 17, '34.62 %', '65.38 %'],
              ['Syksy 2021', null, 15, 0, 0, 0, 0, 0, 6, 0, 9, '40.00 %', '60.00 %'],
              ['Kevät 2021', null, 4, 0, 0, 0, 0, 0, 4, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2020', null, 19, 0, 0, 2, 0, 2, 14, 1, null, '100.00 %', '0.00 %'],
              ['Kevät 2020', null, 4, 0, 1, 0, 1, 0, 2, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2019', null, 25, 1, 0, 4, 0, 5, 15, 0, null, '96.00 %', '4.00 %'],
              ['Kevät 2019', null, 8, 0, 0, 0, 1, 1, 6, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2018', null, 22, 4, 2, 1, 1, 2, 12, 0, null, '81.82 %', '18.18 %'],
              ['Kevät 2018', null, 19, 7, 0, 1, 0, 3, 8, 0, null, '63.16 %', '36.84 %'],
              ['Syksy 2017', null, 8, 1, 0, 0, 2, 2, 3, 0, null, '87.50 %', '12.50 %'],
              ['Syksy 2016', null, 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
            ]
            toggleShowGrades()
            toggleSeparateBySemesters()
            checkTableContents(tableContents)
          })
        })

        describe('Attempts tab', () => {
          beforeEach(() => {
            openAttemptsTab()
          })

          it('Show grades off, Separate by semesters off', () => {
            const tableContents = [
              // [Time, --, Total attempts, Passed, Failed, Pass rate, Enrollments]
              ['Total', null, 186, 140, 16, '89.74 %', 73],
              ['2023-2024', null, 6, 1, 0, '16.67 %', 6],
              ['2022-2023', null, 26, 27, 0, '100.00 %', 26],
              ['2021-2022', null, 41, 15, 0, '36.59 %', 41],
              ['2020-2021', null, 23, 23, 0, '100.00 %', null],
              ['2019-2020', null, 29, 28, 1, '96.55 %', null],
              ['2018-2019', null, 32, 26, 6, '81.25 %', null],
              ['2017-2018', null, 28, 19, 9, '67.86 %', null],
              ['2016-2017', null, 1, 1, 0, '100.00 %', null],
            ]
            checkTableContents(tableContents)
          })

          it('Show grades off, Separate by semesters on', () => {
            const tableContents = [
              // [Time, --, Total attempts, Passed, Failed, Pass rate, Enrollments]
              ['Total', null, 186, 140, 16, '89.74 %', 73],
              ['Syksy 2023', null, 6, 1, 0, '16.67 %', 6],
              ['Kevät 2023', null, 11, 9, 0, '81.82 %', 11],
              ['Syksy 2022', null, 15, 18, 0, '100.00 %', 15],
              ['Kevät 2022', null, 29, 9, 0, '31.03 %', 29],
              ['Syksy 2021', null, 12, 6, 0, '50.00 %', 12],
              ['Kevät 2021', null, 4, 4, 0, '100.00 %', null],
              ['Syksy 2020', null, 19, 19, 0, '100.00 %', null],
              ['Kevät 2020', null, 4, 4, 0, '100.00 %', null],
              ['Syksy 2019', null, 25, 24, 1, '96.00 %', null],
              ['Kevät 2019', null, 8, 8, 0, '100.00 %', null],
              ['Syksy 2018', null, 24, 18, 6, '75.00 %', null],
              ['Kevät 2018', null, 20, 12, 8, '60.00 %', null],
              ['Syksy 2017', null, 8, 7, 1, '87.50 %', null],
              ['Syksy 2016', null, 1, 1, 0, '100.00 %', null],
            ]
            toggleSeparateBySemesters()
            checkTableContents(tableContents)
          })

          it('Show grades on, Separate by semesters off', () => {
            const tableContents = [
              // [Time, --, Total attempts, 0, 1, 2, 3, 4, 5, Other passed]
              ['Total', null, 186, 16, 3, 8, 5, 24, 99, 1],
              ['2023-2024', null, 6, 0, 0, 0, 0, 0, 1, 0],
              ['2022-2023', null, 26, 0, 0, 0, 0, 6, 21, 0],
              ['2021-2022', null, 41, 0, 0, 0, 0, 2, 13, 0],
              ['2020-2021', null, 23, 0, 0, 2, 0, 2, 18, 1],
              ['2019-2020', null, 29, 1, 1, 4, 1, 5, 17, 0],
              ['2018-2019', null, 32, 6, 2, 1, 2, 3, 18, 0],
              ['2017-2018', null, 28, 9, 0, 1, 2, 5, 11, 0],
              ['2016-2017', null, 1, 0, 0, 0, 0, 1, 0, 0],
            ]
            toggleShowGrades()
            checkTableContents(tableContents)
          })

          it('Show grades on, Separate by semesters on', () => {
            const tableContents = [
              // [Time, --, Total attempts, 0, 1, 2, 3, 4, 5, Other passed]
              ['Total', null, 186, 16, 3, 8, 5, 24, 99, 1],
              ['Syksy 2023', null, 6, 0, 0, 0, 0, 0, 1, 0],
              ['Kevät 2023', null, 11, 0, 0, 0, 0, 3, 6, 0],
              ['Syksy 2022', null, 15, 0, 0, 0, 0, 3, 15, 0],
              ['Kevät 2022', null, 29, 0, 0, 0, 0, 2, 7, 0],
              ['Syksy 2021', null, 12, 0, 0, 0, 0, 0, 6, 0],
              ['Kevät 2021', null, 4, 0, 0, 0, 0, 0, 4, 0],
              ['Syksy 2020', null, 19, 0, 0, 2, 0, 2, 14, 1],
              ['Kevät 2020', null, 4, 0, 1, 0, 1, 0, 2, 0],
              ['Syksy 2019', null, 25, 1, 0, 4, 0, 5, 15, 0],
              ['Kevät 2019', null, 8, 0, 0, 0, 1, 1, 6, 0],
              ['Syksy 2018', null, 24, 6, 2, 1, 1, 2, 12, 0],
              ['Kevät 2018', null, 20, 8, 0, 1, 0, 3, 8, 0],
              ['Syksy 2017', null, 8, 1, 0, 0, 2, 2, 3, 0],
              ['Syksy 2016', null, 1, 0, 0, 0, 0, 1, 0, 0],
            ]
            toggleShowGrades()
            toggleSeparateBySemesters()
            checkTableContents(tableContents)
          })
        })
      })

      describe('Combine substitutions on', () => {
        beforeEach(() => {
          cy.url().should('include', '/coursestatistics')
          cy.contains('Search for courses')
          searchByCourseCode('TKT10002')
          cy.contains('td', /^TKT10002, BSCS1001, 581325, A581325, AYTKT10002$/).click()
          cy.contains('Search for courses').should('not.exist')
          cy.contains('TKT10002 Ohjelmoinnin perusteet')
          cy.contains('AYTKT10002 Avoin yo: Ohjelmoinnin perusteet')
          cy.contains('BSCS1001 Introduction to Programming')
          cy.contains('581325 Ohjelmoinnin perusteet')
          cy.contains('A581325 Avoin yo: Ohjelmoinnin perusteet')
        })

        it('Time range', () => {
          const yearRange = { from: '1999-2000', to: '2023-2024' }
          cy.contains('Statistics by time range')
          cy.get("div[name='fromYear']").within(() => {
            cy.get("div[role='option']").first().should('have.text', yearRange.to)
            cy.contains("div[role='option']", yearRange.from).should('have.class', 'selected')
            cy.get("div[role='option']").last().should('have.text', '1999-2000')
            cy.get("div[role='option']").should('have.length', 25)
          })
          cy.get("div[name='toYear']").within(() => {
            cy.get("div[role='option']").first().should('have.text', '2023-2024')
            cy.contains("div[role='option']", yearRange.to).should('have.class', 'selected')
            cy.get("div[role='option']").last().should('have.text', yearRange.from)
            cy.get("div[role='option']").should('have.length', 25)
          })
          cy.contains('Show population').should('be.enabled')
        })

        describe('Students tab', () => {
          it('Show grades off, Separate by semesters off', () => {
            const tableContents = [
              // [Time, --, Total students, Passed, Failed, Enrolled no grade, Pass rate, Fail rate]
              ['Total', null, 284, 237, 16, 31, '83.45 %', '16.55 %'],
              ['2023-2024', null, 8, 2, 0, 6, '25.00 %', '75.00 %'],
              ['2022-2023', null, 35, 28, 0, 7, '80.00 %', '20.00 %'],
              ['2021-2022', null, 45, 27, 0, 18, '60.00 %', '40.00 %'],
              ['2020-2021', null, 33, 33, 0, null, '100.00 %', '0.00 %'],
              ['2019-2020', null, 57, 56, 1, null, '98.25 %', '1.75 %'],
              ['2018-2019', null, 42, 38, 4, null, '90.48 %', '9.52 %'],
              ['2017-2018', null, 32, 25, 7, null, '78.13 %', '21.88 %'],
              ['2016-2017', null, 7, 6, 1, null, '85.71 %', '14.29 %'],
              ['2015-2016', null, 4, 3, 1, null, '75.00 %', '25.00 %'],
              ['2014-2015', null, 6, 6, 0, null, '100.00 %', '0.00 %'],
              ['2013-2014', null, 2, 1, 1, null, '50.00 %', '50.00 %'],
              ['2012-2013', null, 4, 4, 0, null, '100.00 %', '0.00 %'],
              ['2011-2012', null, 1, 1, 0, null, '100.00 %', '0.00 %'],
              ['2010-2011', null, 1, 1, 0, null, '100.00 %', '0.00 %'],
              ['2008-2009', null, 1, 0, 1, null, '0.00 %', '100.00 %'],
              ['2007-2008', null, 1, 1, 0, null, '100.00 %', '0.00 %'],
              ['2006-2007', null, 1, 1, 0, null, '100.00 %', '0.00 %'],
              ['2005-2006', null, 1, 1, 0, null, '100.00 %', '0.00 %'],
              ['2003-2004', null, 1, 1, 0, null, '100.00 %', '0.00 %'],
              ['1999-2000', null, 2, 2, 0, null, '100.00 %', '0.00 %'],
            ]
            checkTableContents(tableContents)
          })

          it('Show grades off, Separate by semesters on', () => {
            const tableContents = [
              // [Time, --, Total students, Passed, Failed, Enrolled no grade, Pass rate, Fail rate]
              ['Total', null, 293, 239, 19, 35, '81.57 %', '18.43 %'],
              ['Syksy 2023', null, 8, 2, 0, 6, '25.00 %', '75.00 %'],
              ['Kevät 2023', null, 12, 10, 0, 2, '83.33 %', '16.67 %'],
              ['Syksy 2022', null, 23, 18, 0, 5, '78.26 %', '21.74 %'],
              ['Kevät 2022', null, 28, 11, 0, 17, '39.29 %', '60.71 %'],
              ['Syksy 2021', null, 21, 16, 0, 5, '76.19 %', '23.81 %'],
              ['Kevät 2021', null, 8, 8, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2020', null, 25, 25, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2020', null, 26, 26, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2019', null, 33, 31, 2, null, '93.94 %', '6.06 %'],
              ['Kevät 2019', null, 17, 16, 1, null, '94.12 %', '5.88 %'],
              ['Syksy 2018', null, 27, 23, 4, null, '85.19 %', '14.81 %'],
              ['Kevät 2018', null, 24, 17, 7, null, '70.83 %', '29.17 %'],
              ['Syksy 2017', null, 9, 8, 1, null, '88.89 %', '11.11 %'],
              ['Kevät 2017', null, 4, 3, 1, null, '75.00 %', '25.00 %'],
              ['Syksy 2016', null, 3, 3, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2016', null, 3, 2, 1, null, '66.67 %', '33.33 %'],
              ['Syksy 2015', null, 1, 1, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2015', null, 3, 3, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2014', null, 3, 3, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2014', null, 1, 1, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2013', null, 1, 0, 1, null, '0.00 %', '100.00 %'],
              ['Syksy 2012', null, 4, 4, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2012', null, 1, 1, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2011', null, 1, 1, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2008', null, 1, 0, 1, null, '0.00 %', '100.00 %'],
              ['Kevät 2008', null, 1, 1, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2007', null, 1, 1, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2005', null, 1, 1, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2004', null, 1, 1, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 1999', null, 2, 2, 0, null, '100.00 %', '0.00 %'],
            ]
            toggleSeparateBySemesters()
            checkTableContents(tableContents)
          })

          it('Show grades on, Separate by semesters off', () => {
            const tableContents = [
              // [Time, --, Total students, Failed, 0, 1, 2, 3, 4, 5, Other passed, Enrolled no grade, Pass rate, Fail rate]
              ['Total', null, 284, 16, 4, 14, 9, 37, 168, 5, 31, '83.45 %', '16.55 %'],
              ['2023-2024', null, 8, 0, 0, 0, 0, 0, 2, 0, 6, '25.00 %', '75.00 %'],
              ['2022-2023', null, 35, 0, 0, 0, 0, 6, 22, 0, 7, '80.00 %', '20.00 %'],
              ['2021-2022', null, 45, 0, 0, 1, 0, 2, 24, 0, 18, '60.00 %', '40.00 %'],
              ['2020-2021', null, 33, 0, 0, 2, 1, 2, 27, 1, null, '100.00 %', '0.00 %'],
              ['2019-2020', null, 57, 1, 1, 5, 3, 9, 38, 0, null, '98.25 %', '1.75 %'],
              ['2018-2019', null, 42, 4, 3, 2, 2, 6, 25, 0, null, '90.48 %', '9.52 %'],
              ['2017-2018', null, 32, 7, 0, 2, 2, 6, 15, 0, null, '78.13 %', '21.88 %'],
              ['2016-2017', null, 7, 1, 0, 0, 1, 1, 4, 0, null, '85.71 %', '14.29 %'],
              ['2015-2016', null, 4, 1, 0, 1, 0, 0, 1, 1, null, '75.00 %', '25.00 %'],
              ['2014-2015', null, 6, 0, 0, 1, 0, 0, 2, 3, null, '100.00 %', '0.00 %'],
              ['2013-2014', null, 2, 1, 0, 0, 0, 0, 1, 0, null, '50.00 %', '50.00 %'],
              ['2012-2013', null, 4, 0, 0, 0, 0, 3, 1, 0, null, '100.00 %', '0.00 %'],
              ['2011-2012', null, 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
              ['2010-2011', null, 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
              ['2008-2009', null, 1, 1, 0, 0, 0, 0, 0, 0, null, '0.00 %', '100.00 %'],
              ['2007-2008', null, 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
              ['2006-2007', null, 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
              ['2005-2006', null, 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
              ['2003-2004', null, 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
              ['1999-2000', null, 2, 0, 0, 0, 0, 0, 2, 0, null, '100.00 %', '0.00 %'],
            ]
            toggleShowGrades()
            checkTableContents(tableContents)
          })

          it('Show grades on, Separate by semesters on', () => {
            const tableContents = [
              // [Time, --, Total students, Failed, 0, 1, 2, 3, 4, 5, Other passed, Enrolled no grade, Pass rate, Fail rate]
              ['Total', null, 293, 19, 5, 15, 9, 37, 168, 5, 35, '81.57 %', '18.43 %'],
              ['Syksy 2023', null, 8, 0, 0, 0, 0, 0, 2, 0, 6, '25.00 %', '75.00 %'],
              ['Kevät 2023', null, 12, 0, 0, 0, 0, 3, 7, 0, 2, '83.33 %', '16.67 %'],
              ['Syksy 2022', null, 23, 0, 0, 0, 0, 3, 15, 0, 5, '78.26 %', '21.74 %'],
              ['Kevät 2022', null, 28, 0, 0, 0, 0, 2, 9, 0, 17, '39.29 %', '60.71 %'],
              ['Syksy 2021', null, 21, 0, 0, 1, 0, 0, 15, 0, 5, '76.19 %', '23.81 %'],
              ['Kevät 2021', null, 8, 0, 0, 0, 0, 0, 8, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2020', null, 25, 0, 0, 2, 1, 2, 19, 1, null, '100.00 %', '0.00 %'],
              ['Kevät 2020', null, 26, 0, 1, 1, 2, 4, 18, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2019', null, 33, 2, 1, 4, 1, 5, 20, 0, null, '93.94 %', '6.06 %'],
              ['Kevät 2019', null, 17, 1, 1, 1, 1, 2, 11, 0, null, '94.12 %', '5.88 %'],
              ['Syksy 2018', null, 27, 4, 2, 2, 1, 4, 14, 0, null, '85.19 %', '14.81 %'],
              ['Kevät 2018', null, 24, 7, 0, 2, 0, 4, 11, 0, null, '70.83 %', '29.17 %'],
              ['Syksy 2017', null, 9, 1, 0, 0, 2, 2, 4, 0, null, '88.89 %', '11.11 %'],
              ['Kevät 2017', null, 4, 1, 0, 0, 1, 0, 2, 0, null, '75.00 %', '25.00 %'],
              ['Syksy 2016', null, 3, 0, 0, 0, 0, 1, 2, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2016', null, 3, 1, 0, 1, 0, 0, 1, 0, null, '66.67 %', '33.33 %'],
              ['Syksy 2015', null, 1, 0, 0, 0, 0, 0, 0, 1, null, '100.00 %', '0.00 %'],
              ['Kevät 2015', null, 3, 0, 0, 0, 0, 0, 0, 3, null, '100.00 %', '0.00 %'],
              ['Syksy 2014', null, 3, 0, 0, 1, 0, 0, 2, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2014', null, 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2013', null, 1, 1, 0, 0, 0, 0, 0, 0, null, '0.00 %', '100.00 %'],
              ['Syksy 2012', null, 4, 0, 0, 0, 0, 3, 1, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2012', null, 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2011', null, 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2008', null, 1, 1, 0, 0, 0, 0, 0, 0, null, '0.00 %', '100.00 %'],
              ['Kevät 2008', null, 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2007', null, 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 2005', null, 1, 0, 0, 0, 0, 1, 0, 0, null, '100.00 %', '0.00 %'],
              ['Kevät 2004', null, 1, 0, 0, 0, 0, 0, 1, 0, null, '100.00 %', '0.00 %'],
              ['Syksy 1999', null, 2, 0, 0, 0, 0, 0, 2, 0, null, '100.00 %', '0.00 %'],
            ]
            toggleShowGrades()
            toggleSeparateBySemesters()
            checkTableContents(tableContents)
          })
        })

        describe('Attempts tab', () => {
          beforeEach(() => {
            openAttemptsTab()
          })

          it('Show grades off, Separate by semesters off', () => {
            const tableContents = [
              // [Time, --, Total attempts, Passed, Failed, Pass rate, Enrollments]
              ['Total', null, 288, 241, 25, '90.60 %', 79],
              ['2023-2024', null, 6, 2, 0, '33.33 %', 6],
              ['2022-2023', null, 28, 28, 0, '100.00 %', 28],
              ['2021-2022', null, 45, 27, 0, '60.00 %', 45],
              ['2020-2021', null, 34, 34, 0, '100.00 %', null],
              ['2019-2020', null, 60, 57, 3, '95.00 %', null],
              ['2018-2019', null, 46, 39, 7, '84.78 %', null],
              ['2017-2018', null, 35, 26, 9, '74.29 %', null],
              ['2016-2017', null, 7, 6, 1, '85.71 %', null],
              ['2015-2016', null, 5, 3, 2, '60.00 %', null],
              ['2014-2015', null, 7, 6, 1, '85.71 %', null],
              ['2013-2014', null, 2, 1, 1, '50.00 %', null],
              ['2012-2013', null, 4, 4, 0, '100.00 %', null],
              ['2011-2012', null, 1, 1, 0, '100.00 %', null],
              ['2010-2011', null, 1, 1, 0, '100.00 %', null],
              ['2008-2009', null, 1, 0, 1, '0.00 %', null],
              ['2007-2008', null, 1, 1, 0, '100.00 %', null],
              ['2006-2007', null, 1, 1, 0, '100.00 %', null],
              ['2005-2006', null, 1, 1, 0, '100.00 %', null],
              ['2003-2004', null, 1, 1, 0, '100.00 %', null],
              ['1999-2000', null, 2, 2, 0, '100.00 %', null],
            ]
            checkTableContents(tableContents)
          })

          it('Show grades off, Separate by semesters on', () => {
            const tableContents = [
              // [Time, --, Total attempts, Passed, Failed, Pass rate, Enrollments]
              ['Total', null, 288, 241, 25, '90.60 %', 79],
              ['Syksy 2023', null, 6, 2, 0, '33.33 %', 6],
              ['Kevät 2023', null, 13, 10, 0, '76.92 %', 13],
              ['Syksy 2022', null, 15, 18, 0, '100.00 %', 15],
              ['Kevät 2022', null, 30, 11, 0, '36.67 %', 30],
              ['Syksy 2021', null, 15, 16, 0, '100.00 %', 15],
              ['Kevät 2021', null, 8, 8, 0, '100.00 %', null],
              ['Syksy 2020', null, 26, 26, 0, '100.00 %', null],
              ['Kevät 2020', null, 26, 26, 0, '100.00 %', null],
              ['Syksy 2019', null, 34, 31, 3, '91.18 %', null],
              ['Kevät 2019', null, 17, 16, 1, '94.12 %', null],
              ['Syksy 2018', null, 29, 23, 6, '79.31 %', null],
              ['Kevät 2018', null, 26, 18, 8, '69.23 %', null],
              ['Syksy 2017', null, 9, 8, 1, '88.89 %', null],
              ['Kevät 2017', null, 4, 3, 1, '75.00 %', null],
              ['Syksy 2016', null, 3, 3, 0, '100.00 %', null],
              ['Kevät 2016', null, 4, 2, 2, '50.00 %', null],
              ['Syksy 2015', null, 1, 1, 0, '100.00 %', null],
              ['Kevät 2015', null, 4, 3, 1, '75.00 %', null],
              ['Syksy 2014', null, 3, 3, 0, '100.00 %', null],
              ['Kevät 2014', null, 1, 1, 0, '100.00 %', null],
              ['Syksy 2013', null, 1, 0, 1, '0.00 %', null],
              ['Syksy 2012', null, 4, 4, 0, '100.00 %', null],
              ['Kevät 2012', null, 1, 1, 0, '100.00 %', null],
              ['Kevät 2011', null, 1, 1, 0, '100.00 %', null],
              ['Syksy 2008', null, 1, 0, 1, '0.00 %', null],
              ['Kevät 2008', null, 1, 1, 0, '100.00 %', null],
              ['Kevät 2007', null, 1, 1, 0, '100.00 %', null],
              ['Syksy 2005', null, 1, 1, 0, '100.00 %', null],
              ['Kevät 2004', null, 1, 1, 0, '100.00 %', null],
              ['Syksy 1999', null, 2, 2, 0, '100.00 %', null],
            ]
            toggleSeparateBySemesters()
            checkTableContents(tableContents)
          })

          it('Show grades on, Separate by semesters off', () => {
            const tableContents = [
              // [Time, --, Total attempts, 0, 1, 2, 3, 4, 5, Other passed]
              ['Total', null, 288, 25, 6, 15, 9, 37, 169, 5],
              ['2023-2024', null, 6, 0, 0, 0, 0, 0, 2, 0],
              ['2022-2023', null, 28, 0, 0, 0, 0, 6, 22, 0],
              ['2021-2022', null, 45, 0, 0, 1, 0, 2, 24, 0],
              ['2020-2021', null, 34, 0, 0, 2, 1, 2, 28, 1],
              ['2019-2020', null, 60, 3, 2, 5, 3, 9, 38, 0],
              ['2018-2019', null, 46, 7, 3, 3, 2, 6, 25, 0],
              ['2017-2018', null, 35, 9, 1, 2, 2, 6, 15, 0],
              ['2016-2017', null, 7, 1, 0, 0, 1, 1, 4, 0],
              ['2015-2016', null, 5, 2, 0, 1, 0, 0, 1, 1],
              ['2014-2015', null, 7, 1, 0, 1, 0, 0, 2, 3],
              ['2013-2014', null, 2, 1, 0, 0, 0, 0, 1, 0],
              ['2012-2013', null, 4, 0, 0, 0, 0, 3, 1, 0],
              ['2011-2012', null, 1, 0, 0, 0, 0, 0, 1, 0],
              ['2010-2011', null, 1, 0, 0, 0, 0, 1, 0, 0],
              ['2008-2009', null, 1, 1, 0, 0, 0, 0, 0, 0],
              ['2007-2008', null, 1, 0, 0, 0, 0, 0, 1, 0],
              ['2006-2007', null, 1, 0, 0, 0, 0, 0, 1, 0],
              ['2005-2006', null, 1, 0, 0, 0, 0, 1, 0, 0],
              ['2003-2004', null, 1, 0, 0, 0, 0, 0, 1, 0],
              ['1999-2000', null, 2, 0, 0, 0, 0, 0, 2, 0],
            ]
            toggleShowGrades()
            checkTableContents(tableContents)
          })

          it('Show grades on, Separate by semesters on', () => {
            const tableContents = [
              // [Time, --, Total attempts, 0, 1, 2, 3, 4, 5, Other passed]
              ['Total', null, 288, 25, 6, 15, 9, 37, 169, 5],
              ['Syksy 2023', null, 6, 0, 0, 0, 0, 0, 2, 0],
              ['Kevät 2023', null, 13, 0, 0, 0, 0, 3, 7, 0],
              ['Syksy 2022', null, 15, 0, 0, 0, 0, 3, 15, 0],
              ['Kevät 2022', null, 30, 0, 0, 0, 0, 2, 9, 0],
              ['Syksy 2021', null, 15, 0, 0, 1, 0, 0, 15, 0],
              ['Kevät 2021', null, 8, 0, 0, 0, 0, 0, 8, 0],
              ['Syksy 2020', null, 26, 0, 0, 2, 1, 2, 20, 1],
              ['Kevät 2020', null, 26, 0, 1, 1, 2, 4, 18, 0],
              ['Syksy 2019', null, 34, 3, 1, 4, 1, 5, 20, 0],
              ['Kevät 2019', null, 17, 1, 1, 1, 1, 2, 11, 0],
              ['Syksy 2018', null, 29, 6, 2, 2, 1, 4, 14, 0],
              ['Kevät 2018', null, 26, 8, 1, 2, 0, 4, 11, 0],
              ['Syksy 2017', null, 9, 1, 0, 0, 2, 2, 4, 0],
              ['Kevät 2017', null, 4, 1, 0, 0, 1, 0, 2, 0],
              ['Syksy 2016', null, 3, 0, 0, 0, 0, 1, 2, 0],
              ['Kevät 2016', null, 4, 2, 0, 1, 0, 0, 1, 0],
              ['Syksy 2015', null, 1, 0, 0, 0, 0, 0, 0, 1],
              ['Kevät 2015', null, 4, 1, 0, 0, 0, 0, 0, 3],
              ['Syksy 2014', null, 3, 0, 0, 1, 0, 0, 2, 0],
              ['Kevät 2014', null, 1, 0, 0, 0, 0, 0, 1, 0],
              ['Syksy 2013', null, 1, 1, 0, 0, 0, 0, 0, 0],
              ['Syksy 2012', null, 4, 0, 0, 0, 0, 3, 1, 0],
              ['Kevät 2012', null, 1, 0, 0, 0, 0, 0, 1, 0],
              ['Kevät 2011', null, 1, 0, 0, 0, 0, 1, 0, 0],
              ['Syksy 2008', null, 1, 1, 0, 0, 0, 0, 0, 0],
              ['Kevät 2008', null, 1, 0, 0, 0, 0, 0, 1, 0],
              ['Kevät 2007', null, 1, 0, 0, 0, 0, 0, 1, 0],
              ['Syksy 2005', null, 1, 0, 0, 0, 0, 1, 0, 0],
              ['Kevät 2004', null, 1, 0, 0, 0, 0, 0, 1, 0],
              ['Syksy 1999', null, 2, 0, 0, 0, 0, 0, 2, 0],
            ]
            toggleShowGrades()
            toggleSeparateBySemesters()
            checkTableContents(tableContents)
          })
        })

        it('After changing time range shows same stats', () => {
          const newYearRange = { from: '2016-2017', to: '2019-2020' }
          cy.get("div[name='fromYear']")
            .click()
            .within(() => {
              cy.contains(newYearRange.from).click()
            })
          cy.get("div[name='toYear']")
            .click()
            .within(() => {
              cy.contains(newYearRange.to).click()
            })

          // Time range
          cy.get("div[name='fromYear']").within(() => {
            cy.get("div[role='option']").first().should('have.text', newYearRange.to)
            cy.contains("div[role='option']", newYearRange.from).should('have.class', 'selected')
            cy.get("div[role='option']").last().should('have.text', '1999-2000')
            cy.get("div[role='option']").should('have.length', 21)
          })
          cy.get("div[name='toYear']").within(() => {
            cy.get("div[role='option']").first().should('have.text', '2023-2024')
            cy.contains("div[role='option']", newYearRange.to).should('have.class', 'selected')
            cy.get("div[role='option']").last().should('have.text', newYearRange.from)
            cy.get("div[role='option']").should('have.length', 8)
          })
          cy.contains('Show population').should('be.enabled')
        })
      })

      it('If no data available, provider organization(s) toggle is disabled', () => {
        searchByCourseCode('TKT20014')
        cy.contains('TKT20014').click()
        cy.contains('TKT20014 Kypsyysnäyte LuK')
        cy.contains('50036 Suomenkielinen kypsyysnäyte LuK')
        cy.contains('50037 Ruotsinkielinen kypsyysnäyte LuK')
        cy.cs('providerCheckboxUniversity').find('input').should('not.be.disabled')
        cy.cs('providerCheckboxOpenUni').find('input').should('be.disabled')
      })

      it('Has right to see all the students, because course provider is TKT', () => {
        cy.visit('coursestatistics?courseCodes=%5B%22TKT10004%22%5D&cs_tab=0&separate=false')
        cy.get('tbody > :nth-child(3) > :nth-child(2) .level').click()
        cy.contains('Students (29)').click()
        cy.contains('509781')
        cy.contains('529866')
      })
    })
  })

  it('Some features of Course Statistics are hidden for courseStatistics-users without other rights', () => {
    cy.init('/coursestatistics', 'onlycoursestatistics')
    cy.get('[data-cy=nav-bar-button-courseStatistics]').click()
    cy.get('[data-cy=course-code-input]').type('TKT10002')
    cy.contains('tr', 'TKT10002').click()
    cy.contains('Filter statistics by study programmes').should('not.exist')
    cy.contains('Faculty statistics').should('not.exist')
    cy.contains('Show population').should('not.exist')
    cy.contains('.tabular.menu a', 'Attempts').click()

    const emptyYear = year => [year, null, '5 or fewer students', 'NA', 'NA', 'NA', 'NA']

    const attemptsTableContents = [
      // [Time, --, Total attempts, Passed, Failed, Pass rate, Enrollments]
      ['Total*', null, 255, 217, 20, '91.56 %', 73],
      emptyYear('2023-2024'),
      ['2022-2023', null, 28, 28, 0, '100.00 %', 28],
      ['2021-2022', null, 45, 27, 0, '60.00 %', 45],
      ['2020-2021', null, 34, 34, 0, '100.00 %'],
      ['2019-2020', null, 60, 57, 3, '95.00 %'],
      ['2018-2019', null, 46, 39, 7, '84.78 %'],
      ['2017-2018', null, 35, 26, 9, '74.29 %'],
      ['2016-2017', null, 7, 6, 1, '85.71 %'],
      emptyYear('2015-2016'),
      emptyYear('2014-2015'),
      emptyYear('2013-2014'),
      emptyYear('2012-2013'),
      emptyYear('2011-2012'),
      emptyYear('2010-2011'),
      emptyYear('2008-2009'),
      emptyYear('2007-2008'),
      emptyYear('2006-2007'),
      emptyYear('2005-2006'),
      emptyYear('2003-2004'),
      emptyYear('1999-2000'),
    ]

    openAttemptsTab()
    checkTableContents(attemptsTableContents)
  })
})
