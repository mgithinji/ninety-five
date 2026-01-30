import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogCard } from '@/components/features/LogCard'
import { createClient } from '@/lib/supabase/client'

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/components/ui/sonner', () => ({
  Toaster: () => null,
}))

const log = {
  id: 'log-1',
  raw_input: 'Shipped onboarding improvements',
  processed_bullet: 'Shipped onboarding improvements that increased activation by 20%',
  created_at: new Date('2024-01-20T12:00:00Z').toISOString(),
  occurred_at: null,
  category: 'impact',
  tags: ['onboarding', 'activation'],
  needs_review: false,
  experience_id: null,
  experience: null,
} as const

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('LogCard', () => {
  beforeEach(() => {
    mockCreateClient.mockReset()
    mockCreateClient.mockReturnValue({} as never)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('invokes onEdit when the edit action is selected', async () => {
    const onEdit = jest.fn()
    const onDelete = jest.fn()

    render(<LogCard log={log} onEdit={onEdit} onDelete={onDelete} />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button'))

    const editItem = await screen.findByText('Edit')
    await user.click(editItem)

    expect(onEdit).toHaveBeenCalledWith(log)
  })
})
