'use client'

import { useState } from 'react'
import { LogCard } from './LogCard'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Experience, Log } from '@/types/database'

interface ExperienceSectionProps {
  experience: Experience | null
  logs: Log[]
  onEditLog: (log: Log) => void
  onDeleteLog: () => void
}

export function ExperienceSection({ experience, logs, onEditLog, onDeleteLog }: ExperienceSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (logs.length === 0) return null

  const formatDateRange = (start: string | null, end: string | null, isCurrent: boolean) => {
    const startDate = start ? new Date(start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
    const endDate = isCurrent ? 'Present' : (end ? new Date(end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '')
    return `${startDate} - ${endDate}`
  }

  const title = experience
    ? `${experience.title} @ ${experience.organization}`
    : 'Uncategorized'

  const dateRange = experience
    ? formatDateRange(experience.start_date, experience.end_date, experience.is_current)
    : ''

  return (
    <div className="space-y-3">
      {/* Experience Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-left"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg">🏢</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{title}</span>
              {experience?.is_current && (
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                  Current
                </span>
              )}
            </div>
            {dateRange && (
              <span className="text-sm text-gray-500">{dateRange}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{logs.length} logs</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Logs */}
      {isExpanded && (
        <div className="space-y-2 pl-4 border-l-2 border-gray-200">
          {logs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              onEdit={onEditLog}
              onDelete={onDeleteLog}
            />
          ))}
        </div>
      )}
    </div>
  )
}
