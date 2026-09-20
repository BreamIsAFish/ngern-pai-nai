interface CatIllustrationProps {
  className?: string
}

export default function CatIllustration({ className }: CatIllustrationProps) {
  return <img alt="" aria-hidden="true" className={className} draggable={false} src="/assets/meow-royal-cat.svg" />
}
