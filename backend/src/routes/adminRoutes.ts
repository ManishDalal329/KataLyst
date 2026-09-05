import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Platform Overview Analytics
router.get('/analytics/overview', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalBookings = await prisma.booking.count();
    const completedBookings = await prisma.booking.count({ where: { status: 'COMPLETED' } });
    const totalCoops = await prisma.cooperative.count({ where: { status: 'APPROVED' } });
    const totalWorkers = await prisma.worker.count({ where: { verification_status: 'VERIFIED' } });
    const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });

    // Aggregate GMV and Payout breakdown
    const bookings = await prisma.booking.findMany({ select: { amount: true, status: true } });
    const totalGMV = bookings.reduce((sum, b) => sum + b.amount, 0);

    const payouts = await prisma.payout.findMany();
    const totalWorkerPayouts = payouts.reduce((sum, p) => sum + p.worker_share, 0);
    const totalCoopFunds = payouts.reduce((sum, p) => sum + p.cooperative_share, 0);
    const totalPlatformFees = payouts.reduce((sum, p) => sum + p.platform_fee, 0);

    return res.json({
      totalBookings,
      completedBookings,
      totalCoops,
      totalWorkers,
      totalCustomers,
      totalGMV: Number(totalGMV.toFixed(2)),
      totalWorkerPayouts: Number(totalWorkerPayouts.toFixed(2)),
      totalCoopFunds: Number(totalCoopFunds.toFixed(2)),
      totalPlatformFees: Number(totalPlatformFees.toFixed(2))
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ error: 'Failed to fetch admin overview analytics' });
  }
});

// Bookings demand by Category
router.get('/analytics/demand-by-category', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = await prisma.serviceCategory.findMany({
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    });

    const result = categories.map(cat => ({
      name: cat.name,
      bookings: cat._count.bookings,
      baseRate: cat.base_rate
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch demand by category' });
  }
});

// Bookings demand by District
router.get('/analytics/demand-by-district', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const coops = await prisma.cooperative.findMany({
      include: {
        workers: {
          include: {
            _count: { select: { bookings: true } }
          }
        }
      }
    });

    const districtMap: Record<string, number> = {};
    coops.forEach(coop => {
      const district = coop.district || 'Other';
      const coopBookings = coop.workers.reduce((sum, w) => sum + w._count.bookings, 0);
      districtMap[district] = (districtMap[district] || 0) + coopBookings;
    });

    const result = Object.keys(districtMap).map(district => ({
      district,
      bookings: districtMap[district]
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch demand by district' });
  }
});

// Flagged Cooperatives (rating < 3.0 or high disputes)
router.get('/analytics/flagged-cooperatives', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const coops = await prisma.cooperative.findMany({
      include: {
        workers: true,
        admin: { select: { name: true, phone: true } }
      }
    });

    const flagged = coops.map(coop => {
      const totalWorkers = coop.workers.length;
      const avgRating = totalWorkers > 0
        ? coop.workers.reduce((sum, w) => sum + w.rating_avg, 0) / totalWorkers
        : 5.0;

      const isFlagged = avgRating < 3.5 || totalWorkers === 0;
      let reason = '';
      if (avgRating < 3.5) reason = `Low average member rating (${avgRating.toFixed(2)})`;
      if (totalWorkers === 0) reason = 'No registered worker members';

      return {
        id: coop.id,
        name: coop.name,
        district: coop.district,
        state: coop.state,
        status: coop.status,
        memberCount: totalWorkers,
        avgRating: Number(avgRating.toFixed(2)),
        isFlagged,
        reason
      };
    }).filter(c => c.isFlagged);

    return res.json(flagged);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch flagged cooperatives' });
  }
});

export default router;
