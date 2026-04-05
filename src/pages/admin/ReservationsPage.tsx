import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FileText, MoreVertical, Eye, Trash2, MessageCircle, ExternalLink } from 'lucide-react';
import { getAllReservations, updateReservationStatus, deleteReservation } from '@/services/reservationService';
import { createFromReservation } from '@/services/invoiceService';
import { useNavigate } from 'react-router-dom';
import type { Reservation, ReservationStatus } from '@/types';
import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/statusColors';
import ReservationDetail from '@/components/admin/ReservationDetail';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { generateWhatsAppLink } from '@/lib/whatsapp';
import { getDocument } from '@/services/firestore';
import type { BusinessProfile } from '@/types';

const STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
};

function ActionsDropdown({ reservation, onStatusChange, onConvertToInvoice, onDelete, onViewDetails, onSendWhatsApp }: {
  reservation: Reservation;
  onStatusChange: (id: string, status: ReservationStatus) => void;
  onConvertToInvoice: (id: string) => void;
  onDelete: (res: Reservation) => void;
  onViewDetails: (res: Reservation) => void;
  onSendWhatsApp: (res: Reservation) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    // Position menu below the button, aligned to the end (right in LTR, left in RTL)
    const isRtl = document.documentElement.dir === 'rtl';
    setPos({
      top: rect.bottom + 4,
      left: isRtl ? rect.left - 200 + rect.width : rect.left,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', () => setOpen(false), true);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', () => setOpen(false), true);
    };
  }, [open]);

  const handleToggle = () => {
    if (!open) updatePos();
    setOpen(!open);
  };

  const transitions = STATUS_TRANSITIONS[reservation.status];

  const menu = open ? createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[200px] bg-popover border rounded-lg shadow-lg py-1 text-sm"
      style={{ top: pos.top, left: pos.left }}
    >
      {/* View Details */}
      <button
        onClick={() => { setOpen(false); onViewDetails(reservation); }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-start"
      >
        <Eye className="h-4 w-4" />
        {t('admin.viewDetails')}
      </button>

      {/* Status transitions */}
      {transitions.length > 0 && (
        <>
          <div className="border-t my-1" />
          <div className="px-3 py-1 text-xs text-muted-foreground font-medium">
            {t('admin.changeStatus')}
          </div>
          {transitions.map((nextStatus) => (
            <button
              key={nextStatus}
              onClick={() => { setOpen(false); onStatusChange(reservation.id, nextStatus); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-start"
            >
              <span className={cn('w-2 h-2 rounded-full', STATUS_COLORS[nextStatus].split(' ')[0]?.replace('text-', 'bg-') || 'bg-muted-foreground')} />
              {t(`status.${nextStatus}`)}
            </button>
          ))}
        </>
      )}

      {/* Convert to Invoice */}
      {reservation.status === 'completed' && !reservation.invoiceId && (
        <>
          <div className="border-t my-1" />
          <button
            onClick={() => { setOpen(false); onConvertToInvoice(reservation.id); }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-start text-primary"
          >
            <FileText className="h-4 w-4" />
            {t('admin.convertToInvoice')}
          </button>
        </>
      )}

      {/* View Invoice */}
      {reservation.invoiceId && (
        <>
          <div className="border-t my-1" />
          <button
            onClick={() => { setOpen(false); navigate(`/admin/invoices/${reservation.invoiceId}`); }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-start text-primary"
          >
            <ExternalLink className="h-4 w-4" />
            {t('admin.viewInvoice')}
          </button>
        </>
      )}

      {/* Send WhatsApp */}
      <div className="border-t my-1" />
      <button
        onClick={() => { setOpen(false); onSendWhatsApp(reservation); }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-start"
      >
        <MessageCircle className="h-4 w-4" />
        {t('admin.sendWhatsApp')}
      </button>

      {/* Delete */}
      <div className="border-t my-1" />
      <button
        onClick={() => { setOpen(false); onDelete(reservation); }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-start text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        {t('admin.deleteReservation')}
      </button>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="p-1.5 rounded-md hover:bg-accent transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {menu}
    </>
  );
}

export default function ReservationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Reservation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      const data = await getAllReservations();
      setReservations(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleStatusChange = async (id: string, status: ReservationStatus) => {
    await updateReservationStatus(id, status);
    loadData();
  };

  const handleConvertToInvoice = async (reservationId: string) => {
    const invoiceId = await createFromReservation(reservationId);
    navigate(`/admin/invoices/${invoiceId}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteReservation(deleteTarget.id);
      setDeleteTarget(null);
      if (selectedReservation?.id === deleteTarget.id) setSelectedReservation(null);
      loadData();
    } finally {
      setDeleting(false);
    }
  };

  const handleSendWhatsApp = async (reservation: Reservation) => {
    const profile = await getDocument<BusinessProfile>('settings', 'businessProfile');
    const whatsappNumber = profile?.whatsappNumber || profile?.phone || '';
    if (!whatsappNumber) return;
    const link = generateWhatsAppLink(
      whatsappNumber,
      reservation.customerName,
      reservation.customerPhone,
      reservation.services,
      reservation.date,
      reservation.slotTime
    );
    window.open(link, '_blank');
  };

  const filtered = statusFilter
    ? reservations.filter((r) => r.status === statusFilter)
    : reservations;

  if (loading) return <div className="p-6">{t('common.loading')}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.manageReservations')}</h1>

      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background text-sm"
        >
          <option value="">{t('common.filter')}</option>
          {(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const).map((s) => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-6">
        {/* Table */}
        <div className={cn('border rounded-lg overflow-hidden', selectedReservation ? 'flex-1' : 'w-full')}>
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-start px-4 py-3 text-sm font-medium">{t('customer.referenceNumber')}</th>
                <th className="text-start px-4 py-3 text-sm font-medium">{t('auth.fullName')}</th>
                <th className="text-start px-4 py-3 text-sm font-medium">{t('common.date')}</th>
                <th className="text-start px-4 py-3 text-sm font-medium">{t('common.time')}</th>
                <th className="text-start px-4 py-3 text-sm font-medium">{t('common.status')}</th>
                <th className="text-start px-4 py-3 text-sm font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((res) => (
                <tr
                  key={res.id}
                  className={cn(
                    'border-t cursor-pointer hover:bg-muted/30 transition-colors',
                    selectedReservation?.id === res.id && 'bg-muted/40'
                  )}
                  onClick={() => setSelectedReservation(res)}
                >
                  <td className="px-4 py-3 text-sm font-mono" dir="ltr">{res.referenceNumber}</td>
                  <td className="px-4 py-3 text-sm">{res.customerName || res.customerEmail}</td>
                  <td className="px-4 py-3 text-sm" dir="ltr">{res.date}</td>
                  <td className="px-4 py-3 text-sm" dir="ltr">{res.slotTime}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-1 rounded', STATUS_COLORS[res.status])}>
                      {t(`status.${res.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <ActionsDropdown
                      reservation={res}
                      onStatusChange={handleStatusChange}
                      onConvertToInvoice={handleConvertToInvoice}
                      onDelete={setDeleteTarget}
                      onViewDetails={setSelectedReservation}
                      onSendWhatsApp={handleSendWhatsApp}
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selectedReservation && (
          <div className="w-[380px] shrink-0">
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{t('admin.viewDetails')}</h3>
                <button
                  onClick={() => setSelectedReservation(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {t('common.close')}
                </button>
              </div>
              <ReservationDetail reservation={selectedReservation} />

              {/* Quick actions under detail */}
              <div className="mt-4 flex flex-wrap gap-2">
                {STATUS_TRANSITIONS[selectedReservation.status].map((nextStatus) => (
                  <button
                    key={nextStatus}
                    onClick={() => handleStatusChange(selectedReservation.id, nextStatus)}
                    className="text-xs px-3 py-1.5 border rounded-md hover:bg-accent transition-colors"
                  >
                    {t(`status.${nextStatus}`)}
                  </button>
                ))}
                {selectedReservation.status === 'completed' && !selectedReservation.invoiceId && (
                  <button
                    onClick={() => handleConvertToInvoice(selectedReservation.id)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <FileText className="h-3 w-3" />
                    {t('admin.convertToInvoice')}
                  </button>
                )}
                {selectedReservation.invoiceId && (
                  <button
                    onClick={() => navigate(`/admin/invoices/${selectedReservation.invoiceId}`)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {t('admin.viewInvoice')}
                  </button>
                )}
                <button
                  onClick={() => handleSendWhatsApp(selectedReservation)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 border rounded-md hover:bg-accent transition-colors"
                >
                  <MessageCircle className="h-3 w-3" />
                  {t('admin.sendWhatsApp')}
                </button>
                <button
                  onClick={() => setDeleteTarget(selectedReservation)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 border border-destructive/30 text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={t('admin.deleteReservation')}
        description={t('admin.deleteReservationConfirm')}
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
