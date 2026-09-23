const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function calculateCommission(sellerId, listingOrigin, amount) {
  const value = Number(amount);

  if (listingOrigin === 'OWN') {
    return { commissionAmt: 0, netToSeller: value };
  }

  const tiers = await prisma.commissionTier.findMany({
    where: { sellerId },
    orderBy: { minValue: 'asc' }
  });

  const tier = tiers.find(t => value >= Number(t.minValue) && value <= Number(t.maxValue));

  if (!tier) {
    return { commissionAmt: 0, netToSeller: value };
  }

  let commissionAmt;
  if (tier.mode === 'FIXED') {
    commissionAmt = Number(tier.value);
  } else {
    commissionAmt = round2(value * (Number(tier.value) / 100));
  }

  commissionAmt = Math.min(commissionAmt, value);
  const netToSeller = round2(value - commissionAmt);

  return { commissionAmt: round2(commissionAmt), netToSeller };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { calculateCommission };
