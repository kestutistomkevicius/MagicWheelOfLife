import { render, screen } from '@testing-library/react'
import { TermsPage } from './TermsPage'

describe('TermsPage', () => {
  it('does not render "Coming soon" placeholder text', () => {
    render(<TermsPage />)
    expect(screen.queryByText(/coming soon/i)).toBeNull()
  })
  it('renders at least one h2 section heading', () => {
    render(<TermsPage />)
    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings.length).toBeGreaterThan(0)
  })
})
