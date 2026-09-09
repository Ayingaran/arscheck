import { createClient } from "@supabase/supabase-js";

export async function getApiUser(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  const supabase = createClient(url, anonKey);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireAdmin(request: Request) {
  const user = await getApiUser(request);

  if (!user) {
    return {
      allowed: false as const,
      status: 401,
      error: "Authentication required.",
    };
  }

  if (user.app_metadata?.role !== "admin") {
    return {
      allowed: false as const,
      status: 403,
      error: "Admin access required.",
    };
  }

  return {
    allowed: true as const,
    user,
  };
}

export async function requireStaffOrAdmin(request: Request) {
  const user = await getApiUser(request);

  if (!user) {
    return {
      allowed: false as const,
      status: 401,
      error: "Authentication required.",
    };
  }

  const role = user.app_metadata?.role;

  if (role !== "admin" && role !== "staff") {
    return {
      allowed: false as const,
      status: 403,
      error: "Staff access required.",
    };
  }

  return {
    allowed: true as const,
    user,
    role,
  };
}
