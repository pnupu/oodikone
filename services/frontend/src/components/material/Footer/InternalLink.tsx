import { Link } from '@mui/material'
import { NavLink } from 'react-router-dom'

/**
 * Link that opens another page in Oodikone
 *
 * @param href - URL of the internal page
 * @param text - Text to display in the link
 */
export const InternalLink = ({ href, text }: { href: string; text: string }) => {
  return (
    <Link component={NavLink} to={href} variant="body2">
      {text}
    </Link>
  )
}
