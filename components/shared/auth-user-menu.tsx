import Link from "next/link";

import { signOutAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export async function AuthUserMenu() {
  const supabase = await createClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Link href="/login" className="rounded-lg border border-border px-3 py-1.5 text-xs text-gray-200 hover:text-white">
        Iniciar sesion
      </Link>
    );
  }

  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="rounded-lg border border-border px-3 py-1.5 text-xs text-gray-200 hover:text-white"
      >
        Cerrar sesion
      </button>
    </form>
  );
}
