import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthenticatedRequest, requireRoles } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Create proposal for a cooperative
router.post('/cooperatives/:id/proposals', authenticateJWT, requireRoles(['COOP_ADMIN', 'GOV_ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, options, deadline } = req.body;
    const coopId = req.params.id;

    if (!title || !description || !options) {
      return res.status(400).json({ error: 'Title, description, and options are required' });
    }

    const formattedOptions = Array.isArray(options) ? options.join(',') : options;

    const proposal = await prisma.proposal.create({
      data: {
        cooperative_id: coopId,
        title,
        description,
        options: formattedOptions,
        deadline: deadline ? new Date(deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // default 7 days
        status: 'OPEN'
      }
    });

    return res.status(201).json(proposal);
  } catch (err) {
    console.error('Create proposal error:', err);
    return res.status(500).json({ error: 'Failed to create proposal' });
  }
});

// Get proposals for a cooperative
router.get('/cooperatives/:id/proposals', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const coopId = req.params.id;
    const proposals = await prisma.proposal.findMany({
      where: { cooperative_id: coopId },
      include: {
        votes: {
          include: {
            worker: {
              include: { user: { select: { name: true } } }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Format proposals with calculated vote breakdown
    const formatted = proposals.map(p => {
      const optionsList = p.options.split(',').map(o => o.trim());
      const totalVotes = p.votes.length;
      const tally: Record<string, number> = {};
      optionsList.forEach(opt => { tally[opt] = 0; });
      p.votes.forEach(v => {
        if (tally[v.choice] !== undefined) {
          tally[v.choice] += 1;
        } else {
          tally[v.choice] = 1;
        }
      });

      const optionsBreakdown = optionsList.map(opt => ({
        option: opt,
        votes: tally[opt] || 0,
        percentage: totalVotes > 0 ? Number(((tally[opt] || 0) / totalVotes * 100).toFixed(1)) : 0
      }));

      return {
        ...p,
        optionsList,
        totalVotes,
        optionsBreakdown
      };
    });

    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

// Cast vote on a proposal (Worker member only, 1 vote limit)
router.post('/proposals/:id/vote', authenticateJWT, requireRoles(['WORKER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { choice } = req.body;
    const proposalId = req.params.id;
    const userId = req.user!.id;

    if (!choice) {
      return res.status(400).json({ error: 'Voting choice is required' });
    }

    // Find worker profile for current user
    const worker = await prisma.worker.findUnique({ where: { user_id: userId } });
    if (!worker) {
      return res.status(403).json({ error: 'Only registered worker members can vote on proposals' });
    }

    const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (proposal.cooperative_id !== worker.cooperative_id) {
      return res.status(403).json({ error: 'You can only vote on proposals within your cooperative' });
    }

    if (proposal.status !== 'OPEN') {
      return res.status(400).json({ error: 'This proposal is closed for voting' });
    }

    // Enforce 1 member 1 vote using upsert/unique constraint
    const vote = await prisma.vote.upsert({
      where: {
        proposal_id_worker_id: {
          proposal_id: proposalId,
          worker_id: worker.id
        }
      },
      update: { choice },
      create: {
        proposal_id: proposalId,
        worker_id: worker.id,
        choice
      }
    });

    return res.json({ message: 'Vote recorded successfully', vote });
  } catch (err) {
    console.error('Voting error:', err);
    return res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Get proposal results
router.get('/proposals/:id/results', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
      include: { votes: true }
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const optionsList = proposal.options.split(',').map(o => o.trim());
    const totalVotes = proposal.votes.length;
    const tally: Record<string, number> = {};
    optionsList.forEach(opt => { tally[opt] = 0; });
    proposal.votes.forEach(v => {
      tally[v.choice] = (tally[v.choice] || 0) + 1;
    });

    const breakdown = optionsList.map(opt => ({
      option: opt,
      votes: tally[opt] || 0,
      percentage: totalVotes > 0 ? Number(((tally[opt] || 0) / totalVotes * 100).toFixed(1)) : 0
    }));

    return res.json({
      proposalId: proposal.id,
      title: proposal.title,
      totalVotes,
      status: proposal.status,
      breakdown
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch proposal results' });
  }
});

export default router;
