// NOTE: GET handler is intentional for iframe preview — does not mutate state.
// Template key is strictly whitelisted by VALID_KEYS. No user-derived data is rendered;
// all payloads come from SAMPLE_* constants in src/lib/emails/samples.ts.
// If template rendering ever accepts dynamic params, convert to POST.
import { NextResponse } from 'next/server';

import { BookingConfirmationEmail } from '@/lib/emails/booking-confirmation';
import {
  BookingCompletedGuestReviewEmail,
  BookingCompletedHostReviewEmail,
  BookingDepositTimeoutGuestEmail,
  BookingDepositTimeoutHostEmail,
  BookingHoldTimeoutGuestEmail,
  BookingHoldTimeoutHostEmail,
  BookingRequestGuestEmail,
  BookingRequestHostEmail,
} from '@/lib/emails/booking-transitions';
import { PaymentReceivedEmail } from '@/lib/emails/payment-received';
import {
  SAMPLE_BOOKING_CONFIRMATION,
  SAMPLE_BOOKING_TRANSITION,
  SAMPLE_KYC_APPROVED,
  SAMPLE_KYC_REJECTED,
  SAMPLE_PAYMENT_RECEIVED,
  SAMPLE_PROPERTY_APPROVED,
  SAMPLE_PROPERTY_REJECTED,
  SAMPLE_SUBSCRIPTION_OVERDUE,
} from '@/lib/emails/samples';
import {
  KycApprovedEmail,
  KycRejectedEmail,
  PropertyApprovedEmail,
  PropertyRejectedEmail,
  SubscriptionOverdueEmail,
} from '@/lib/emails/simple-templates';
import type { EmailTemplateKey } from '@/lib/emails/types';
import { requireAdmin } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VALID_KEYS: EmailTemplateKey[] = [
  'booking_confirmation',
  'payment_received',
  'kyc_approved',
  'kyc_rejected',
  'property_approved',
  'property_rejected',
  'subscription_overdue',
  'booking_request_guest',
  'booking_request_host',
  'booking_hold_timeout_guest',
  'booking_hold_timeout_host',
  'booking_deposit_timeout_guest',
  'booking_deposit_timeout_host',
  'booking_completed_guest_review',
  'booking_completed_host_review',
];

function getElement(key: EmailTemplateKey) {
  switch (key) {
    case 'booking_confirmation':
      return <BookingConfirmationEmail data={SAMPLE_BOOKING_CONFIRMATION} />;
    case 'payment_received':
      return <PaymentReceivedEmail data={SAMPLE_PAYMENT_RECEIVED} />;
    case 'kyc_approved':
      return <KycApprovedEmail data={SAMPLE_KYC_APPROVED} />;
    case 'kyc_rejected':
      return <KycRejectedEmail data={SAMPLE_KYC_REJECTED} />;
    case 'property_approved':
      return <PropertyApprovedEmail data={SAMPLE_PROPERTY_APPROVED} />;
    case 'property_rejected':
      return <PropertyRejectedEmail data={SAMPLE_PROPERTY_REJECTED} />;
    case 'subscription_overdue':
      return <SubscriptionOverdueEmail data={SAMPLE_SUBSCRIPTION_OVERDUE} />;
    case 'booking_request_guest':
      return <BookingRequestGuestEmail data={SAMPLE_BOOKING_TRANSITION} />;
    case 'booking_request_host':
      return <BookingRequestHostEmail data={SAMPLE_BOOKING_TRANSITION} />;
    case 'booking_hold_timeout_guest':
      return <BookingHoldTimeoutGuestEmail data={SAMPLE_BOOKING_TRANSITION} />;
    case 'booking_hold_timeout_host':
      return <BookingHoldTimeoutHostEmail data={SAMPLE_BOOKING_TRANSITION} />;
    case 'booking_deposit_timeout_guest':
      return (
        <BookingDepositTimeoutGuestEmail data={SAMPLE_BOOKING_TRANSITION} />
      );
    case 'booking_deposit_timeout_host':
      return (
        <BookingDepositTimeoutHostEmail data={SAMPLE_BOOKING_TRANSITION} />
      );
    case 'booking_completed_guest_review':
      return (
        <BookingCompletedGuestReviewEmail data={SAMPLE_BOOKING_TRANSITION} />
      );
    case 'booking_completed_host_review':
      return (
        <BookingCompletedHostReviewEmail data={SAMPLE_BOOKING_TRANSITION} />
      );
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ template: string }> },
) {
  await requireAdmin();
  const { template } = await ctx.params;
  if (!(VALID_KEYS as string[]).includes(template)) {
    return NextResponse.json(
      { error: 'Invalid template key' },
      { status: 400 },
    );
  }

  // Dynamic import bypasses Next.js compiler check on `react-dom/server`.
  const { renderToStaticMarkup } = await import('react-dom/server');
  const html = renderToStaticMarkup(getElement(template as EmailTemplateKey));

  return new NextResponse(`<!doctype html>\n${html}`, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
