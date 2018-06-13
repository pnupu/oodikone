import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Header, Image } from 'semantic-ui-react'
import { images } from '../../common'

class WelcomePage extends Component {
  componentDidMount() {
   console.log(images.toskaLogo)
  }

  render() {
    return (
      <div>
        <Container text style={{ paddingTop: 50 }}>
          <Header as='h1' textAlign="center">oodikone</Header>
          <h3>
            A tool for explorative research on student data.
          </h3>
          <h4>
            Population Statistics
          </h4>
          <p>
            Query a student population specified by starting year and studyright.
            Oodikone will give you study statistics and visualizations of the population,
            which you can interactively filter and explore.
          </p>
          <h4>
            Course Instances
          </h4>
          <p>
            Shows course instances of a given course.
          </p>
          <h4>
            Student Statistics
          </h4>
          <p>
            Shows detailed information and visualizations of a queried student.
          </p>
          <h4>
            Course Statistics
          </h4>
          <p>
            Shows student results of a course over specified years.
          </p>
          <h4>
            Settings
          </h4>
          <p>
            Here you can modify settings of oodikone.
             For example you can create custom course code correspondences.
          </p>
        </Container>
        <Image src={images.toskaLogo} size="medium" centered style={{ bottom: 0 }} />
      </div>
    )
  }
}
export default connect()(WelcomePage)
