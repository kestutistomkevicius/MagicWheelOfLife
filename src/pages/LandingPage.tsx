import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { WheelChart, type WheelChartPoint } from '@/components/WheelChart'
import { ComparisonChart } from '@/components/ComparisonChart'
import { useInView } from '@/hooks/useInView'
import { Check } from 'lucide-react'
import type { SnapshotScoreRow } from '@/types/database'

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

const SNAP1_SCORES = [
  { category_name: 'Health',        score_asis: 5, score_tobe: 8, position: 0 },
  { category_name: 'Career',        score_asis: 4, score_tobe: 7, position: 1 },
  { category_name: 'Relationships', score_asis: 6, score_tobe: 8, position: 2 },
  { category_name: 'Finance',       score_asis: 3, score_tobe: 6, position: 3 },
  { category_name: 'Fun',           score_asis: 4, score_tobe: 7, position: 4 },
  { category_name: 'Growth',        score_asis: 5, score_tobe: 9, position: 5 },
  { category_name: 'Environment',   score_asis: 6, score_tobe: 7, position: 6 },
  { category_name: 'Family',        score_asis: 7, score_tobe: 9, position: 7 },
] as SnapshotScoreRow[]

const SNAP2_SCORES = [
  { category_name: 'Health',        score_asis: 7, score_tobe: 9, position: 0 },
  { category_name: 'Career',        score_asis: 6, score_tobe: 8, position: 1 },
  { category_name: 'Relationships', score_asis: 7, score_tobe: 8, position: 2 },
  { category_name: 'Finance',       score_asis: 5, score_tobe: 7, position: 3 },
  { category_name: 'Fun',           score_asis: 6, score_tobe: 8, position: 4 },
  { category_name: 'Growth',        score_asis: 7, score_tobe: 9, position: 5 },
  { category_name: 'Environment',   score_asis: 7, score_tobe: 8, position: 6 },
  { category_name: 'Family',        score_asis: 8, score_tobe: 9, position: 7 },
] as SnapshotScoreRow[]

const TESTIMONIALS = [
  {
    quote: "I've used the Wheel of Life in client sessions for years. Having a tool that tracks progress over time — and shows clients the delta — is a game-changer.",
    name: 'Rachel K.',
    role: 'Certified Life Coach',
    initials: 'RK',
    avatarColor: 'bg-brand-400',
  },
  {
    quote: "I do a monthly check-in and it takes 10 minutes. Seeing my scores shift over six months made me realise I was neglecting relationships while chasing career goals.",
    name: 'Marcus T.',
    role: 'Product Manager',
    initials: 'MT',
    avatarColor: 'bg-stone-500',
  },
  {
    quote: "As a student it's easy to let everything outside studies slide. This forces me to look at the whole picture once a month. Simple, but it actually works.",
    name: 'Anya S.',
    role: 'University Student',
    initials: 'AS',
    avatarColor: 'bg-blue-400',
  },
]

const SHARED_FEATURES = [
  'Unlimited categories per wheel',
  'As-is and to-be scoring',
  'Snapshot history',
  'Snapshot comparison overlay',
  'Trend chart',
  'Action items per category',
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

function FeatureShowcase() {
  const { ref, inView } = useInView()

  const features = [
    {
      title: 'Score your life areas at a glance',
      description: 'Drag sliders to rate where you are (as-is) and where you want to be (to-be). Your wheel redraws in real time.',
      visual: <WheelChart data={HERO_WHEEL_DATA} />,
    },
    {
      title: 'Compare any two moments in time',
      description: "Save a snapshot after each check-in. Layer any two snapshots to see exactly where you've grown.",
      visual: (
        <ComparisonChart
          snap1Scores={SNAP1_SCORES}
          snap2Scores={SNAP2_SCORES}
          snap1Label="Q1 2024"
          snap2Label="Q4 2024"
        />
      ),
    },
    {
      title: 'Turn insight into action',
      description: 'Attach up to 7 action items to each life area. Set deadlines, check them off, and watch your wheel follow.',
      visual: (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-4">Health</p>
          <ul className="space-y-3">
            {[
              { label: 'Walk 30 min every morning', done: true },
              { label: 'Cook at home 4x per week',  done: true },
              { label: 'Schedule annual check-up',  done: false },
              { label: 'Cut sugar to 3 days/week',  done: false },
            ].map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm">
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-brand-500 border-brand-500' : 'border-border'}`}>
                  {item.done && <Check className="w-3 h-3 text-white" />}
                </span>
                <span className={item.done ? 'line-through text-muted-foreground' : ''}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
  ]

  return (
    <section
      id="features"
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`py-24 px-6 max-w-6xl mx-auto transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      <h2 className="text-3xl font-bold text-center mb-4">
        Everything you need to take stock, and take action.
      </h2>
      <p className="text-center text-muted-foreground mb-16">Three powerful views. One simple habit.</p>

      <div className="space-y-24">
        {features.map((feature, index) => (
          <div key={feature.title} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {index % 2 === 0 ? (
              <>
                <div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
                <div className="flex justify-center">{feature.visual}</div>
              </>
            ) : (
              <>
                <div className="flex justify-center lg:order-first">{feature.visual}</div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const { ref, inView } = useInView()

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`py-24 px-6 bg-surface transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">What people are saying</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <p className="text-muted-foreground italic mb-4">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${t.avatarColor}`}>
                  {t.initials}
                </div>
                <div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-muted-foreground text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  const { ref, inView } = useInView()

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`py-24 px-6 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Simple, transparent pricing</h2>
        <p className="text-center text-muted-foreground">Start free. Upgrade when you want more.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-12">
          {/* Free tier */}
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
            <h3 className="text-xl font-semibold">Free</h3>
            <p className="text-3xl font-bold mt-2">$0/mo</p>
            <ul className="mt-6 space-y-3">
              {SHARED_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-brand-500 flex-shrink-0" />
                <span>1 wheel</span>
              </li>
            </ul>
            <Button className="w-full mt-8" asChild>
              <a href="/auth">Start free &rarr;</a>
            </Button>
          </div>

          {/* Premium tier */}
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
            <h3 className="text-xl font-semibold">Premium</h3>
            <p className="text-3xl font-bold mt-2">$5/mo</p>
            <ul className="mt-6 space-y-3">
              {SHARED_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-brand-500 flex-shrink-0" />
                <span>Unlimited wheels</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-3">More coming soon</p>
            <Button className="w-full mt-8" disabled>Coming soon</Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function FinalCTASection() {
  const { ref, inView } = useInView()

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`bg-gradient-to-br from-brand-50 via-brand-100 to-surface transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      <div className="text-center py-24 px-6">
        <h2 className="text-3xl lg:text-4xl font-bold">Ready to see your life clearly?</h2>
        <p className="text-muted-foreground mt-4 text-lg">Five minutes of honest scoring. A lifetime of direction.</p>
        <Button size="lg" asChild className="mt-8">
          <a href="/auth">Start your wheel &rarr;</a>
        </Button>
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} JustAWheelOfLife. All rights reserved.</p>
        <nav className="flex gap-6">
          <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
        </nav>
      </div>
    </footer>
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
      <FeatureShowcase />
      <TestimonialsSection />
      <PricingSection />
      <FinalCTASection />
      <LandingFooter />
    </>
  )
}
