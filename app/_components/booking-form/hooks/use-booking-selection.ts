import { useState } from "react";

export function useBookingSelection() {
  const [parentId, setParentId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");

  function chooseParent(id: string) {
    setParentId(id);
    // A child from the previous parent is no longer a valid choice.
    setStudentId("");
  }

  return {
    parentId,
    studentId,
    classId,
    chooseParent,
    chooseStudent: setStudentId,
    chooseClass: setClassId,
  };
}
