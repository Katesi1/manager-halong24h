import { Suspense } from 'react';

import { AcceptInviteClient } from '@/components/auth/accept-invite-client';

export default function StaffAcceptPage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteClient />
    </Suspense>
  );
}
