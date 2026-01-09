export const calculateGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A'
  if (percentage >= 80) return 'B'
  if (percentage >= 70) return 'C'
  if (percentage >= 60) return 'D'
  return 'F'
}

export const getGradeColor = (grade: string): string => {
  if (grade.startsWith('A')) return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
  if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
  if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
  return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
}

export const getGradeBadgeColor = (grade: string): string => {
  if (grade.startsWith('A')) return 'bg-green-500'
  if (grade.startsWith('B')) return 'bg-blue-500'
  if (grade.startsWith('C')) return 'bg-yellow-500'
  return 'bg-red-500'
}

export const getRankVariant = (rank: number): "default" | "secondary" | "destructive" => {
  if (rank <= 3) return "default"
  if (rank <= 10) return "secondary"
  return "destructive"
}

export const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
  const variants: Record<string, "default" | "secondary" | "destructive"> = {
    'Completed': 'default',
    'Upcoming': 'secondary',
    'Ongoing': 'default'
  }
  return variants[status] || 'secondary'
}

export const formatExamDate = (date: string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const formatExamTime = (time: string): string => {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const formattedHour = hour % 12 || 12
  return `${formattedHour}:${minutes} ${ampm}`
}

export const calculateDuration = (startTime: string, endTime: string): number => {
  const start = new Date(`1970-01-01T${startTime}`)
  const end = new Date(`1970-01-01T${endTime}`)
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60))
}
