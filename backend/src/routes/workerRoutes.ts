import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { rankWorker } from '../services/matchingService';
import { authenticateJWT, AuthenticatedRequest, requireRoles } from '../middleware/auth';
import { emitWorkerAvailabilityChanged } from '../socket';

const router = Router();
const prisma = new PrismaClient();

// Search workers with AI Smart Matching score ranking
router.get('/search', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, lat, lng } = req.query;

    const reqLat = lat ? parseFloat(lat as string) : 28.6139;
    const reqLng = lng ? parseFloat(lng as string) : 77.2090;

    let categoryObj = null;
    if (category) {
      categoryObj = await prisma.serviceCategory.findFirst({
        where: {
          OR: [
            { id: category as string },
            { name: { contains: category as string } }
          ]
        }
      });
    }

    const workers = await prisma.worker.findMany({
      where: {
        verification_status: 'VERIFIED',
        cooperative: {
          status: 'APPROVED'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        cooperative: {
          select: {
            id: true,
            name: true,
            district: true,
            state: true
          }
        }
      }
    });

    const categoryName = categoryObj ? categoryObj.name : (category as string || '');

    // Compute AI match score for each worker & sort descending
    const rankedWorkers = workers.map(worker => {
      const matchData = rankWorker(worker, reqLat, reqLng, categoryName);
      return {
        ...worker,
        matchScore: matchData.matchScore,
        matchBreakdown: matchData.breakdown
      };
    });

    rankedWorkers.sort((a, b) => b.matchScore - a.matchScore);

    return res.json(rankedWorkers);
  } catch (err) {
    console.error('Worker search error:', err);
    return res.status(500).json({ error: 'Failed to search workers' });
  }
});

// Get single worker profile by ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { id: true, name: true, phone: true }
        },
        cooperative: true,
        bookings: {
          include: {
            rating: true,
            category: true
          },
          orderBy: { created_at: 'desc' },
          take: 10
        }
      }
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    return res.json(worker);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch worker profile' });
  }
});

// Toggle worker availability status
router.patch('/:id/availability', authenticateJWT, requireRoles(['WORKER', 'COOP_ADMIN', 'GOV_ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { availability_status } = req.body;
    
    // If caller is WORKER, ensure they are editing their own profile
    if (req.user!.role === 'WORKER') {
      const currentWorker = await prisma.worker.findUnique({ where: { user_id: req.user!.id } });
      if (!currentWorker || currentWorker.id !== req.params.id) {
        return res.status(403).json({ error: 'Access denied: you can only update your own availability' });
      }
    }

    const worker = await prisma.worker.update({
      where: { id: req.params.id },
      data: { availability_status: Boolean(availability_status) }
    });

    emitWorkerAvailabilityChanged(worker.id, Boolean(availability_status));

    return res.json(worker);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update availability status' });
  }
});

export default router;
