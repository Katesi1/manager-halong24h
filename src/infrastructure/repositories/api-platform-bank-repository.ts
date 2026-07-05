import 'server-only';

import type {
  ReceivingBankAccount,
  UpdateReceivingBankInput,
} from '@/core/entities/platform-bank';
import type { PlatformBankRepository } from '@/application/ports/platform-bank-repository';

import { apiClient } from '../http/api-client';

/**
 * STK nền tảng nhận tiền mua gói — spec §10.7.
 * `GET`/`PUT /admin/payments/receiving-bank`. Response shape giống nhau; PUT
 * đổi `source` sang `'db'` + `updatedAt` có giá trị.
 */

interface SpecReceivingBank {
  bankBin?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  source?: string | null;
  updatedAt?: string | null;
}

function str(v: string | null | undefined): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function mapBank(d: SpecReceivingBank): ReceivingBankAccount {
  return {
    bankBin: str(d.bankBin),
    bankName: str(d.bankName),
    bankAccountNumber: str(d.bankAccountNumber),
    bankAccountName: str(d.bankAccountName),
    source: d.source === 'db' ? 'db' : 'env',
    updatedAt: d.updatedAt ?? null,
  };
}

export class ApiPlatformBankRepository implements PlatformBankRepository {
  async getReceiving(): Promise<ReceivingBankAccount> {
    const data = await apiClient.get<SpecReceivingBank>(
      '/admin/payments/receiving-bank',
      { cache: 'no-store' },
    );
    return mapBank(data);
  }

  async updateReceiving(
    input: UpdateReceivingBankInput,
  ): Promise<ReceivingBankAccount> {
    const data = await apiClient.put<SpecReceivingBank>(
      '/admin/payments/receiving-bank',
      input,
    );
    return mapBank(data);
  }
}
