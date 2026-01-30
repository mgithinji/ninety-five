import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/login/page'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

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

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

const mockSignIn = jest.fn()
const mockSignUp = jest.fn()
const mockPush = jest.fn()
const mockRefresh = jest.fn()

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('LoginPage', () => {
  beforeEach(() => {
    mockSignIn.mockReset()
    mockSignUp.mockReset()
    mockPush.mockReset()
    mockRefresh.mockReset()
    mockCreateClient.mockReset()

    mockCreateClient.mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
        signUp: mockSignUp,
      },
    } as never)

    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('signs in and redirects to dashboard', async () => {
    mockSignIn.mockResolvedValue({ error: null })

    render(<LoginPage />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    expect(toast.success).toHaveBeenCalledWith('Welcome back!')
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('creates a new account when sign up is selected', async () => {
    mockSignUp.mockResolvedValue({ error: null })

    render(<LoginPage />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /create account/i }))
    await user.type(screen.getByLabelText(/full name/i), 'Ada Lovelace')
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /^create account$/i }))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'ada@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'Ada Lovelace',
          },
        },
      })
    })

    expect(toast.success).toHaveBeenCalledWith('Check your email for the confirmation link!')
  })
})
