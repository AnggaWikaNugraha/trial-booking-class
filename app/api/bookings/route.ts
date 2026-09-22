import { createBooking } from "@/lib/data/create-booking";
import { getClass } from "@/lib/data/get-class";
import { studentBelongsToParent } from "@/lib/data/student-belongs-to-parent";
import { isUuid, jsonError } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { parent_id, student_id, class_id } = body ?? {};
  if (!isUuid(parent_id) || !isUuid(student_id) || !isUuid(class_id)) {
    return jsonError(400, "parent_id, student_id, and class_id must be valid ids");
  }

  // There is no login, so parent_id comes from the client and is checked here.
  if (!(await studentBelongsToParent(student_id, parent_id))) {
    return jsonError(403, "This child does not belong to this parent");
  }

  const trialClass = await getClass(class_id);
  if (!trialClass) return jsonError(404, "Class not found");
  // Early check so nobody pays for a class that is already full. It can be
  // stale; confirm_payment is what actually guards the seat.
  if (trialClass.confirmed_count >= trialClass.capacity) {
    return jsonError(409, "This class is already full");
  }

  const result = await createBooking(student_id, class_id);
  if (!result.ok) {
    return jsonError(409, "This child already has an active booking for this class");
  }
  return Response.json({ booking: result.booking }, { status: 201 });
}
