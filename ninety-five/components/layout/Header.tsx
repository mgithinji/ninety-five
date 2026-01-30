'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Mobile menu button would go here */}
        <div className="lg:hidden">
          <span className="font-semibold text-lg">95ive</span>
        </div>

        {/* Desktop - logo and nav are in sidebar, so this is for mobile */}
        <div className="flex items-center gap-4 ml-auto">
          <Link href="/generate">
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Generate Resume</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
