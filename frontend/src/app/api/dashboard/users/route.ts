import { NextResponse, type NextRequest } from 'next/server';
import { newUserSchema } from '@/lib/dashboard/auth/types';
import { adminClient } from '@/lib/supabase/server';
import { asAdmin, PROFILE_COLUMNS, toDashboardUser, type ProfileRow } from './guard';

/** GET (admins): every team member, with last sign-in and two-step status from Supabase Auth. */
export async function GET(request: NextRequest) {
  return asAdmin(request, async () => {
    const admin = adminClient();
    const [{ data: profiles, error }, { data: auth }] = await Promise.all([
      admin.from('profiles').select(PROFILE_COLUMNS).order('name').returns<ProfileRow[]>(),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const byId = new Map((auth?.users ?? []).map((u) => [u.id, u]));
    return NextResponse.json({
      users: (profiles ?? []).map((p) => toDashboardUser(p, byId.get(p.id))),
    });
  });
}

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
      .select(PROFILE_COLUMNS)
      .single<ProfileRow>();
    if (profileError || !profile) {
      // Don't leave an account without dashboard access behind.
      await admin.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({ error: 'Could not add the user.' }, { status: 500 });
    }

    return NextResponse.json({ user: toDashboardUser(profile, data.user) }, { status: 201 });
  });
}
