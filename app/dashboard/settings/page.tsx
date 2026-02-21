/**
 * Account Settings Page
 * 
 * Allows users to manage their account and data.
 * Validates Requirements: 15.5
 */

import { AccountSettings } from '@/components/dashboard/AccountSettings';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <AccountSettings />
    </div>
  );
}
