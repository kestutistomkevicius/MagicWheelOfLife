import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { WheelChart, type WheelChartPoint } from '@/components/WheelChart'

const HERO_WHEEL_DATA: WheelChartPoint[] = [
  { category: 'Health',        asis: 6, tobe: 9 },
  { category: 'Career',        asis: 7, tobe: 8 },
  { category: 'Relationships', asis: 5, tobe: 8 },
  { category: 'Finance',       asis: 4, tobe: 7 },
  { category: 'Fun',           asis: 3, tobe: 7 },
  { category: 'Growth',        asis: 6, tobe: 9 },
  { category: 'Environment',   asis: 7, tobe: 8 },
  { category: 'Family',        asis: 8, tobe: 9 },
]

function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="font-semibold text-foreground">JustAWheelOfLife</span>
        <div className="flex items-center gap-4">
          <a
            href="/auth"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </a>
          <Button asChild size="sm">
            <a href="/auth">Start free &rarr;</a>
          </Button>
        </div>
      </div>
    </nav>
  )
}

function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-brand-50 via-brand-100 to-surface min-h-[88vh] flex items-center">
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            Design your best life, one area at a time.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Score your life areas, identify gaps, and track the actions that move you forward. Free to start.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
            <Button asChild>
              <a href="/auth">Start your wheel &rarr;</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="#features">See how it works</a>
            </Button>
          </div>
        </div>
        <div className="flex justify-center">
          <WheelChart data={HERO_WHEEL_DATA} />
        </div>
      </div>
    </section>
  )
}

export function LandingPage() {
  const { session } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (session) navigate('/wheel', { replace: true })
  }, [session, navigate])

  if (session === undefined || session) return null

  return (
    <>
      <LandingNav />
      <HeroSection />
      {/* TODO: FeatureShowcase id="features" */}
      {/* TODO: TestimonialsSection */}
      {/* TODO: PricingSection */}
      {/* TODO: FinalCTASection */}
      {/* TODO: LandingFooter */}
    </>
  )
}
