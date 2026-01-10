import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding Inventory...')

  const academicYear = await prisma.academicYear.findFirst({
    where: { isCurrent: true },
  })

  if (!academicYear) {
    console.log('No current academic year found. Please seed academic years first.')
    return
  }

  const students = await prisma.student.findMany({
    include: { grade: true, section: true },
    take: 10,
  })

  const grades = await prisma.grade.findMany({
    include: { sections: true },
  })

  const teachers = await prisma.teacher.findMany({
    take: 5,
  })

  const subjects = await prisma.subject.findMany()

  const users = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'TEACHER'] } },
    take: 3,
  })

  if (users.length === 0) {
    console.log('No admin/teacher users found. Creating a default admin user...')
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@school.com',
        name: 'System Administrator',
        role: 'ADMIN',
        password: 'admin123',
      },
    })
    users.push(adminUser)
  }

  const inventoryManager = users[0]

  console.log(`Found ${students.length} students, ${grades.length} grades, ${teachers.length} teachers, ${subjects.length} subjects`)

  const assets = []
  const transactions = []

  let assetCounter = 1

  for (const student of students) {
    const laptop = await prisma.asset.create({
      data: {
        assetCode: `LAP-${String(assetCounter).padStart(4, '0')}`,
        name: `Student Laptop - ${student.firstName} ${student.lastName}`,
        category: 'Electronics',
        description: `Chromebook assigned to ${student.firstName} ${student.lastName} in Grade ${student.grade.name} Section ${student.section.name}`,
        serialNumber: `SN-LAP-${Date.now()}-${assetCounter}`,
        purchaseDate: new Date('2024-01-15'),
        purchasePrice: 350.0,
        currentValue: 280.0,
        condition: 'Good',
        location: `${student.grade.name} - ${student.section.name}`,
        assignedTo: `${student.firstName} ${student.lastName} (${student.rollNumber})`,
        status: 'InUse',
      },
    })
    assets.push(laptop)
    assetCounter++

    transactions.push({
      assetId: laptop.id,
      type: 'Assignment',
      toLocation: `${student.grade.name} - ${student.section.name}`,
      assignedTo: `${student.firstName} ${student.lastName} (${student.rollNumber})`,
      quantity: 1,
      remarks: `Laptop assigned to student for academic year ${academicYear.name}`,
      performedBy: inventoryManager.id,
    })
  }

  for (const grade of grades) {
    for (const section of grade.sections) {
      const projector = await prisma.asset.create({
        data: {
          assetCode: `PROJ-${String(assetCounter).padStart(4, '0')}`,
          name: `Classroom Projector - ${grade.name} ${section.name}`,
          category: 'Electronics',
          description: `Smart classroom projector for ${grade.name} ${section.name}`,
          serialNumber: `SN-PROJ-${Date.now()}-${assetCounter}`,
          purchaseDate: new Date('2024-02-01'),
          purchasePrice: 800.0,
          currentValue: 640.0,
          condition: 'Excellent',
          location: `${grade.name} - ${section.name} - Room ${section.roomNumber || '101'}`,
          assignedTo: `${grade.name} ${section.name}`,
          status: 'Available',
        },
      })
      assets.push(projector)
      assetCounter++

      transactions.push({
        assetId: projector.id,
        type: 'Purchase',
        toLocation: `${grade.name} - ${section.name}`,
        quantity: 1,
        remarks: `Projector purchased for classroom ${grade.name} ${section.name}`,
        performedBy: inventoryManager.id,
      })

      const deskCount = section.capacity || 40
      for (let i = 1; i <= 5; i++) {
        const furnitureSet = await prisma.asset.create({
          data: {
            assetCode: `FUR-${String(assetCounter).padStart(4, '0')}`,
            name: `Student Desk & Chair Set - ${grade.name} ${section.name}`,
            category: 'Furniture',
            description: `Batch of ${deskCount} student desk and chair sets for ${grade.name} ${section.name}`,
            serialNumber: `SN-FUR-${Date.now()}-${assetCounter}`,
            purchaseDate: new Date('2024-01-10'),
            purchasePrice: deskCount * 50.0,
            currentValue: deskCount * 40.0,
            condition: 'Good',
            location: `${grade.name} - ${section.name} - Room ${section.roomNumber || '101'}`,
            assignedTo: `${grade.name} ${section.name}`,
            status: 'Available',
          },
        })
        assets.push(furnitureSet)
        assetCounter++

        transactions.push({
          assetId: furnitureSet.id,
          type: 'Purchase',
          toLocation: `${grade.name} - ${section.name}`,
          quantity: deskCount,
          remarks: `Furniture batch purchased for classroom ${grade.name} ${section.name}`,
          performedBy: inventoryManager.id,
        })
      }
    }
  }

  const scienceSubject = subjects.find(s => s.name.toLowerCase().includes('science') || s.code.toLowerCase().includes('sci'))
  if (scienceSubject) {
    const labEquipments = [
      { name: 'Microscope', price: 250.0, quantity: 10 },
      { name: 'Test Tube Set', price: 50.0, quantity: 20 },
      { name: 'Bunsen Burner', price: 45.0, quantity: 15 },
      { name: 'Beaker Set', price: 35.0, quantity: 25 },
      { name: 'Lab Safety Goggles', price: 15.0, quantity: 40 },
    ]

    for (const equipment of labEquipments) {
      const asset = await prisma.asset.create({
        data: {
          assetCode: `LAB-${String(assetCounter).padStart(4, '0')}`,
          name: `${equipment.name} - Science Lab`,
          category: 'Equipment',
          description: `${equipment.name} for ${scienceSubject.name} laboratory`,
          serialNumber: `SN-LAB-${equipment.name.replace(/\s/g, '')}-${Date.now()}-${assetCounter}`,
          purchaseDate: new Date('2024-03-01'),
          purchasePrice: equipment.price * equipment.quantity,
          currentValue: (equipment.price * equipment.quantity) * 0.8,
          condition: 'Good',
          location: `Science Laboratory`,
          assignedTo: `Science Department - ${scienceSubject.name}`,
          status: 'Available',
        },
      })
      assets.push(asset)
      assetCounter++

      transactions.push({
        assetId: asset.id,
        type: 'Purchase',
        toLocation: 'Science Laboratory',
        quantity: equipment.quantity,
        remarks: `${equipment.quantity} units purchased for ${scienceSubject.name} department`,
        performedBy: inventoryManager.id,
      })
    }
  }

  const mathSubject = subjects.find(s => s.name.toLowerCase().includes('math') || s.code.toLowerCase().includes('mat'))
  if (mathSubject) {
    for (let i = 1; i <= 5; i++) {
      const kit = await prisma.asset.create({
        data: {
          assetCode: `MATH-${String(assetCounter).padStart(4, '0')}`,
          name: `Mathematics Learning Kit - Set ${i}`,
          category: 'Equipment',
          description: `Geometry sets, calculators, and manipulatives for ${mathSubject.name}`,
          serialNumber: `SN-MATH-${Date.now()}-${assetCounter}`,
          purchaseDate: new Date('2024-02-15'),
          purchasePrice: 150.0,
          currentValue: 120.0,
          condition: 'Excellent',
          location: `Mathematics Resource Center`,
          assignedTo: `Mathematics Department - ${mathSubject.name}`,
          status: 'Available',
        },
      })
      assets.push(kit)
      assetCounter++

      transactions.push({
        assetId: kit.id,
        type: 'Purchase',
        toLocation: 'Mathematics Resource Center',
        quantity: 1,
        remarks: `Math learning kit purchased for ${mathSubject.name} department`,
        performedBy: inventoryManager.id,
      })
    }
  }

  const computerLabComputers = await prisma.asset.create({
    data: {
      assetCode: `COMP-${String(assetCounter).padStart(4, '0')}`,
      name: `Computer Lab Desktops - 30 Units`,
      category: 'Electronics',
      description: '30 Dell OptiPlex desktop computers for computer lab',
      serialNumber: `SN-COMP-${Date.now()}-${assetCounter}`,
      purchaseDate: new Date('2024-01-20'),
      purchasePrice: 15000.0,
      currentValue: 12000.0,
      condition: 'Excellent',
      location: 'Computer Lab - Room 205',
      assignedTo: 'Computer Science Department',
      status: 'Available',
    },
  })
  assets.push(computerLabComputers)
  assetCounter++

  transactions.push({
    assetId: computerLabComputers.id,
    type: 'Purchase',
    toLocation: 'Computer Lab - Room 205',
    quantity: 30,
    remarks: '30 desktop computers purchased for computer lab',
    performedBy: inventoryManager.id,
  })

  const sportsEquipment = [
    { name: 'Basketball Set', price: 200.0, quantity: 20 },
    { name: 'Football Set', price: 250.0, quantity: 25 },
    { name: 'Volleyball Set', price: 180.0, quantity: 15 },
    { name: 'Badminton Set', price: 150.0, quantity: 20 },
    { name: 'Track & Field Equipment', price: 500.0, quantity: 1 },
  ]

  for (const equipment of sportsEquipment) {
    const asset = await prisma.asset.create({
      data: {
        assetCode: `SPT-${String(assetCounter).padStart(4, '0')}`,
        name: `${equipment.name} - PE Department`,
        category: 'Equipment',
        description: `${equipment.name} for Physical Education department`,
        serialNumber: `SN-SPT-${equipment.name.replace(/\s/g, '')}-${Date.now()}-${assetCounter}`,
        purchaseDate: new Date('2024-03-15'),
        purchasePrice: equipment.price * equipment.quantity,
        currentValue: (equipment.price * equipment.quantity) * 0.85,
        condition: 'Good',
        location: 'Sports Complex - Gymnasium',
        assignedTo: 'Physical Education Department',
        status: 'Available',
      },
    })
    assets.push(asset)
    assetCounter++

    transactions.push({
      assetId: asset.id,
      type: 'Purchase',
      toLocation: 'Sports Complex - Gymnasium',
      quantity: equipment.quantity,
      remarks: `${equipment.name} purchased for PE department`,
      performedBy: inventoryManager.id,
    })
  }

  const libraryBooks = [
    { name: 'Reference Books Collection', price: 500.0, quantity: 100 },
    { name: 'Textbook Set - Grade 9', price: 1200.0, quantity: 200 },
    { name: 'Textbook Set - Grade 10', price: 1200.0, quantity: 200 },
    { name: 'Textbook Set - Grade 11', price: 1300.0, quantity: 180 },
    { name: 'Textbook Set - Grade 12', price: 1400.0, quantity: 150 },
  ]

  for (const book of libraryBooks) {
    const asset = await prisma.asset.create({
      data: {
        assetCode: `LIB-${String(assetCounter).padStart(4, '0')}`,
        name: `${book.name}`,
        category: 'Books',
        description: `${book.quantity} units of ${book.name} for school library`,
        serialNumber: `SN-LIB-${book.name.replace(/\s/g, '')}-${Date.now()}-${assetCounter}`,
        purchaseDate: new Date('2024-02-20'),
        purchasePrice: book.price,
        currentValue: book.price * 0.7,
        condition: 'Good',
        location: 'School Library - Main Hall',
        assignedTo: 'Library Department',
        status: 'Available',
      },
    })
    assets.push(asset)
    assetCounter++

    transactions.push({
      assetId: asset.id,
      type: 'Purchase',
      toLocation: 'School Library - Main Hall',
      quantity: book.quantity,
      remarks: `${book.quantity} books purchased for library`,
      performedBy: inventoryManager.id,
    })
  }

  const musicalInstruments = [
    { name: 'Piano - Upright', price: 3000.0, quantity: 2 },
    { name: 'Guitar Set - Acoustic', price: 800.0, quantity: 10 },
    { name: 'Drum Set', price: 1200.0, quantity: 3 },
    { name: 'Violin Set', price: 600.0, quantity: 8 },
  ]

  for (const instrument of musicalInstruments) {
    const asset = await prisma.asset.create({
      data: {
        assetCode: `MUS-${String(assetCounter).padStart(4, '0')}`,
        name: `${instrument.name} - Music Room`,
        category: 'Equipment',
        description: `${instrument.name} for Music department`,
        serialNumber: `SN-MUS-${instrument.name.replace(/\s/g, '')}-${Date.now()}-${assetCounter}`,
        purchaseDate: new Date('2024-04-01'),
        purchasePrice: instrument.price * instrument.quantity,
        currentValue: (instrument.price * instrument.quantity) * 0.85,
        condition: 'Excellent',
        location: 'Music Room - Room 303',
        assignedTo: 'Music Department',
        status: 'Available',
      },
    })
    assets.push(asset)
    assetCounter++

    transactions.push({
      assetId: asset.id,
      type: 'Purchase',
      toLocation: 'Music Room - Room 303',
      quantity: instrument.quantity,
      remarks: `${instrument.quantity} units purchased for music department`,
      performedBy: inventoryManager.id,
    })
  }

  const artSupplies = await prisma.asset.create({
    data: {
      assetCode: `ART-${String(assetCounter).padStart(4, '0')}`,
      name: `Art Supplies Kit - Painting, Drawing, Sculpture`,
      category: 'Supplies',
      description: 'Comprehensive art supplies including paints, brushes, canvases, clay, and sculpting tools',
      serialNumber: `SN-ART-${Date.now()}-${assetCounter}`,
      purchaseDate: new Date('2024-04-15'),
      purchasePrice: 800.0,
      currentValue: 640.0,
      condition: 'Good',
      location: 'Art Studio - Room 304',
      assignedTo: 'Art Department',
      status: 'Available',
    },
  })
  assets.push(artSupplies)
  assetCounter++

  transactions.push({
    assetId: artSupplies.id,
    type: 'Purchase',
    toLocation: 'Art Studio - Room 304',
    quantity: 1,
    remarks: 'Art supplies kit purchased for art department',
    performedBy: inventoryManager.id,
  })

  const maintenanceItems = [
    { name: 'Office Printer - High Volume', price: 450.0, condition: 'Fair', status: 'Maintenance' },
    { name: 'Photocopier', price: 1200.0, condition: 'Fair', status: 'Maintenance' },
    { name: 'Scanner Unit', price: 200.0, condition: 'Poor', status: 'Maintenance' },
  ]

  for (const item of maintenanceItems) {
    const asset = await prisma.asset.create({
      data: {
        assetCode: `MAINT-${String(assetCounter).padStart(4, '0')}`,
        name: `${item.name}`,
        category: 'Electronics',
        description: `${item.name} requiring maintenance`,
        serialNumber: `SN-MAINT-${item.name.replace(/\s/g, '')}-${Date.now()}-${assetCounter}`,
        purchaseDate: new Date('2022-06-01'),
        purchasePrice: item.price,
        currentValue: item.price * 0.4,
        condition: item.condition,
        location: 'Administration Office',
        assignedTo: 'Admin Staff',
        status: item.status,
      },
    })
    assets.push(asset)
    assetCounter++

    transactions.push({
      assetId: asset.id,
      type: 'Maintenance',
      fromLocation: 'Administration Office',
      toLocation: 'Service Center',
      quantity: 1,
      remarks: `Asset sent for maintenance due to ${item.condition} condition`,
      performedBy: inventoryManager.id,
    })
  }

  for (const transaction of transactions) {
    await prisma.inventoryTransaction.create({
      data: transaction,
    })
  }

  console.log(`Created ${assets.length} assets and ${transactions.length} inventory transactions`)
  console.log('Inventory seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding inventory:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
