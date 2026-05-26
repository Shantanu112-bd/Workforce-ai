import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { AgentCategory, AgentDifficulty, WorkflowStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString('en-IN')
}

export const CATEGORY_LABELS: Record<AgentCategory, string> = {
  developer: '👨‍💻 Developer',
  teacher: '📚 Teacher',
  business: '💼 Business',
  creator: '🎨 Creator',
}

export const CATEGORY_COLORS: Record<AgentCategory, string> = {
  developer: 'bg-accent/15 text-accent',
  teacher: 'bg-accent-2/12 text-accent-2',
  business: 'bg-brand-amber/12 text-brand-amber',
  creator: 'bg-accent-3/12 text-accent-3',
}

export const DIFFICULTY_LABELS: Record<AgentDifficulty, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const DIFFICULTY_COLORS: Record<AgentDifficulty, string> = {
  low: 'bg-accent-2/10 text-accent-2',
  medium: 'bg-brand-amber/10 text-brand-amber',
  high: 'bg-brand-red/10 text-brand-red',
}

export const STATUS_COLORS: Record<WorkflowStatus, string> = {
  pending: 'text-text-2',
  running: 'text-brand-amber',
  completed: 'text-accent-2',
  failed: 'text-brand-red',
  cancelled: 'text-text-3',
}

export const STATUS_LABELS: Record<WorkflowStatus, string> = {
  pending: 'Pending',
  running: 'Running...',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

export function estimateTimeSaved(creditCost: number): number {
  // Rough estimate: each credit unit = ~15 mins of manual work
  return creditCost * 15
}

export function validateGitHubUrl(url: string): boolean {
  return /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/.test(url)
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + '...'
}
