import { NextResponse, type NextRequest } from 'next/server';
import { newUserSchema, type DashboardUser } from '@/lib/dashboard/auth/types';
import { adminClient } from '@/lib/supabase/server';
import { asAdmin } from './guard';

/** POST { name, email, role, password } (admins): creates a staff account that can sign in now. */
export async function POST(request: NextRequest) {
  return asAdmin(request, async () => {
    const parsed = newUserSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Check the details.' },
        { status: 400 },
      );
    const { name, email, role, password } = parsed.data;
    const admin = adminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error || !data.user)
      return NextResponse.json(
        { error: error?.message ?? 'Could not create the account.' },
        { status: 400 },
      );

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .insert({ id: data.user.id, email, name, role })
      .select('id,email,name,role,created_at')
      .single();
    if (profileError || !profile) {
      // Don't leave an account without dashboard access behind.
      await admin.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({ error: 'Could not add the user.' }, { status: 500 });
    }

    const user: DashboardUser = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      mfaEnrolled: false,
      createdAt: profile.created_at,
    };
    return NextResponse.json({ user }, { status: 201 });
  });
}
