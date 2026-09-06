import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthenticatedRequest, requireRoles } from '../middleware/auth';
import { rankWorker } from '../services/matchingService';
import { processBookingPayout } from '../services/payoutService';
import {
  emitNewServiceRequest,
  emitRequestAccepted,
  emitRequestConfirmed,
  emitRequestStatusUpdate,
  emitWorkerDeclined
} from '../socket';

const router = Router();
const prisma = new PrismaClient();

// Multipliers configuration
export const WORK_LEVEL_MULTIPLIERS: Record<string, number> = {
  LOW: 1.0,
  MODERATE: 1.5,
  HIGH: 2.0
};

// 1. Create a raised service request (Customer)
router.post('/', authenticateJWT, requireRoles(['CUSTOMER', 'COOP_ADMIN', 'GOV_ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category_id, category_name, problem_type, work_level, scheduled_time, address, instructions } = req.body;

    if (!category_id || !problem_type || !address) {
      return res.status(400).json({ error: 'category_id, problem_type, and address are required' });
    }

    let category = await prisma.serviceCategory.findUnique({
      where: { id: category_id }
    });

    if (!category) {
      if (category_name) {
        category = await prisma.serviceCategory.findFirst({
          where: { name: { contains: category_name } }
        });
      }
      if (!category) {
        const fallbackNameMap: Record<string, string> = {
          'cat-1': 'Cleaning',
          'cat-2': 'Plumbing',
          'cat-3': 'Electrical',
          'cat-4': 'Tutoring',
          'cat-5': 'Caregiving',
          'cat-6': 'Appliance'
        };
        const kw = fallbackNameMap[category_id];
        if (kw) {
          category = await prisma.serviceCategory.findFirst({
            where: { name: { contains: kw } }
          });
        }
      }
      if (!category) {
        category = await prisma.serviceCategory.findFirst();
      }
    }

    if (!category) {
      return res.status(404).json({ error: 'Service category not found' });
    }

    const level = (work_level || 'LOW').toUpperCase();
    const multiplier = WORK_LEVEL_MULTIPLIERS[level] || 1.0;
    const amount = Number((category.base_rate * multiplier).toFixed(2));

    const scheduledDate = new Date(scheduled_time || Date.now());
    if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() < Date.now() - 60000) {
      return res.status(400).json({ error: 'Scheduled date and time cannot be in the past' });
    }

    // Ensure customer user exists in database to prevent Foreign Key constraint errors
    let customerUser = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!customerUser && req.user!.phone) {
      customerUser = await prisma.user.findFirst({
        where: { phone: req.user!.phone }
      });
    }

    if (!customerUser) {
      customerUser = await prisma.user.create({
        data: {
          id: req.user!.id,
          name: req.user!.name || 'Customer User',
          phone: req.user!.phone || `user_${Date.now()}`,
          role: req.user!.role || 'CUSTOMER',
          lang_pref: 'EN'
        }
      });
    }

    // Duplicate check: block ONLY if customer has an open request matching ALL of: category_id, problem_type, address, AND scheduled_time
    const scheduledTimeMs = scheduledDate.getTime();
    const existingRequests = await prisma.serviceRequest.findMany({
      where: {
        customer_id: customerUser.id,
        category_id: category.id,
        problem_type,
        address,
        status: { in: ['RAISED', 'CONFIRMED', 'IN_PROGRESS'] }
      }
    });

    const isExactDuplicate = existingRequests.some(r => {
      const diffMs = Math.abs(new Date(r.scheduled_time).getTime() - scheduledTimeMs);
      return diffMs < 60000; // Exact scheduled time match within 1 minute
    });

    if (isExactDuplicate) {
      return res.status(400).json({ error: 'You already have an open request for this exact service, location, and scheduled time.' });
    }

    const request = await prisma.serviceRequest.create({
      data: {
        customer_id: customerUser.id,
        category_id: category.id,
        problem_type,
        work_level: level,
        amount,
        scheduled_time: scheduledDate,
        address,
        instructions: instructions || '',
        status: 'RAISED'
      },
      include: {
        category: true,
        customer: { select: { id: true, name: true, phone: true } }
      }
    });

    emitNewServiceRequest(request);

    return res.status(201).json(request);
  } catch (err) {
    console.error('Create request error:', err);
    return res.status(500).json({ error: 'Failed to create service request' });
  }
});

// 2. Query live online workers count
router.get('/online-workers', async (req, res) => {
  try {
    const { categoryId, categoryName, problemType } = req.query;

    const availableWorkers = await prisma.worker.findMany({
      where: {
        availability_status: true,
        verification_status: 'VERIFIED',
        cooperative: {
          status: 'APPROVED'
        }
      },
      include: {
        cooperative: true
      }
    });

    // Check if worker skills match category or problem type
    const queryCat = (categoryName as string || '').toLowerCase();
    const queryProb = (problemType as string || '').toLowerCase();

    let matching = availableWorkers;
    if (queryProb || queryCat) {
      matching = availableWorkers.filter(w => {
        const skillsLower = (w.skills || '').toLowerCase();
        if (queryProb && skillsLower.includes(queryProb)) return true;
        if (queryCat && skillsLower.includes(queryCat)) return true;
        return false;
      });
    }

    return res.json({
      count: matching.length,
      categoryName: categoryName || null,
      problemType: problemType || null
    });
  } catch (err) {
    console.error('Online workers count error:', err);
    return res.status(500).json({ error: 'Failed to count online workers' });
  }
});

// 3. Get customer's raised requests (Customer view with dynamic cards up to 5)
router.get('/mine', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const requests = await prisma.serviceRequest.findMany({
      where: { customer_id: userId },
      include: {
        category: true,
        selected_worker: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
            cooperative: { select: { id: true, name: true, district: true, state: true } }
          }
        },
        acceptances: {
          where: {
            status: { in: ['ACCEPTED', 'CONFIRMED'] }
          },
          include: {
            worker: {
              include: {
                user: { select: { id: true, name: true, phone: true } },
                cooperative: { select: { id: true, name: true, district: true, state: true } }
              }
            }
          },
          orderBy: { created_at: 'asc' }
        },
        booking: {
          include: {
            rating: true,
            payout: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Process and enrich requests for customer
    const enriched = requests.map(reqItem => {
      // Reward fastest workers: strictly cap at first 5 accepted workers
      const cappedAcceptances = reqItem.acceptances.slice(0, 5).map(acc => {
        const rank = rankWorker(acc.worker, 28.6139, 77.2090, reqItem.category.name);
        return {
          id: acc.id,
          worker_id: acc.worker_id,
          status: acc.status,
          created_at: acc.created_at,
          worker: {
            ...acc.worker,
            matchScore: rank.matchScore,
            matchBreakdown: rank.breakdown
          }
        };
      });

      // Check if open > 24 hours with 0 acceptances
      const hoursSinceCreation = (Date.now() - new Date(reqItem.created_at).getTime()) / (1000 * 60 * 60);
      const showWaitingNotice = reqItem.status === 'RAISED' && reqItem.acceptances.length === 0 && hoursSinceCreation >= 24;

      // Construct timeline items
      const timeline: Array<{
        step: string;
        title: string;
        timestamp: Date;
        description: string;
      }> = [
        {
          step: 'RAISED',
          title: 'Request Raised',
          timestamp: reqItem.created_at,
          description: `Broadcast to ${reqItem.category.name} workers for "${reqItem.problem_type}"`
        }
      ];

      // Add individual worker acceptance timestamps
      reqItem.acceptances.forEach(acc => {
        timeline.push({
          step: 'WORKER_ACCEPTED',
          title: `${acc.worker.user?.name || 'Worker'} Accepted`,
          timestamp: acc.created_at,
          description: `Accepted request (${acc.worker.cooperative?.name || 'Cooperative'})`
        });
      });

      // Work started
      if (reqItem.work_started_at) {
        timeline.push({
          step: 'WORK_STARTED',
          title: 'Work In Progress',
          timestamp: reqItem.work_started_at,
          description: `Started by ${reqItem.selected_worker?.user?.name || 'Confirmed Worker'}`
        });
      }

      // Work completed
      if (reqItem.work_completed_at) {
        timeline.push({
          step: 'WORK_COMPLETED',
          title: 'Work Completed',
          timestamp: reqItem.work_completed_at,
          description: 'Service completed successfully'
        });
      }

      // Cancellation if applicable
      if (reqItem.status === 'CANCELLED') {
        timeline.push({
          step: 'CANCELLED',
          title: 'Request Cancelled',
          timestamp: reqItem.work_completed_at || reqItem.created_at,
          description: `Reason: ${reqItem.cancellation_reason || 'Cancelled'} (by ${reqItem.cancelled_by || 'Customer'})`
        });
      }

      // Sort timeline chronologically
      timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return {
        ...reqItem,
        acceptedWorkers: cappedAcceptances,
        totalAcceptedCount: reqItem.acceptances.length,
        showWaitingNotice,
        timeline
      };
    });

    return res.json(enriched);
  } catch (err) {
    console.error('Fetch customer requests error:', err);
    return res.status(500).json({ error: 'Failed to fetch customer requests' });
  }
});

// 4. Worker requests feed (Worker sees requests relevant to their field with status & payout)
router.get('/worker-feed', authenticateJWT, requireRoles(['WORKER', 'COOP_ADMIN', 'GOV_ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    let worker = await prisma.worker.findUnique({
      where: { user_id: req.user!.id },
      include: { cooperative: true }
    });

    if (!worker && req.user!.phone) {
      const userRec = await prisma.user.findFirst({ where: { phone: req.user!.phone } });
      if (userRec) {
        worker = await prisma.worker.findUnique({
          where: { user_id: userRec.id },
          include: { cooperative: true }
        });
      }
    }

    if (!worker) {
      const defaultCoop = await prisma.cooperative.findFirst({ where: { status: 'APPROVED' } });
      if (defaultCoop) {
        worker = await prisma.worker.create({
          data: {
            user_id: req.user!.id,
            cooperative_id: defaultCoop.id,
            skills: 'General Household Services, Plumbing, Cleaning, Electrical, Tutoring, Caregiving, Appliance Repair',
            verification_status: 'VERIFIED',
            rating_avg: 4.8,
            availability_status: true
          },
          include: { cooperative: true }
        });
      } else {
        return res.status(404).json({ error: 'Worker profile not found' });
      }
    }

    // Duty Status Check (Fix 1): If worker is offline (availability_status === false), return empty feed immediately
    if (!worker.availability_status) {
      return res.json([]);
    }

    const workerSkills = (worker.skills || '').toLowerCase();

    // Fetch all requests
    const allRequests = await prisma.serviceRequest.findMany({
      include: {
        category: true,
        customer: { select: { id: true, name: true, phone: true } },
        acceptances: {
          include: {
            worker: {
              include: {
                user: { select: { id: true, name: true } }
              }
            }
          }
        },
        booking: {
          include: {
            payout: true,
            rating: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Flexible token keyword matching for category & problem type against worker skills
    const isCategoryOrSkillMatch = (reqCatName: string, reqProbType: string, workerSkillsStr: string) => {
      const reqText = `${reqCatName || ''} ${reqProbType || ''}`.toLowerCase();
      const workerText = (workerSkillsStr || '').toLowerCase();

      if (!workerText || workerText.includes('general') || workerText.includes('all')) return true;

      const reqWords = reqText.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && w !== 'services' && w !== 'works');
      const workerWords = workerText.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);

      if (reqWords.length === 0) return true;
      return reqWords.some(rw => workerWords.some(ww => ww.includes(rw) || rw.includes(ww)));
    };

    // Filter requests matching worker skills or category
    const relevantRequests = allRequests.filter(reqItem => {
      const catName = reqItem.category?.name || '';
      const probType = reqItem.problem_type || '';
      const workerAcceptance = reqItem.acceptances.find(a => a.worker_id === worker.id);

      // If worker explicitly declined, filter it out so they don't see it re-offered
      if (workerAcceptance && workerAcceptance.status === 'DECLINED') {
        return false;
      }

      const hasAccepted = workerAcceptance && workerAcceptance.status === 'ACCEPTED';
      if (hasAccepted) return true;

      return isCategoryOrSkillMatch(catName, probType, workerSkills);
    });

    // Map status specifically for this worker
    const feed = relevantRequests.map(reqItem => {
      const workerAcceptance = reqItem.acceptances.find(a => a.worker_id === worker.id);
      
      let workerSpecificStatus = 'Pending';
      let cancellationReason = null;

      if (reqItem.status === 'CANCELLED') {
        workerSpecificStatus = 'Cancelled';
        cancellationReason = reqItem.cancellation_reason;
      } else if (workerAcceptance) {
        if (workerAcceptance.status === 'CANCELLED') {
          workerSpecificStatus = 'Cancelled';
          cancellationReason = workerAcceptance.cancellation_reason;
        } else if (workerAcceptance.status === 'CONFIRMED' || reqItem.selected_worker_id === worker.id) {
          if (reqItem.status === 'IN_PROGRESS') {
            workerSpecificStatus = 'In Progress';
          } else if (reqItem.status === 'PENDING_PRICE_APPROVAL') {
            workerSpecificStatus = 'Pending Price Approval';
          } else if (reqItem.status === 'COMPLETED') {
            workerSpecificStatus = 'Completed';
          } else {
            workerSpecificStatus = 'Confirmed';
          }
        } else if (workerAcceptance.status === 'CLOSED' || (reqItem.selected_worker_id && reqItem.selected_worker_id !== worker.id)) {
          workerSpecificStatus = 'Closed';
        } else if (workerAcceptance.status === 'ACCEPTED') {
          workerSpecificStatus = 'Accepted';
        }
      } else {
        if (reqItem.status === 'RAISED') {
          workerSpecificStatus = 'Pending';
        } else {
          workerSpecificStatus = 'Closed';
        }
      }

      // Compute transparent 80/15/5 payout for worker
      const workerShare = Number((reqItem.amount * 0.80).toFixed(2));
      const coopFund = Number((reqItem.amount * 0.15).toFixed(2));
      const platformFee = Number((reqItem.amount * 0.05).toFixed(2));

      const activeAcceptancesCount = reqItem.acceptances.filter(a => a.status === 'ACCEPTED').length;
      const isQueueFull = activeAcceptancesCount >= 5;

      return {
        id: reqItem.id,
        category: reqItem.category,
        problem_type: reqItem.problem_type,
        work_level: reqItem.work_level,
        amount: reqItem.amount,
        status: reqItem.status,
        proposed_total: reqItem.proposed_total,
        proposed_reason: reqItem.proposed_reason,
        proposed_by: reqItem.proposed_by,
        proposed_at: reqItem.proposed_at,
        price_rejection_note: reqItem.price_rejection_note,
        payoutBreakdown: {
          workerShare,
          coopFund,
          platformFee
        },
        scheduled_time: reqItem.scheduled_time,
        address: reqItem.address,
        instructions: reqItem.instructions,
        created_at: reqItem.created_at,
        work_started_at: reqItem.work_started_at,
        work_completed_at: reqItem.work_completed_at,
        customer: reqItem.customer,
        workerSpecificStatus,
        cancellationReason,
        myAcceptance: workerAcceptance || null,
        booking: reqItem.booking,
        activeAcceptancesCount,
        isQueueFull
      };
    });

    return res.json(feed);
  } catch (err) {
    console.error('Worker feed error:', err);
    return res.status(500).json({ error: 'Failed to fetch worker feed' });
  }
});

// 5. Worker accepts a raised service request (No expiry/timeout)
router.post('/:id/accept', authenticateJWT, requireRoles(['WORKER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = req.params.id;
    const worker = await prisma.worker.findUnique({
      where: { user_id: req.user!.id },
      include: { user: { select: { name: true } } }
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { customer: true }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'RAISED') {
      return res.status(400).json({ error: `Request cannot be accepted (current status: ${request.status})` });
    }

    // Check if worker already accepted
    const existing = await prisma.requestAcceptance.findUnique({
      where: {
        request_id_worker_id: {
          request_id: requestId,
          worker_id: worker.id
        }
      }
    });

    // Check total accepted count before creating new acceptance
    const acceptedCount = await prisma.requestAcceptance.count({
      where: {
        request_id: requestId,
        status: 'ACCEPTED'
      }
    });

    if (acceptedCount >= 5 && (!existing || existing.status !== 'ACCEPTED')) {
      return res.status(400).json({ error: 'Queue is full right now (5 workers accepted). Wait for cancellation.' });
    }

    let acceptance;
    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return res.json(existing);
      }
      acceptance = await prisma.requestAcceptance.update({
        where: { id: existing.id },
        data: {
          status: 'ACCEPTED',
          cancellation_reason: null,
          cancelled_at: null,
          created_at: new Date()
        }
      });
    } else {
      acceptance = await prisma.requestAcceptance.create({
        data: {
          request_id: requestId,
          worker_id: worker.id,
          status: 'ACCEPTED',
          created_at: new Date()
        }
      });
    }

    // Track total accepted requests and recalculate worker reliability score
    if (!existing || existing.status !== 'ACCEPTED') {
      await prisma.worker.update({
        where: { id: worker.id },
        data: {
          total_accepted_requests: { increment: 1 }
        }
      });
      const freshWorker = await prisma.worker.findUnique({ where: { id: worker.id } });
      if (freshWorker) {
        const accepted = freshWorker.total_accepted_requests || 1;
        const declined = freshWorker.total_declined_requests || 0;
        const relRatio = Math.max(0, Math.min(1, 1 - (declined / accepted)));
        await prisma.worker.update({
          where: { id: worker.id },
          data: {
            reliability_score: Number((relRatio * 100).toFixed(1))
          }
        });
      }
    }

    const totalAccepted = await prisma.requestAcceptance.count({
      where: {
        request_id: requestId,
        status: 'ACCEPTED'
      }
    });

    emitRequestAccepted(requestId, request.customer_id, {
      requestId,
      workerId: worker.id,
      workerName: worker.user.name,
      totalAccepted
    });

    return res.json(acceptance);
  } catch (err) {
    console.error('Accept request error:', err);
    return res.status(500).json({ error: 'Failed to accept request' });
  }
});

// Worker declines a raised service request (removes from active feed pool)
router.post('/:id/decline', authenticateJWT, requireRoles(['WORKER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = req.params.id;
    const worker = await prisma.worker.findUnique({
      where: { user_id: req.user!.id }
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    const existing = await prisma.requestAcceptance.findUnique({
      where: {
        request_id_worker_id: {
          request_id: requestId,
          worker_id: worker.id
        }
      }
    });

    if (existing) {
      await prisma.requestAcceptance.update({
        where: { id: existing.id },
        data: { status: 'DECLINED' }
      });
    } else {
      await prisma.requestAcceptance.create({
        data: {
          request_id: requestId,
          worker_id: worker.id,
          status: 'DECLINED'
        }
      });
    }

    return res.json({ message: 'Request declined successfully' });
  } catch (err) {
    console.error('Decline request error:', err);
    return res.status(500).json({ error: 'Failed to decline request' });
  }
});

// 6. Customer confirms one worker from shown cards (up to 5)
// Immediately closes other accepted workers ("request closed / already fulfilled")
router.post('/:id/confirm', authenticateJWT, requireRoles(['CUSTOMER', 'COOP_ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = req.params.id;
    const { worker_id } = req.body;

    if (!worker_id) {
      return res.status(400).json({ error: 'worker_id is required' });
    }

    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        acceptances: true,
        category: true
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.customer_id !== req.user!.id && req.user!.role === 'CUSTOMER') {
      return res.status(403).json({ error: 'Access denied: only the request owner can confirm a worker' });
    }

    if (request.status !== 'RAISED') {
      return res.status(400).json({ error: `Cannot confirm worker on request with status: ${request.status}` });
    }

    // Verify worker has accepted this request
    const targetAcceptance = request.acceptances.find(a => a.worker_id === worker_id && a.status === 'ACCEPTED');
    if (!targetAcceptance) {
      return res.status(400).json({ error: 'Worker has not accepted this request' });
    }

    // 1. Create linked Booking record for existing payout engine & rating systems
    const booking = await prisma.booking.create({
      data: {
        customer_id: request.customer_id,
        worker_id,
        category_id: request.category_id,
        status: 'ACCEPTED',
        scheduled_time: request.scheduled_time,
        address: request.address,
        instructions: request.instructions,
        amount: request.amount
      }
    });

    // 2. Mark confirmed worker's acceptance as CONFIRMED
    await prisma.requestAcceptance.update({
      where: { id: targetAcceptance.id },
      data: { status: 'CONFIRMED' }
    });

    // 3. Mark all other acceptances as CLOSED
    await prisma.requestAcceptance.updateMany({
      where: {
        request_id: requestId,
        worker_id: { not: worker_id },
        status: 'ACCEPTED'
      },
      data: { status: 'CLOSED' }
    });

    // 4. Update request status to CONFIRMED
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'CONFIRMED',
        selected_worker_id: worker_id,
        booking_id: booking.id
      },
      include: {
        category: true,
        selected_worker: {
          include: {
            user: { select: { name: true, phone: true } },
            cooperative: true
          }
        },
        booking: true
      }
    });

    emitRequestConfirmed(requestId, {
      requestId,
      workerId: worker_id,
      status: 'CONFIRMED',
      message: 'Worker confirmed by customer'
    });

    return res.json(updatedRequest);
  } catch (err) {
    console.error('Confirm worker error:', err);
    return res.status(500).json({ error: 'Failed to confirm worker' });
  }
});

// 7. Confirmed Worker starts work
router.post('/:id/start', authenticateJWT, requireRoles(['WORKER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = req.params.id;
    const worker = await prisma.worker.findUnique({ where: { user_id: req.user!.id } });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request || request.selected_worker_id !== worker.id) {
      return res.status(403).json({ error: 'You are not the confirmed worker for this request' });
    }

    if (request.status !== 'CONFIRMED') {
      return res.status(400).json({ error: `Cannot start work from status: ${request.status}` });
    }

    const now = new Date();
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'IN_PROGRESS',
        work_started_at: now
      }
    });

    if (request.booking_id) {
      await prisma.booking.update({
        where: { id: request.booking_id },
        data: { status: 'IN_PROGRESS' }
      });
    }

    emitRequestStatusUpdate(requestId, {
      status: 'IN_PROGRESS',
      work_started_at: now
    });

    return res.json(updatedRequest);
  } catch (err) {
    console.error('Start work error:', err);
    return res.status(500).json({ error: 'Failed to start work' });
  }
});

// 8. Confirmed Worker finishes work (or requests payout price adjustment)
router.post('/:id/complete', authenticateJWT, requireRoles(['WORKER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = req.params.id;
    const { proposedTotal, proposedReason } = req.body;

    const worker = await prisma.worker.findUnique({ where: { user_id: req.user!.id } });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request || request.selected_worker_id !== worker.id) {
      return res.status(403).json({ error: 'You are not the confirmed worker for this request' });
    }

    if (request.status !== 'IN_PROGRESS' && request.status !== 'PENDING_PRICE_APPROVAL') {
      return res.status(400).json({ error: `Cannot complete work from status: ${request.status}` });
    }

    const numProposed = proposedTotal !== undefined && proposedTotal !== null && proposedTotal !== '' 
      ? Number(proposedTotal) 
      : request.amount;

    const isPriceChanged = Math.abs(numProposed - request.amount) > 0.01;

    // Requirement 3 & 6: If price changed, enter pending-approval state, NEVER complete immediately
    if (isPriceChanged) {
      if (isNaN(numProposed) || numProposed <= 0) {
        return res.status(400).json({ error: 'Revised customer total must be a positive number' });
      }

      if (!proposedReason || !proposedReason.trim()) {
        return res.status(400).json({ error: 'Reason for price change is required when modifying the quoted amount' });
      }

      const updatedRequest = await prisma.serviceRequest.update({
        where: { id: requestId },
        data: {
          status: 'PENDING_PRICE_APPROVAL',
          proposed_total: Number(numProposed.toFixed(2)),
          proposed_reason: proposedReason.trim(),
          proposed_by: worker.id,
          proposed_at: new Date(),
          price_rejection_note: null
        }
      });

      emitRequestStatusUpdate(requestId, {
        status: 'PENDING_PRICE_APPROVAL',
        proposed_total: updatedRequest.proposed_total,
        proposed_reason: updatedRequest.proposed_reason,
        proposed_by: updatedRequest.proposed_by,
        proposed_at: updatedRequest.proposed_at,
        message: 'Worker requested a payout price revision. Awaiting customer approval.'
      });

      return res.json(updatedRequest);
    }

    // Requirement 2: If amount is unchanged, complete immediately
    const now = new Date();
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        work_completed_at: now,
        proposed_total: null,
        proposed_reason: null,
        proposed_by: null,
        proposed_at: null,
        price_rejection_note: null
      }
    });

    // Update booking and trigger 80/15/5 payout calculations!
    let payout = null;
    if (request.booking_id) {
      await prisma.booking.update({
        where: { id: request.booking_id },
        data: { status: 'COMPLETED' }
      });
      payout = await processBookingPayout(request.booking_id);
    }

    emitRequestStatusUpdate(requestId, {
      status: 'COMPLETED',
      work_completed_at: now,
      payout
    });

    return res.json({
      ...updatedRequest,
      payout
    });
  } catch (err) {
    console.error('Complete work error:', err);
    return res.status(500).json({ error: 'Failed to mark work as completed' });
  }
});

// 8a. Customer approves worker's revised price proposal (Requirement 5)
router.post('/:id/approve-price', authenticateJWT, requireRoles(['CUSTOMER', 'COOP_ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = req.params.id;
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.customer_id !== req.user!.id && req.user!.role === 'CUSTOMER') {
      return res.status(403).json({ error: 'Only the request customer can approve price revisions' });
    }

    if (request.status !== 'PENDING_PRICE_APPROVAL' || !request.proposed_total) {
      return res.status(400).json({ error: 'This request is not currently awaiting price revision approval' });
    }

    const newAmount = request.proposed_total;
    const now = new Date();

    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        amount: newAmount,
        status: 'COMPLETED',
        work_completed_at: now,
        price_rejection_note: null
      }
    });

    // Update booking amount and trigger 80/15/5 payout calculation off new total!
    let payout = null;
    if (request.booking_id) {
      await prisma.booking.update({
        where: { id: request.booking_id },
        data: {
          amount: newAmount,
          status: 'COMPLETED'
        }
      });
      payout = await processBookingPayout(request.booking_id);
    }

    emitRequestStatusUpdate(requestId, {
      status: 'COMPLETED',
      amount: newAmount,
      work_completed_at: now,
      payout,
      message: `Price revision of ₹${newAmount.toFixed(2)} approved by customer. Job marked completed.`
    });

    return res.json({
      ...updatedRequest,
      payout
    });
  } catch (err) {
    console.error('Approve price error:', err);
    return res.status(500).json({ error: 'Failed to approve price revision' });
  }
});

// 8b. Customer rejects worker's revised price proposal (Requirement 5)
router.post('/:id/reject-price', authenticateJWT, requireRoles(['CUSTOMER', 'COOP_ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = req.params.id;
    const { reason } = req.body;

    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.customer_id !== req.user!.id && req.user!.role === 'CUSTOMER') {
      return res.status(403).json({ error: 'Only the request customer can reject price revisions' });
    }

    if (request.status !== 'PENDING_PRICE_APPROVAL') {
      return res.status(400).json({ error: 'This request is not currently awaiting price revision approval' });
    }

    const rejectionNote = (reason && reason.trim()) || `Customer rejected proposed price revision of ₹${request.proposed_total?.toFixed(2)}.`;

    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'IN_PROGRESS',
        price_rejection_note: rejectionNote
      }
    });

    emitRequestStatusUpdate(requestId, {
      status: 'IN_PROGRESS',
      price_rejection_note: rejectionNote,
      message: 'Customer rejected the price revision. Request returned to in-progress state.'
    });

    return res.json(updatedRequest);
  } catch (err) {
    console.error('Reject price error:', err);
    return res.status(500).json({ error: 'Failed to reject price revision' });
  }
});

// 9. Customer cancels request before work starts (Required reason captured and stored)
router.post('/:id/cancel', authenticateJWT, requireRoles(['CUSTOMER', 'COOP_ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = req.params.id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A cancellation reason is required' });
    }

    const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.customer_id !== req.user!.id && req.user!.role === 'CUSTOMER') {
      return res.status(403).json({ error: 'Access denied: only request owner can cancel' });
    }

    if (request.status === 'IN_PROGRESS' || request.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot cancel request after work has started' });
    }

    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
        cancellation_reason: reason.trim(),
        cancelled_by: 'CUSTOMER'
      }
    });

    // Close all acceptances
    await prisma.requestAcceptance.updateMany({
      where: { request_id: requestId },
      data: { status: 'CLOSED' }
    });

    // If linked booking exists, cancel it
    if (request.booking_id) {
      await prisma.booking.update({
        where: { id: request.booking_id },
        data: { status: 'CANCELLED' }
      });
    }

    emitRequestStatusUpdate(requestId, {
      status: 'CANCELLED',
      cancellation_reason: reason.trim(),
      cancelled_by: 'CUSTOMER'
    });

    return res.json(updatedRequest);
  } catch (err) {
    console.error('Customer cancel error:', err);
    return res.status(500).json({ error: 'Failed to cancel request' });
  }
});

// 10. Worker cancels acceptance/confirmation before work starts (Reason captured and stored)
router.post('/:id/worker-cancel', authenticateJWT, requireRoles(['WORKER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = req.params.id;
    const { reason, notes } = req.body;
    const declineReason = (reason && reason.trim()) || 'Not available now';
    const fullReason = notes && notes.trim() ? `${declineReason}: ${notes.trim()}` : declineReason;

    const worker = await prisma.worker.findUnique({
      where: { user_id: req.user!.id },
      include: { user: { select: { name: true } } }
    });
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status === 'IN_PROGRESS' || request.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot cancel after work has started' });
    }

    // Update worker's acceptance to CANCELLED
    await prisma.requestAcceptance.updateMany({
      where: {
        request_id: requestId,
        worker_id: worker.id
      },
      data: {
        status: 'CANCELLED',
        cancellation_reason: fullReason,
        cancelled_at: new Date()
      }
    });

    // Increment worker's total_declined_requests and recalculate reliability score
    await prisma.worker.update({
      where: { id: worker.id },
      data: {
        total_declined_requests: { increment: 1 }
      }
    });

    const freshWorker = await prisma.worker.findUnique({ where: { id: worker.id } });
    if (freshWorker) {
      const accepted = freshWorker.total_accepted_requests || 1;
      const declined = freshWorker.total_declined_requests || 0;
      const relRatio = Math.max(0, Math.min(1, 1 - (declined / accepted)));
      await prisma.worker.update({
        where: { id: worker.id },
        data: {
          reliability_score: Number((relRatio * 100).toFixed(1))
        }
      });
    }

    // If this worker was already confirmed, revert request to RAISED so other workers can be confirmed
    if (request.selected_worker_id === worker.id) {
      await prisma.serviceRequest.update({
        where: { id: requestId },
        data: {
          status: 'RAISED',
          selected_worker_id: null,
          cancellation_reason: `Worker cancelled: ${fullReason}`,
          cancelled_by: 'WORKER'
        }
      });

      if (request.booking_id) {
        await prisma.booking.update({
          where: { id: request.booking_id },
          data: { status: 'CANCELLED' }
        });
      }
    }

    // Emit decline notification to customer and global updates
    emitWorkerDeclined(requestId, request.customer_id, {
      workerId: worker.id,
      workerName: worker.user.name,
      reason: fullReason
    });

    emitRequestStatusUpdate(requestId, {
      type: 'WORKER_CANCELLED',
      workerId: worker.id,
      reason: fullReason
    });

    return res.json({ success: true, message: 'Acceptance cancelled', reason: fullReason });
  } catch (err) {
    console.error('Worker cancel error:', err);
    return res.status(500).json({ error: 'Failed to cancel worker acceptance' });
  }
});

// 11. Post-completion rating
router.post('/:id/rate', authenticateJWT, requireRoles(['CUSTOMER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = req.params.id;
    const { score, comment } = req.body;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ error: 'Score must be between 1 and 5' });
    }

    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { booking: true }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.customer_id !== req.user!.id) {
      return res.status(403).json({ error: 'Only the request customer can submit a rating' });
    }

    if (!request.selected_worker_id) {
      return res.status(400).json({ error: 'No confirmed worker on this request' });
    }

    if (!request.booking_id) {
      return res.status(400).json({ error: 'No associated booking found for rating' });
    }

    const rating = await prisma.rating.upsert({
      where: { booking_id: request.booking_id },
      update: { score: parseInt(score), comment },
      create: {
        booking_id: request.booking_id,
        score: parseInt(score),
        comment
      }
    });

    // Recalculate worker rating_avg
    const allRatings = await prisma.rating.findMany({
      where: {
        booking: { worker_id: request.selected_worker_id }
      }
    });

    const avgScore = allRatings.reduce((acc, curr) => acc + curr.score, 0) / (allRatings.length || 1);
    await prisma.worker.update({
      where: { id: request.selected_worker_id },
      data: { rating_avg: Number(avgScore.toFixed(2)) }
    });

    return res.json(rating);
  } catch (err) {
    console.error('Rating request error:', err);
    return res.status(500).json({ error: 'Failed to submit rating' });
  }
});

export default router;
