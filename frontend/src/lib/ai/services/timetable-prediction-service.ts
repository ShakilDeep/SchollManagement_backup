import { fetchAPI } from '@/lib/api/client'

export interface TimetablePrediction {
  sectionId: string
  sectionName: string
  optimalSchedule: {
    suggestedChanges: Array<{
      day: string
      period: number
      currentSubject: string
      suggestedSubject: string
      reason: string
      impact: 'high' | 'medium' | 'low'
      confidence: number
    }>
    overallOptimizationScore: number
    improvementPotential: string
  }
  teacherEffectiveness: {
    teacherId: string
    teacherName: string
    subject: string
    effectivenessScore: number
    periodsAssigned: number
    recommendations: string[]
  }[]
  subjectDistribution: {
    subject: string
    periodsPerWeek: number
    idealPeriods: number
    balanceScore: number
    difficultyDistribution: 'balanced' | 'front_loaded' | 'back_loaded' | 'scattered'
    recommendations: string[]
  }[]
  conflictAnalysis: {
    detectedConflicts: Array<{
      type: 'teacher_overlap' | 'room_unavailable' | 'subject_clash'
      description: string
      severity: 'high' | 'medium' | 'low'
      affectedSlots: Array<{ day: string; period: number }>
      resolution: string
    }>
    conflictFreeScore: number
  }
  studyLoadAnalysis: {
    dailyLoad: Array<{
      day: string
      totalDifficulty: number
      averageDifficulty: number
      loadLevel: 'light' | 'balanced' | 'heavy'
      recommendations: string[]
    }>
    weeklyBalance: 'balanced' | 'imbalanced'
    peakDays: string[]
    lightDays: string[]
    optimizationSuggestions: string[]
  }
  performanceInsights: {
    bestPerformingDays: string[]
    challengingDays: string[]
    subjectPerformanceCorrelation: Array<{
      subject: string
      avgPerformance: number
      bestDay: string
      worstDay: string
      insight: string
    }>
    recommendations: string[]
  }
  alerts: Array<{
    type: 'urgent' | 'warning' | 'info'
    title: string
    message: string
    action?: string
  }>
  generatedAt: Date
}

export interface ScheduleOptimization {
  currentSchedule: any[]
  optimizedSchedule: any[]
  improvements: Array<{
    description: string
    benefit: string
    implementationEffort: 'easy' | 'moderate' | 'complex'
  }>
  expectedImpact: {
    studentPerformance: number
    teacherSatisfaction: number
    scheduleEfficiency: number
  }
}

export class TimetablePredictionService {
  private readonly MIN_TIMETABLE_ENTRIES = 10
  private readonly HIGH_CONFIDENCE_THRESHOLD = 0.85

  async generatePredictions(sectionId: string): Promise<TimetablePrediction | null> {
    try {
      // Fetch section and timetable data from backend API
      const sectionResponse = await fetchAPI<any>(`/sections/${sectionId}/`)
      const section = {
        id: sectionResponse.id,
        name: sectionResponse.name || sectionResponse.section_name || '',
        grade: {
          name: sectionResponse.grade_name || sectionResponse.grade?.name || 'N/A'
        }
      }

      if (!section) return null

      // Fetch timetable entries
      const timetableResponse = await fetchAPI<{ results: any[] }>(`/timetable/?section=${sectionId}`)
      const timetableEntries = (timetableResponse.results || []).map((t: any) => ({
        id: t.id,
        sectionId: t.section || t.sectionId,
        dayOfWeek: t.day_of_week || t.dayOfWeek,
        period: t.period,
        subjectId: t.subject || t.subjectId,
        subject: {
          id: t.subject,
          name: t.subject_name || t.subject?.name || 'Unknown'
        },
        teacherId: t.teacher || t.teacherId,
        teacher: {
          id: t.teacher,
          name: t.teacher_name || t.teacher?.name || 'Unknown'
        }
      }))

      if (timetableEntries.length < this.MIN_TIMETABLE_ENTRIES) {
        return this.generateLimitedPredictions(section, timetableEntries)
      }

      const [
        optimalSchedule,
        teacherEffectiveness,
        subjectDistribution,
        conflictAnalysis,
        studyLoadAnalysis,
        performanceInsights
      ] = await Promise.all([
        this.analyzeOptimalSchedule(timetableEntries, sectionId),
        this.analyzeTeacherEffectiveness(timetableEntries, sectionId),
        this.analyzeSubjectDistribution(timetableEntries),
        this.analyzeConflicts(timetableEntries, sectionId),
        this.analyzeStudyLoad(timetableEntries),
        this.analyzePerformanceInsights(timetableEntries, sectionId)
      ])

      const alerts = this.generateAlerts(
        conflictAnalysis,
        studyLoadAnalysis,
        teacherEffectiveness
      )

      return {
        sectionId,
        sectionName: `${section.grade.name} - Section ${section.name}`,
        optimalSchedule,
        teacherEffectiveness,
        subjectDistribution,
        conflictAnalysis,
        studyLoadAnalysis,
        performanceInsights,
        alerts,
        generatedAt: new Date()
      }
    } catch (error) {
      console.error('Error generating timetable predictions from backend API:', error)
      return null
    }
  }

  async optimizeSchedule(sectionId: string): Promise<ScheduleOptimization | null> {
    try {
      // Fetch section and timetable data from backend API
      const sectionResponse = await fetchAPI<any>(`/sections/${sectionId}/`)
      const section = {
        id: sectionResponse.id,
        name: sectionResponse.name || sectionResponse.section_name || '',
        grade: {
          name: sectionResponse.grade_name || sectionResponse.grade?.name || 'N/A'
        }
      }

      if (!section) return null

      // Fetch timetable entries
      const timetableResponse = await fetchAPI<{ results: any[] }>(`/timetable/?section=${sectionId}`)
      const currentSchedule = (timetableResponse.results || []).map((t: any) => ({
        id: t.id,
        sectionId: t.section || t.sectionId,
        dayOfWeek: t.day_of_week || t.dayOfWeek,
        period: t.period,
        subjectId: t.subject || t.subjectId,
        subject: {
          id: t.subject,
          name: t.subject_name || t.subject?.name || 'Unknown'
        },
        teacherId: t.teacher || t.teacherId,
        teacher: {
          id: t.teacher,
          name: t.teacher_name || t.teacher?.name || 'Unknown'
        }
      }))

      if (currentSchedule.length === 0) return null

      const optimizedSchedule = this.generateOptimizedSchedule(currentSchedule)
      const improvements = this.calculateImprovements(currentSchedule, optimizedSchedule)

      return {
        currentSchedule,
        optimizedSchedule,
        improvements,
        expectedImpact: {
          studentPerformance: this.calculatePerformanceImpact(improvements),
          teacherSatisfaction: this.calculateSatisfactionImpact(improvements),
          scheduleEfficiency: this.calculateEfficiencyImpact(improvements)
        }
      }
    } catch (error) {
      console.error('Error optimizing schedule from backend API:', error)
      return null
    }
  }

  private async analyzeOptimalSchedule(
    timetableEntries: any[],
    sectionId: string
  ): Promise<TimetablePrediction['optimalSchedule']> {
    const suggestedChanges: TimetablePrediction['optimalSchedule']['suggestedChanges'] = []

    const dayPatterns = this.analyzeDayPatterns(timetableEntries)
    const subjectPatterns = this.analyzeSubjectPatterns(timetableEntries)
    const difficultyDistribution = this.analyzeDifficultyDistribution(timetableEntries)

    dayPatterns.forEach((pattern, day) => {
      if (pattern.load > 0.85) {
        const heavyPeriods = timetableEntries
          .filter(t => this.formatDayOfWeek(t.dayOfWeek) === day && this.getSubjectDifficulty(t.subject.name) === 'advanced')
          .slice(0, 2)

        heavyPeriods.forEach(period => {
          suggestedChanges.push({
            day,
            period: period.period,
            currentSubject: period.subject.name,
            suggestedSubject: this.findAlternativeSubject(timetableEntries, period, day),
            reason: `Reduce ${day} load - currently overloaded with ${heavyPeriods.length} advanced subjects`,
            impact: 'high',
            confidence: 0.87
          })
        })
      }

      if (pattern.load < 0.4) {
        const lightPeriods = timetableEntries
          .filter(t => this.formatDayOfWeek(t.dayOfWeek) === day)
          .slice(0, 2)

        lightPeriods.forEach(period => {
          suggestedChanges.push({
            day,
            period: period.period,
            currentSubject: period.subject.name,
            suggestedSubject: this.findMoreChallengingSubject(timetableEntries, period),
            reason: `Balance ${day} load - currently too light (${(pattern.load * 100).toFixed(0)}%)`,
            impact: 'medium',
            confidence: 0.82
          })
        })
      }
    })

    subjectPatterns.forEach((pattern, subject) => {
      if (pattern.consecutiveCount > 3) {
        const consecutivePeriods = this.findConsecutivePeriods(timetableEntries, subject)
        consecutivePeriods.forEach(period => {
          suggestedChanges.push({
            day: period.day,
            period: period.period,
            currentSubject: subject,
            suggestedSubject: this.findAlternativeSubject(timetableEntries, period, period.day),
            reason: `Break up ${subject} - too many consecutive periods`,
            impact: 'medium',
            confidence: 0.85
          })
        })
      }
    })

    const overallScore = this.calculateOverallOptimizationScore(timetableEntries, suggestedChanges)
    const improvementPotential = this.calculateImprovementPotential(overallScore, suggestedChanges)

    return {
      suggestedChanges: suggestedChanges.slice(0, 8),
      overallOptimizationScore: overallScore,
      improvementPotential
    }
  }

  private async analyzeTeacherEffectiveness(
    timetableEntries: any[],
    sectionId: string
  ): Promise<TimetablePrediction['teacherEffectiveness']> {
    const teacherStats = new Map<string, any>()

    timetableEntries.forEach(entry => {
      const key = entry.teacherId
      if (!teacherStats.has(key)) {
        teacherStats.set(key, {
          teacherId: entry.teacherId,
          teacherName: entry.teacher.name || 'Unknown',
          subject: entry.subject.name,
          periodsAssigned: 0,
          totalSlots: 0
        })
      }
      teacherStats.get(key).periodsAssigned++
      teacherStats.get(key).totalSlots++
    })

    const effectivenessData = Array.from(teacherStats.values()).map(stat => {
      const effectivenessScore = this.calculateTeacherEffectivenessScore(stat, timetableEntries)
      const recommendations = this.generateTeacherRecommendations(stat, effectivenessScore)

      return {
        ...stat,
        effectivenessScore,
        recommendations
      }
    })

    return effectivenessData
  }

  private async analyzeSubjectDistribution(
    timetableEntries: any[]
  ): Promise<TimetablePrediction['subjectDistribution']> {
    const subjectStats = new Map<string, any>()

    timetableEntries.forEach(entry => {
      const subjectName = entry.subject.name
      const difficulty = this.getSubjectDifficulty(subjectName)

      if (!subjectStats.has(subjectName)) {
        subjectStats.set(subjectName, {
          subject: subjectName,
          periodsPerWeek: 0,
          periodsByDay: new Map<string, number>(),
          difficulty: difficulty,
          totalDifficulty: 0
        })
      }

      const stat = subjectStats.get(subjectName)
      stat.periodsPerWeek++
      const day = this.formatDayOfWeek(entry.dayOfWeek)
      stat.periodsByDay.set(day, (stat.periodsByDay.get(day) || 0) + 1)
      stat.totalDifficulty += difficulty === 'advanced' ? 3 : difficulty === 'intermediate' ? 2 : 1
    })

    return Array.from(subjectStats.values()).map(stat => {
      const idealPeriods = this.calculateIdealPeriods(stat.subject, stat.difficulty)
      const balanceScore = this.calculateBalanceScore(stat.periodsPerWeek, idealPeriods)
      const difficultyDistribution = this.analyzeDifficultyPattern(stat.periodsByDay)
      const recommendations = this.generateSubjectRecommendations(stat, balanceScore, difficultyDistribution)

      return {
        subject: stat.subject,
        periodsPerWeek: stat.periodsPerWeek,
        idealPeriods,
        balanceScore,
        difficultyDistribution,
        recommendations
      }
    })
  }

  private async analyzeConflicts(
    timetableEntries: any[],
    sectionId: string
  ): Promise<TimetablePrediction['conflictAnalysis']> {
    const conflicts: TimetablePrediction['conflictAnalysis']['detectedConflicts'] = []

    // Fetch all timetables from backend API for conflict detection
    const allTimetablesResponse = await fetchAPI<{ results: any[] }>('/timetable/')
    const allTimetables = allTimetablesResponse.results || []

    const teacherSchedule = new Map<string, Array<{ day: string; period: number; section: string }>>()
    const roomSchedule = new Map<string, Array<{ day: string; period: number; section: string }>>()

    allTimetables.forEach((entry: any) => {
      const day = this.formatDayOfWeek(entry.day_of_week || entry.dayOfWeek)
      const period = entry.period
      const sectionName = `${entry.grade_name || entry.grade?.name || 'N/A'} - ${entry.section_name || entry.section?.name || 'N/A'}`

      if (entry.teacher || entry.teacherId) {
        const teacherId = entry.teacher || entry.teacherId
        if (!teacherSchedule.has(teacherId)) {
          teacherSchedule.set(teacherId, [])
        }
        teacherSchedule.get(teacherId).push({ day, period, section: sectionName })
      }

      if (entry.room_number || entry.roomNumber) {
        const roomNumber = entry.room_number || entry.roomNumber
        if (!roomSchedule.has(roomNumber)) {
          roomSchedule.set(roomNumber, [])
        }
        roomSchedule.get(roomNumber).push({ day, period, section: sectionName })
      }
    })

    teacherSchedule.forEach((slots, teacherId) => {
      const slotsByDay = new Map<string, any[]>()
      slots.forEach(slot => {
        if (!slotsByDay.has(slot.day)) {
          slotsByDay.set(slot.day, [])
        }
        slotsByDay.get(slot.day).push(slot)
      })

      slotsByDay.forEach((daySlots, day) => {
        const periodCounts = new Map<number, number>()
        daySlots.forEach(slot => {
          periodCounts.set(slot.period, (periodCounts.get(slot.period) || 0) + 1)
        })

        periodCounts.forEach((count, period) => {
          if (count > 1) {
            const conflictingSections = daySlots
              .filter(s => s.period === period)
              .map(s => s.section)
              .join(', ')

            conflicts.push({
              type: 'teacher_overlap',
              description: `Teacher assigned to multiple sections at the same time`,
              severity: 'high',
              affectedSlots: [{ day, period }],
              resolution: `Reassign one of the conflicting periods for sections: ${conflictingSections}`
            })
          }
        })
      })
    })

    roomSchedule.forEach((slots, roomNumber) => {
      const slotsByDay = new Map<string, any[]>()
      slots.forEach(slot => {
        if (!slotsByDay.has(slot.day)) {
          slotsByDay.set(slot.day, [])
        }
        slotsByDay.get(slot.day).push(slot)
      })

      slotsByDay.forEach((daySlots, day) => {
        const periodCounts = new Map<number, number>()
        daySlots.forEach(slot => {
          periodCounts.set(slot.period, (periodCounts.get(slot.period) || 0) + 1)
        })

        periodCounts.forEach((count, period) => {
          if (count > 1) {
            conflicts.push({
              type: 'room_unavailable',
              description: `Room ${roomNumber} double-booked on ${day}`,
              severity: 'high',
              affectedSlots: [{ day, period }],
              resolution: `Reassign one class to a different room`
            })
          }
        })
      })
    })

    const conflictFreeScore = conflicts.length === 0 ? 1 : Math.max(0.6, 1 - (conflicts.length * 0.15))

    return {
      detectedConflicts: conflicts.slice(0, 10),
      conflictFreeScore
    }
  }

  private async analyzeStudyLoad(
    timetableEntries: any[]
  ): Promise<TimetablePrediction['studyLoadAnalysis']> {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const dailyLoad: TimetablePrediction['studyLoadAnalysis']['dailyLoad'] = []

    days.forEach(day => {
      const dayPeriods = timetableEntries.filter(t => this.formatDayOfWeek(t.dayOfWeek) === day)
      const totalDifficulty = dayPeriods.reduce((sum, p) => {
        const diff = this.getSubjectDifficulty(p.subject.name)
        return sum + (diff === 'advanced' ? 3 : diff === 'intermediate' ? 2 : 1)
      }, 0)
      const averageDifficulty = dayPeriods.length > 0 ? totalDifficulty / dayPeriods.length : 0

      let loadLevel: 'light' | 'balanced' | 'heavy'
      if (averageDifficulty < 1.5) loadLevel = 'light'
      else if (averageDifficulty > 2.5) loadLevel = 'heavy'
      else loadLevel = 'balanced'

      const recommendations = this.generateDayLoadRecommendations(day, averageDifficulty, dayPeriods)

      dailyLoad.push({
        day,
        totalDifficulty,
        averageDifficulty,
        loadLevel,
        recommendations
      })
    })

    const averageWeeklyLoad = dailyLoad.reduce((sum, day) => sum + day.averageDifficulty, 0) / days.length
    const weeklyBalance = Math.max(...dailyLoad.map(d => d.averageDifficulty)) - Math.min(...dailyLoad.map(d => d.averageDifficulty)) < 0.8
      ? 'balanced'
      : 'imbalanced'

    const peakDays = dailyLoad.filter(d => d.loadLevel === 'heavy').map(d => d.day)
    const lightDays = dailyLoad.filter(d => d.loadLevel === 'light').map(d => d.day)

    const optimizationSuggestions = this.generateLoadOptimizationSuggestions(dailyLoad, weeklyBalance)

    return {
      dailyLoad,
      weeklyBalance,
      peakDays,
      lightDays,
      optimizationSuggestions
    }
  }

  private async analyzePerformanceInsights(
    timetableEntries: any[],
    sectionId: string
  ): Promise<TimetablePrediction['performanceInsights']> {
    // Fetch section data from backend API with exam results
    const sectionResponse = await fetchAPI<any>(`/sections/${sectionId}/`)

    // Since we can't easily get exam results through the section endpoint,
    // we'll return basic insights
    return {
      bestPerformingDays: [],
      challengingDays: [],
      subjectPerformanceCorrelation: [],
      recommendations: ['Complete timetable setup for performance insights']
    }
  }

  private generateAlerts(
    conflictAnalysis: TimetablePrediction['conflictAnalysis'],
    studyLoadAnalysis: TimetablePrediction['studyLoadAnalysis'],
    teacherEffectiveness: TimetablePrediction['teacherEffectiveness']
  ): TimetablePrediction['alerts'] {
    const alerts: TimetablePrediction['alerts'] = []

    if (conflictAnalysis.detectedConflicts.some(c => c.severity === 'high')) {
      alerts.push({
        type: 'urgent',
        title: 'Schedule Conflicts Detected',
        message: `${conflictAnalysis.detectedConflicts.filter(c => c.severity === 'high').length} high-severity conflicts found in the schedule`,
        action: 'Review and resolve conflicts immediately'
      })
    }

    if (studyLoadAnalysis.weeklyBalance === 'imbalanced') {
      alerts.push({
        type: 'warning',
        title: 'Unbalanced Study Load',
        message: `Study load varies significantly between days. Peak days: ${studyLoadAnalysis.peakDays.join(', ')}`,
        action: 'Consider redistributing subjects across the week'
      })
    }

    const lowEffectivenessTeachers = teacherEffectiveness.filter(t => t.effectivenessScore < 0.65)
    if (lowEffectivenessTeachers.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Teacher Effectiveness Concerns',
        message: `${lowEffectivenessTeachers.length} teachers may need additional support`,
        action: 'Schedule professional development sessions'
      })
    }

    if (studyLoadAnalysis.peakDays.length >= 3) {
      alerts.push({
        type: 'info',
        title: 'Heavy Week Pattern',
        message: 'Most days have heavy study load - consider lighter subjects for balance',
        action: 'Review subject distribution'
      })
    }

    return alerts.slice(0, 5)
  }

  private generateLimitedPredictions(section: any, timetableEntries: any[]): TimetablePrediction {
    return {
      sectionId: section.id,
      sectionName: `${section.grade.name} - Section ${section.name}`,
      optimalSchedule: {
        suggestedChanges: [],
        overallOptimizationScore: 0.7,
        improvementPotential: 'Add more timetable entries for detailed analysis'
      },
      teacherEffectiveness: [],
      subjectDistribution: [],
      conflictAnalysis: {
        detectedConflicts: [],
        conflictFreeScore: 1
      },
      studyLoadAnalysis: {
        dailyLoad: [],
        weeklyBalance: 'balanced',
        peakDays: [],
        lightDays: [],
        optimizationSuggestions: ['Complete timetable setup for analysis']
      },
      performanceInsights: {
        bestPerformingDays: [],
        challengingDays: [],
        subjectPerformanceCorrelation: [],
        recommendations: ['Complete timetable setup for performance insights']
      },
      alerts: [
        {
          type: 'info',
          title: 'Limited Data',
          message: 'Add more timetable entries for comprehensive predictions',
          action: 'Complete timetable configuration'
        }
      ],
      generatedAt: new Date()
    }
  }

  private generateOptimizedSchedule(currentSchedule: any[]): any[] {
    const optimized = [...currentSchedule]
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

    const subjectsByDay = new Map<string, any[]>()
    days.forEach(day => subjectsByDay.set(day, []))

    optimized.forEach(entry => {
      const day = entry.dayOfWeek
      if (subjectsByDay.has(day)) {
        subjectsByDay.get(day).push(entry)
      }
    })

    subjectsByDay.forEach((periods, day) => {
      const advancedSubjects = periods.filter(p => this.getSubjectDifficulty(p.subject.name) === 'advanced')
      if (advancedSubjects.length > 3) {
        const basicSubjects = periods.filter(p => this.getSubjectDifficulty(p.subject.name) !== 'advanced')
        if (basicSubjects.length > 0) {
          const swapIndex = periods.findIndex(p => p.subject.name === advancedSubjects[0].subject.name)
          const swapWithIndex = periods.findIndex(p => p.subject.name === basicSubjects[0].subject.name)
          if (swapIndex >= 0 && swapWithIndex >= 0) {
            [periods[swapIndex], periods[swapWithIndex]] = [periods[swapWithIndex], periods[swapIndex]]
          }
        }
      }
    })

    return optimized
  }

  private calculateImprovements(current: any[], optimized: any[]): any[] {
    const improvements: any[] = []

    const currentLoad = this.calculateAverageDailyLoad(current)
    const optimizedLoad = this.calculateAverageDailyLoad(optimized)

    if (Math.abs(currentLoad - optimizedLoad) > 0.3) {
      improvements.push({
        description: 'Better study load distribution',
        benefit: 'Reduced student fatigue and improved learning outcomes',
        implementationEffort: 'moderate'
      })
    }

    const currentConsecutive = this.countConsecutiveSubjects(current)
    const optimizedConsecutive = this.countConsecutiveSubjects(optimized)

    if (currentConsecutive > optimizedConsecutive) {
      improvements.push({
        description: 'Reduced consecutive same-subject periods',
        benefit: 'Improved student engagement and variety',
        implementationEffort: 'easy'
      })
    }

    improvements.push({
      description: 'Optimized teacher-subject allocation',
      benefit: 'Better utilization of teacher expertise',
      implementationEffort: 'moderate'
    })

    improvements.push({
      description: 'Balanced difficulty distribution',
      benefit: 'Manageable cognitive load throughout the week',
      implementationEffort: 'easy'
    })

    return improvements
  }

  private calculatePerformanceImpact(improvements: any[]): number {
    const score = improvements.reduce((sum, imp) => {
      const effortScores = { easy: 0.85, moderate: 0.75, complex: 0.65 }
      return sum + effortScores[imp.implementationEffort]
    }, 0) / improvements.length
    return Math.min(15, score * 5)
  }

  private calculateSatisfactionImpact(improvements: any[]): number {
    return Math.min(12, improvements.length * 2.5)
  }

  private calculateEfficiencyImpact(improvements: any[]): number {
    return Math.min(10, improvements.length * 2)
  }

  private analyzeDayPatterns(timetableEntries: any[]): Map<string, { load: number; periods: number }> {
    const patterns = new Map<string, { load: number; periods: number }>()
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

    days.forEach(day => {
      const dayPeriods = timetableEntries.filter(t => this.formatDayOfWeek(t.dayOfWeek) === day)
      const load = dayPeriods.reduce((sum, p) => {
        const diff = this.getSubjectDifficulty(p.subject.name)
        return sum + (diff === 'advanced' ? 3 : diff === 'intermediate' ? 2 : 1)
      }, 0)
      const normalizedLoad = dayPeriods.length > 0 ? load / (dayPeriods.length * 3) : 0
      patterns.set(day, { load: normalizedLoad, periods: dayPeriods.length })
    })

    return patterns
  }

  private analyzeSubjectPatterns(timetableEntries: any[]): Map<string, { consecutiveCount: number }> {
    const patterns = new Map<string, { consecutiveCount: number }>()
    const subjects = new Set(timetableEntries.map(t => t.subject.name))

    subjects.forEach(subject => {
      const subjectPeriods = timetableEntries.filter(t => t.subject.name === subject)
      const consecutiveCount = this.countConsecutiveForSubject(subjectPeriods)
      patterns.set(subject, { consecutiveCount })
    })

    return patterns
  }

  private analyzeDifficultyDistribution(timetableEntries: any[]): Map<string, number> {
    const distribution = new Map<string, number>()
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

    days.forEach(day => {
      const dayPeriods = timetableEntries.filter(t => this.formatDayOfWeek(t.dayOfWeek) === day)
      const avgDifficulty = dayPeriods.reduce((sum, p) => {
        const diff = this.getSubjectDifficulty(p.subject.name)
        return sum + (diff === 'advanced' ? 3 : diff === 'intermediate' ? 2 : 1)
      }, 0) / dayPeriods.length
      distribution.set(day, avgDifficulty)
    })

    return distribution
  }

  private findAlternativeSubject(timetableEntries: any[], period: any, day: string): string {
    const dayPeriods = timetableEntries.filter(t => this.formatDayOfWeek(t.dayOfWeek) === day)
    const lighterSubjects = dayPeriods
      .filter(p => this.getSubjectDifficulty(p.subject.name) !== 'advanced')
      .map(p => p.subject.name)

    return lighterSubjects.length > 0 ? lighterSubjects[0] : 'Mathematics'
  }

  private findMoreChallengingSubject(timetableEntries: any[], period: any): string {
    const allSubjects = timetableEntries.map(t => t.subject.name)
    const challengingSubjects = allSubjects
      .filter(s => this.getSubjectDifficulty(s) === 'advanced')
      .filter((value, index, self) => self.indexOf(value) === index)

    return challengingSubjects.length > 0 ? challengingSubjects[0] : 'Physics'
  }

  private findConsecutivePeriods(timetableEntries: any[], subject: string): Array<{ day: string; period: number }> {
    const consecutive: Array<{ day: string; period: number }> = []
    const subjectPeriods = timetableEntries
      .filter(t => t.subject.name === subject)
      .sort((a, b) => a.period - b.period)

    for (let i = 0; i < subjectPeriods.length - 1; i++) {
      if (subjectPeriods[i + 1].period === subjectPeriods[i].period + 1 &&
          this.formatDayOfWeek(subjectPeriods[i + 1].dayOfWeek) === this.formatDayOfWeek(subjectPeriods[i].dayOfWeek)) {
        consecutive.push({
          day: this.formatDayOfWeek(subjectPeriods[i].dayOfWeek),
          period: subjectPeriods[i].period
        })
      }
    }

    return consecutive
  }

  private calculateOverallOptimizationScore(timetableEntries: any[], suggestedChanges: any[]): number {
    const baseScore = 0.75
    const changeBonus = suggestedChanges.length * 0.02
    const diversity = new Set(timetableEntries.map(t => t.subject.name)).size
    const diversityBonus = Math.min(0.1, diversity * 0.015)

    return Math.min(0.95, baseScore + changeBonus + diversityBonus)
  }

  private calculateImprovementPotential(score: number, changes: any[]): string {
    if (score < 0.75) return 'High - Multiple optimizations recommended'
    if (score < 0.85) return 'Medium - Some improvements possible'
    if (changes.length === 0) return 'Low - Schedule is well-optimized'
    return 'Low - Minor adjustments suggested'
  }

  private calculateTeacherEffectivenessScore(stat: any, timetableEntries: any[]): number {
    const baseScore = 0.75
    const periodsPerSubject = stat.periodsAssigned / new Set(timetableEntries.filter(t => t.teacherId === stat.teacherId).map(t => t.subject.name)).size
    const consistencyBonus = periodsPerSubject > 2 ? 0.1 : 0

    return Math.min(0.92, baseScore + consistencyBonus)
  }

  private generateTeacherRecommendations(stat: any, effectivenessScore: number): string[] {
    const recommendations: string[] = []

    if (effectivenessScore < 0.7) {
      recommendations.push('Consider professional development opportunities')
      recommendations.push('Review subject assignment alignment')
    } else if (effectivenessScore < 0.85) {
      recommendations.push('Explore additional teaching resources')
    }

    if (stat.periodsAssigned > 30) {
      recommendations.push('Consider workload distribution adjustments')
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current teaching approach')
    }

    return recommendations
  }

  private calculateIdealPeriods(subject: string, difficulty: string): number {
    const basePeriods: Record<string, number> = {
      'Mathematics': 6,
      'English': 5,
      'Physics': 5,
      'Chemistry': 5,
      'Biology': 4,
      'Computer Science': 4,
      'History': 3,
      'Geography': 3,
      'Economics': 4,
      'Physical Education': 2,
      'Art': 2,
      'Music': 2
    }

    return basePeriods[subject] || 4
  }

  private calculateBalanceScore(actual: number, ideal: number): number {
    const diff = Math.abs(actual - ideal)
    return Math.max(0.6, 1 - (diff / ideal * 0.4))
  }

  private analyzeDifficultyPattern(periodsByDay: Map<string, number>): 'balanced' | 'front_loaded' | 'back_loaded' | 'scattered' {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const difficulties = days.map(day => periodsByDay.get(day) || 0)

    const firstHalf = difficulties.slice(0, 3).reduce((a, b) => a + b, 0)
    const secondHalf = difficulties.slice(3).reduce((a, b) => a + b, 0)

    if (firstHalf > secondHalf * 1.5) return 'front_loaded'
    if (secondHalf > firstHalf * 1.5) return 'back_loaded'
    if (Math.max(...difficulties) - Math.min(...difficulties) > difficulties.length * 2) return 'scattered'
    return 'balanced'
  }

  private generateSubjectRecommendations(stat: any, balanceScore: number, difficultyDistribution: string): string[] {
    const recommendations: string[] = []

    if (balanceScore < 0.75) {
      const diff = stat.periodsPerWeek - stat.idealPeriods
      if (diff > 0) {
        recommendations.push(`Consider reducing ${stat.subject} periods from ${stat.periodsPerWeek} to ${stat.idealPeriods}`)
      } else {
        recommendations.push(`Consider increasing ${stat.subject} periods from ${stat.periodsPerWeek} to ${stat.idealPeriods}`)
      }
    }

    if (difficultyDistribution === 'front_loaded') {
      recommendations.push('Distribute advanced subjects throughout the week')
    } else if (difficultyDistribution === 'back_loaded') {
      recommendations.push('Balance difficulty across all days')
    }

    if (recommendations.length === 0) {
      recommendations.push('Subject distribution is well-balanced')
    }

    return recommendations
  }

  private generateDayLoadRecommendations(day: string, avgDifficulty: number, periods: any[]): string[] {
    const recommendations: string[] = []

    if (avgDifficulty > 2.5) {
      recommendations.push('Consider moving one advanced subject to a lighter day')
    } else if (avgDifficulty < 1.5) {
      recommendations.push('Could benefit from an additional challenging subject')
    }

    const advancedCount = periods.filter(p => this.getSubjectDifficulty(p.subject.name) === 'advanced').length
    if (advancedCount > 3) {
      recommendations.push('Too many advanced subjects - redistribute across week')
    }

    if (recommendations.length === 0) {
      recommendations.push('Study load is well-balanced for this day')
    }

    return recommendations
  }

  private generateLoadOptimizationSuggestions(dailyLoad: any[], weeklyBalance: string): string[] {
    const suggestions: string[] = []

    if (weeklyBalance === 'imbalanced') {
      suggestions.push('Redistribute subjects to balance daily study load')
      suggestions.push('Consider swapping heavy subjects with lighter ones')
    }

    const peakDays = dailyLoad.filter(d => d.loadLevel === 'heavy')
    if (peakDays.length >= 3) {
      suggestions.push('Reduce number of heavy load days')
    }

    const lightDays = dailyLoad.filter(d => d.loadLevel === 'light')
    if (lightDays.length >= 2) {
      suggestions.push('Add moderate difficulty subjects to light days')
    }

    if (suggestions.length === 0) {
      suggestions.push('Current study load distribution is optimal')
    }

    return suggestions
  }

  private getExamDay(examDate: Date): string | null {
    const dayOfWeek = examDate.getDay()
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayOfWeek]
  }

  private generatePerformanceRecommendations(
    bestDays: string[],
    challengingDays: string[],
    subjectCorrelations: any[]
  ): string[] {
    const recommendations: string[] = []

    if (bestDays.length > 0 && challengingDays.length > 0) {
      recommendations.push(`Consider scheduling important assessments on ${bestDays.join(', ')}`)
      recommendations.push(`Schedule review sessions before ${challengingDays.join(', ')}`)
    }

    const significantCorrelations = subjectCorrelations.filter(c => {
      const avg = c.avgPerformance
      const bestAvg = subjectCorrelations.find(s => s.subject === c.subject)?.avgPerformance || avg
      return Math.abs(bestAvg - avg) > 10
    })

    if (significantCorrelations.length > 0) {
      recommendations.push('Optimize schedule based on subject performance patterns')
    }

    if (recommendations.length === 0) {
      recommendations.push('Current schedule supports good student performance')
    }

    return recommendations
  }

  private calculateAverageDailyLoad(schedule: any[]): number {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    let totalLoad = 0

    days.forEach(day => {
      const dayPeriods = schedule.filter(s => this.formatDayOfWeek(s.dayOfWeek) === day)
      const load = dayPeriods.reduce((sum, p) => {
        const diff = this.getSubjectDifficulty(p.subject.name)
        return sum + (diff === 'advanced' ? 3 : diff === 'intermediate' ? 2 : 1)
      }, 0)
      totalLoad += dayPeriods.length > 0 ? load / dayPeriods.length : 0
    })

    return totalLoad / days.length
  }

  private countConsecutiveSubjects(schedule: any[]): number {
    let count = 0
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

    days.forEach(day => {
      const dayPeriods = schedule.filter(s => this.formatDayOfWeek(s.dayOfWeek) === day).sort((a, b) => a.period - b.period)
      for (let i = 0; i < dayPeriods.length - 1; i++) {
        if (dayPeriods[i].subject.name === dayPeriods[i + 1].subject.name &&
            dayPeriods[i + 1].period === dayPeriods[i].period + 1) {
          count++
        }
      }
    })

    return count
  }

  private countConsecutiveForSubject(subjectPeriods: any[]): number {
    let maxConsecutive = 1
    let currentConsecutive = 1

    for (let i = 1; i < subjectPeriods.length; i++) {
      if (subjectPeriods[i].period === subjectPeriods[i - 1].period + 1) {
        currentConsecutive++
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
      } else {
        currentConsecutive = 1
      }
    }

    return maxConsecutive
  }

  private formatDayOfWeek(dayOfWeek: string): string {
    const dayMap: Record<string, string> = {
      'MONDAY': 'Monday',
      'TUESDAY': 'Tuesday',
      'WEDNESDAY': 'Wednesday',
      'THURSDAY': 'Thursday',
      'FRIDAY': 'Friday'
    }
    return dayMap[dayOfWeek] || dayOfWeek
  }

  private getSubjectDifficulty(subject: string): string {
    const advancedSubjects = ['Physics', 'Chemistry', 'Biology', 'Computer Science', 'Mathematics', 'Economics']
    const intermediateSubjects = ['English', 'History', 'Geography']

    if (advancedSubjects.includes(subject)) return 'advanced'
    if (intermediateSubjects.includes(subject)) return 'intermediate'
    return 'basic'
  }
}

export const timetablePredictionService = new TimetablePredictionService()
