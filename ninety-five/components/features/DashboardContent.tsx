'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { LogEntryModal } from '@/components/features/LogEntryModal'
import { LogsList } from '@/components/features/LogsList'
import { ResumeUploader } from '@/components/features/ResumeUploader'
import { GitHubConnectButton } from '@/components/features/GitHubConnectButton'
import { GitHubActivityList } from '@/components/features/GitHubActivityList'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { PlusCircle, FileText, Clock, Sparkles } from 'lucide-react'
import type { Profile, Experience, Log } from '@/types/database'

interface DashboardContentProps {
  userId: string
}

export function DashboardContent({ userId }: DashboardContentProps) {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [isUpdatingResume, setIsUpdatingResume] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [userId])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      // Fetch experiences
      const { data: expData } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', userId)
        .order('is_current', { ascending: false })
        .order('start_date', { ascending: false })

      if (expData) {
        setExperiences(expData)
      }

      // Fetch logs
      const { data: logData } = await supabase
        .from('logs')
        .select(`
          *,
          experience:experiences(id, title, organization, is_current)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (logData) {
        setLogs(logData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogCreated = () => {
    setIsLogModalOpen(false)
    fetchData()
    toast.success('Log created successfully!')
  }

  const stats = {
    totalLogs: logs.length,
    thisMonth: logs.filter((log) => {
      const logDate = new Date(log.created_at)
      const now = new Date()
      return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear()
    }).length,
    lastLog: logs[0]?.created_at
      ? new Date(logs[0].created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : null,
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Track your accomplishments and build your story</p>
        </div>
        <Button onClick={() => setIsLogModalOpen(true)} className="gap-2">
          <PlusCircle className="w-4 h-4" />
          New Log
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Logs</CardDescription>
            <CardTitle className="text-3xl">{stats.totalLogs}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileText className="w-4 h-4" />
              {stats.thisMonth} this month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last Log</CardDescription>
            <CardTitle className="text-3xl">{stats.lastLog || 'None'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              Keep the streak going
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Experiences</CardDescription>
            <CardTitle className="text-3xl">{experiences.filter((e) => e.type === 'job').length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Sparkles className="w-4 h-4" />
              {experiences.filter((e) => e.is_current).length} current role(s)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile & GitHub Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Resume Uploader or Profile Summary */}
          {profile?.resume_url && !isUpdatingResume ? (
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-indigo-600 text-white text-xl">
                      {profile.full_name?.charAt(0) || profile.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{profile.full_name || 'Your Name'}</h3>
                    <p className="text-gray-500">{profile.headline || 'Add your resume to see your headline'}</p>
                    {profile.skills && profile.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {profile.skills.slice(0, 5).map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                        {profile.skills.length > 5 && (
                          <Badge variant="outline">+{profile.skills.length - 5} more</Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('Update Resume clicked:', { profileResumeUrl: profile?.resume_url, isUpdatingResume })
                      setIsUpdatingResume(true)
                    }}
                  >
                    Update Resume
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {isUpdatingResume && (
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setIsUpdatingResume(false)}>
                    Cancel
                  </Button>
                </div>
              )}
              <ResumeUploader
                onUploadComplete={() => {
                  setIsUpdatingResume(false)
                  fetchData()
                }}
              />
            </div>
          )}

          {/* Logs Section */}
          <Card>
            <CardHeader>
              <CardTitle>Your Logs</CardTitle>
              <CardDescription>
                Accomplishments organized by experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LogsList
                logs={logs}
                experiences={experiences}
                onEditLog={() => {}}
                onDeleteLog={() => fetchData()}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* GitHub Integration */}
          <GitHubConnectButton
            isConnected={!!profile?.github_username}
            username={profile?.github_username || undefined}
          />

          {profile?.github_username && (
            <GitHubActivityList
              onImport={() => {
                fetchData()
                toast.success('Activity imported as log!')
              }}
            />
          )}
        </div>
      </div>

      {/* Log Entry Modal */}
      <LogEntryModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onLogCreated={handleLogCreated}
        experiences={experiences}
      />
    </div>
  )
}
