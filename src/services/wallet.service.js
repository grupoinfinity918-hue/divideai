const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const HOLD_DAYS = 15;

async function creditSaleHeld(sellerId, orderId, netToSeller) {
  const wallet = await prisma.wallet.upsert({
    where: { userId: sellerId },
    update: {},
    create: { userId: sellerId }
  });

  const releaseAt = new Date();
  releaseAt.setDate(releaseAt.getDate() + HOLD_DAYS);

  await prisma.$transaction([
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        orderId,
        type: 'SALE_HOLD',
        status: 'HELD',
        amount: netToSeller,
        releaseAt
      }
    }),
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balanceHeld: { increment: netToSeller } }
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { holdReleaseAt: releaseAt }
    })
  ]);
}

async function releaseMaturedHolds() {
  const now = new Date();
  const matured = await prisma.walletTransaction.findMany({
    where: { type: 'SALE_HOLD', status: 'HELD', releaseAt: { lte: now } }
  });

  for (const tx of matured) {
    await prisma.$transaction([
      prisma.walletTransaction.update({
        where: { id: tx.id },
        data: { status: 'RELEASED' }
      }),
      prisma.wallet.update({
        where: { id: tx.walletId },
        data: {
          balanceHeld: { decrement: tx.amount },
          balanceFree: { increment: tx.amount }
        }
      })
    ]);
  }

  return matured.length;
}

async function reverseHoldOnBan(sellerId) {
  const wallet = await prisma.wallet.findUnique({ where: { userId: sellerId } });
  if (!wallet) return 0;

  const held = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id, type: 'SALE_HOLD', status: 'HELD' }
  });

  for (const tx of held) {
    await prisma.$transaction([
      prisma.walletTransaction.update({
        where: { id: tx.id },
        data: { status: 'REVERSED' }
      }),
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balanceHeld: { decrement: tx.amount } }
      }),
      prisma.order.update({
        where: { id: tx.orderId },
        data: { status: 'REFUNDED' }
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          orderId: tx.orderId,
          type: 'REFUND',
          status: 'RELEASED',
          amount: tx.amount
        }
      })
    ]);
  }

  return held.length;
}

module.exports = { creditSaleHeld, releaseMaturedHolds, reverseHoldOnBan, HOLD_DAYS };
