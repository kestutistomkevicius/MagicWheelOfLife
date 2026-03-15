import { describe, it } from 'vitest'

describe('LandingPage', () => {
  // LAND-01: Hero section
  it.todo('shows hero section with value proposition for unauthenticated visitor')
  it.todo("hero section contains 'Start your wheel' CTA linking to /auth")
  it.todo('returns null while session is undefined (no flash)')
  it.todo('redirects authenticated user to /wheel')

  // LAND-02: Feature showcase
  it.todo('feature showcase section is present with 3 feature rows')
  it.todo('feature showcase renders wheel chart and comparison chart demos')

  // LAND-03: Social proof
  it.todo('social proof section shows 3 testimonial cards with quote, name, role')

  // LAND-04: Pricing
  it.todo('pricing section shows Free ($0/mo) and Premium ($5/mo) columns')
  it.todo("premium CTA button is disabled with text 'Coming soon'")
  it.todo('free CTA links to /auth')
})
