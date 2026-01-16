import { GeminiClient } from '@/lib/ai/gemini-client'
import type { HostelPrediction } from '@/lib/ai/types'

interface Hostel {
  id: string
  name: string
  type: string
  capacity: number
  currentOccupancy: number
  wardenName?: string
  wardenPhone?: string
  address?: string
}

interface Room {
  id: string
  hostelId: string
  roomNumber: string
  floor: number
  capacity: number
  currentOccupancy: number
  type?: string
  facilities?: string
}

interface Allocation {
  id: string
  hostelId: string
  roomId: string
  studentId: string
  academicYearId: string
  allocationDate: string
  checkoutDate?: string
  fees?: number
  status: string
}

export class HostelPredictionService {
  private geminiClient: GeminiClient

  constructor() {
    this.geminiClient = new GeminiClient('gemini-2.0-flash', { temperature: 0.4 })
  }

  async generatePredictions(hostels: Hostel[], rooms: Room[], allocations: Allocation[]): Promise<HostelPrediction> {
    try {
      const prompt = this.buildPredictionPrompt(hostels, rooms, allocations)
      const response = await this.geminiClient.generateContent(prompt)
      return this.parseResponse(response, hostels, rooms, allocations)
    } catch (error) {
      console.error('Error generating hostel predictions:', error)
      return this.generateFallbackPredictions(hostels, rooms, allocations)
    }
  }

  private buildPredictionPrompt(hostels: Hostel[], rooms: Room[], allocations: Allocation[]): string {
    return `
Analyze the hostel management data and provide AI-powered insights:

HOSTELS (${hostels.length}):
${hostels.map(h => `- ${h.name} (${h.type}): Capacity ${h.capacity}, Occupancy ${h.currentOccupancy}`).join('\n')}

ROOMS (${rooms.length}):
${rooms.slice(0, 20).map(r => `- ${r.roomNumber}: Floor ${r.floor}, Capacity ${r.capacity}, Occupancy ${r.currentOccupancy}`).join('\n')}

ALLOCATIONS (${allocations.length}):
${allocations.slice(0, 20).map(a => `- Student ${a.studentId}: ${a.status}, Fees: ${a.fees || 0}`).join('\n')}

Provide insights in the following JSON format:
{
  "overallHealth": {
    "score": 0-1,
    "status": "excellent|good|fair|poor",
    "totalHostels": number,
    "totalRooms": number,
    "totalCapacity": number,
    "currentOccupancy": number,
    "occupancyRate": number,
    "monthlyRevenue": number
  },
  "popularHostels": [
    {
      "id": "hostel_id",
      "name": "hostel_name",
      "type": "Boys|Girls|Staff",
      "occupancyRate": number,
      "demand": "high|medium|low",
      "recommendation": "actionable_recommendation"
    }
  ],
  "occupancyForecast": {
    "current": number,
    "projected": number,
    "trend": "increasing|stable|decreasing",
    "nextMonthOccupancy": number,
    "peakSeason": "optional_season_name"
  },
  "feeCollection": {
    "totalRevenue": number,
    "collectedAmount": number,
    "pendingAmount": number,
    "collectionRate": number,
    "defaultRisk": "low|medium|high"
  },
  "roomUtilization": {
    "mostUtilized": [
      {
        "roomNumber": "room_number",
        "occupancyRate": number,
        "hostel": "hostel_name"
      }
    ],
    "leastUtilized": [
      {
        "roomNumber": "room_number",
        "occupancyRate": number,
        "hostel": "hostel_name"
      }
    ],
    "floorPreferences": {
      "1": 0.5,
      "2": 0.3,
      "3": 0.2
    }
  },
  "capacityAlerts": [
    {
      "type": "warning|critical|info",
      "hostelId": "hostel_id",
      "hostelName": "hostel_name",
      "message": "alert_message",
      "action": "recommended_action",
      "priority": "low|medium|high"
    }
  ],
  "genderDistribution": {
    "maleCount": number,
    "femaleCount": number,
    "balance": "balanced|imbalanced",
    "recommendation": "actionable_recommendation"
  },
  "actionableInsights": [
    {
      "category": "category_name",
      "insight": "insight_description",
      "impact": "high|medium|low",
      "effort": "low|medium|high"
    }
  ],
  "alerts": [
    {
      "type": "urgent|warning|info",
      "title": "alert_title",
      "message": "alert_message",
      "action": "optional_action",
      "priority": "high|medium|low"
    }
  ],
  "insights": {
    "keyHighlights": ["highlight1", "highlight2"],
    "opportunities": ["opportunity1", "opportunity2"],
    "priorities": [
      {
        "title": "priority_title",
        "urgency": "high|medium|low",
        "impact": "high|medium|low"
      }
    ]
  }
}

Focus on:
- Occupancy optimization and space utilization
- Revenue generation and fee collection efficiency
- Capacity planning and expansion needs
- Gender balance and allocation fairness
- Actionable recommendations for improvement
`
  }

  private parseResponse(response: string, hostels: Hostel[], rooms: Room[], allocations: Allocation[]): HostelPrediction {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      const parsed = JSON.parse(jsonMatch[0])
      return {
        ...parsed,
        generatedAt: new Date()
      }
    } catch (error) {
      console.error('Error parsing AI response:', error)
      return this.generateFallbackPredictions(hostels, rooms, allocations)
    }
  }

  private generateFallbackPredictions(hostels: Hostel[], rooms: Room[], allocations: Allocation[]): HostelPrediction {
    const overallHealth = this.getOverallHealth(hostels, allocations)
    const popularHostels = this.getPopularHostels(hostels, allocations)
    const occupancyForecast = this.getOccupancyForecast(allocations)
    const feeCollection = this.getFeeCollection(allocations)
    const roomUtilization = this.getRoomUtilization(rooms, allocations)
    const capacityAlerts = this.getCapacityAlerts(hostels, rooms, allocations)
    const genderDistribution = this.getGenderDistribution(hostels, allocations)
    const actionableInsights = this.getActionableInsights(hostels, rooms, allocations)
    const alerts = this.getAlerts(hostels, rooms, allocations)
    const insights = this.getInsights(hostels, rooms, allocations)

    return {
      overallHealth,
      popularHostels,
      occupancyForecast,
      feeCollection,
      roomUtilization,
      capacityAlerts,
      genderDistribution,
      actionableInsights,
      alerts,
      insights,
      generatedAt: new Date()
    }
  }

  private getOverallHealth(hostels: Hostel[], allocations: Allocation[]): HostelPrediction['overallHealth'] {
    if (!hostels || hostels.length === 0) {
      return {
        score: 0,
        status: 'poor',
        totalHostels: 0,
        totalRooms: 0,
        totalCapacity: 0,
        currentOccupancy: 0,
        occupancyRate: 0,
        monthlyRevenue: 0
      }
    }

    const totalHostels = hostels.length
    const totalCapacity = hostels.reduce((sum, h) => sum + h.capacity, 0)
    const currentOccupancy = hostels.reduce((sum, h) => sum + h.currentOccupancy, 0)
    const occupancyRate = totalCapacity > 0 ? currentOccupancy / totalCapacity : 0
    const monthlyRevenue = (allocations || []).reduce((sum, a) => sum + (a.fees || 0), 0)

    let score = 0
    if (occupancyRate >= 0.7 && occupancyRate <= 0.9) score += 0.4
    else if (occupancyRate >= 0.5 && occupancyRate < 0.7) score += 0.3
    else if (occupancyRate > 0.9) score += 0.2
    else score += 0.1

    const activeAllocations = (allocations || []).filter(a => a.status === 'Active').length
    const collectionRate = activeAllocations > 0 ? (allocations || []).filter(a => a.fees && a.fees > 0).length / activeAllocations : 0
    score += collectionRate * 0.3

    const avgOccupancy = hostels.reduce((sum, h) => sum + (h.capacity > 0 ? h.currentOccupancy / h.capacity : 0), 0) / totalHostels
    score += avgOccupancy * 0.3

    let status: 'excellent' | 'good' | 'fair' | 'poor'
    if (score >= 0.8) status = 'excellent'
    else if (score >= 0.6) status = 'good'
    else if (score >= 0.4) status = 'fair'
    else status = 'poor'

    return {
      score,
      status,
      totalHostels,
      totalRooms: 0,
      totalCapacity,
      currentOccupancy,
      occupancyRate: Math.round(occupancyRate * 100),
      monthlyRevenue
    }
  }

  private getPopularHostels(hostels: Hostel[], allocations: Allocation[]): HostelPrediction['popularHostels'] {
    if (!hostels || hostels.length === 0) {
      return []
    }

    const hostelOccupancy = hostels
      .map(h => ({
        id: h.id,
        name: h.name,
        type: h.type,
        occupancyRate: h.capacity > 0 ? h.currentOccupancy / h.capacity : 0
      }))
      .sort((a, b) => b.occupancyRate - a.occupancyRate)
      .slice(0, 5)

    return hostelOccupancy.map(h => {
      let demand: 'high' | 'medium' | 'low'
      if (h.occupancyRate >= 0.8) demand = 'high'
      else if (h.occupancyRate >= 0.5) demand = 'medium'
      else demand = 'low'

      let recommendation = 'Monitor occupancy trends'
      if (demand === 'high') recommendation = 'Consider expansion to meet demand'
      else if (demand === 'low') recommendation = 'Review amenities to increase attractiveness'

      return {
        id: h.id,
        name: h.name,
        type: h.type,
        occupancyRate: Math.round(h.occupancyRate * 100),
        demand,
        recommendation
      }
    })
  }

  private getOccupancyForecast(allocations: Allocation[]): HostelPrediction['occupancyForecast'] {
    if (!allocations || allocations.length === 0) {
      return {
        current: 0,
        projected: 0,
        trend: 'stable',
        nextMonthOccupancy: 0
      }
    }

    const current = allocations.filter(a => a.status === 'Active').length
    const recentAllocations = allocations.filter(a => {
      const allocationDate = new Date(a.allocationDate)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return allocationDate >= thirtyDaysAgo && a.status === 'Active'
    }).length

    const monthlyAllocationRate = recentAllocations
    const projected = current + Math.round(monthlyAllocationRate * 0.8)

    let trend: 'increasing' | 'stable' | 'decreasing'
    if (monthlyAllocationRate > current * 0.1) trend = 'increasing'
    else if (monthlyAllocationRate < -current * 0.1) trend = 'decreasing'
    else trend = 'stable'

    const nextMonthOccupancy = Math.round(projected * 1.05)

    return {
      current,
      projected,
      trend,
      nextMonthOccupancy,
      peakSeason: trend === 'increasing' ? 'Admission period' : undefined
    }
  }

  private getFeeCollection(allocations: Allocation[]): HostelPrediction['feeCollection'] {
    if (!allocations || allocations.length === 0) {
      return {
        totalRevenue: 0,
        collectedAmount: 0,
        pendingAmount: 0,
        collectionRate: 0,
        defaultRisk: 'low'
      }
    }

    const activeAllocations = allocations.filter(a => a.status === 'Active')
    const totalRevenue = activeAllocations.reduce((sum, a) => sum + (a.fees || 0), 0)
    const collectedAmount = activeAllocations.filter(a => a.fees && a.fees > 0).reduce((sum, a) => sum + a.fees, 0)
    const pendingAmount = totalRevenue - collectedAmount
    const collectionRate = totalRevenue > 0 ? collectedAmount / totalRevenue : 0

    let defaultRisk: 'low' | 'medium' | 'high'
    if (collectionRate >= 0.9) defaultRisk = 'low'
    else if (collectionRate >= 0.7) defaultRisk = 'medium'
    else defaultRisk = 'high'

    return {
      totalRevenue,
      collectedAmount,
      pendingAmount,
      collectionRate: Math.round(collectionRate * 100),
      defaultRisk
    }
  }

  private getRoomUtilization(rooms: Room[], allocations: Allocation[]): HostelPrediction['roomUtilization'] {
    if (!rooms || rooms.length === 0) {
      return {
        mostUtilized: [],
        leastUtilized: [],
        floorPreferences: {}
      }
    }

    const roomOccupancy = rooms.map(r => ({
      roomNumber: r.roomNumber,
      occupancyRate: r.capacity > 0 ? r.currentOccupancy / r.capacity : 0,
      hostel: '',
      floor: r.floor
    }))

    const hostelMap = new Map<string, string>()
    rooms.forEach(r => hostelMap.set(r.id, r.hostelId))
    roomOccupancy.forEach(r => r.hostel = hostelMap.get(r.hostelId) || '')

    const sortedByOccupancy = [...roomOccupancy].sort((a, b) => b.occupancyRate - a.occupancyRate)
    const mostUtilized = sortedByOccupancy.slice(0, 5).map(r => ({
      roomNumber: r.roomNumber,
      occupancyRate: Math.round(r.occupancyRate * 100),
      hostel: r.hostel
    }))
    const leastUtilized = sortedByOccupancy.slice(-5).reverse().map(r => ({
      roomNumber: r.roomNumber,
      occupancyRate: Math.round(r.occupancyRate * 100),
      hostel: r.hostel
    }))

    const floorPreferences: Record<number, number> = {}
    rooms.forEach(r => {
      if (r.capacity > 0) {
        const floorOccupancy = r.currentOccupancy / r.capacity
        floorPreferences[r.floor] = (floorPreferences[r.floor] || 0) + floorOccupancy
      }
    })

    const totalFloorOccupancy = Object.values(floorPreferences).reduce((sum, val) => sum + val, 0)
    Object.keys(floorPreferences).forEach(floor => {
      const floorNum = parseInt(floor)
      floorPreferences[floorNum] = totalFloorOccupancy > 0 ? Math.round((floorPreferences[floorNum] / totalFloorOccupancy) * 100) : 0
    })

    return {
      mostUtilized,
      leastUtilized,
      floorPreferences
    }
  }

  private getCapacityAlerts(hostels: Hostel[], rooms: Room[], allocations: Allocation[]): HostelPrediction['capacityAlerts'] {
    const alerts: HostelPrediction['capacityAlerts'] = []

    if (!hostels || hostels.length === 0) {
      return alerts
    }

    hostels.forEach(h => {
      const occupancyRate = h.capacity > 0 ? h.currentOccupancy / h.capacity : 0

      if (occupancyRate >= 0.95) {
        alerts.push({
          type: 'critical',
          hostelId: h.id,
          hostelName: h.name,
          message: `${h.name} is at critical capacity (${Math.round(occupancyRate * 100)}%)`,
          action: 'Immediate capacity expansion required',
          priority: 'high'
        })
      } else if (occupancyRate >= 0.8) {
        alerts.push({
          type: 'warning',
          hostelId: h.id,
          hostelName: h.name,
          message: `${h.name} approaching capacity (${Math.round(occupancyRate * 100)}%)`,
          action: 'Plan for additional rooms or hostel',
          priority: 'medium'
        })
      } else if (occupancyRate <= 0.3 && h.capacity > 10) {
        alerts.push({
          type: 'info',
          hostelId: h.id,
          hostelName: h.name,
          message: `${h.name} has low occupancy (${Math.round(occupancyRate * 100)}%)`,
          action: 'Review amenities and marketing',
          priority: 'low'
        })
      }
    })

    return alerts.slice(0, 5)
  }

  private getGenderDistribution(hostels: Hostel[], allocations: Allocation[]): HostelPrediction['genderDistribution'] {
    if (!hostels || hostels.length === 0 || !allocations || allocations.length === 0) {
      return {
        maleCount: 0,
        femaleCount: 0,
        balance: 'balanced',
        recommendation: 'No gender data available'
      }
    }

    const maleHostelIds = hostels.filter(h => h.type === 'Boys').map(h => h.id)
    const femaleHostelIds = hostels.filter(h => h.type === 'Girls').map(h => h.id)

    const maleCount = allocations.filter(a => maleHostelIds.includes(a.hostelId) && a.status === 'Active').length
    const femaleCount = allocations.filter(a => femaleHostelIds.includes(a.hostelId) && a.status === 'Active').length

    const total = maleCount + femaleCount
    const balance: 'balanced' | 'imbalanced' = total === 0 ? 'balanced' : Math.abs(maleCount - femaleCount) / total <= 0.1 ? 'balanced' : 'imbalanced'

    let recommendation = 'Gender distribution is well balanced'
    if (balance === 'imbalanced') {
      if (maleCount > femaleCount) recommendation = 'Consider promoting girls hostel facilities'
      else recommendation = 'Consider promoting boys hostel facilities'
    }

    return {
      maleCount,
      femaleCount,
      balance,
      recommendation
    }
  }

  private getActionableInsights(hostels: Hostel[], rooms: Room[], allocations: Allocation[]): HostelPrediction['actionableInsights'] {
    const insights: HostelPrediction['actionableInsights'] = []

    if (!hostels || hostels.length === 0) {
      return insights
    }

    const overallHealth = this.getOverallHealth(hostels, allocations)

    if (overallHealth.occupancyRate < 70) {
      insights.push({
        category: 'Occupancy',
        insight: 'Improve occupancy by enhancing hostel amenities and services',
        impact: 'high',
        effort: 'medium'
      })
    }

    const feeCollection = this.getFeeCollection(allocations)
    if (feeCollection.collectionRate < 90) {
      insights.push({
        category: 'Revenue',
        insight: 'Implement automated fee reminders to improve collection rate',
        impact: 'high',
        effort: 'low'
      })
    }

    const roomUtilization = this.getRoomUtilization(rooms, allocations)
    if (roomUtilization.leastUtilized.length > 0) {
      insights.push({
        category: 'Space',
        insight: 'Reallocate underutilized rooms to optimize space efficiency',
        impact: 'medium',
        effort: 'low'
      })
    }

    const genderDistribution = this.getGenderDistribution(hostels, allocations)
    if (genderDistribution.balance === 'imbalanced') {
      insights.push({
        category: 'Balance',
        insight: genderDistribution.recommendation,
        impact: 'medium',
        effort: 'medium'
      })
    }

    insights.push({
      category: 'Maintenance',
      insight: 'Schedule regular maintenance to prevent infrastructure issues',
      impact: 'medium',
      effort: 'medium'
    })

    return insights.slice(0, 5)
  }

  private getAlerts(hostels: Hostel[], rooms: Room[], allocations: Allocation[]): HostelPrediction['alerts'] {
    const alerts: HostelPrediction['alerts'] = []

    const capacityAlerts = this.getCapacityAlerts(hostels, rooms, allocations)
    capacityAlerts.forEach(alert => {
      alerts.push({
        type: alert.type === 'critical' ? 'urgent' : alert.type === 'warning' ? 'warning' : 'info',
        title: `${alert.hostelName} Capacity Alert`,
        message: alert.message,
        action: alert.action,
        priority: alert.priority
      })
    })

    const feeCollection = this.getFeeCollection(allocations)
    if (feeCollection.defaultRisk === 'high') {
      alerts.push({
        type: 'urgent',
        title: 'Fee Collection Risk',
        message: 'High default risk detected in fee collection',
        action: 'Initiate payment recovery process',
        priority: 'high'
      })
    } else if (feeCollection.defaultRisk === 'medium') {
      alerts.push({
        type: 'warning',
        title: 'Fee Collection Alert',
        message: 'Some pending fees require attention',
        action: 'Send payment reminders',
        priority: 'medium'
      })
    }

    const genderDistribution = this.getGenderDistribution(hostels, allocations)
    if (genderDistribution.balance === 'imbalanced') {
      alerts.push({
        type: 'info',
        title: 'Gender Imbalance',
        message: 'Gender distribution needs attention',
        action: genderDistribution.recommendation,
        priority: 'low'
      })
    }

    return alerts.slice(0, 5)
  }

  private getInsights(hostels: Hostel[], rooms: Room[], allocations: Allocation[]): HostelPrediction['insights'] {
    const overallHealth = this.getOverallHealth(hostels, allocations)
    const popularHostels = this.getPopularHostels(hostels, allocations)
    const feeCollection = this.getFeeCollection(allocations)

    const keyHighlights: string[] = []
    if (overallHealth.occupancyRate > 0) {
      keyHighlights.push(`Overall occupancy at ${overallHealth.occupancyRate}%`)
    }
    if (feeCollection.collectionRate > 0) {
      keyHighlights.push(`Fee collection rate at ${feeCollection.collectionRate}%`)
    }
    if (popularHostels.length > 0) {
      keyHighlights.push(`${popularHostels[0].name} is the most popular hostel`)
    }

    const opportunities: string[] = []
    if (overallHealth.occupancyRate < 85) {
      opportunities.push('Increase occupancy through marketing and amenities improvement')
    }
    if (feeCollection.collectionRate < 95) {
      opportunities.push('Improve fee collection with automated reminders')
    }
    opportunities.push('Optimize room allocation for better space utilization')

    const priorities: Array<{ title: string; urgency: 'high' | 'medium' | 'low'; impact: 'high' | 'medium' | 'low' }> = []

    if (overallHealth.occupancyRate >= 90) {
      priorities.push({
        title: 'Expand hostel capacity',
        urgency: 'high',
        impact: 'high'
      })
    }

    if (feeCollection.defaultRisk === 'high') {
      priorities.push({
        title: 'Recover pending fees',
        urgency: 'high',
        impact: 'high'
      })
    }

    priorities.push({
      title: 'Improve hostel amenities',
      urgency: 'medium',
      impact: 'medium'
    })

    priorities.push({
      title: 'Optimize room allocation',
      urgency: 'medium',
      impact: 'medium'
    })

    return {
      keyHighlights: keyHighlights.slice(0, 3),
      opportunities: opportunities.slice(0, 3),
      priorities: priorities.slice(0, 3)
    }
  }
}
