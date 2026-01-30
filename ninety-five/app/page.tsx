import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Mic, Github, FileText, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">9</span>
              </div>
              <span className="font-semibold text-lg">95ive</span>
            </div>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            Capture your wins.
            <br />
            <span className="text-indigo-600">Build your story.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Remember every accomplishment. Generate perfect resumes in seconds.
            Your professional story, captured effortlessly.
          </p>
          <div className="mt-10">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mic className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Voice Log</h3>
              <p className="text-gray-600">
                Capture wins in 10 seconds with voice notes. AI transforms your words into professional accomplishments.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Github className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">GitHub Sync</h3>
              <p className="text-gray-600">
                Import your commits and PRs automatically. Your code contributions, captured and formatted.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Resume</h3>
              <p className="text-gray-600">
                Generate tailored resumes in seconds. AI weaves your logs into compelling, job-specific narratives.
              </p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-24 text-center">
          <p className="text-sm text-gray-500 uppercase tracking-wider mb-4">
            Built for developers, by developers
          </p>
          <p className="text-2xl font-medium text-gray-700 italic max-w-2xl mx-auto">
            &quot;Capture in 10 seconds now, save 10 hours later when stakes are high.&quot;
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>95ive - Your accomplishments deserve to be remembered.</p>
        </div>
      </footer>
    </div>
  )
}
