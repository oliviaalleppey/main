import { redirect } from 'next/navigation';

export default function GuestDetailsRedirectPage() {
    redirect('/book/checkout');
}
