import { NextRequest, NextResponse } from "next/server";
import db, { standardDrinks } from "@/lib/db";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD, local date
  const rows = date
    ? db
        .prepare(
          `SELECT * FROM drinks WHERE date(created_at, 'localtime') = ? ORDER BY created_at DESC`
        )
        .all(date)
    : db.prepare(`SELECT * FROM drinks ORDER BY created_at DESC LIMIT 200`).all();

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, drink_type, volume_ml, abv_percent, calories, notes } = body;

  if (!name || volume_ml == null || abv_percent == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const sd = standardDrinks(Number(volume_ml), Number(abv_percent));
  const created_at = new Date().toISOString();

  const info = db
    .prepare(
      `INSERT INTO drinks (created_at, name, drink_type, volume_ml, abv_percent, calories, standard_drinks, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      created_at,
      name,
      drink_type || "other",
      Number(volume_ml),
      Number(abv_percent),
      Number(calories) || 0,
      sd,
      notes || null
    );

  return NextResponse.json({ id: info.lastInsertRowid, created_at, standard_drinks: sd });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  db.prepare(`DELETE FROM drinks WHERE id = ?`).run(id);
  return NextResponse.json({ ok: true });
}
