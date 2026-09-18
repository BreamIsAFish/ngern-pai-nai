type IconName = 'arrow-down' | 'arrow-up' | 'calendar' | 'close' | 'filter' | 'plus' | 'settings' | 'sheet' | 'wallet'

interface IconProps {
  name: IconName
  size?: number
}

const paths: Record<IconName, string> = {
  'arrow-down': 'M12 5v14m0 0 6-6m-6 6-6-6',
  'arrow-up': 'M12 19V5m0 0 6 6m-6-6-6 6',
  calendar: 'M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z',
  close: 'm6 6 12 12M18 6 6 18',
  filter: 'M4 5h16M7 12h10m-7 7h4',
  plus: 'M12 5v14M5 12h14',
  settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.55V20h-3v-.09a1.7 1.7 0 0 0-1.04-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7 14.7a1.7 1.7 0 0 0-1.55-1.04H5v-3h.09A1.7 1.7 0 0 0 6.64 9.6 1.7 1.7 0 0 0 6.3 7.72l-.06-.06 2.12-2.12.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 11.34 4.4V4h3v.09a1.7 1.7 0 0 0 1.04 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.55 1.04H21v3h-.09A1.7 1.7 0 0 0 19.4 15Z',
  sheet: 'M6 3h9l4 4v14H6V3Zm8 0v5h5M9 12h7m-7 4h7',
  wallet: 'M4 7h15a1 1 0 0 1 1 1v11H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12v3m0 5h3v4h-3a2 2 0 0 1 0-4Z',
}

export default function Icon({ name, size = 20 }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d={paths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

