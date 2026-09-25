const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function calculateCommission(sellerId, listingOrigin, amount) {
  const value = Number(amount);

  // Produtos próprios da plataforma não geram comissão para vendedor.
  if (listingOrigin === 'OWN') {
    return { commissionAmt: 0, netToSeller: value };
  }

  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { customCommissionRate: true }
  });

  // 5% é apenas o padrão para vendedores sem uma configuração diferente.
  const rate = seller?.customCommissionRate == null
    ? 5
    : Number(seller.customCommissionRate);

  const safeRate = Math.max(0, Math.min(100, rate));
  const commissionAmt = Math.min(
    round2(value * (safeRate / 100)),
    value
  );
  const netToSeller = round2(value - commissionAmt);

  return { commissionAmt: round2(commissionAmt), netToSeller };
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

module.exports = { calculateCommission };
