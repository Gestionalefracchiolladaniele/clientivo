import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/app/onedigit');

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <Image
          src="/logo.png"
          alt="Clientivo"
          width={160}
          height={48}
          className="object-contain"
          priority
        />
        <LoginForm />
      </div>
    </div>
  );
}
