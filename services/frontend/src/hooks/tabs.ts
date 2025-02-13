import qs from 'query-string'
import { useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

export const useTabs = (totalTabs: number) => {
  const history = useHistory()
  const location = useLocation()

  const id = 'tab'
  const initialTab = 0

  const normalizeTab = (tab: unknown) => {
    const tabIndex = parseInt(tab as string, 10)
    return Number.isNaN(tabIndex) || tabIndex < 0 || tabIndex >= totalTabs ? initialTab : tabIndex
  }

  const [tab, setTab] = useState<number>(() => {
    const params = qs.parse(location.search)
    return normalizeTab(params[id])
  })

  const pushToUrl = (newTab: number) => {
    history.replace({
      pathname: location.pathname,
      search: qs.stringify({ ...qs.parse(location.search), [id]: newTab }),
    })
  }

  useEffect(() => {
    const params = qs.parse(location.search)
    const queryTab = normalizeTab(params[id])
    if (queryTab !== tab) {
      setTab(queryTab)
    }
  }, [id, location.search])

  useEffect(() => {
    pushToUrl(tab)
  }, [tab])

  const handleChange = (_event: React.SyntheticEvent, { activeIndex }: { activeIndex: number }) => {
    setTab(activeIndex)
  }

  return [tab, handleChange] as const
}
