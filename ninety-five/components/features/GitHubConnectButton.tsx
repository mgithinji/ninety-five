'use client'

import { Button } from '@/components/ui/button'
import { Github, RefreshCw, Link2, Unlink } from 'lucide-react'

interface GitHubConnectButtonProps {
  isConnected: boolean
  username?: string
  onConnect?: () => void
  onDisconnect?: () => void
  onRefresh?: () => void
}

export function GitHubConnectButton({
  isConnected,
  username,
  onConnect,
  onDisconnect,
  onRefresh,
}: GitHubConnectButtonProps) {
  if (isConnected) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
            <Github className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium">GitHub Connected</p>
            <p className="text-sm text-gray-500">@{username}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onDisconnect}
          >
            <Unlink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <Github className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <p className="font-medium">Connect GitHub</p>
          <p className="text-sm text-gray-500">Import your coding activity</p>
        </div>
      </div>
      <Button className="w-full gap-2" onClick={onConnect}>
        <Link2 className="w-4 h-4" />
        Connect GitHub
      </Button>
    </div>
  )
}
