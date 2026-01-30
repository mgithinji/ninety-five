'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { Upload, FileText, Check, AlertCircle } from 'lucide-react'

interface ResumeUploaderProps {
  onUploadComplete: () => void
}

export function ResumeUploader({ onUploadComplete }: ResumeUploaderProps) {
  const supabase = createClient()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'parsing' | 'success'>('idle')

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      await uploadAndParse(file)
    } else {
      toast.error('Please upload a PDF file')
    }
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadAndParse(file)
    }
  }

  const uploadAndParse = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setIsUploading(true)
    setStatus('uploading')
    setProgress(0)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please sign in first')
        setIsUploading(false)
        return
      }

      console.log('User authenticated:', user.id)

      // Upload file
      setProgress(30)
      const filePath = `${user.id}/resume.pdf`
      // Convert File to Blob for Supabase storage upload
      const fileBlob = new Blob([file], { type: file.type })
      console.log('Uploading file to:', filePath)
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('resumes')
        .upload(filePath, fileBlob, { upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      console.log('Upload successful:', uploadData)
      setProgress(50)

      // Update profile with resume URL
      console.log('Updating profile with resume URL...')
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ resume_url: filePath })
        .eq('id', user.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
        throw new Error(`Profile update failed: ${profileError.message}`)
      }

      setProgress(70)
      setStatus('parsing')
      console.log('Starting resume parsing...')

      // Parse resume
      console.log('Calling /api/resume/parse...')
      const parseResponse = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const parseText = await parseResponse.text()
      let parseResult: any = null
      if (parseText) {
        try {
          parseResult = JSON.parse(parseText)
        } catch {
          parseResult = { error: parseText }
        }
      }

      console.log('Parse response:', parseResponse.status, parseResult)

      if (!parseResponse.ok) {
        console.error('Parse error:', parseResult)
        const errorMessage =
          parseResult?.error ||
          parseResult?.details ||
          parseResult?.message ||
          parseResponse.statusText ||
          'Unknown error'
        throw new Error(`Parse failed: ${errorMessage}`)
      }

      if (!parseResult) {
        throw new Error('Parse failed: Empty response from server')
      }

      console.log('Parse successful:', parseResult)
      setProgress(100)
      setStatus('success')

      toast.success('Resume uploaded and parsed successfully!')
      onUploadComplete()
    } catch (error: any) {
      console.error('Error uploading resume:', error)
      toast.error(error.message || 'Failed to upload resume. Please try again.')
      setStatus('idle')
    } finally {
      setIsUploading(false)
    }
  }

  if (status === 'success') {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Resume uploaded and parsed!</h3>
            <p className="text-gray-500 mb-4">Your profile and experiences have been populated.</p>
            <Button
              variant="outline"
              onClick={() => {
                setStatus('idle')
                setProgress(0)
              }}
            >
              Upload Different Resume
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Toaster />
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="py-8">
          <div className="text-center">
            {isUploading ? (
              <>
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {status === 'uploading' ? (
                    <Upload className="w-8 h-8 text-indigo-600 animate-bounce" />
                  ) : (
                    <FileText className="w-8 h-8 text-indigo-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {status === 'uploading' ? 'Uploading resume...' : 'Parsing resume with AI...'}
                </h3>
                <Progress value={progress} className="max-w-xs mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {status === 'uploading' ? 'This may take a moment' : 'Extracting your profile and experiences'}
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Upload your resume</h3>
                <p className="text-gray-500 mb-6">
                  Upload your PDF resume and we&apos;ll automatically extract your profile, experiences, and skills.
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('resume-upload')?.click()}
                  >
                    Choose File
                  </Button>
                  <input
                    id="resume-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-400 mt-4">Supports PDF (max 10MB)</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
