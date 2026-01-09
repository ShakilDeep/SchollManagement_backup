import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedInventoryData() {
  console.log('Start seeding inventory data...')

  try {
    const assets = [
      {
        assetCode: 'ASSET-001',
        name: 'Smart Board - Interactive Display',
        category: 'Teaching Equipment',
        description: '65-inch interactive whiteboard for classroom use',
        serialNumber: 'SB-2024-001',
        purchaseDate: new Date('2024-01-15'),
        purchasePrice: 2500,
        currentValue: 2250,
        condition: 'Good',
        location: 'Building A, Room 101',
        status: 'Available',
      },
      {
        assetCode: 'ASSET-002',
        name: 'Desktop Computer',
        category: 'IT Equipment',
        description: 'Dell OptiPlex desktop computer',
        serialNumber: 'DELL-2024-002',
        purchaseDate: new Date('2024-02-01'),
        purchasePrice: 800,
        currentValue: 720,
        condition: 'Excellent',
        location: 'Computer Lab 1',
        status: 'Available',
      },
      {
        assetCode: 'ASSET-003',
        name: 'Projector',
        category: 'Teaching Equipment',
        description: 'Epson high-brightness projector',
        serialNumber: 'EP-2024-003',
        purchaseDate: new Date('2024-03-10'),
        purchasePrice: 1200,
        currentValue: 1080,
        condition: 'Good',
        location: 'Building B, Room 205',
        status: 'In Use',
      },
      {
        assetCode: 'ASSET-004',
        name: 'Laboratory Microscope',
        category: 'Lab Equipment',
        description: 'Digital compound microscope with camera',
        serialNumber: 'MIC-2024-004',
        purchaseDate: new Date('2024-04-05'),
        purchasePrice: 350,
        currentValue: 315,
        condition: 'Excellent',
        location: 'Science Lab 1',
        status: 'Available',
      },
      {
        assetCode: 'ASSET-005',
        name: 'Desk and Chair Set',
        category: 'Furniture',
        description: 'Student desk and chair combo',
        serialNumber: 'FUR-2024-005',
        purchaseDate: new Date('2024-05-01'),
        purchasePrice: 150,
        currentValue: 135,
        condition: 'Good',
        location: 'Building A, Room 103',
        status: 'Available',
      },
      {
        assetCode: 'ASSET-006',
        name: 'Laptop',
        category: 'IT Equipment',
        description: 'HP Pavilion laptop for staff use',
        serialNumber: 'HP-2024-006',
        purchaseDate: new Date('2024-06-15'),
        purchasePrice: 900,
        currentValue: 810,
        condition: 'Excellent',
        location: 'Staff Room',
        status: 'In Use',
      },
      {
        assetCode: 'ASSET-007',
        name: 'Physics Lab Equipment Set',
        category: 'Lab Equipment',
        description: 'Complete set of physics lab instruments',
        serialNumber: 'PHY-2024-007',
        purchaseDate: new Date('2024-07-01'),
        purchasePrice: 2000,
        currentValue: 1800,
        condition: 'Good',
        location: 'Physics Lab',
        status: 'Available',
      },
      {
        assetCode: 'ASSET-008',
        name: 'Chemistry Lab Glassware Set',
        category: 'Lab Equipment',
        description: 'Beakers, test tubes, and other glassware',
        serialNumber: 'CHEM-2024-008',
        purchaseDate: new Date('2024-08-10'),
        purchasePrice: 500,
        currentValue: 450,
        condition: 'Good',
        location: 'Chemistry Lab',
        status: 'Available',
      },
      {
        assetCode: 'ASSET-009',
        name: 'Sports Equipment Set',
        category: 'Sports Equipment',
        description: 'Basketballs, footballs, and volleyball set',
        serialNumber: 'SPT-2024-009',
        purchaseDate: new Date('2024-09-01'),
        purchasePrice: 300,
        currentValue: 270,
        condition: 'Excellent',
        location: 'Sports Room',
        status: 'Available',
      },
      {
        assetCode: 'ASSET-010',
        name: 'Sound System',
        category: 'Audio Equipment',
        description: 'Portable PA system with speakers',
        serialNumber: 'AUD-2024-010',
        purchaseDate: new Date('2024-10-15'),
        purchasePrice: 600,
        currentValue: 540,
        condition: 'Good',
        location: 'Auditorium',
        status: 'Available',
      },
      {
        assetCode: 'ASSET-011',
        name: '3D Printer',
        category: 'IT Equipment',
        description: 'FDM 3D printer for STEM projects',
        serialNumber: '3D-2024-011',
        purchaseDate: new Date('2024-11-01'),
        purchasePrice: 1500,
        currentValue: 1350,
        condition: 'Excellent',
        location: 'Innovation Lab',
        status: 'Available',
      },
      {
        assetCode: 'ASSET-012',
        name: 'Bookshelf',
        category: 'Furniture',
        description: 'Wooden bookshelf for library',
        serialNumber: 'LIB-2024-012',
        purchaseDate: new Date('2024-12-01'),
        purchasePrice: 250,
        currentValue: 225,
        condition: 'Good',
        location: 'Library',
        status: 'Available',
      },
    ]

    const createdAssets = []
    for (const asset of assets) {
      try {
        const createdAsset = await prisma.asset.create({
          data: asset,
        })
        createdAssets.push(createdAsset)
        console.log('Created asset:', asset.name)
      } catch (error) {
        console.log('Asset already exists:', asset.name)
        const existing = await prisma.asset.findUnique({
          where: { assetCode: asset.assetCode },
        })
        if (existing) {
          createdAssets.push(existing)
        }
      }
    }

    console.log(`Created ${createdAssets.length} assets`)

    const users = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF'] } },
      take: 3,
    })

    if (users.length > 0) {
      const transactions = [
        {
          assetId: createdAssets[0]?.id,
          type: 'Assignment',
          assignedTo: 'Robert Anderson',
          remarks: 'Assigned to Math teacher for classroom use',
          performedBy: users[0].id,
        },
        {
          assetId: createdAssets[1]?.id,
          type: 'Assignment',
          assignedTo: 'Jennifer Wilson',
          remarks: 'Assigned to Computer Science teacher',
          performedBy: users[0].id,
        },
        {
          assetId: createdAssets[2]?.id,
          type: 'Assignment',
          assignedTo: 'Emily Thompson',
          remarks: 'Assigned to English department',
          performedBy: users[0].id,
        },
        {
          assetId: createdAssets[4]?.id,
          type: 'Transfer',
          fromLocation: 'Storage',
          toLocation: 'Building A, Room 103',
          remarks: 'Transferred from storage to classroom',
          performedBy: users[1]?.id || users[0].id,
        },
        {
          assetId: createdAssets[5]?.id,
          type: 'Assignment',
          assignedTo: 'Michael Davis',
          remarks: 'Assigned to Science teacher for lab work',
          performedBy: users[0].id,
        },
      ]

      const createdTransactions = []
      for (const transaction of transactions) {
        if (transaction.assetId) {
          try {
            const createdTransaction = await prisma.inventoryTransaction.create({
              data: transaction,
            })
            createdTransactions.push(createdTransaction)
          } catch (error) {
            console.log('Transaction creation skipped')
          }
        }
      }

      console.log(`Created ${createdTransactions.length} inventory transactions`)
    }

    console.log('Inventory data seeding completed successfully!')
    console.log(`- Created ${createdAssets.length} assets`)
  } catch (error) {
    console.error('Error seeding inventory data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedInventoryData()
