import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Service } from '@/types';

interface CartItem {
  serviceId: string;
  nameAr: string;
  nameEn: string;
  price: number;
  quantity: number;
  offerDiscount: number;
}

interface CartState {
  items: CartItem[];
  addItem: (service: Service) => void;
  removeItem: (serviceId: string) => void;
  updateQuantity: (serviceId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

function calculateDiscount(service: Service): number {
  if (!service.offer) return 0;
  const now = new Date();
  if (service.offer.expiresAt.toDate() < now) return 0;
  if (service.offer.type === 'percentage') {
    return (service.price * service.offer.value) / 100;
  }
  return service.offer.value;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (service) => {
        const { items } = get();
        const existing = items.find((i) => i.serviceId === service.id);

        if (existing) {
          set({
            items: items.map((i) =>
              i.serviceId === service.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                serviceId: service.id,
                nameAr: service.nameAr,
                nameEn: service.nameEn,
                price: service.price,
                quantity: 1,
                offerDiscount: calculateDiscount(service),
              },
            ],
          });
        }
      },

      removeItem: (serviceId) => {
        set({ items: get().items.filter((i) => i.serviceId !== serviceId) });
      },

      updateQuantity: (serviceId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(serviceId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.serviceId === serviceId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + (item.price - item.offerDiscount) * item.quantity,
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    { name: 'cart-store' }
  )
);
