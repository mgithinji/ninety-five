'use client'

import { ExperienceSection } from './ExperienceSection'
import type { Experience, Log } from '@/types/database'

interface LogsListProps {
  logs: Log[]
  experiences: Experience[]
  onEditLog: (log: Log) => void
  onDeleteLog: () => void
}

export function LogsList({ logs, experiences, onEditLog, onDeleteLog }: LogsListProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📝</div>
        <h3 className="text-lg font-medium mb-2">Your story starts here</h3>
        <p className="text-gray-500 mb-4">
          Log your first accomplishment and watch your professional narrative come to life.
        </p>
      </div>
    )
  }

  // Group logs by experience
  const logsByExperience = new Map<string, Log[]>()
  const uncategorizedLogs: Log[] = []

  for (const log of logs) {
    if (log.experience_id) {
      const existing = logsByExperience.get(log.experience_id) || []
      existing.push(log)
      logsByExperience.set(log.experience_id, existing)
    } else {
      uncategorizedLogs.push(log)
    }
  }

  // Get experience objects in order
  const sortedExperiences = [...experiences].sort((a, b) => {
    // Current roles first
    if (a.is_current && !b.is_current) return -1
    if (!a.is_current && b.is_current) return 1
    // Then by start date (most recent first)
    const aDate = a.start_date ? new Date(a.start_date).getTime() : 0
    const bDate = b.start_date ? new Date(b.start_date).getTime() : 0
    return bDate - aDate
  })

  return (
    <div className="space-y-6">
      {/* Uncategorized logs first */}
      {uncategorizedLogs.length > 0 && (
        <ExperienceSection
          experience={null}
          logs={uncategorizedLogs}
          onEditLog={onEditLog}
          onDeleteLog={onDeleteLog}
        />
      )}

      {/* Logs grouped by experience */}
      {sortedExperiences.map((experience) => {
        const experienceLogs = logsByExperience.get(experience.id) || []
        return (
          <ExperienceSection
            key={experience.id}
            experience={experience}
            logs={experienceLogs}
            onEditLog={onEditLog}
            onDeleteLog={onDeleteLog}
          />
        )
      })}
    </div>
  )
}
