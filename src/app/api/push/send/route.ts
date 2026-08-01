import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Broadcasts a push notification to every stored subscription. Guarded by a
 * shared secret so random visitors can't blast every subscriber.
 */
export async function POST(req: NextRequest) {
  const { title, body, url, secret } = await req.json();

  if (!process.env.PUSH_ADMIN_SECRET || secret !== process.env.PUSH_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!title || !body) {
    return NextResponse.json({ error: "title and body are required" }, { status: 400 });
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;
  if (!vapidPublic || !vapidPrivate || !vapidSubject) {
    return NextResponse.json({ error: "VAPID keys are not configured" }, { status: 500 });
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const supabase = supabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase isn't configured" }, { status: 500 });
  }

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const payload = JSON.stringify({ title, body, url: url || "/" });
  let sent = 0;
  let removed = 0;
  const errors: string[] = [];

  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
          removed++;
        } else {
          errors.push(err instanceof Error ? err.message : "Unknown error");
        }
      }
    })
  );

  return NextResponse.json({ sent, removed, total: subs?.length ?? 0, errors });
}
