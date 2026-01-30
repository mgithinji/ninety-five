'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface VoiceRecorderProps {
  onTranscription: (text: string) => void
  onError: (error: string) => void
}

export function VoiceRecorder({ onTranscription, onError }: VoiceRecorderProps) {
  const [status, setStatus] = useState<'idle' | 'recording' | 'transcribing'>('idle')
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await transcribeAudio(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setStatus('recording')
      setDuration(0)

      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      onError('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    setStatus('transcribing')

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Transcription failed')
      }

      const data = await response.json()
      onTranscription(data.text)
    } catch (error) {
      console.error('Transcription error:', error)
      onError('Transcription failed. Please try again or type your log.')
    } finally {
      setStatus('idle')
      setDuration(0)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (status === 'transcribing') {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4 bg-gray-50 rounded-lg">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-gray-600">Transcribing your recording...</p>
      </div>
    )
  }

  if (status === 'recording') {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4 bg-red-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-lg font-medium text-red-600">Recording</span>
        </div>
        <div className="text-3xl font-mono text-red-600">{formatDuration(duration)}</div>
        <Button variant="outline" onClick={stopRecording} className="gap-2">
          Stop Recording
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4 bg-gray-50 rounded-lg">
      <div className="text-center text-gray-500">
        <p className="mb-2">Tap to record</p>
        <p className="text-sm">Speak about what you accomplished</p>
      </div>
      <Button
        size="lg"
        variant="outline"
        className="rounded-full w-16 h-16 border-2 border-indigo-600 hover:bg-indigo-50"
        onClick={startRecording}
      >
        <span className="text-2xl">🎤</span>
      </Button>
    </div>
  )
}
