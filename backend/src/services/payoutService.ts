import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function processBookingPayout(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      worker: {
        include: {
          cooperative: true
        }
      }
    }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Check if payout already exists
  const existingPayout = await prisma.payout.findUnique({
    where: { booking_id: bookingId }
  });

  if (existingPayout) {
    return existingPayout;
  }

  const amount = booking.amount;
  const platform_fee = Number((amount * 0.05).toFixed(2));
  const cooperative_share = Number((amount * 0.15).toFixed(2));
  const worker_share = Number((amount * 0.80).toFixed(2));

  // Perform transaction: create payout record and increment coop fund balance
  const [payout] = await prisma.$transaction([
    prisma.payout.create({
      data: {
        booking_id: bookingId,
        platform_fee,
        cooperative_share,
        worker_share,
        status: 'RELEASED'
      }
    }),
    prisma.cooperative.update({
      where: { id: booking.worker.cooperative_id },
      data: {
        fund_balance: {
          increment: cooperative_share
        }
      }
    })
  ]);

  return payout;
}
