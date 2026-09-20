interface Props { actionLabel?: string }

export default function VisualKeyboard({ actionLabel = 'go' }: Props) {
  return <div aria-hidden="true" className="fake-keyboard">
    <div className="keyboard-suggestions"><span>I</span><span>The</span><span>I'm</span></div>
    {['qwertyuiop', 'asdfghjkl', '⇧zxcvbnm⌫'].map((row) => <div className="keyboard-row" key={row}>{[...row].map((key, index) => <i key={`${key}-${index}`}>{key}</i>)}</div>)}
    <div className="keyboard-row keyboard-bottom"><i>123</i><i>☺</i><i className="space">space</i><i className="go">{actionLabel}</i></div>
  </div>
}
