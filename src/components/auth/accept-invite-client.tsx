'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Loader2, UserPlus } from 'lucide-react';

import {
  acceptInviteWithGoogleAction,
  acceptInviteWithPasswordAction,
  verifyStaffInviteAction,
} from '@/app/actions/staff-invite';
import type { ActionResult } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { SubmitButton } from '@/components/auth/submit-button';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

interface VerifiedState {
  token: string;
  email: string;
  ownerName: string;
  homestayName: string | null;
}

export function AcceptInviteClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const urlToken = sp.get('token');

  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verified, setVerified] = useState<VerifiedState | null>(null);

  // Auto-verify khi tới từ link email (?token=).
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current || !urlToken) return;
    autoRan.current = true;
    void runVerify(urlToken);
  }, [urlToken]);

  async function runVerify(raw: string) {
    setVerifying(true);
    setVerifyError(null);
    const res = await verifyStaffInviteAction(raw);
    setVerifying(false);
    if (!res.ok) {
      setVerifyError(res.error);
      setVerified(null);
      return;
    }
    setVerified({
      token: res.token,
      email: res.data.email,
      ownerName: res.data.ownerName,
      homestayName: res.data.homestayName,
    });
  }

  if (verified) {
    return (
      <AcceptForm
        state={verified}
        onBack={() => {
          setVerified(null);
          setVerifyError(null);
        }}
        onGoogle={async (idToken) => {
          const res = await acceptInviteWithGoogleAction(verified.token, idToken);
          if (res.ok) {
            router.push(res.redirectTo);
            router.refresh();
          }
          return res.ok ? null : res.error;
        }}
      />
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink-900">Nhận lời mời nhân viên</h1>
      <p className="mt-2 text-sm text-ink-500">
        Nhập mã mời chủ nhà đã gửi cho bạn (dạng <span className="font-mono">HL-XXXXXX</span>).
      </p>

      {urlToken && verifying ? (
        <div className="mt-8 flex items-center gap-3 rounded-lg bg-navy-50 px-4 py-4 text-sm text-navy-700 ring-1 ring-navy-100">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang kiểm tra lời mời...
        </div>
      ) : (
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!verifying) void runVerify(code);
          }}
        >
          <div>
            <Label htmlFor="invite-code" required>
              Mã mời
            </Label>
            <Input
              id="invite-code"
              name="invite-code"
              type="text"
              autoComplete="off"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="HL-A1B2C3"
              className="uppercase"
            />
          </div>

          {verifyError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
              {verifyError}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            variant="primary"
            className="w-full"
            disabled={verifying}
          >
            {verifying ? 'Đang kiểm tra...' : 'Tiếp tục'}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-700">
        <Link href="/login" className="font-semibold text-navy-700 hover:underline">
          ← Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}

interface AcceptFormProps {
  state: VerifiedState;
  onBack: () => void;
  /** Trả về error string nếu lỗi, null nếu thành công (đã redirect). */
  onGoogle: (idToken: string) => Promise<string | null>;
}

function AcceptForm({ state, onBack, onGoogle }: AcceptFormProps) {
  const [pwState, formAction] = useActionState<ActionResult, FormData>(
    acceptInviteWithPasswordAction,
    {},
  );
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const v = pwState.values;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink-900">Tạo tài khoản nhân viên</h1>

      <div className="mt-4 flex items-start gap-3 rounded-xl bg-navy-50 p-4 ring-1 ring-navy-100">
        <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-navy-700" />
        <div className="text-sm">
          <p className="text-ink-700">
            Bạn được mời làm nhân viên
            {state.ownerName ? (
              <>
                {' '}của <strong className="text-ink-900">{state.ownerName}</strong>
              </>
            ) : null}
            {state.homestayName ? (
              <>
                {' '}·{' '}
                <span className="text-ink-900">{state.homestayName}</span>
              </>
            ) : null}
            .
          </p>
          {state.email && (
            <p className="mt-1 text-xs text-ink-500">
              Lời mời gửi tới <span className="font-medium text-ink-700">{state.email}</span>
            </p>
          )}
        </div>
      </div>

      {/* Google */}
      <div className="mt-6">
        <GoogleSignInButton
          onCredential={(idToken) => {
            setGoogleBusy(true);
            setGoogleError(null);
            void onGoogle(idToken).then((err) => {
              setGoogleBusy(false);
              if (err) setGoogleError(err);
            });
          }}
          disabled={googleBusy}
        />
        {googleError && (
          <p className="mt-2 text-center text-xs text-rose-600" role="alert">
            {googleError}
          </p>
        )}
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-ink-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-ink-500">hoặc tạo bằng email</span>
        </div>
      </div>

      {/* Email / password */}
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={state.token} />

        <div>
          <Label htmlFor="name" required>
            Họ tên
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            defaultValue={v?.name ?? ''}
            placeholder="Nguyễn Văn A"
            key={`name-${v?.name ?? ''}`}
          />
          {pwState.fieldErrors?.name && (
            <p className="mt-1 text-xs text-red-600">{pwState.fieldErrors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={v?.phone ?? ''}
            placeholder="0912 345 678"
            key={`phone-${v?.phone ?? ''}`}
          />
          {pwState.fieldErrors?.phone && (
            <p className="mt-1 text-xs text-red-600">{pwState.fieldErrors.phone}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password" required>
            Mật khẩu
          </Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
          />
          {pwState.fieldErrors?.password && (
            <p className="mt-1 text-xs text-red-600">{pwState.fieldErrors.password}</p>
          )}
        </div>

        {pwState.error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {pwState.error}
          </div>
        )}

        <SubmitButton pending="Đang tạo tài khoản...">
          <span className="inline-flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Tham gia làm nhân viên
          </span>
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-ink-700">
        Không phải bạn?{' '}
        <button
          type="button"
          onClick={onBack}
          className="font-semibold text-navy-700 hover:underline"
        >
          Nhập mã mời khác
        </button>
      </p>
    </div>
  );
}
