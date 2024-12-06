import { ErrorOutline as ErrorIcon } from '@mui/icons-material'
import { Box, Stack, Typography } from '@mui/material'

export const ErrorMessage = () => {
  return (
    <Box
      sx={{
        alignItems: 'center',
        border: 1,
        borderRadius: 1,
        color: theme => theme.palette.error.main,
        display: 'flex',
        height: 400,
        justifyContent: 'center',
      }}
    >
      <Stack alignItems="center" direction="column" gap={2}>
        <ErrorIcon fontSize="large" />
        <Typography color="inherit" fontStyle="italic" textAlign="center" variant="body1">
          Something went wrong, please try refreshing the page
        </Typography>
      </Stack>
    </Box>
  )
}
