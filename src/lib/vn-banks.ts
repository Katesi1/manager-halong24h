/**
 * Danh sách ngân hàng Việt Nam theo mã BIN NAPAS (6 chữ số) — nguồn dùng chung
 * cho mọi form nhập STK (STK nền tảng thu tiền gói + STK cọc của OWNER).
 *
 * BIN là mã định danh ngân hàng thụ hưởng trong chuẩn VietQR/NAPAS — sinh mã QR
 * cần đúng BIN chứ không phải tên. Xếp theo mức phổ biến để dropdown tiện chọn.
 */
export interface VnBank {
  /** Mã BIN NAPAS — 6 chữ số. */
  bin: string;
  /** Tên hiển thị (lưu xuống field bankName). */
  name: string;
}

export const VN_BANKS: VnBank[] = [
  { bin: '970436', name: 'Vietcombank' },
  { bin: '970415', name: 'VietinBank' },
  { bin: '970418', name: 'BIDV' },
  { bin: '970405', name: 'Agribank' },
  { bin: '970407', name: 'Techcombank' },
  { bin: '970422', name: 'MB Bank' },
  { bin: '970416', name: 'ACB' },
  { bin: '970432', name: 'VPBank' },
  { bin: '970403', name: 'Sacombank' },
  { bin: '970437', name: 'HDBank' },
  { bin: '970423', name: 'TPBank' },
  { bin: '970441', name: 'VIB' },
  { bin: '970443', name: 'SHB' },
  { bin: '970448', name: 'OCB' },
  { bin: '970426', name: 'MSB' },
  { bin: '970468', name: 'SeABank' },
  { bin: '970431', name: 'Eximbank' },
  { bin: '970449', name: 'LPBank' },
  { bin: '970429', name: 'SCB' },
  { bin: '970409', name: 'Bac A Bank' },
  { bin: '970412', name: 'PVcomBank' },
  { bin: '970428', name: 'Nam A Bank' },
  { bin: '970427', name: 'VietABank' },
  { bin: '970425', name: 'ABBANK' },
  { bin: '970438', name: 'BaoViet Bank' },
  { bin: '970400', name: 'SaigonBank' },
  { bin: '970452', name: 'KienLongBank' },
  { bin: '970430', name: 'PGBank' },
  { bin: '970414', name: 'OceanBank' },
  { bin: '970444', name: 'CBBank' },
  { bin: '970433', name: 'VietBank' },
  { bin: '970419', name: 'NCB' },
  { bin: '970454', name: 'BVBank' },
  { bin: '970434', name: 'Indovina Bank' },
  { bin: '970424', name: 'Shinhan Bank' },
  { bin: '970458', name: 'UOB' },
  { bin: '970410', name: 'Standard Chartered' },
  { bin: '970408', name: 'GPBank' },
  { bin: '970446', name: 'Co-opBank' },
  { bin: '970439', name: 'Public Bank' },
  { bin: '970442', name: 'Hong Leong Bank' },
  { bin: '970457', name: 'Woori Bank' },
  { bin: '970459', name: 'CIMB' },
];

/** Tra tên ngân hàng từ mã BIN (undefined nếu không có trong danh sách). */
export function bankNameByBin(bin: string | null | undefined): string | undefined {
  if (!bin) return undefined;
  return VN_BANKS.find((b) => b.bin === bin)?.name;
}
