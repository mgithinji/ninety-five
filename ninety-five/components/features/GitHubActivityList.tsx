'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ExternalLink } from 'lucide-react'
import type { GitHubActivity } from '@/types/database'

interface GitHubActivityListProps {
  onImport: () => void
}

export function GitHubActivityList({ onImport }: GitHubActivityListProps) {
  const [activities, setActivities] = useState<GitHubActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState<string | null>(null)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/github/activities')
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching GitHub activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async (activityId: string) => {
    setIsImporting(activityId)
    try {
      const response = await fetch('/api/github/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId }),
      })

      if (response.ok) {
        onImport()
        fetchActivities()
      }
    } catch (error) {
      console.error('Error importing activity:', error)
    } finally {
      setIsImporting(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">No recent activity to import</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchActivities}>
            Refresh
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🐙 Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
        {activities.slice(0, 10).map((activity) => (
          <div
            key={activity.id}
            className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">
                  {activity.type === 'pr' ? '🔀' : activity.type === 'commit' ? '📝' : '📋'}
                </span>
                <span className="font-medium text-sm truncate">{activity.title}</span>
              </div>
              <p className="text-xs text-gray-500">
                {activity.repo_name} • {new Date(activity.occurred_at).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => handleImport(activity.id)}
              disabled={isImporting === activity.id}
            >
              {isImporting === activity.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Import
                  <ExternalLink className="w-3 h-3 ml-1" />
                </>
              )}
            </Button>
          </div>
        ))}
        {activities.length > 10 && (
          <p className="text-xs text-center text-gray-400 pt-2">
            Showing 10 of {activities.length} activities
          </p>
        )}
      </CardContent>
    </Card>
  )
}
