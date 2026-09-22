import { listClasses } from "@/lib/data";

export async function GET() {
  return Response.json({ classes: await listClasses() });
}
