import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileSettings } from '@/components/dashboard/ProfileSettings';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-4xl">
      <ProfileSettings user={user} />
    </div>
  );
}
