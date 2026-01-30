'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { formatDate, formatRelativeTime, getCategoryColor, getCategoryLabel } from '@/lib/utils'
import { Edit2, Trash2, MoreHorizontal, AlertTriangle } from 'lucide-react'
import type { Log } from '@/types/database'

interface LogCardProps {
  log: Log
  onEdit: (log: Log) => void
  onDelete: () => void
}

export function LogCard({ log, onEdit, onDelete }: LogCardProps) {
  const supabase = createClient()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this log?')) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('logs')
        .delete()
        .eq('id', log.id)

      if (error) throw error

      toast.success('Log deleted')
      onDelete()
    } catch (error) {
      console.error('Error deleting log:', error)
      toast.error('Failed to delete log')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Toaster />
      <Card className={`group ${log.needs_review ? 'border-amber-300 bg-amber-50/50' : ''}`}>
        <CardContent className="py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Category and Tags */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {log.category && (
                  <Badge className={getCategoryColor(log.category)}>
                    {getCategoryLabel(log.category)}
                  </Badge>
                )}
                {log.tags?.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
                {log.needs_review && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Review
                  </Badge>
                )}
                <span className="text-xs text-gray-400 ml-auto">
                  {log.occurred_at ? formatDate(log.occurred_at) : formatRelativeTime(log.created_at)}
                </span>
              </div>

              {/* Processed Bullet */}
              <p className="text-gray-800">{log.processed_bullet || log.raw_input}</p>

              {/* Experience Attachment */}
              {log.experience && (
                <p className="text-sm text-gray-500 mt-2">
                  📎 {log.experience.title} @ {log.experience.organization}
                </p>
              )}
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(log)} className="gap-2">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="gap-2 text-red-600"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
