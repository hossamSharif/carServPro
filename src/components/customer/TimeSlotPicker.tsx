import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getAvailableSlots } from '@/services/scheduleService';
import { cn } from '@/lib/utils';

interface TimeSlotPickerProps {
  selectedDate: string;
  selectedTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}

export default function TimeSlotPicker({ selectedDate, selectedTime, onDateChange, onTimeChange }: TimeSlotPickerProps) {
  const { t, i18n } = useTranslation();
  const [slots, setSlots] = useState<Array<{ time: string; remaining: number }>>([]);
  const [loading, setLoading] = useState(false);
  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    getAvailableSlots(selectedDate)
      .then(setSlots)
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat(i18n.language, { weekday: 'short', month: 'short', day: 'numeric' }).format(d);
  };

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div>
        <h3 className="font-medium mb-3">{t('customer.selectDate')}</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((date) => (
            <button
              key={date}
              onClick={() => onDateChange(date)}
              className={cn(
                'flex-shrink-0 px-4 py-3 rounded-lg border text-sm text-center min-w-[100px] transition-colors',
                selectedDate === date
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-accent'
              )}
            >
              {formatDate(date)}
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <h3 className="font-medium mb-3">{t('customer.selectTime')}</h3>
          {loading ? (
            <p className="text-muted-foreground">{t('common.loading')}</p>
          ) : slots.length === 0 ? (
            <p className="text-muted-foreground">{t('customer.noSlotsAvailable')}</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => onTimeChange(slot.time)}
                  className={cn(
                    'px-3 py-3 rounded-lg border text-sm text-center transition-colors',
                    selectedTime === slot.time
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-accent'
                  )}
                >
                  <div className="font-medium" dir="ltr">{slot.time}</div>
                  <div className="text-xs mt-1 opacity-75">
                    {t('customer.slotsRemaining', { count: slot.remaining })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
