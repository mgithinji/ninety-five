'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { VoiceRecorder } from './VoiceRecorder'
import { Loader2, Sparkles } from 'lucide-react'
import type { Experience } from '@/types/database'

interface LogEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onLogCreated: () => void
  experiences: Experience[]
}

export function LogEntryModal({ isOpen, onClose, onLogCreated, experiences }: LogEntryModalProps) {
  const supabase = createClient()
  const [inputType, setInputType] = useState<'text' | 'voice'>('text')
  const [rawInput, setRawInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)

  const handleTranscription = (text: string) => {
    setRawInput(text)
    setInputType('text')
  }

  const handleSubmit = async () => {
    if (!rawInput.trim()) {
      toast.error('Please enter what you accomplished')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_input: rawInput.trim(),
          input_type: inputType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create log')
      }

      const { log } = await response.json()

      toast.success('Log created! AI enhanced your entry.')
      onLogCreated()
      setRawInput('')
    } catch (error: any) {
      console.error('Error creating log:', error)
      toast.error(error.message || 'Failed to create log')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
  }

  return (
    <>
      <Toaster />
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>What did you accomplish?</DialogTitle>
            <DialogDescription>
              Capture your win in a sentence or two. AI will enhance it into a professional bullet point.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Input Type Toggle */}
            <div className="flex gap-2">
              <Button
                variant={inputType === 'text' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setInputType('text')}
              >
                <span className="text-lg">✏️</span>
                Text
              </Button>
              <Button
                variant={inputType === 'voice' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setInputType('voice')}
              >
                <span className="text-lg">🎤</span>
                Voice
              </Button>
            </div>

            {/* Input Area */}
            <div className="min-h-[150px]">
              {inputType === 'text' ? (
                <Textarea
                  placeholder="e.g., Shipped the new onboarding flow. Users are completing setup 40% faster now."
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[150px] resize-none"
                />
              ) : (
                <VoiceRecorder
                  onTranscription={handleTranscription}
                  onError={(error) => toast.error(error)}
                />
              )}
            </div>

            {/* Tips */}
            <div className="flex items-start gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
              <Sparkles className="w-4 h-4 mt-0.5 text-indigo-500" />
              <p>Include impact when you can! AI will help craft a compelling STAR-format bullet point.</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!rawInput.trim() || isSubmitting || isTranscribing}
                className="gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Log
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
