import Hamster from './Hamster'
export default function LoadingScreen() {
  return (
    <main className="loading-screen" aria-live="polite">
      <Hamster pose="seed" size={120} />
      <div className="loading-dots"><span /><span /><span /></div>
      <p>Opening your money book</p>
    </main>
  )
}

