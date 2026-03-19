import { describe, it } from 'vitest'

describe('useAiChat', () => {
  it.todo('initializes with empty messages array and no proposal')
  it.todo('sendMessage appends user message to messages immediately')
  it.todo('sendMessage sets streaming=true during fetch and false after')
  it.todo('sendMessage appends assistant placeholder then fills tokens incrementally')
  it.todo('detectAndSetProposal extracts asis and tobe from sentinel JSON in stream')
  it.todo('detectAndSetProposal strips sentinel JSON from displayed assistant message')
  it.todo('sendMessage persists user message and assistant message to DB after stream completes')
  it.todo('sets error when fetch response is not ok')
  it.todo('retry resends the last user message')
  it.todo('loadHistory fetches messages for a category and populates messages array')
})
