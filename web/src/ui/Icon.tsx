type IconName =
  | 'arrow-down' | 'arrow-up' | 'back' | 'budget' | 'calendar' | 'card'
  | 'chart' | 'chevron-right' | 'close' | 'filter' | 'grid' | 'home'
  | 'list' | 'menu' | 'more' | 'note' | 'plus' | 'profile' | 'refresh'
  | 'repeat' | 'search' | 'settings' | 'sheet' | 'tag' | 'transfer'
  | 'upload' | 'wallet' | 'wifi'

interface IconProps {
  name: IconName
  size?: number
}

const paths: Record<IconName, string> = {
  'arrow-down': 'M12 5v14m0 0 6-6m-6 6-6-6',
  'arrow-up': 'M12 19V5m0 0 6 6m-6-6-6 6',
  back: 'm15 18-6-6 6-6',
  budget: 'M12 3v18M17 7.5C17 5.6 15.2 4 12.5 4S8 5.3 8 7.3c0 4.2 9 2.1 9 6.7 0 2.2-1.9 4-4.8 4S7 16.2 7 14',
  calendar: 'M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z',
  card: 'M3 7h18v11H3V7Zm0 4h18M7 15h3',
  chart: 'M5 19V9m7 10V5m7 14v-7',
  'chevron-right': 'm9 18 6-6-6-6',
  close: 'm6 6 12 12M18 6 6 18',
  filter: 'M4 5h16M7 12h10m-7 7h4',
  grid: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z',
  home: 'm3 11 9-8 9 8v10h-6v-6H9v6H3V11Z',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  menu: 'M5 7h14M5 12h14M5 17h14',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  note: 'M5 4h14v16H5V4Zm4 5h6m-6 4h6',
  plus: 'M12 5v14M5 12h14',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 9a7 7 0 0 0-14 0',
  refresh: 'M20 11a8 8 0 1 0-2.34 5.66M20 11V5m0 6h-6',
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3',
  search: 'm21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.55V20h-3v-.09a1.7 1.7 0 0 0-1.04-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7 14.7a1.7 1.7 0 0 0-1.55-1.04H5v-3h.09A1.7 1.7 0 0 0 6.64 9.6 1.7 1.7 0 0 0 6.3 7.72l-.06-.06 2.12-2.12.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 11.34 4.4V4h3v.09a1.7 1.7 0 0 0 1.04 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.55 1.04H21v3h-.09A1.7 1.7 0 0 0 19.4 15Z',
  sheet: 'M6 3h9l4 4v14H6V3Zm8 0v5h5M9 12h7m-7 4h7',
  tag: 'M4 4h7l9 9-7 7-9-9V4Zm4 4h.01',
  transfer: 'M7 7h13m0 0-4-4m4 4-4 4M17 17H4m0 0 4 4m-4-4 4-4',
  upload: 'M12 16V3m0 0L7 8m5-5 5 5M4 14v7h16v-7',
  wallet: 'M4 7h15a1 1 0 0 1 1 1v11H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12v3m0 5h3v4h-3a2 2 0 0 1 0-4Z',
  wifi: 'M4 9a12 12 0 0 1 16 0M7 12a8 8 0 0 1 10 0m-7 3a4 4 0 0 1 4 0m-2 4h.01',
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
