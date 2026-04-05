import type { Invoice } from '@/types';

export function initializeMoyasarPayment(invoice: Invoice, publishableKey: string): void {
  // Moyasar widget initialization
  const script = document.createElement('script');
  script.src = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.js';
  script.onload = () => {
    const Moyasar = (window as unknown as { Moyasar: { init: (config: unknown) => void } }).Moyasar;
    Moyasar.init({
      element: '#moyasar-payment',
      amount: Math.round(invoice.grandTotal * 100), // Moyasar uses smallest unit (halalas)
      currency: 'SAR',
      description: `Invoice ${invoice.invoiceNumber || invoice.id}`,
      publishable_api_key: publishableKey,
      callback_url: `${window.location.origin}/payment/callback`,
      metadata: {
        invoiceId: invoice.id,
        tenantId: import.meta.env.VITE_TENANT_ID,
      },
      methods: ['creditcard', 'stcpay', 'applepay'],
    });
  };
  document.head.appendChild(script);
}
