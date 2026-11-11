
import "server-only";

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";

type AdminAccess =
  | {
      ok: true;
      client: SupabaseClient<Database>;
      userId: string;
    }
  | {
      ok: false;
      status: 401 | 403 | 500;
      error: string;
    };

export async function requireAdmin(
  request: Request,
): Promise<AdminAccess> {
  const authorization = request.headers.get("authorization");

  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "Authentication required.",
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return {
      ok: false,
      status: 500,
      error: "Supabase configuration is missing.",
    };
  }

  const client = createClient<Database>(
    supabaseUrl,
    anonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  );

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser(token);

  if (authError || !user) {
    return {
      ok: false,
      status: 401,
      error: "Invalid or expired authentication token.",
    };
  }

  const { data: isAdmin, error: adminError } =
    await client.rpc("is_admin", {});

  if (adminError) {
    console.error("Admin verification failed:", adminError);

    return {
      ok: false,
      status: 500,
      error: "Unable to verify administrator access.",
    };
  }

  if (isAdmin !== true) {
    return {
      ok: false,
      status: 403,
      error: "Administrator access required.",
    };
  }

  return {
    ok: true,
    client,
    userId: user.id,
  };
}
