import { NextResponse } from 'next/server'
import { HostelPredictionService } from '@/lib/ai/services/hostel-predictions'
import { HostelPrediction } from '@/lib/ai/types'
import { fetchAPI } from '@/lib/api/client'

function generateFallbackPredictions(hostels: any[], rooms: any[], allocations: any[]): HostelPrediction {
  const totalHostels = hostels.length
  const totalCapacity = hostels.reduce((sum, h) => sum + (h.capacity || 0), 0)
  const currentOccupancy = hostels.reduce((sum, h) => sum + (h.currentOccupancy || h.current_occupancy || 0), 0)
  const occupancyRate = totalCapacity > 0 ? currentOccupancy / totalCapacity : 0
  const monthlyRevenue = allocations.reduce((sum, a) => sum + (a.fees || 0), 0)

  let healthScore = 0
  if (occupancyRate >= 0.7 && occupancyRate <= 0.9) healthScore += 0.4
  else if (occupancyRate >= 0.5 && occupancyRate < 0.7) healthScore += 0.3
  else if (occupancyRate > 0.9) healthScore += 0.2
  else healthScore += 0.1

  const activeAllocations = allocations.filter(a => a.status === 'Active' || a.status === 'active').length
  const collectionRate = activeAllocations > 0 ? allocations.filter(a => a.fees && a.fees > 0).length / activeAllocations : 0
  healthScore += collectionRate * 0.3

  const avgOccupancy = totalHostels > 0 ? hostels.reduce((sum, h) => sum + ((h.capacity || 0) > 0 ? (h.currentOccupancy || h.current_occupancy || 0) / (h.capacity || 1) : 0), 0) / totalHostels : 0
  healthScore += avgOccupancy * 0.3

  let healthStatus: 'excellent' | 'good' | 'fair' | 'poor' = 'good'
  if (healthScore >= 0.8) healthStatus = 'excellent'
  else if (healthScore >= 0.6) healthStatus = 'good'
  else if (healthScore >= 0.4) healthStatus = 'fair'
  else healthStatus = 'poor'

  const hostelOccupancy = hostels
    .map(h => ({
      id: h.id,
      name: h.name,
      type: h.type,
      occupancyRate: (h.capacity || 1) > 0 ? (h.currentOccupancy || h.current_occupancy || 0) / (h.capacity || 1) : 0
    }))
    .sort((a, b) => b.occupancyRate - a.occupancyRate)

  const popularHostels = hostelOccupancy.slice(0, 5).map(h => {
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

  const current = allocations.filter(a => a.status === 'Active' || a.status === 'active').length
  const recentAllocations = allocations.filter(a => {
    const allocationDate = new Date(a.allocationDate || a.allocation_date || a.created_at || a.createdAt)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return allocationDate >= thirtyDaysAgo && (a.status === 'Active' || a.status === 'active')
  }).length

  const projected = current + Math.round(recentAllocations * 0.8)

  let trend: 'increasing' | 'stable' | 'decreasing'
  if (recentAllocations > current * 0.1) trend = 'increasing'
  else if (recentAllocations < -current * 0.1) trend = 'decreasing'
  else trend = 'stable'

  const activeAllocationsList = allocations.filter(a => a.status === 'Active' || a.status === 'active')
  const totalRevenue = activeAllocationsList.reduce((sum, a) => sum + (a.fees || 0), 0)
  const collectedAmount = activeAllocationsList.filter(a => a.fees && a.fees > 0).reduce((sum, a) => sum + a.fees, 0)
  const pendingAmount = totalRevenue - collectedAmount
  const feeCollectionRate = totalRevenue > 0 ? collectedAmount / totalRevenue : 0

  let defaultRisk: 'low' | 'medium' | 'high'
  if (feeCollectionRate >= 0.9) defaultRisk = 'low'
  else if (feeCollectionRate >= 0.7) defaultRisk = 'medium'
  else defaultRisk = 'high'

  const roomOccupancy = rooms.map(r => {
    const hostel = hostels.find(h => h.id === (r.hostelId || r.hostel || r.hostel_id))
    return {
      roomNumber: r.roomNumber || r.room_number,
      occupancyRate: (r.capacity || 1) > 0 ? (r.currentOccupancy || r.current_occupancy || 0) / (r.capacity || 1) : 0,
      hostel: hostel?.name || '',
      floor: r.floor
    }
  })

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
    if ((r.capacity || 0) > 0) {
      const floorOccupancy = (r.currentOccupancy || r.current_occupancy || 0) / (r.capacity || 1)
      floorPreferences[r.floor] = (floorPreferences[r.floor] || 0) + floorOccupancy
    }
  })

  const totalFloorOccupancy = Object.values(floorPreferences).reduce((sum, val) => sum + val, 0)
  Object.keys(floorPreferences).forEach(floor => {
    const floorNum = parseInt(floor)
    floorPreferences[floorNum] = totalFloorOccupancy > 0 ? Math.round((floorPreferences[floorNum] / totalFloorOccupancy) * 100) : 0
  })

  const capacityAlerts: HostelPrediction['capacityAlerts'] = []
  hostels.forEach(h => {
    const occRate = (h.capacity || 1) > 0 ? (h.currentOccupancy || h.current_occupancy || 0) / (h.capacity || 1) : 0

    if (occRate >= 0.95) {
      capacityAlerts.push({
        type: 'critical',
        hostelId: h.id,
        hostelName: h.name,
        message: `${h.name} is at critical capacity (${Math.round(occRate * 100)}%)`,
        action: 'Immediate capacity expansion required',
        priority: 'high'
      })
    } else if (occRate >= 0.8) {
      capacityAlerts.push({
        type: 'warning',
        hostelId: h.id,
        hostelName: h.name,
        message: `${h.name} approaching capacity (${Math.round(occRate * 100)}%)`,
        action: 'Plan for additional rooms or hostel',
        priority: 'medium'
      })
    } else if (occRate <= 0.3 && (h.capacity || 0) > 10) {
      capacityAlerts.push({
        type: 'info',
        hostelId: h.id,
        hostelName: h.name,
        message: `${h.name} has low occupancy (${Math.round(occRate * 100)}%)`,
        action: 'Review amenities and marketing',
        priority: 'low'
      })
    }
  })

  const maleHostelIds = hostels.filter(h => h.type === 'Boys').map(h => h.id)
  const femaleHostelIds = hostels.filter(h => h.type === 'Girls').map(h => h.id)

  const maleCount = allocations.filter(a => maleHostelIds.includes((a.hostelId || a.hostel || a.hostel_id)) && (a.status === 'Active' || a.status === 'active')).length
  const femaleCount = allocations.filter(a => femaleHostelIds.includes((a.hostelId || a.hostel || a.hostel_id)) && (a.status === 'Active' || a.status === 'active')).length

  const totalStudents = maleCount + femaleCount
  const balance: 'balanced' | 'imbalanced' = totalStudents === 0 ? 'balanced' : Math.abs(maleCount - femaleCount) / totalStudents <= 0.1 ? 'balanced' : 'imbalanced'

  let genderRecommendation = 'Gender distribution is well balanced'
  if (balance === 'imbalanced') {
    if (maleCount > femaleCount) genderRecommendation = 'Consider promoting girls hostel facilities'
    else genderRecommendation = 'Consider promoting boys hostel facilities'
  }

  const alerts: HostelPrediction['alerts'] = []
  capacityAlerts.forEach(alert => {
    alerts.push({
      type: alert.type === 'critical' ? 'urgent' : alert.type === 'warning' ? 'warning' : 'info',
      title: `${alert.hostelName} Capacity Alert`,
      message: alert.message,
      action: alert.action,
      priority: alert.priority
    })
  })

  if (defaultRisk === 'high') {
    alerts.push({
      type: 'urgent',
      title: 'Fee Collection Risk',
      message: 'High default risk detected in fee collection',
      action: 'Initiate payment recovery process',
      priority: 'high'
    })
  } else if (defaultRisk === 'medium') {
    alerts.push({
      type: 'warning',
      title: 'Fee Collection Alert',
      message: 'Some pending fees require attention',
      action: 'Send payment reminders',
      priority: 'medium'
    })
  }

  if (balance === 'imbalanced') {
    alerts.push({
      type: 'info',
      title: 'Gender Imbalance',
      message: 'Gender distribution needs attention',
      action: genderRecommendation,
      priority: 'low'
    })
  }

  const actionableInsights: HostelPrediction['actionableInsights'] = []
  if (occupancyRate < 0.7) {
    actionableInsights.push({
      category: 'Occupancy',
      insight: 'Improve occupancy by enhancing hostel amenities and services',
      impact: 'high',
      effort: 'medium'
    })
  }

  if (feeCollectionRate < 0.9) {
    actionableInsights.push({
      category: 'Revenue',
      insight: 'Implement automated fee reminders to improve collection rate',
      impact: 'high',
      effort: 'low'
    })
  }

  if (leastUtilized.length > 0) {
    actionableInsights.push({
      category: 'Space',
      insight: 'Reallocate underutilized rooms to optimize space efficiency',
      impact: 'medium',
      effort: 'low'
    })
  }

  if (balance === 'imbalanced') {
    actionableInsights.push({
      category: 'Balance',
      insight: genderRecommendation,
      impact: 'medium',
      effort: 'medium'
    })
  }

  actionableInsights.push({
    category: 'Maintenance',
    insight: 'Schedule regular maintenance to prevent infrastructure issues',
    impact: 'medium',
    effort: 'medium'
  })

  const keyHighlights: string[] = []
  if (occupancyRate > 0) {
    keyHighlights.push(`Overall occupancy at ${Math.round(occupancyRate * 100)}%`)
  }
  if (feeCollectionRate > 0) {
    keyHighlights.push(`Fee collection rate at ${Math.round(feeCollectionRate * 100)}%`)
  }
  if (popularHostels.length > 0) {
    keyHighlights.push(`${popularHostels[0].name} is the most popular hostel`)
  }

  const opportunities: string[] = []
  if (occupancyRate < 0.85) {
    opportunities.push('Increase occupancy through marketing and amenities improvement')
  }
  if (feeCollectionRate < 0.95) {
    opportunities.push('Improve fee collection with automated reminders')
  }
  opportunities.push('Optimize room allocation for better space utilization')

  const priorities: Array<{ title: string; urgency: 'high' | 'medium' | 'low'; impact: 'high' | 'medium' | 'low' }> = []

  if (occupancyRate >= 0.9) {
    priorities.push({
      title: 'Expand hostel capacity',
      urgency: 'high',
      impact: 'high'
    })
  }

  if (defaultRisk === 'high') {
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
    overallHealth: {
      score: healthScore,
      status: healthStatus,
      totalHostels,
      totalRooms: rooms.length,
      totalCapacity,
      currentOccupancy,
      occupancyRate: Math.round(occupancyRate * 100),
      monthlyRevenue
    },
    popularHostels,
    occupancyForecast: {
      current,
      projected,
      trend,
      nextMonthOccupancy: Math.round(projected * 1.05),
      peakSeason: trend === 'increasing' ? 'Admission period' : undefined
    },
    feeCollection: {
      totalRevenue,
      collectedAmount,
      pendingAmount,
      collectionRate: Math.round(feeCollectionRate * 100),
      defaultRisk
    },
    roomUtilization: {
      mostUtilized,
      leastUtilized,
      floorPreferences
    },
    capacityAlerts,
    genderDistribution: {
      maleCount,
      femaleCount,
      balance,
      recommendation: genderRecommendation
    },
    actionableInsights: actionableInsights.slice(0, 5),
    alerts: alerts.slice(0, 5),
    insights: {
      keyHighlights: keyHighlights.slice(0, 3),
      opportunities: opportunities.slice(0, 3),
      priorities: priorities.slice(0, 3)
    },
    generatedAt: new Date()
  }
}

export async function GET() {
  try {
    // Fetch data from Django backend API
    const [hostelsResponse, roomsResponse, allocationsResponse] = await Promise.all([
      fetchAPI<{ results: any[] }>('/hostels/'),
      fetchAPI<{ results: any[] }>('/hostels/rooms/'),
      fetchAPI<{ results: any[] }>('/hostels/allocations/')
    ])

    const hostels = hostelsResponse.results || []
    const rooms = roomsResponse.results || []
    const allocations = allocationsResponse.results || []

    // Filter recent allocations (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentAllocations = allocations.filter(a => {
      const allocationDate = new Date(a.allocationDate || a.allocation_date || a.created_at || a.createdAt)
      return allocationDate >= thirtyDaysAgo
    })

    const hostelData = {
      hostels: hostels.map(hostel => ({
        id: hostel.id,
        name: hostel.name,
        type: hostel.type,
        capacity: hostel.capacity || 0,
        currentOccupancy: hostel.currentOccupancy || hostel.current_occupancy || 0,
        wardenName: hostel.wardenName || hostel.warden_name,
        wardenPhone: hostel.wardenPhone || hostel.warden_phone,
        address: hostel.address
      })),
      rooms: rooms.map(room => ({
        id: room.id,
        hostelId: room.hostel || room.hostelId || room.hostel_id,
        roomNumber: room.roomNumber || room.room_number,
        floor: room.floor,
        capacity: room.capacity || 0,
        currentOccupancy: room.currentOccupancy || room.current_occupancy || 0,
        type: room.type,
        facilities: room.facilities
      })),
      allocations: recentAllocations.map(allocation => ({
        id: allocation.id,
        hostelId: allocation.hostel || allocation.hostelId || allocation.hostel_id,
        roomId: allocation.room || allocation.roomId || allocation.room_id,
        studentId: allocation.student || allocation.studentId || allocation.student_id,
        academicYearId: allocation.academicYear || allocation.academicYearId || allocation.academic_year_id,
        allocationDate: allocation.allocationDate || allocation.allocation_date || allocation.created_at,
        checkoutDate: allocation.checkoutDate || allocation.checkout_date,
        fees: allocation.fees || 0,
        status: allocation.status || 'Active'
      }))
    }

    const predictionService = new HostelPredictionService()
    const predictions = await predictionService.generatePredictions(hostelData.hostels, hostelData.rooms, hostelData.allocations)

    return NextResponse.json(predictions)
  } catch (error) {
    console.error('[HOSTEL_PREDICTIONS_GET]', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      console.log('[HOSTEL_PREDICTIONS_GET] Using fallback predictions due to API quota limit')

      // Try to fetch basic data from backend for fallback
      try {
        const [hostelsResponse, roomsResponse, allocationsResponse] = await Promise.all([
          fetchAPI<{ results: any[] }>('/hostels/'),
          fetchAPI<{ results: any[] }>('/hostels/rooms/'),
          fetchAPI<{ results: any[] }>('/hostels/allocations/')
        ])

        const hostels = (hostelsResponse.results || []).map(h => ({
          id: h.id,
          name: h.name,
          type: h.type,
          capacity: h.capacity || 0,
          currentOccupancy: h.currentOccupancy || h.current_occupancy || 0
        }))

        const rooms = (roomsResponse.results || []).map(r => ({
          id: r.id,
          hostelId: r.hostel || r.hostelId || r.hostel_id,
          roomNumber: r.roomNumber || r.room_number,
          floor: r.floor,
          capacity: r.capacity || 0,
          currentOccupancy: r.currentOccupancy || r.current_occupancy || 0,
          type: r.type,
          facilities: r.facilities
        }))

        const allocations = (allocationsResponse.results || []).map(a => ({
          id: a.id,
          hostelId: a.hostel || a.hostelId || a.hostel_id,
          roomId: a.room || a.roomId || a.room_id,
          studentId: a.student || a.studentId || a.student_id,
          allocationDate: a.allocationDate || a.allocation_date || a.created_at,
          fees: a.fees || 0,
          status: a.status || 'Active'
        }))

        const fallbackPredictions = generateFallbackPredictions(hostels, rooms, allocations)

        return NextResponse.json(fallbackPredictions)
      } catch (fallbackError) {
        console.error('[HOSTEL_PREDICTIONS_GET] Fallback also failed:', fallbackError)
        return NextResponse.json(generateFallbackPredictions([], [], []))
      }
    }

    return new NextResponse(JSON.stringify({ error: 'Internal Error', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
