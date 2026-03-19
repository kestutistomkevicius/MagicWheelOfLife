import { describe, it } from 'vitest'

describe('FeatureRequestModal', () => {
  it.todo('renders a textarea for feature request text')
  it.todo('disables submit button when text is fewer than 10 characters')
  it.todo('calls supabase insert with user_id and text on submit')
  it.todo('shows success state after successful submit')
  it.todo('shows loading state during submit')
})
