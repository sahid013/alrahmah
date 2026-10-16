import { NextResponse, type NextRequest } from 'next/server';
import { userUpdateSchema } from '@/lib/dashboard/auth/types';
import { adminClient } from '@/lib/supabase/server';
import { asAdmin, PROFILE_COLUMNS, toDashboardUser, type ProfileRow } from '../guard';

/**
 * PATCH { name?, email?, password? } (admins): edit a team member. A new email works straight
 * away (no confirmation email); a new password replaces the old one.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<'/api/dashboard/users/[id]'>,
) {
  const { id } = await params;
  return asAdmin(request, async () => {
    const parsed = userUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Check the details.' },
        { status: 400 },
      );
    const { name, email, password } = parsed.data;
    const admin = adminClient();

    const { data: auth, error } = await admin.auth.admin.updateUserById(id, {
      ...(email && { email, email_confirm: true }),
      ...(password && { password }),
      ...(name && { user_metadata: { name } }),
    });
    if (error || !auth.user)
      return NextResponse.json({ error: error?.message ?? 'Could not update.' }, { status: 400 });

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .update({ ...(name && { name }), ...(email && { email }) })
      .eq('id', id)
      .select(PROFILE_COLUMNS)
      .single<ProfileRow>();
    if (profileError || !profile)
      return NextResponse.json({ error: 'That user no longer exists.' }, { status: 404 });
    return NextResponse.json({ user: toDashboardUser(profile, auth.user) });
  });
}

/** DELETE (admins): removes a staff account. You can't remove yourself or the last admin. */
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<'/api/dashboard/users/[id]'>,
) {
  const { id } = await params;
  return asAdmin(request, async (me) => {
    if (id === me.userId)
      return NextResponse.json({ error: 'You can’t remove your own account.' }, { status: 400 });
    const admin = adminClient();
    // Profile first: the database refuses to remove the last admin.
    const { error: profileError } = await admin.from('profiles').delete().eq('id', id);
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ removed: true });
  });
}
