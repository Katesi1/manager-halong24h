'use client';

import { useRef, useState } from 'react';
import { Eye, Download, X } from 'lucide-react';
import * as RDialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';

import { formatVND } from '@/core/value-objects/vnd';

interface TopRoomRow {
  rank: number;
  name: string;
  bookings: number;
  occupancy: number;
  revenue: number;
}

interface RevenueByDay {
  date: string;
  revenue: number;
  bookings: number;
}

export interface ReportData {
  ownerName: string;
  periodLabel: string;
  generatedAt: string;
  totalRevenue: number;
  totalBookings: number;
  adr: number;
  occupancyRate: number;
  totalDeposit: number;
  confirmedCount: number;
  completedCount: number;
  holdCount: number;
  cancelledCount: number;
  topRooms: TopRoomRow[];
  revenueByDay: RevenueByDay[];
}

export function RevenueReportExport({ data }: { data: ReportData }) {
  const [open, setOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  function handleDownload() {
    if (!printRef.current) return;
    const html = printRef.current.innerHTML;
    const blob = new Blob(
      [
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Báo cáo doanh thu - Halong24h</title><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#1a1a1a;background:#fff;padding:40px;max-width:900px;margin:0 auto}
.report-header{border-bottom:2px solid #1b365d;padding-bottom:20px;margin-bottom:24px}
.brand{font-size:24px;font-weight:700;color:#1b365d}
.brand span{color:#c9a96e}
.meta{margin-top:8px;font-size:12px;color:#717171}
h2{font-size:16px;font-weight:600;color:#1b365d;margin:24px 0 12px;padding-bottom:6px;border-bottom:1px solid #ebe3d3}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
.stat-box{border:1px solid #ebe3d3;border-radius:8px;padding:12px}
.stat-box .label{font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#717171}
.stat-box .value{font-size:20px;font-weight:700;color:#1b365d;margin-top:4px}
.stat-box .sub{font-size:11px;color:#717171;margin-top:2px}
table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px}
th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#717171;padding:8px 12px;border-bottom:2px solid #ebe3d3}
td{padding:8px 12px;border-bottom:1px solid #f5f1ea}
tr:hover{background:#faf7f2}
.text-right{text-align:right}
.text-emerald{color:#059669}
.text-gold{color:#b08a48}
.rank{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#1b365d;color:#fff;font-size:11px;font-weight:700}
.rank.gold{background:#c9a96e}
.footer{margin-top:32px;padding-top:16px;border-top:1px solid #ebe3d3;font-size:11px;color:#b0b0b0;text-align:center}
.booking-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px}
.booking-chip{text-align:center;border-radius:8px;padding:8px;font-size:12px}
.booking-chip .count{font-size:18px;font-weight:700}
@media print{body{padding:20px}}</style></head><body>${html}</body></html>`,
      ],
      { type: 'text/html' },
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-doanh-thu-${data.periodLabel.replace(/\s/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-navy-800 hover:shadow-md active:scale-[0.98]"
      >
        <Eye className="h-4 w-4" />
        Xem báo cáo
      </button>

      <RDialog.Root open={open} onOpenChange={setOpen}>
        <AnimatePresence>
          {open && (
            <RDialog.Portal forceMount>
              <RDialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                />
              </RDialog.Overlay>
              <RDialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed inset-4 z-50 flex flex-col rounded-2xl bg-cream-50 shadow-2xl ring-1 ring-ink-200 sm:inset-8 lg:inset-x-[10%] lg:inset-y-6 focus:outline-none"
                >
                  {/* Toolbar */}
                  <div className="flex items-center justify-between border-b border-ink-200 px-6 py-3">
                    <div>
                      <RDialog.Title className="font-display text-lg font-semibold text-navy-900">
                        Xem trước báo cáo
                      </RDialog.Title>
                      <p className="text-xs text-ink-500">{data.periodLabel}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98]"
                      >
                        <Download className="h-4 w-4" />
                        Tải xuống
                      </button>
                      <RDialog.Close asChild>
                        <button
                          type="button"
                          className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream-200 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </RDialog.Close>
                    </div>
                  </div>

                  {/* Preview scroll area */}
                  <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                    <div
                      ref={printRef}
                      className="mx-auto max-w-[800px] rounded-xl bg-white p-8 shadow-card ring-1 ring-ink-200/60"
                    >
                      <ReportTemplate data={data} />
                    </div>
                  </div>
                </motion.div>
              </RDialog.Content>
            </RDialog.Portal>
          )}
        </AnimatePresence>
      </RDialog.Root>
    </>
  );
}

function ReportTemplate({ data }: { data: ReportData }) {
  return (
    <div>
      {/* Header */}
      <div className="report-header" style={{ borderBottom: '2px solid #1b365d', paddingBottom: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#1b365d' }}>
              Halong<span style={{ color: '#c9a96e' }}>24h</span>
            </p>
            <p style={{ fontSize: 14, color: '#717171', marginTop: 4 }}>
              Báo cáo doanh thu — {data.periodLabel}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: '#717171' }}>Chủ nhà: {data.ownerName}</p>
            <p style={{ fontSize: 12, color: '#717171' }}>Ngày xuất: {data.generatedAt}</p>
          </div>
        </div>
      </div>

      {/* KPI summary */}
      <SectionTitle>Tổng quan chỉ số</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatBox label="Doanh thu" value={formatVND(data.totalRevenue)} />
        <StatBox label="Lượt đặt" value={String(data.totalBookings)} />
        <StatBox label="Giá TB / đêm" value={formatVND(data.adr)} />
        <StatBox label="Occupancy" value={`${data.occupancyRate.toFixed(1)}%`} />
      </div>

      {/* Booking breakdown */}
      <SectionTitle>Phân bổ booking</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
        <BookingChip label="Xác nhận" count={data.confirmedCount} bg="#f4f6fa" color="#1b365d" />
        <BookingChip label="Hoàn tất" count={data.completedCount} bg="#ecfdf5" color="#059669" />
        <BookingChip label="Đang giữ" count={data.holdCount} bg="#fbf7ee" color="#b08a48" />
        <BookingChip label="Đã huỷ" count={data.cancelledCount} bg="#fef2f2" color="#dc2626" />
      </div>

      {/* Deposit */}
      <div style={{ background: '#f4f6fa', borderRadius: 8, padding: '12px 16px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#717171' }}>Tổng đặt cọc nhận được</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#1b365d' }}>{formatVND(data.totalDeposit)}</span>
      </div>

      {/* Top rooms */}
      {data.topRooms.length > 0 && (
        <>
          <SectionTitle>Top phòng bán chạy</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 24 }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Tên phòng</th>
                <th style={thStyle}>Booking</th>
                <th style={thStyle}>Occupancy</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {data.topRooms.map((r) => (
                <tr key={r.rank}>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 24, height: 24, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                        background: r.rank <= 3 ? '#c9a96e' : '#1b365d', color: '#fff',
                      }}
                    >
                      {r.rank}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{r.name}</td>
                  <td style={tdStyle}>{r.bookings}</td>
                  <td style={tdStyle}>{r.occupancy.toFixed(0)}%</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                    {formatVND(r.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Revenue by day */}
      {data.revenueByDay.length > 0 && (
        <>
          <SectionTitle>Doanh thu theo ngày</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
            <thead>
              <tr>
                <th style={thStyle}>Ngày</th>
                <th style={thStyle}>Booking</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {data.revenueByDay.map((d) => (
                <tr key={d.date}>
                  <td style={tdStyle}>{d.date}</td>
                  <td style={tdStyle}>{d.bookings}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: d.revenue > 0 ? '#059669' : '#b0b0b0' }}>
                    {formatVND(d.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Footer */}
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #ebe3d3', fontSize: 11, color: '#b0b0b0', textAlign: 'center' }}>
        Báo cáo được tạo tự động bởi Halong24h Manager · {data.generatedAt}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#717171',
  padding: '8px 12px',
  borderBottom: '2px solid #ebe3d3',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #f5f1ea',
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: '#1b365d',
        margin: '24px 0 12px',
        paddingBottom: 6,
        borderBottom: '1px solid #ebe3d3',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}
    >
      {children}
    </h2>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid #ebe3d3', borderRadius: 8, padding: 12 }}>
      <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#717171' }}>
        {label}
      </p>
      <p style={{ fontSize: 20, fontWeight: 700, color: '#1b365d', marginTop: 4 }}>
        {value}
      </p>
    </div>
  );
}

function BookingChip({
  label,
  count,
  bg,
  color,
}: {
  label: string;
  count: number;
  bg: string;
  color: string;
}) {
  return (
    <div style={{ textAlign: 'center', borderRadius: 8, padding: 8, background: bg }}>
      <p style={{ fontSize: 18, fontWeight: 700, color }}>{count}</p>
      <p style={{ fontSize: 11, color: '#717171', marginTop: 2 }}>{label}</p>
    </div>
  );
}
