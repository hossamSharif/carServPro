import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ShoppingCart } from 'lucide-react';
import { getVisibleServices } from '@/services/serviceService';
import { getCategories } from '@/services/categoryService';
import ServiceCard from '@/components/customer/ServiceCard';
import CartDrawer from '@/components/customer/CartDrawer';
import { useCartStore } from '@/stores/cartStore';
import type { Service, Category } from '@/types';

export default function ServicesPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());

  useEffect(() => {
    Promise.all([getVisibleServices(), getCategories()])
      .then(([svc, cat]) => { setServices(svc); setCategories(cat); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = services.filter((s) => {
    if (selectedCategory && s.categoryId !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.nameAr.includes(q) || s.nameEn.toLowerCase().includes(q) || s.descriptionAr.includes(q) || s.descriptionEn.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('customer.browseServices')}</h1>
        <button onClick={() => setCartOpen(true)} className="relative p-2 hover:bg-accent rounded-md">
          <ShoppingCart className="h-6 w-6" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -end-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('customer.searchServices')}
            className="w-full ps-10 pe-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        <button
          onClick={() => setSelectedCategory('')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm transition-colors ${
            !selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'
          }`}
        >
          {t('customer.allCategories')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm transition-colors ${
              selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'
            }`}
          >
            {isAr ? cat.nameAr : cat.nameEn}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{t('common.noData')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
