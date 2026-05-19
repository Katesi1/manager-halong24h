/**
 * VietQR helper — sinh URL ảnh QR từ vietqr.io.
 * Pattern: https://img.vietqr.io/image/{BIN}-{ACCT}-compact2.jpg?amount=X&addInfo=Y&accountName=Z
 */

interface VietQRConfig {
  bankBin: string;
  accountNumber: string;
  accountName: string;
}

function getConfig(): VietQRConfig {
  return {
    bankBin: process.env.VIETQR_BANK_BIN || '970422', // MB Bank default
    accountNumber: process.env.VIETQR_ACCOUNT_NUMBER || '0000000000',
    accountName: process.env.VIETQR_ACCOUNT_NAME || 'HALONG24H',
  };
}

/** Sinh URL ảnh QR (compact). amount = VND. memo = nội dung CK. */
export function vietQRImageUrl(amount: number, memo: string): string {
  const cfg = getConfig();
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: memo,
    accountName: cfg.accountName,
  });
  return `https://img.vietqr.io/image/${cfg.bankBin}-${cfg.accountNumber}-compact2.jpg?${params.toString()}`;
}

/** Sinh memo unique cho booking */
export function paymentMemo(bookingCode: string): string {
  return `HL ${bookingCode}`.toUpperCase();
}

export function getBankInfo() {
  const cfg = getConfig();
  return {
    bankBin: cfg.bankBin,
    accountNumber: cfg.accountNumber,
    accountName: cfg.accountName,
    bankName: getBankName(cfg.bankBin),
  };
}

const BANK_NAMES: Record<string, string> = {
  '970422': 'MB Bank',
  '970418': 'BIDV',
  '970436': 'Vietcombank',
  '970415': 'VietinBank',
  '970432': 'VPBank',
  '970407': 'Techcombank',
  '970416': 'ACB',
  '970448': 'OCB',
  '970454': 'VietCapital',
  '970426': 'MSB',
};

function getBankName(bin: string): string {
  return BANK_NAMES[bin] ?? 'Bank';
}
