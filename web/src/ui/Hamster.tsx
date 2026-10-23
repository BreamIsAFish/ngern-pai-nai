interface Props {
  pose?: 'peek' | 'seed' | 'sleep'
  size?: number
  className?: string
}

/** The paper journal mascot, with only the requested pose rendered. */
export default function Hamster({ pose = 'peek', size = 120, className }: Props) {
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 120 120">
    <g stroke="#1d1d22" strokeWidth="2.5" strokeLinejoin="round">
      <circle cx="30" cy="34" r="13" fill="#e9a25f" />
      <circle cx="90" cy="34" r="13" fill="#e9a25f" />
      <ellipse cx="60" cy="70" rx="46" ry="42" fill="#e9a25f" />
      <path d="M27 86c4-18 18-27 33-27s29 9 33 27c-6 15-18 23-33 23s-27-8-33-23z" fill="#fff3df" />
    </g>
    <circle cx="30" cy="34" r="6" fill="#f6b7a6" />
    <circle cx="90" cy="34" r="6" fill="#f6b7a6" />
    <circle cx="33" cy="84" r="8" fill="#ffb3a3" opacity="0.75" />
    <circle cx="87" cy="84" r="8" fill="#ffb3a3" opacity="0.75" />
    {pose === 'sleep' ? <g>
      <path d="M39 66q5 4 10 0M71 66q5 4 10 0" stroke="#1d1d22" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M98 20h8l-8 9h8" stroke="#1d1d22" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g> : <g>
      <circle cx="44" cy="66" r="5" fill="#1d1d22" />
      <circle cx="76" cy="66" r="5" fill="#1d1d22" />
      <circle cx="45.6" cy="64.4" r="1.7" fill="#ffffff" />
      <circle cx="77.6" cy="64.4" r="1.7" fill="#ffffff" />
    </g>}
    <ellipse cx="60" cy="75" rx="4" ry="3" fill="#c0584a" />
    <path d="M54 80q6 5 12 0" stroke="#1d1d22" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    <rect x="56.5" y="82" width="7" height="7" rx="1.5" fill="#ffffff" stroke="#1d1d22" strokeWidth="1.8" />
    {pose === 'seed' && <g>
      <ellipse cx="60" cy="101" rx="7" ry="11" fill="#3b3530" stroke="#1d1d22" strokeWidth="2" transform="rotate(18 60 101)" />
      <path d="M58 93l4 16" stroke="#e8e2d4" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="48" cy="102" r="6" fill="#fff3df" stroke="#1d1d22" strokeWidth="2" />
      <circle cx="72" cy="102" r="6" fill="#fff3df" stroke="#1d1d22" strokeWidth="2" />
    </g>}
  </svg>
}
