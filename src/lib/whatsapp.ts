import type { ReservationService } from '@/types';

export function generateWhatsAppLink(
  whatsappNumber: string,
  customerName: string,
  customerPhone: string,
  services: ReservationService[],
  date: string,
  time: string
): string {
  const servicesList = services
    .map((s) => `- ${s.nameAr} (${s.quantity}x)`)
    .join('\n');

  const message = `حجز جديد 🚗
العميل: ${customerName}
الهاتف: ${customerPhone}
التاريخ: ${date}
الوقت: ${time}
الخدمات:
${servicesList}`;

  const encodedMessage = encodeURIComponent(message);
  const cleanNumber = whatsappNumber.replace(/[^0-9+]/g, '');

  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
}
