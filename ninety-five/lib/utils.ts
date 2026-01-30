import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return formatDate(dateString)
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    launch: 'bg-green-100 text-green-800',
    achievement: 'bg-blue-100 text-blue-800',
    collaboration: 'bg-purple-100 text-purple-800',
    learning: 'bg-yellow-100 text-yellow-800',
    impact: 'bg-red-100 text-red-800',
    process: 'bg-gray-100 text-gray-800',
  }
  return colors[category] || 'bg-gray-100 text-gray-800'
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    launch: 'Launch',
    achievement: 'Achievement',
    collaboration: 'Collaboration',
    learning: 'Learning',
    impact: 'Impact',
    process: 'Process',
  }
  return labels[category] || category
}
