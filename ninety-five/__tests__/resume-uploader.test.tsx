import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResumeUploader } from '@/components/features/ResumeUploader'
import * as supabaseClient from '@/lib/supabase/client'
import { toast } from 'sonner'

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/components/ui/sonner', () => ({
  Toaster: () => null,
}))

const mockGetUser = jest.fn()
const mockUpload = jest.fn()
const mockStorageFrom = jest.fn(() => ({ upload: mockUpload }))
const mockEq = jest.fn()
const mockUpdate = jest.fn(() => ({ eq: mockEq }))
const mockFrom = jest.fn(() => ({ update: mockUpdate }))

describe('ResumeUploader', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockUpload.mockReset()
    mockStorageFrom.mockClear()
    mockEq.mockReset()
    mockUpdate.mockClear()
    mockFrom.mockClear()

    jest.spyOn(supabaseClient, 'createClient').mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
      storage: {
        from: mockStorageFrom,
      },
      from: mockFrom,
    } as never)

    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  it('rejects oversized files', async () => {
    render(<ResumeUploader onUploadComplete={jest.fn()} />)

    const file = new File(['big'], 'resume.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 })

    const input = document.getElementById('resume-upload') as HTMLInputElement
    const user = userEvent.setup()
    await user.upload(input, file)

    expect(toast.error).toHaveBeenCalledWith('File size must be less than 10MB')
    expect(mockGetUser).not.toHaveBeenCalled()
  })

  it('uploads, parses, and confirms success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockUpload.mockResolvedValue({ error: null, data: { path: 'user-123/resume.pdf' } })
    mockEq.mockResolvedValue({ error: null })
    ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => JSON.stringify({ status: 'ok' }),
    })

    const onUploadComplete = jest.fn()
    render(<ResumeUploader onUploadComplete={onUploadComplete} />)

    const file = new File(['pdf'], 'resume.pdf', { type: 'application/pdf' })
    const input = document.getElementById('resume-upload') as HTMLInputElement
    const user = userEvent.setup()
    await user.upload(input, file)

    await waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalled()
    })

    expect(screen.getByText('Resume uploaded and parsed!')).toBeInTheDocument()
    expect(toast.success).toHaveBeenCalledWith('Resume uploaded and parsed successfully!')
  })
})
