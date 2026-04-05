import { useTranslation } from 'react-i18next';
import { X, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/hooks/useAuth';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();

  if (!open) return null;

  const handleProceed = () => {
    onClose();
    if (isAuthenticated) {
      navigate('/reservation');
    } else {
      navigate('/login', { state: { from: { pathname: '/reservation' } } });
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 end-0 w-full max-w-md bg-background shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('customer.cart')}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-2" />
              <p>{t('customer.cartEmpty')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const effectivePrice = item.price - item.offerDiscount;
                return (
                  <div key={item.serviceId} className="flex gap-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{isAr ? item.nameAr : item.nameEn}</h3>
                      <p className="text-sm text-primary mt-1">{effectivePrice.toFixed(2)} {t('common.sar')}</p>
                      {item.offerDiscount > 0 && (
                        <p className="text-xs text-muted-foreground line-through">{item.price.toFixed(2)} {t('common.sar')}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button onClick={() => removeItem(item.serviceId)} className="p-1 text-destructive hover:bg-accent rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="flex items-center gap-2 border rounded-md">
                        <button onClick={() => updateQuantity(item.serviceId, item.quantity - 1)} className="p-1 hover:bg-accent">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.serviceId, item.quantity + 1)} className="p-1 hover:bg-accent">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-sm font-medium">{(effectivePrice * item.quantity).toFixed(2)} {t('common.sar')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between text-lg font-semibold">
              <span>{t('customer.subtotal')}</span>
              <span>{getSubtotal().toFixed(2)} {t('common.sar')}</span>
            </div>
            <button
              onClick={handleProceed}
              className="w-full py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
            >
              {isAuthenticated ? t('customer.proceedToReservation') : t('customer.loginToReserve')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
