import { listClasses } from "@/lib/data/list-classes";

export async function GET() {
  return Response.json({ classes: await listClasses() });
}
