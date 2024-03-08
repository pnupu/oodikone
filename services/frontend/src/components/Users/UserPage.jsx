import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { Button, Card, Divider, Popup, Segment, Loader, Message } from 'semantic-ui-react'

import { useGetAuthorizedUserQuery, useShowAsUser } from '@/redux/auth'
import { useGetUserQuery } from '@/redux/users'
import { AccessGroups } from './AccessGroups'
import { AccessRights } from './AccessRights'
import { EmailNotification } from './EmailNotification'

export const UserPage = () => {
  const history = useHistory()

  const { userid } = useParams()
  const { userId: currentUserId, isAdmin } = useGetAuthorizedUserQuery()
  const showAsUser = useShowAsUser()
  const { data: user, isLoading, isError, error } = useGetUserQuery(userid)

  if (isLoading) return <Loader active inline="centered" />

  if (isError) return <Message negative size="big" icon="ban" header={error.data.error} />

  const renderUserInfoCard = () => (
    <Card fluid>
      <Card.Content>
        <Card.Header>
          {isAdmin && user.username !== currentUserId && (
            <Popup
              content="Show Oodikone as this user"
              trigger={
                <Button
                  floated="right"
                  circular
                  size="tiny"
                  basic
                  icon="spy"
                  onClick={() => showAsUser(user.username)}
                />
              }
            />
          )}
          {user.full_name}
        </Card.Header>
        <Divider />
        <Card.Meta content={user.username} />
        <Card.Meta content={user.email} />
      </Card.Content>
    </Card>
  )

  return (
    <Segment loading={isLoading} className="contentSegment">
      <div>
        <Button icon="arrow circle left" content="Back" onClick={() => history.push('/users')} />
        <Divider />
        <Card.Group>
          {!user.sisu_person_id && (
            <Message
              header="This user does not have a person id"
              content="All their roles and access rights might not be displayed."
              info
              negative
              icon="exclamation circle"
              style={{ margin: '1rem 0' }}
            />
          )}
          {renderUserInfoCard()}
          <Card fluid>
            <Card.Content>
              <Card.Header content="Roles" />
              <AccessGroups user={user} />
            </Card.Content>
          </Card>
          <Card fluid>
            <Card.Content>
              <Card.Header content="Study programme access rights" />
              <Divider />
              <AccessRights user={user} />
            </Card.Content>
          </Card>
          <Card fluid>
            <Card.Content>
              <Card.Header content="Send email about receiving access to oodikone" />
              <Card.Description>
                <Divider />
                <EmailNotification userEmail={user.email} />
              </Card.Description>
            </Card.Content>
          </Card>
        </Card.Group>
      </div>
    </Segment>
  )
}
