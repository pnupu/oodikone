import { Chip, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

import { isDev } from '@/conf'

export const Logo = () => {
  return (
    <Stack alignItems="center" direction="row" gap={1} marginRight={2}>
      <Typography
        component={Link}
        noWrap
        sx={{
          color: 'inherit',
          fontWeight: 700,
          letterSpacing: '.1rem',
          '&:hover': {
            color: 'inherit',
          },
        }}
        to="/"
        variant="h6"
      >
        oodikone
      </Typography>
      {isDev && <Chip color="error" label="dev" size="small" />}
    </Stack>
  )
}
