import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting to seed messages...')

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    take: 10,
  })

  if (users.length < 2) {
    console.log('Not enough users to create messages')
    return
  }

  const studentUsers = users.filter(u => u.role === 'STUDENT')
  const parentUsers = users.filter(u => u.role === 'PARENT')

  const now = new Date()

  const messages = [
    {
      senderId: users[0].id,
      receiverId: users[1].id,
      subject: 'Grade Report - First Quarter',
      content: 'Dear Parent,\n\nPlease find attached the grade report for your child for the first quarter. Overall performance has been satisfactory with notable improvement in Mathematics and Science.\n\nWe encourage you to review the report and discuss any concerns with the class teacher during the upcoming parent-teacher meeting scheduled for next week.\n\nBest regards,\nSchool Administration',
      type: 'Direct',
      priority: 'Normal',
      isRead: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      readAt: null,
    },
    {
      senderId: users[2].id,
      receiverId: users[0].id,
      subject: 'Re: Grade Report - First Quarter',
      content: 'Thank you for sending the grade report. We have reviewed it and are pleased with the progress. We will definitely attend the parent-teacher meeting next week.\n\nCould you please let us know what time would be most convenient?\n\nRegards,\nParent',
      type: 'Direct',
      priority: 'Normal',
      isRead: true,
      createdAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000),
      readAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },
    {
      senderId: users[4].id,
      receiverId: users[5].id,
      subject: 'Meeting Reminder - Parent Teacher Conference',
      content: 'This is a reminder that the parent-teacher conference is scheduled for tomorrow at 3:00 PM in the school auditorium. Please make sure to arrive 10 minutes early to complete registration.\n\nTopics to be discussed:\n1. Academic performance review\n2. Behavioral assessment\n3. Extra-curricular activities\n4. Upcoming events\n\nWe look forward to seeing you there.\n\nBest,\nSchool Office',
      type: 'Direct',
      priority: 'High',
      isRead: false,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      readAt: null,
    },
    {
      senderId: users[0].id,
      receiverId: users[2].id,
      subject: 'Assignment Submission - Science Project',
      content: 'Dear Student,\n\nThis is a reminder that the science project submission deadline is this Friday. Please ensure that:\n\n1. Project report is properly formatted\n2. All required diagrams and charts are included\n3. Bibliography is complete\n4. Working model is ready for presentation\n\nIf you need any assistance, please reach out to the science department during office hours.\n\nGood luck with your project!\n\nScience Department',
      type: 'Direct',
      priority: 'Normal',
      isRead: true,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      readAt: new Date(now.getTime() - 2.5 * 24 * 60 * 60 * 1000),
    },
    {
      senderId: users[6].id,
      receiverId: users[7].id,
      subject: 'Urgent: School Closure Tomorrow',
      content: 'Dear Parents,\n\nPlease be informed that the school will remain closed tomorrow due to severe weather conditions. All classes and activities have been cancelled.\n\nThe school will reopen the following day as scheduled. Please monitor your email and school website for further updates.\n\nStay safe.\n\nSchool Administration',
      type: 'Alert',
      priority: 'Urgent',
      isRead: false,
      createdAt: new Date(now.getTime() - 30 * 60 * 1000),
      readAt: null,
    },
    {
      senderId: users[8].id,
      receiverId: users[9].id,
      subject: 'Library Books Due Notice',
      content: 'This is a notification that the following library books borrowed by your child are due for return:\n\n1. Introduction to Physics - Due: Tomorrow\n2. World History - Due: In 2 days\n3. Advanced Mathematics - Due: In 3 days\n\nPlease ensure these books are returned on time to avoid any late fees. Books can be returned to the school library during school hours.\n\nThank you for your cooperation.\n\nLibrary Department',
      type: 'Direct',
      priority: 'Normal',
      isRead: true,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      readAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      senderId: users[0].id,
      receiverId: users[4].id,
      subject: 'Sports Day Announcement',
      content: 'Dear Students and Parents,\n\nWe are excited to announce that the Annual Sports Day will be held on March 15th at the school stadium. This event showcases athletic talents and promotes teamwork and sportsmanship.\n\nSchedule:\n- 8:00 AM: Opening ceremony\n- 9:00 AM: Track events begin\n- 12:00 PM: Lunch break\n- 1:00 PM: Field events\n- 4:00 PM: Closing ceremony\n\nAll students are required to participate. Please wear your house jersey and bring water bottles.\n\nLooking forward to your enthusiastic participation!\n\nSports Department',
      type: 'Announcement',
      priority: 'High',
      isRead: false,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      readAt: null,
    },
    {
      senderId: users[2].id,
      receiverId: users[0].id,
      subject: 'Fee Payment Reminder - Second Installment',
      content: 'Dear Parent,\n\nThis is a gentle reminder that the second installment of school fees is due by the end of this month. Please ensure timely payment to avoid any late fees.\n\nPayment Methods:\n1. Online payment through school portal\n2. Bank transfer\n3. Cash payment at school office\n\nIf you have already paid, please disregard this notice.\n\nFor any queries regarding fees, please contact the accounts department.\n\nBest regards,\nAccounts Department',
      type: 'Direct',
      priority: 'Normal',
      isRead: true,
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      readAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
    },
    {
      senderId: users[4].id,
      receiverId: users[6].id,
      subject: 'Re: Sports Day Announcement',
      content: 'Thank you for the announcement. We are looking forward to the sports day!\n\nQuick question - is there a dress code for parents attending the event? Also, are there any specific items students need to bring besides water bottles?\n\nThanks,\nParent',
      type: 'Direct',
      priority: 'Low',
      isRead: true,
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      readAt: new Date(now.getTime() - 5.5 * 24 * 60 * 60 * 1000),
    },
    {
      senderId: users[8].id,
      receiverId: users[0].id,
      subject: 'Bus Route Change Notification',
      content: 'Dear Parents,\n\nPlease be informed that effective from next Monday, there will be a change in the bus route for Bus No. 12. The route has been modified to accommodate additional stops.\n\nNew Route Details:\n- Old stop: Main Street\n- New stop: Central Avenue (near City Mall)\n- Pickup time: 7:15 AM (unchanged)\n\nIf your child uses this bus route, please ensure they are aware of the new pickup location. Contact the transport department if you have any questions.\n\nTransport Department',
      type: 'Announcement',
      priority: 'High',
      isRead: false,
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      readAt: null,
    },
    {
      senderId: users[0].id,
      receiverId: users[8].id,
      subject: 'Cafeteria Menu Update',
      content: 'Dear Parents,\n\nWe are pleased to announce that the school cafeteria has updated its menu with healthier options. The new menu includes:\n\n- Fresh fruits and vegetables daily\n- Whole grain options\n- Low-sugar snacks\n- Vegetarian meals on Tuesdays and Thursdays\n- Seasonal special dishes\n\nMenu cards will be distributed to all students this week. You can also view the complete menu on the school website.\n\nWe hope your children enjoy the new options!\n\nCafeteria Management',
      type: 'Announcement',
      priority: 'Low',
      isRead: true,
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      readAt: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000),
    },
    {
      senderId: users[2].id,
      receiverId: users[4].id,
      subject: 'Exam Schedule - Final Examinations',
      content: 'Dear Students,\n\nThe final examination schedule has been released. Please find below the exam dates:\n\nMarch 20: Mathematics\nMarch 21: Science\nMarch 22: English\nMarch 23: Social Studies\nMarch 24: Second Language\n\nExamination Timings: 9:00 AM to 12:00 PM\n\nImportant Notes:\n- Arrive 15 minutes before exam time\n- Bring necessary stationery\n- Mobile phones are not permitted\n- School ID card is mandatory\n\nAll the best for your exams!\n\nExamination Department',
      type: 'Direct',
      priority: 'High',
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      readAt: null,
    },
  ]

  for (const msg of messages) {
    await prisma.message.create({
      data: msg,
    })
  }

  console.log(`Created ${messages.length} messages`)
  console.log('Messages seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding messages:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
