import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all service categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.serviceCategory.findMany({
      include: {
        cooperative: {
          select: {
            id: true,
            name: true,
            district: true
          }
        }
      }
    });
    return res.json(categories);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch service categories' });
  }
});

export default router;
