'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { Loader2, FileText, Download, Copy, ArrowLeft } from 'lucide-react'
import { JOB_PRESETS } from '@/lib/presets'
import type { GeneratedResume, ResumeGenerationResult } from '@/types/database'

export function GeneratePageContent() {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [customJob, setCustomJob] = useState({ title: '', company: '', description: '' })
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<ResumeGenerationResult | null>(null)

  const handleGenerate = async () => {
    const jobTitle = selectedPreset ? JOB_PRESETS[selectedPreset as keyof typeof JOB_PRESETS].title : customJob.title
    const company = selectedPreset ? JOB_PRESETS[selectedPreset as keyof typeof JOB_PRESETS].company : customJob.company
    const description = selectedPreset ? JOB_PRESETS[selectedPreset as keyof typeof JOB_PRESETS].description : customJob.description

    if (!jobTitle || !company || !description.trim()) {
      toast.error('Please fill in all job details')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: jobTitle,
          company: company,
          job_description: description
        })
      })

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      const data = await response.json()
      setResult(data)
      toast.success('Resume generated successfully!')
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate resume. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    if (!result) return

    const text = formatResumeAsText(result.resume)
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const handleDownloadPDF = async () => {
    if (!result) return

    try {
      const html2pdf = (await import('html2pdf.js')).default
      const element = document.getElementById('resume-preview')
      if (!element) {
        toast.error('Resume element not found')
        return
      }

      html2pdf()
        .set({
          margin: 0.5,
          filename: `${result.resume.name.replace(' ', '_')}_Resume.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        })
        .from(element)
        .save()
    } catch (error) {
      console.error('PDF download error:', error)
      toast.error('Failed to download PDF')
    }
  }

  const reset = () => {
    setSelectedPreset(null)
    setCustomJob({ title: '', company: '', description: '' })
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200">
        <div className="flex items-center h-16 px-4 lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {!result ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Generate Tailored Resume</h1>
              <p className="text-gray-500">
                AI will create a customized resume based on your profile, experiences, and logs
              </p>
            </div>

            <Tabs defaultValue="presets" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
                <TabsTrigger value="presets">Quick Presets</TabsTrigger>
                <TabsTrigger value="custom">Custom Job</TabsTrigger>
              </TabsList>

              <TabsContent value="presets">
                <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                  {Object.entries(JOB_PRESETS).map(([key, preset]) => (
                    <Card
                      key={key}
                      className={`cursor-pointer transition-all ${
                        selectedPreset === key
                          ? 'ring-2 ring-indigo-600 bg-indigo-50'
                          : 'hover:border-indigo-300'
                      }`}
                      onClick={() => setSelectedPreset(key)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                            {key === 'cursor' ? (
                              <span className="text-white text-lg">🖱️</span>
                            ) : (
                              <span className="text-white text-lg">🔊</span>
                            )}
                          </div>
                          <div>
                            <div>{preset.title}</div>
                            <div className="text-sm font-normal text-gray-500">{preset.company}</div>
                          </div>
                        </CardTitle>
                        <CardDescription>
                          {key === 'cursor'
                            ? 'AI-powered code editor for developers'
                            : 'Pioneering voice AI technology'}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="custom">
                <Card className="max-w-2xl mx-auto">
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Job Title</label>
                        <Input
                          placeholder="Senior Software Engineer"
                          value={customJob.title}
                          onChange={(e) => setCustomJob({ ...customJob, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Company</label>
                        <Input
                          placeholder="Acme Inc"
                          value={customJob.company}
                          onChange={(e) => setCustomJob({ ...customJob, company: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Job Description</label>
                      <Textarea
                        placeholder="Paste the full job description here..."
                        className="min-h-[200px]"
                        value={customJob.description}
                        onChange={(e) => setCustomJob({ ...customJob, description: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-center mt-8">
              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={!selectedPreset && (!customJob.title || !customJob.company || !customJob.description)}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate Resume
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={reset} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Generate Another
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCopy} className="gap-2">
                  <Copy className="w-4 h-4" />
                  Copy Text
                </Button>
                <Button onClick={handleDownloadPDF} className="gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Resume Preview */}
              <div className="lg:col-span-2">
                <div id="resume-preview" className="bg-white p-8 shadow-lg rounded-lg">
                  {/* Resume Header */}
                  <div className="text-center border-b pb-6 mb-6">
                    <h1 className="text-2xl font-bold">{result.resume.name}</h1>
                    <p className="text-gray-600">{result.resume.headline}</p>
                    <p className="text-sm text-gray-500 mt-1">{result.resume.contact.email}</p>
                  </div>

                  {/* Summary */}
                  {result.resume.summary && (
                    <div className="mb-6">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
                        Summary
                      </h2>
                      <p className="text-gray-700">{result.resume.summary}</p>
                    </div>
                  )}

                  {/* Experience */}
                  <div className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
                      Experience
                    </h2>
                    {result.resume.experience.map((exp, i) => (
                      <div key={i} className="mb-4">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-semibold">{exp.title}</h3>
                          <span className="text-sm text-gray-500">{exp.dates}</span>
                        </div>
                        <p className="text-gray-600">{exp.organization}</p>
                        <ul className="mt-2 space-y-1">
                          {exp.bullets.map((bullet, j) => (
                            <li key={j} className="text-gray-700 text-sm flex gap-2">
                              <span>•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Education */}
                  {result.resume.education && result.resume.education.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
                        Education
                      </h2>
                      {result.resume.education.map((edu, i) => (
                        <div key={i} className="mb-2">
                          <div className="flex justify-between items-baseline">
                            <h3 className="font-semibold">{edu.degree}</h3>
                            <span className="text-sm text-gray-500">{edu.dates}</span>
                          </div>
                          <p className="text-gray-600">{edu.school}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Skills */}
                  {result.resume.skills && result.resume.skills.length > 0 && (
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
                        Skills
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {result.resume.skills.map((skill, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tailoring Notes */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tailoring Notes</CardTitle>
                    <CardDescription>
                      How this resume was optimized for {result.resume.experience[0]?.organization || 'this role'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.tailoring_notes.map((note, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-indigo-600">✨</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Match Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-indigo-600 mb-2">
                      {result.match_score}%
                    </div>
                    <p className="text-sm text-gray-500">
                      Estimated fit based on job description keywords
                    </p>
                  </CardContent>
                </Card>

                {result.suggestions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {result.suggestions.map((suggestion, i) => (
                        <div key={i} className="flex gap-2 text-sm text-gray-600">
                          <span>💡</span>
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function formatResumeAsText(resume: GeneratedResume): string {
  let text = `${resume.name}\n`
  text += `${resume.headline}\n\n`
  text += `SUMMARY\n${resume.summary}\n\n`
  text += `EXPERIENCE\n`

  for (const exp of resume.experience) {
    text += `${exp.title} at ${exp.organization} (${exp.dates})\n`
    for (const bullet of exp.bullets) {
      text += `• ${bullet}\n`
    }
    text += '\n'
  }

  if (resume.education && resume.education.length > 0) {
    text += `EDUCATION\n`
    for (const edu of resume.education) {
      text += `${edu.degree}, ${edu.school} (${edu.dates})\n`
    }
    text += '\n'
  }

  text += `SKILLS\n${resume.skills.join(', ')}\n`
  return text
}
