import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listCompanies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { withRetry } = await import("./retry");
    return withRetry(async () => {
      const { data, error } = await context.supabase
        .from("companies")
        .select("*")
        .eq("active", true)
        .order("name", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    });
  });

export const getCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: z.string().max(80) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("companies")
      .select("*")
      .eq("slug", data.slug)
      .eq("active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Company not found");
    return row;
  });

export const getTargetCompanies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("target_companies")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.target_companies ?? [];
  });

export const toggleTargetCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: z.string().max(80) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: profile, error: readErr } = await context.supabase
      .from("profiles")
      .select("target_companies")
      .eq("id", context.userId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);

    const current = profile?.target_companies ?? [];
    const next = current.includes(data.slug)
      ? current.filter((s) => s !== data.slug)
      : [...current, data.slug];

    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, target_companies: next });
    if (error) throw new Error(error.message);
    return { target_companies: next };
  });
