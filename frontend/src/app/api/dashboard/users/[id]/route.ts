import { NextResponse, type NextRequest } from 'next/server';
import { adminClient } from '@/lib/supabase/server';
import { asAdmin } from '../guard';

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
