'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard', label: 'New Log', icon: PlusCircle },
  { href: '/generate', label: 'Generate Resume', icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 hidden lg:block">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">9</span>
            </div>
            <span className="font-semibold text-lg">95ive</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'w-full justify-start gap-3',
              pathname === '/dashboard' && 'bg-gray-100'
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/dashboard#new-log"
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'w-full justify-start gap-3'
            )}
          >
            <PlusCircle className="w-4 h-4" />
            New Log
          </Link>
          <Link
            href="/generate"
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'w-full justify-start gap-3',
              pathname === '/generate' && 'bg-gray-100'
            )}
          >
            <FileText className="w-4 h-4" />
            Generate Resume
          </Link>
        </nav>

        {/* Bottom section */}
        <div className="px-4 py-4 border-t border-gray-200 space-y-1">
          <button
            onClick={handleSignOut}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50'
            )}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  )
}
