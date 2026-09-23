const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const META_API_URL = `https://graph.facebook.com/v20.0/${process.env.META_PHONE_ID}/messages`;
const META_TOKEN = process.env.META_WHATSAPP_TOKEN;

async function sendWhatsapp(orderId, event, toPhone, templateName, params) {
  const notif = await prisma.whatsappNotification.create({
    data: { orderId, event, toPhone }
  });

  try {
    const res = await fetch(META_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${META_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'pt_BR' },
          components: [
            {
              type: 'body',
              parameters: params.map(p => ({ type: 'text', text: String(p) }))
            }
          ]
        }
      })
    });

    const ok = res.ok;
    await prisma.whatsappNotification.update({
      where: { id: notif.id },
      data: { sentAt: new Date(), success: ok }
    });
    return ok;
  } catch (err) {
    await prisma.whatsappNotification.update({
      where: { id: notif.id },
      data: { sentAt: new Date(), success: false }
    });
    return false;
  }
}

async function notifySellerPixConfirmed(order, sellerPhone) {
  return sendWhatsapp(
    order.id,
    'PIX_CONFIRMED_SELLER',
    sellerPhone,
    'pix_confirmado_vendedor',
    [order.protocol, order.amount.toString()]
  );
}

async function notifyClientDelivered(order, clientPhone) {
  return sendWhatsapp(
    order.id,
    'DELIVERY_CONFIRMED_CLIENT',
    clientPhone,
    'entrega_confirmada_cliente',
    [order.protocol]
  );
}

module.exports = { notifySellerPixConfirmed, notifyClientDelivered };
