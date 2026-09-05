import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthenticatedRequest, requireRoles } from '../middleware/auth';
import { processBookingPayout } from '../services/payoutService';
import { emitBookingUpdate } from '../socket';

const router = Router();
const prisma = new PrismaClient();

// Create a booking
router.post('/', authenticateJWT, requireRoles(['CUSTOMER', 'COOP_ADMIN', 'GOV_ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { worker_id, category_id, scheduled_time, address, instructions, amount } = req.body;

    if (!worker_id || !category_id || !address || !amount) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }

    const booking = await prisma.booking.create({
      data: {
        customer_id: req.user!.id,
        worker_id,
        category_id,
        scheduled_time: new Date(scheduled_time || Date.now()),
        address,
        instructions: instructions || '',
        amount: parseFloat(amount),
        status: 'REQUESTED'
      },
      include: {
        category: true,
        worker: {
          include: {
            user: { select: { name: true, phone: true } },
            cooperative: { select: { name: true } }
          }
        },
        customer: { select: { name: true, phone: true } }
      }
    });

    emitBookingUpdate(booking.id, booking);

    return res.status(201).json(booking);
  } catch (err) {
    console.error('Create booking error:', err);
    return res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get user's bookings (Customer or Worker)
router.get('/mine', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    let bookings = [];

    if (role === 'WORKER') {
      const worker = await prisma.worker.findUnique({ where: { user_id: userId } });
      if (!worker) {
        return res.json([]);
      }
      bookings = await prisma.booking.findMany({
        where: { worker_id: worker.id },
        include: {
          category: true,
          customer: { select: { id: true, name: true, phone: true } },
          worker: { include: { cooperative: true } },
          payout: true,
          rating: true
        },
        orderBy: { created_at: 'desc' }
      });
    } else {
      // CUSTOMER or fallback
      bookings = await prisma.booking.findMany({
        where: { customer_id: userId },
        include: {
          category: true,
          worker: {
            include: {
              user: { select: { name: true, phone: true } },
              cooperative: { select: { name: true, district: true } }
            }
          },
          payout: true,
          rating: true
        },
        orderBy: { created_at: 'desc' }
      });
    }

    return res.json(bookings);
  } catch (err) {
    console.error('Fetch bookings error:', err);
    return res.status(500).json({ error: 'Failed to fetch user bookings' });
  }
});

// Get booking by ID
router.get('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        worker: {
          include: {
            user: { select: { name: true, phone: true } },
            cooperative: true
          }
        },
        customer: { select: { name: true, phone: true } },
        payout: true,
        rating: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.json(booking);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch booking details' });
  }
});

// Update booking status
router.patch('/:id/status', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        category: true,
        worker: {
          include: {
            user: { select: { name: true, phone: true } },
            cooperative: true
          }
        },
        customer: { select: { name: true, phone: true } }
      }
    });

    // If completed, trigger 80/15/5 payout calculations!
    let payout = null;
    if (status === 'COMPLETED') {
      payout = await processBookingPayout(updatedBooking.id);
    }

    const result = {
      ...updatedBooking,
      payout: payout || undefined
    };

    emitBookingUpdate(updatedBooking.id, result);

    return res.json(result);
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Rate booking
router.post('/:id/rate', authenticateJWT, requireRoles(['CUSTOMER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { score, comment } = req.body;
    const bookingId = req.params.id;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ error: 'Score must be between 1 and 5' });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.customer_id !== req.user!.id) {
      return res.status(403).json({ error: 'Only the booking customer can submit a rating' });
    }

    const rating = await prisma.rating.upsert({
      where: { booking_id: bookingId },
      update: { score: parseInt(score), comment },
      create: {
        booking_id: bookingId,
        score: parseInt(score),
        comment
      }
    });

    // Recalculate Worker rating_avg
    const allRatings = await prisma.rating.findMany({
      where: {
        booking: { worker_id: booking.worker_id }
      }
    });

    const avgScore = allRatings.reduce((acc, curr) => acc + curr.score, 0) / (allRatings.length || 1);
    await prisma.worker.update({
      where: { id: booking.worker_id },
      data: { rating_avg: Number(avgScore.toFixed(2)) }
    });

    return res.json(rating);
  } catch (err) {
    console.error('Rating error:', err);
    return res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// Cancel booking
router.post('/:id/cancel', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updatedBooking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });

    emitBookingUpdate(updatedBooking.id, updatedBooking);

    return res.json(updatedBooking);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

export default router;
