import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'sahakar_connect_secret_key_sih_2026_ps_26089';

// Request OTP
router.post('/otp/request', async (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Mock OTP generator
  const otp = '123456';
  console.log(`[AUTH OTP DEV LOG] Generated OTP for ${phone}: ${otp}`);

  return res.json({
    message: 'OTP sent successfully (Dev Mode)',
    phone,
    otp // returned in response for seamless hackathon testing
  });
});

// Verify OTP & return JWT
router.post('/otp/verify', async (req: Request, res: Response) => {
  const { phone, otp, role, name, cooperative_id, skills } = req.body;

  const cleanPhone = (phone || '').trim();
  if (!cleanPhone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  // In dev mode, accept 123456 or any 6-digit OTP
  if (otp !== '123456' && otp.length !== 6) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: cleanPhone },
        { id: cleanPhone }
      ]
    },
    include: {
      workerProfile: {
        include: {
          cooperative: true
        }
      }
    }
  });

  const requestedRole = role || 'CUSTOMER';

  // If user doesn't exist, create user profile
  if (!user) {
    const userName = name || (cleanPhone.includes('@') ? cleanPhone.split('@')[0] : `User ${cleanPhone.slice(-4)}`);

    try {
      user = await prisma.user.create({
        data: {
          phone: cleanPhone,
          role: requestedRole,
          name: userName,
          lang_pref: 'EN'
        },
        include: {
          workerProfile: {
            include: {
              cooperative: true
            }
          }
        }
      });
    } catch (e) {
      user = await prisma.user.findFirst({
        where: { phone: cleanPhone },
        include: {
          workerProfile: {
            include: {
              cooperative: true
            }
          }
        }
      });
    }
  } else if (role && user.role !== role) {
    // If user exists but requested a different role on login, update user role
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: requestedRole },
      include: {
        workerProfile: {
          include: {
            cooperative: true
          }
        }
      }
    });
  }

  // If role is WORKER, create associated worker profile if not already present
  if (user && user.role === 'WORKER' && !user.workerProfile) {
    let targetCoopId = cooperative_id;
    if (!targetCoopId) {
      const defaultCoop = await prisma.cooperative.findFirst({ where: { status: 'APPROVED' } });
      targetCoopId = defaultCoop ? defaultCoop.id : undefined;
    }

    if (targetCoopId) {
      try {
        await prisma.worker.create({
          data: {
            user_id: user.id,
            cooperative_id: targetCoopId,
            skills: skills || 'General Household Services, Plumbing, Repair',
            verification_status: 'VERIFIED',
            rating_avg: 4.8,
            availability_status: true,
            lat: 28.6139,
            lng: 77.2090
          }
        });
      } catch (e) {
        console.warn('Worker profile creation skipped or already exists for user:', user.id);
      }

      // Refetch user with worker profile
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          workerProfile: {
            include: {
              cooperative: true
            }
          }
        }
      }) as any;
    }
  }

  const token = jwt.sign(
    {
      id: user!.id,
      phone: user!.phone,
      role: user!.role,
      name: user!.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    user: {
      id: user!.id,
      name: user!.name,
      phone: user!.phone,
      role: user!.role,
      lang_pref: user!.lang_pref,
      workerProfile: user!.workerProfile
    }
  });
});

export default router;
