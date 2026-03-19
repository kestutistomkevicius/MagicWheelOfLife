import { render, screen } from '@testing-library/react'
import { PrivacyPage } from './PrivacyPage'

describe('PrivacyPage', () => {
  it('does not render "Coming soon" placeholder text', () => {
    render(<PrivacyPage />)
    expect(screen.queryByText(/coming soon/i)).toBeNull()
  })
  it('renders at least one h2 section heading', () => {
    render(<PrivacyPage />)
    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings.length).toBeGreaterThan(0)
  })
})
