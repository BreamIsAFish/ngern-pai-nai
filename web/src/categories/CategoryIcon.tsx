import { useState } from 'react'
import Icon from '../ui/Icon'

interface Props {
  iconUrl: string | null
}

/** Displays a category image or the built-in category icon after load failure. */
export default function CategoryIcon({ iconUrl }: Props) {
  const [failedUrl, setFailedUrl] = useState<string>()
  if (!iconUrl || failedUrl === iconUrl) {
    return <span data-category-icon-source="fallback"><Icon name="grid" size={25} /></span>
  }
  return <img
    alt=""
    data-category-icon-source="image"
    onError={() => {
      if (import.meta.env.DEV) console.warn('[CategoryIcon] Failed to load category icon:', iconUrl)
      setFailedUrl(iconUrl)
    }}
    src={iconUrl}
  />
}
