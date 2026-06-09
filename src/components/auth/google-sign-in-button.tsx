'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client';

/**
 * Google Identity Services — không cần npm dep, load qua next/script.
 * Renders official Google button + handles ID token callback.
 *
 * Spec v1.7 §2.2: BE expect `{ idToken, role? }` ở POST /auth/google.
 * Component này chỉ trả `idToken`; caller (LoginForm) xử lý logic role/redirect.
 */
interface Props {
  /** Callback nhận Google ID token (JWT). */
  onCredential: (idToken: string) => void;
  /** Optional disabled khi đang submit. */
  disabled?: boolean;
  /** Locale GIS button — mặc định 'vi'. */
  locale?: 'vi' | 'en';
}

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      logo_alignment?: 'left' | 'center';
      width?: number;
      locale?: string;
    },
  ) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

export function GoogleSignInButton({
  onCredential,
  disabled,
  locale = 'vi',
}: Props) {
  const buttonRef = useRef<HTMLDivElement>(null);
  // Ref-stable callback để effect không re-run khi parent re-render (gây
  // render button trùng lặp trong cùng div).
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!ready || !clientId) return;
    const gid = window.google?.accounts?.id;
    const parent = buttonRef.current;
    if (!gid || !parent) return;

    try {
      gid.initialize({
        client_id: clientId,
        callback: (resp) => {
          if (resp.credential) callbackRef.current(resp.credential);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
      });
      // Clear trước khi render — tránh button trùng lặp nếu effect re-run.
      parent.innerHTML = '';
      gid.renderButton(parent, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 320,
        locale,
      });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Không khởi tạo được Google Sign-In',
      );
    }
  }, [ready, clientId, locale]);

  if (!clientId) {
    return (
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-900 ring-1 ring-amber-200">
        Google Sign-In chưa cấu hình. Thêm{' '}
        <code className="font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> vào
        <code className="font-mono">.env.local</code> để bật.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Script
        src={GIS_SCRIPT}
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
        onError={() => setError('Không tải được Google Identity Services')}
      />
      <div
        ref={buttonRef}
        className={disabled ? 'pointer-events-none opacity-50' : ''}
      />
      {error && (
        <p className="text-xs text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
