import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthenticatedRequest, requireRoles } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all cooperatives
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cooperatives = await prisma.cooperative.findMany({
      include: {
        admin: { select: { id: true, name: true, phone: true } },
        workers: {
          include: {
            user: { select: { name: true, phone: true } }
          }
        },
        serviceCategories: true,
        proposals: true
      },
      orderBy: { created_at: 'desc' }
    });
    return res.json(cooperatives);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch cooperatives' });
  }
});

// Create a cooperative (Admin / Gov)
router.post('/', authenticateJWT, requireRoles(['COOP_ADMIN', 'GOV_ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, registration_no, district, state } = req.body;

    if (!name || !registration_no || !district || !state) {
      return res.status(400).json({ error: 'Missing required cooperative fields' });
    }

    const coop = await prisma.cooperative.create({
      data: {
        name,
        registration_no,
        district,
        state,
        admin_user_id: req.user!.id,
        status: req.user!.role === 'GOV_ADMIN' ? 'APPROVED' : 'PENDING'
      }
    });

    return res.status(201).json(coop);
  } catch (err) {
    console.error('Create coop error:', err);
    return res.status(500).json({ error: 'Failed to register cooperative' });
  }
});

// Get single cooperative
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const coop = await prisma.cooperative.findUnique({
      where: { id: req.params.id },
      include: {
        admin: { select: { id: true, name: true, phone: true } },
        workers: {
          include: {
            user: { select: { name: true, phone: true } },
            bookings: { select: { id: true, amount: true, status: true } }
          }
        },
        serviceCategories: true,
        proposals: {
          include: {
            votes: true
          }
        }
      }
    });

    if (!coop) {
      return res.status(404).json({ error: 'Cooperative not found' });
    }

    return res.json(coop);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch cooperative details' });
  }
});

// Update cooperative status (Gov admin only)
router.patch('/:id/status', authenticateJWT, requireRoles(['GOV_ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const coop = await prisma.cooperative.update({
      where: { id: req.params.id },
      data: { status }
    });

    return res.json(coop);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update cooperative status' });
  }
});

// Add worker member to cooperative (Coop admin)
router.post('/:id/members', authenticateJWT, requireRoles(['COOP_ADMIN', 'GOV_ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, phone, skills } = req.body;
    const coopId = req.params.id;

    if (!phone || !name) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          phone,
          role: 'WORKER'
        }
      });
    }

    let worker = await prisma.worker.findUnique({ where: { user_id: user.id } });
    if (!worker) {
      worker = await prisma.worker.create({
        data: {
          user_id: user.id,
          cooperative_id: coopId,
          skills: skills || 'Household Services',
          verification_status: 'VERIFIED',
          rating_avg: 5.0,
          availability_status: true,
          lat: 28.6139,
          lng: 77.2090
        }
      });
    } else {
      worker = await prisma.worker.update({
        where: { id: worker.id },
        data: {
          cooperative_id: coopId,
          verification_status: 'VERIFIED'
        }
      });
    }

    return res.status(201).json(worker);
  } catch (err) {
    console.error('Add member error:', err);
    return res.status(500).json({ error: 'Failed to add worker member' });
  }
});

// Update/Set service category rates for cooperative
router.patch('/:id/rates', authenticateJWT, requireRoles(['COOP_ADMIN', 'GOV_ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, base_rate } = req.body;
    const coopId = req.params.id;

    const category = await prisma.serviceCategory.create({
      data: {
        name,
        description: description || '',
        base_rate: parseFloat(base_rate),
        cooperative_id: coopId
      }
    });

    return res.json(category);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update category rates' });
  }
});

export default router;
