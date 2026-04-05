import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Upload, X, Plus } from 'lucide-react';
import {
  getBusinessProfile,
  updateBusinessProfile,
  getScheduleConfig,
  updateScheduleConfig,
  getPaymentSettings,
  updatePaymentSettings,
} from '@/services/settingsService';
import type { BusinessProfile, ScheduleConfig, PaymentSettings } from '@/types';

type SettingsTab = 'business' | 'schedule' | 'payment';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('business');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Business Profile State
  const [businessProfile, setBusinessProfile] = useState<Partial<BusinessProfile>>({
    nameAr: '', nameEn: '', phone: '', whatsappNumber: '', vatNumber: '', crNumber: '', address: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Schedule Config State
  const [scheduleConfig, setScheduleConfig] = useState<Partial<ScheduleConfig>>({
    workingHours: {},
    slotDurationMinutes: 60,
    maxBookingsPerSlot: 3,
    blockedDates: [],
  });
  const [newBlockedDate, setNewBlockedDate] = useState('');

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState<Partial<PaymentSettings>>({
    provider: 'moyasar',
    moyasar: { publishableKey: '' },
  });

  useEffect(() => {
    Promise.all([getBusinessProfile(), getScheduleConfig(), getPaymentSettings()])
      .then(([bp, sc, ps]) => {
        if (bp) setBusinessProfile(bp);
        if (sc) setScheduleConfig(sc);
        if (ps) setPaymentSettings(ps);
      })
      .finally(() => setLoading(false));
  }, []);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveBusiness = async () => {
    setSaving(true);
    try {
      await updateBusinessProfile({ ...businessProfile, logoFile: logoFile || undefined } as BusinessProfile & { logoFile?: File });
      setLogoFile(null);
      showSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      await updateScheduleConfig(scheduleConfig as ScheduleConfig);
      showSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = async () => {
    setSaving(true);
    try {
      await updatePaymentSettings(paymentSettings as PaymentSettings);
      showSaved();
    } finally {
      setSaving(false);
    }
  };

  const updateDaySchedule = (day: string, field: string, value: unknown) => {
    setScheduleConfig((prev) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...(prev.workingHours?.[day] || { isOpen: false, openTime: '09:00', closeTime: '18:00' }),
          [field]: value,
        },
      },
    }));
  };

  const addBlockedDate = () => {
    if (!newBlockedDate || scheduleConfig.blockedDates?.includes(newBlockedDate)) return;
    setScheduleConfig((prev) => ({
      ...prev,
      blockedDates: [...(prev.blockedDates || []), newBlockedDate].sort(),
    }));
    setNewBlockedDate('');
  };

  const removeBlockedDate = (date: string) => {
    setScheduleConfig((prev) => ({
      ...prev,
      blockedDates: (prev.blockedDates || []).filter((d) => d !== date),
    }));
  };

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: 'business', label: t('admin.businessSettings') },
    { key: 'schedule', label: t('admin.scheduleSettings') },
    { key: 'payment', label: t('admin.paymentSettings') },
  ];

  if (loading) return <div className="p-6">{t('common.loading')}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('nav.settings')}</h1>
        {saved && (
          <span className="text-sm text-emerald-400">{t('common.save')} ✓</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Business Profile Tab */}
      {activeTab === 'business' && (
        <div className="border rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.businessSettings')} (AR)</label>
              <input
                value={businessProfile.nameAr || ''}
                onChange={(e) => setBusinessProfile({ ...businessProfile, nameAr: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.businessSettings')} (EN)</label>
              <input
                value={businessProfile.nameEn || ''}
                onChange={(e) => setBusinessProfile({ ...businessProfile, nameEn: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.phone')}</label>
              <input
                value={businessProfile.phone || ''}
                onChange={(e) => setBusinessProfile({ ...businessProfile, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">WhatsApp</label>
              <input
                value={businessProfile.whatsappNumber || ''}
                onChange={(e) => setBusinessProfile({ ...businessProfile, whatsappNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('invoice.vatNumber')}</label>
              <input
                value={businessProfile.vatNumber || ''}
                onChange={(e) => setBusinessProfile({ ...businessProfile, vatNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                dir="ltr"
                maxLength={15}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('invoice.crNumber')}</label>
              <input
                value={businessProfile.crNumber || ''}
                onChange={(e) => setBusinessProfile({ ...businessProfile, crNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                dir="ltr"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">{t('nav.contact')}</label>
              <input
                value={businessProfile.address || ''}
                onChange={(e) => setBusinessProfile({ ...businessProfile, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium mb-1">Logo</label>
            <div className="flex items-center gap-4">
              {businessProfile.logoUrl && (
                <img src={businessProfile.logoUrl} alt="Logo" className="h-16 w-16 rounded-lg object-cover" />
              )}
              <label className="flex items-center gap-2 px-3 py-2 border rounded-md bg-background text-sm cursor-pointer hover:bg-accent">
                <Upload className="h-4 w-4" />
                {logoFile ? logoFile.name : t('admin.uploadImage')}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          <button
            onClick={handleSaveBusiness}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm"
          >
            <Save className="h-4 w-4" />
            {t('common.save')}
          </button>
        </div>
      )}

      {/* Schedule Settings Tab */}
      {activeTab === 'schedule' && (
        <div className="border rounded-lg p-6 space-y-6">
          {/* Working Hours */}
          <div>
            <h3 className="font-medium mb-3">{t('admin.workingHours')}</h3>
            <div className="space-y-2">
              {DAYS.map((day) => {
                const dayConfig = scheduleConfig.workingHours?.[day] || { isOpen: false, openTime: '09:00', closeTime: '18:00' };
                return (
                  <div key={day} className="flex items-center gap-3 py-2">
                    <label className="flex items-center gap-2 w-32">
                      <input
                        type="checkbox"
                        checked={dayConfig.isOpen}
                        onChange={(e) => updateDaySchedule(day, 'isOpen', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">{t(`days.${day}`)}</span>
                    </label>
                    {dayConfig.isOpen && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={dayConfig.openTime}
                          onChange={(e) => updateDaySchedule(day, 'openTime', e.target.value)}
                          className="px-2 py-1 border rounded text-sm bg-background"
                          dir="ltr"
                        />
                        <span className="text-sm text-muted-foreground">→</span>
                        <input
                          type="time"
                          value={dayConfig.closeTime}
                          onChange={(e) => updateDaySchedule(day, 'closeTime', e.target.value)}
                          className="px-2 py-1 border rounded text-sm bg-background"
                          dir="ltr"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Slot Duration & Max Bookings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.slotDuration')}</label>
              <select
                value={scheduleConfig.slotDurationMinutes || 60}
                onChange={(e) => setScheduleConfig({ ...scheduleConfig, slotDurationMinutes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              >
                <option value={30}>30</option>
                <option value={60}>60</option>
                <option value={90}>90</option>
                <option value={120}>120</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.maxBookings')}</label>
              <input
                type="number"
                min={1}
                max={20}
                value={scheduleConfig.maxBookingsPerSlot || 3}
                onChange={(e) => setScheduleConfig({ ...scheduleConfig, maxBookingsPerSlot: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                dir="ltr"
              />
            </div>
          </div>

          {/* Blocked Dates */}
          <div>
            <h3 className="font-medium mb-2">{t('admin.blockedDates')}</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="date"
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background text-sm"
                dir="ltr"
              />
              <button
                onClick={addBlockedDate}
                className="flex items-center gap-1 px-3 py-2 border rounded-md text-sm hover:bg-accent"
              >
                <Plus className="h-4 w-4" />
                {t('common.add')}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(scheduleConfig.blockedDates || []).map((date) => (
                <span key={date} className="flex items-center gap-1 text-xs bg-red-500/15 text-red-400 px-2 py-1 rounded">
                  <span dir="ltr">{date}</span>
                  <button onClick={() => removeBlockedDate(date)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveSchedule}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm"
          >
            <Save className="h-4 w-4" />
            {t('common.save')}
          </button>
        </div>
      )}

      {/* Payment Settings Tab */}
      {activeTab === 'payment' && (
        <div className="border rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.paymentSettings')}</label>
            <select
              value={paymentSettings.provider || 'moyasar'}
              onChange={(e) => setPaymentSettings({ ...paymentSettings, provider: e.target.value as PaymentSettings['provider'] })}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm"
            >
              <option value="moyasar">Moyasar</option>
              <option value="tap">Tap</option>
              <option value="hyperpay">HyperPay</option>
            </select>
          </div>

          {paymentSettings.provider === 'moyasar' && (
            <div>
              <label className="block text-sm font-medium mb-1">Publishable Key</label>
              <input
                value={paymentSettings.moyasar?.publishableKey || ''}
                onChange={(e) => setPaymentSettings({
                  ...paymentSettings,
                  moyasar: { publishableKey: e.target.value },
                })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm font-mono"
                dir="ltr"
                placeholder="pk_test_..."
              />
            </div>
          )}

          {paymentSettings.provider === 'tap' && (
            <div>
              <label className="block text-sm font-medium mb-1">Publishable Key</label>
              <input
                value={paymentSettings.tap?.publishableKey || ''}
                onChange={(e) => setPaymentSettings({
                  ...paymentSettings,
                  tap: { publishableKey: e.target.value },
                })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm font-mono"
                dir="ltr"
                placeholder="pk_test_..."
              />
            </div>
          )}

          {paymentSettings.provider === 'hyperpay' && (
            <div>
              <label className="block text-sm font-medium mb-1">Entity ID</label>
              <input
                value={paymentSettings.hyperpay?.entityId || ''}
                onChange={(e) => setPaymentSettings({
                  ...paymentSettings,
                  hyperpay: { entityId: e.target.value },
                })}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm font-mono"
                dir="ltr"
              />
            </div>
          )}

          <button
            onClick={handleSavePayment}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm"
          >
            <Save className="h-4 w-4" />
            {t('common.save')}
          </button>
        </div>
      )}
    </div>
  );
}
