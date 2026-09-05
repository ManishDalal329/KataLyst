import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SahakarConnect Database Seeding...');

  // Clean existing data
  await prisma.vote.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.cooperative.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Government / Platform Admin User
  const govAdmin = await prisma.user.create({
    data: {
      name: 'Ministry Admin (Gov)',
      phone: '9999999999',
      role: 'GOV_ADMIN',
      lang_pref: 'EN'
    }
  });

  // 2. Create 3 Cooperative Admin Users
  const coopAdmin1 = await prisma.user.create({
    data: {
      name: 'Rajesh Sharma (NCR Coop Chair)',
      phone: '9810011111',
      role: 'COOP_ADMIN',
      lang_pref: 'EN'
    }
  });

  const coopAdmin2 = await prisma.user.create({
    data: {
      name: 'Sunita Patil (Mumbai Artisan Coop)',
      phone: '9820022222',
      role: 'COOP_ADMIN',
      lang_pref: 'EN'
    }
  });

  const coopAdmin3 = await prisma.user.create({
    data: {
      name: 'Karthik Rao (Bangalore HomeCare Coop)',
      phone: '9840033333',
      role: 'COOP_ADMIN',
      lang_pref: 'EN'
    }
  });

  // 3. Create 3 Cooperatives
  const coop1 = await prisma.cooperative.create({
    data: {
      name: 'Delhi NCR Urban Workers Cooperative',
      registration_no: 'COOP/DEL/2024/0089',
      district: 'Central Delhi',
      state: 'Delhi NCR',
      admin_user_id: coopAdmin1.id,
      fund_balance: 4250.0,
      status: 'APPROVED'
    }
  });

  const coop2 = await prisma.cooperative.create({
    data: {
      name: 'Mumbai Metro Household Services Sahakari',
      registration_no: 'COOP/MUM/2024/0142',
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      admin_user_id: coopAdmin2.id,
      fund_balance: 6180.0,
      status: 'APPROVED'
    }
  });

  const coop3 = await prisma.cooperative.create({
    data: {
      name: 'Bengaluru Smart Community Care Coop',
      registration_no: 'COOP/BLR/2024/0205',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      admin_user_id: coopAdmin3.id,
      fund_balance: 3890.0,
      status: 'APPROVED'
    }
  });

  // 4. Create 6 Service Categories
  const categoriesData = [
    { name: 'Cleaning & Sanitation', description: 'Deep home cleaning, kitchen & bathroom sanitization', base_rate: 699.0 },
    { name: 'Plumbing Services', description: 'Leak repair, pipe fitting, faucet replacement', base_rate: 499.0 },
    { name: 'Electrical Works', description: 'Wiring, MCB repair, light fittings, fan installations', base_rate: 549.0 },
    { name: 'Academic Tutoring', description: 'K-12 home tutoring for Mathematics, Science & English', base_rate: 800.0 },
    { name: 'Elder & Caregiving', description: 'Compassionate elderly assistance, nursing & companionship', base_rate: 1200.0 },
    { name: 'Appliance Repair', description: 'AC servicing, refrigerator, washing machine repair', base_rate: 750.0 }
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const created = await prisma.serviceCategory.create({
      data: cat
    });
    categories.push(created);
  }

  // 5. Create 15 Workers across Cooperatives
  const workerDefs = [
    // Delhi Coop Workers (5)
    { name: 'Amit Kumar', phone: '9711000001', coop: coop1, skills: 'Plumbing Services, Leak Repair, Pipe Fitting', rating: 4.9, lat: 28.6139, lng: 77.2090, avail: true },
    { name: 'Pooja Verma', phone: '9711000002', coop: coop1, skills: 'Cleaning & Sanitation, Deep Cleaning', rating: 4.8, lat: 28.6250, lng: 77.2150, avail: true },
    { name: 'Sanjay Singh', phone: '9711000003', coop: coop1, skills: 'Electrical Works, MCB Repair', rating: 4.7, lat: 28.6010, lng: 77.1980, avail: false },
    { name: 'Meena Devi', phone: '9711000004', coop: coop1, skills: 'Elder & Caregiving, Nursing', rating: 5.0, lat: 28.6300, lng: 77.2200, avail: true },
    { name: 'Ravi Malhotra', phone: '9711000005', coop: coop1, skills: 'Appliance Repair, AC Servicing', rating: 4.6, lat: 28.6180, lng: 77.2050, avail: true },

    // Mumbai Coop Workers (5)
    { name: 'Ganesh Shinde', phone: '9822000001', coop: coop2, skills: 'Electrical Works, Wiring', rating: 4.9, lat: 19.0760, lng: 72.8777, avail: true },
    { name: 'Asha Bhosle', phone: '9822000002', coop: coop2, skills: 'Academic Tutoring, Mathematics, Science', rating: 4.95, lat: 19.0850, lng: 72.8850, avail: true },
    { name: 'Vijay Salunkhe', phone: '9822000003', coop: coop2, skills: 'Plumbing Services, Faucet Replacement', rating: 4.5, lat: 19.0650, lng: 72.8650, avail: true },
    { name: 'Radhika Kulkarni', phone: '9822000004', coop: coop2, skills: 'Elder & Caregiving, Home Assistance', rating: 4.85, lat: 19.0900, lng: 72.8900, avail: false },
    { name: 'Mahesh Jadhav', phone: '9822000005', coop: coop2, skills: 'Cleaning & Sanitation, Kitchen Sanitization', rating: 4.7, lat: 19.0700, lng: 72.8700, avail: true },

    // Bangalore Coop Workers (5)
    { name: 'Ananth Murthy', phone: '9844000001', coop: coop3, skills: 'Academic Tutoring, English, Physics', rating: 4.9, lat: 12.9716, lng: 77.5946, avail: true },
    { name: 'Kavitha Reddy', phone: '9844000002', coop: coop3, skills: 'Cleaning & Sanitation, Sofa Cleaning', rating: 4.8, lat: 12.9800, lng: 77.6000, avail: true },
    { name: 'Deepak Gowda', phone: '9844000003', coop: coop3, skills: 'Appliance Repair, Washing Machine', rating: 4.65, lat: 12.9600, lng: 77.5850, avail: true },
    { name: 'Lakshmi Narayan', phone: '9844000004', coop: coop3, skills: 'Elder & Caregiving, Senior Companionship', rating: 5.0, lat: 12.9750, lng: 77.6100, avail: true },
    { name: 'Praveen Kumar', phone: '9844000005', coop: coop3, skills: 'Electrical Works, Appliance Repair', rating: 4.75, lat: 12.9680, lng: 77.5900, avail: true }
  ];

  const workers = [];
  for (const wDef of workerDefs) {
    const user = await prisma.user.create({
      data: {
        name: wDef.name,
        phone: wDef.phone,
        role: 'WORKER',
        lang_pref: 'EN'
      }
    });

    const worker = await prisma.worker.create({
      data: {
        user_id: user.id,
        cooperative_id: wDef.coop.id,
        skills: wDef.skills,
        verification_status: 'VERIFIED',
        rating_avg: wDef.rating,
        availability_status: wDef.avail,
        lat: wDef.lat,
        lng: wDef.lng
      },
      include: { user: true, cooperative: true }
    });
    workers.push(worker);
  }

  // 6. Create 10 Customer Users
  const customersData = [
    { name: 'Priya Sharma', phone: '9900112233' },
    { name: 'Rahul Verma', phone: '9900112234' },
    { name: 'Sneha Patel', phone: '9900112235' },
    { name: 'Arjun Nair', phone: '9900112236' },
    { name: 'Divya Iyer', phone: '9900112237' },
    { name: 'Vikram Joshi', phone: '9900112238' },
    { name: 'Ananya Gupta', phone: '9900112239' },
    { name: 'Siddharth Rao', phone: '9900112240' },
    { name: 'Kavya Singh', phone: '9900112241' },
    { name: 'Manish Mehta', phone: '9900112242' }
  ];

  const customers = [];
  for (const cData of customersData) {
    const customer = await prisma.user.create({
      data: {
        name: cData.name,
        phone: cData.phone,
        role: 'CUSTOMER',
        lang_pref: 'EN'
      }
    });
    customers.push(customer);
  }

  // 7. Seed 30 Bookings with realistic status distribution & payout records
  console.log('📦 Seeding 30 Bookings with payouts & ratings...');

  const statuses = [
    'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED',
    'IN_PROGRESS', 'ACCEPTED', 'REQUESTED', 'CANCELLED'
  ];

  for (let i = 0; i < 30; i++) {
    const customer = customers[i % customers.length];
    const worker = workers[i % workers.length];
    const category = categories[i % categories.length];
    const status = statuses[i % statuses.length];
    const amount = category.base_rate + (i * 20 % 300);

    const booking = await prisma.booking.create({
      data: {
        customer_id: customer.id,
        worker_id: worker.id,
        category_id: category.id,
        status,
        scheduled_time: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
        address: `${101 + i}, Sector ${10 + (i % 5)}, Block ${String.fromCharCode(65 + (i % 4))}`,
        instructions: i % 2 === 0 ? 'Please call before arrival.' : 'Gate code 4321',
        amount: Number(amount.toFixed(2))
      }
    });

    // If completed, create 80/15/5 Payout and Rating
    if (status === 'COMPLETED') {
      const platform_fee = Number((amount * 0.05).toFixed(2));
      const cooperative_share = Number((amount * 0.15).toFixed(2));
      const worker_share = Number((amount * 0.80).toFixed(2));

      await prisma.payout.create({
        data: {
          booking_id: booking.id,
          platform_fee,
          cooperative_share,
          worker_share,
          status: 'RELEASED'
        }
      });

      await prisma.rating.create({
        data: {
          booking_id: booking.id,
          score: 4 + (i % 2), // 4 or 5 stars
          comment: i % 2 === 0 ? 'Excellent, punctual and very professional service!' : 'Great cooperative worker. Very neat work.'
        }
      });
    }
  }

  // 8. Seed Cooperative Governance Proposals & Votes
  console.log('🗳️ Seeding Democratic Governance Proposals & Votes...');

  const prop1 = await prisma.proposal.create({
    data: {
      cooperative_id: coop1.id,
      title: 'Should we raise Plumbing Base Rate by 10% for monsoon season?',
      description: 'Due to higher emergency callouts during heavy rains, we propose increasing base plumbing rate from ₹499 to ₹549. Extra proceeds will benefit member emergency funds.',
      options: 'Yes - Raise by 10%, No - Keep rates constant, Abstain',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'OPEN'
    }
  });

  const prop2 = await prisma.proposal.create({
    data: {
      cooperative_id: coop2.id,
      title: 'Cooperative Welfare Fund Allocation for Health Insurance 2026',
      description: 'We have accumulated over ₹6,000 in our coop fund. Proposal to allocate 60% of fund balance towards group health coverage for all active members.',
      options: 'Approve Insurance Plan, Reinvest in Equipment Grants, Defer Decision',
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'OPEN'
    }
  });

  const prop3 = await prisma.proposal.create({
    data: {
      cooperative_id: coop1.id,
      title: 'Approval of 3 New Electrician Member Applications',
      description: 'Vote on ratifying the background-checked member applications for Ramesh, Suresh, and Vinod into Delhi NCR Coop.',
      options: 'Approve All, Approve Conditionally, Reject Applications',
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'CLOSED'
    }
  });

  // Seed Votes for Delhi Coop Workers on Prop 1 & Prop 3
  const delhiWorkers = workers.filter(w => w.cooperative_id === coop1.id);
  if (delhiWorkers.length >= 3) {
    await prisma.vote.create({
      data: { proposal_id: prop1.id, worker_id: delhiWorkers[0].id, choice: 'Yes - Raise by 10%' }
    });
    await prisma.vote.create({
      data: { proposal_id: prop1.id, worker_id: delhiWorkers[1].id, choice: 'Yes - Raise by 10%' }
    });
    await prisma.vote.create({
      data: { proposal_id: prop1.id, worker_id: delhiWorkers[2].id, choice: 'No - Keep rates constant' }
    });

    // Closed proposal votes
    await prisma.vote.create({
      data: { proposal_id: prop3.id, worker_id: delhiWorkers[0].id, choice: 'Approve All' }
    });
    await prisma.vote.create({
      data: { proposal_id: prop3.id, worker_id: delhiWorkers[1].id, choice: 'Approve All' }
    });
    await prisma.vote.create({
      data: { proposal_id: prop3.id, worker_id: delhiWorkers[2].id, choice: 'Approve All' }
    });
    await prisma.vote.create({
      data: { proposal_id: prop3.id, worker_id: delhiWorkers[3].id, choice: 'Approve Conditionally' }
    });
  }

  console.log('✅ SahakarConnect Database Seeding Completed Successfully!');
  console.log('---------------------------------------------------------');
  console.log('Gov Admin Login: Phone = 9999999999 (OTP: 123456)');
  console.log('Coop Admin Login: Phone = 9810011111 (OTP: 123456)');
  console.log('Worker Login: Phone = 9711000001 (OTP: 123456)');
  console.log('Customer Login: Phone = 9900112233 (OTP: 123456)');
  console.log('---------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
