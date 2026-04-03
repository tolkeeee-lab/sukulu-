import { redirect } from 'next/navigation'

// NOTE: This file conflicts with app/page.tsx (both resolve to URL "/").
// Safe to delete this file — app/page.tsx handles the root redirect.
export default function GroupIndexPage() {
  redirect('/dashboard')
}
