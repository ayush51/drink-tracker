import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Push isn't configured on this server." }, { status: 500 });
  }

  const { subscription, deviceId, name } = await req.json();
  if (!subscription?.endpoint || !deviceId) {
    return NextResponse.json({ error: "Missing subscription or deviceId" }, { status: 400 });
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys?.p256dh ?? "",
      auth: subscription.keys?.auth ?? "",
      device_id: deviceId,
      name: name ?? "",
    },
    { onConflict: "endpoint" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
