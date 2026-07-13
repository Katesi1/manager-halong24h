'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QrCodeProps {
  /** Chuỗi EMV (hoặc bất kỳ) cần encode thành QR. */
  value: string;
  size?: number;
  className?: string;
}

/**
 * Render QR từ chuỗi EMV VietQR (BE trả `payment.qrCode`) — client-side, không
 * phụ thuộc dịch vụ ảnh ngoài (đảm bảo nội dung/CRC khớp chính xác BE sinh).
 */
export function QrCode({ value, size = 180, className }: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    void QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
    }).catch(() => {
      // Chuỗi không encode được — bỏ qua, UI đã có STK để chuyển tay.
    });
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      aria-label="Mã QR VietQR"
    />
  );
}
