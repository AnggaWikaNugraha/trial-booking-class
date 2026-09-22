import { resetDemoData } from "@/lib/data/reset-demo-data";

// Wipes every booking and restores the seed. Open to anyone who can reach the
// app, which is acceptable only because this is a demo with synthetic data.
export async function POST() {
  await resetDemoData();
  return Response.json({ ok: true });
}
