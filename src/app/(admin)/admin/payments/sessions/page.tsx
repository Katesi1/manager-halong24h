import { redirect } from 'next/navigation';

export default function PaymentSessionsRedirect() {
  redirect('/admin/payments?view=approve');
}
