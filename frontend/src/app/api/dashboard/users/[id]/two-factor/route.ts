import { NextResponse, type NextRequest } from 'next/server';
import { adminClient } from '@/lib/supabase/server';
import { asAdmin } from '../../guard';

/** DELETE (admins): removes a user's authenticator app so they set it up again at next sign-in. */
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<'/api/dashboard/users/[id]/two-factor'>,
) {
  const { id } = await params;
  return asAdmin(request, async () => {
    const admin = adminClient();
    const { data, error } = await admin.auth.admin.mfa.listFactors({ userId: id });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    for (const factor of data.factors)
      await admin.auth.admin.mfa.deleteFactor({ userId: id, id: factor.id });
    return NextResponse.json({ reset: true });
  });
}
