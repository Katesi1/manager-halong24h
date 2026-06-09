'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { loginWithGoogleAction } from '@/app/actions/auth';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { RoleSelectDialog } from '@/components/auth/role-select-dialog';
import type { OAuthNewUserPrompt } from '@/core/entities/user';
import type { RoleCode } from '@/core/value-objects/role';

interface State {
  busy: boolean;
  error: string | null;
  /** Lưu idToken cùng với prompt để gọi lại action kèm role. */
  prompt: { idToken: string; data: OAuthNewUserPrompt } | null;
}

const INITIAL: State = { busy: false, error: null, prompt: null };

export function GoogleLoginSection() {
  const router = useRouter();
  const [state, setState] = useState<State>(INITIAL);

  async function submit(idToken: string, role?: RoleCode) {
    setState((s) => ({ ...s, busy: true, error: null }));
    const res = await loginWithGoogleAction(idToken, role);
    if (!res.ok) {
      setState({ busy: false, error: res.error, prompt: null });
      return;
    }
    if (res.kind === 'needs-role') {
      setState({ busy: false, error: null, prompt: { idToken, data: res.prompt } });
      return;
    }
    setState(INITIAL);
    router.push(res.redirectTo);
    router.refresh();
  }

  return (
    <>
      <GoogleSignInButton
        onCredential={(idToken) => void submit(idToken)}
        disabled={state.busy}
      />
      {state.error && (
        <p className="mt-2 text-center text-xs text-rose-600" role="alert">
          {state.error}
        </p>
      )}
      {state.prompt && (
        <RoleSelectDialog
          open={true}
          userName={state.prompt.data.googleProfile.name}
          userEmail={state.prompt.data.googleProfile.email}
          pending={state.busy}
          onSelect={(role) =>
            void submit(state.prompt!.idToken, role)
          }
          onCancel={() => setState(INITIAL)}
        />
      )}
    </>
  );
}
