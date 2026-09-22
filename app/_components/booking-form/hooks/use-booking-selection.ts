import { useState } from "react";

export function useBookingSelection({ onChange }: { onChange?: () => void } = {}) {
  const [parentId, setParentId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");

  function chooseParent(id: string) {
    setParentId(id);
    // A child from the previous parent is no longer a valid choice.
    setStudentId("");
    onChange?.();
  }

  function chooseStudent(id: string) {
    setStudentId(id);
    onChange?.();
  }

  function chooseClass(id: string) {
    setClassId(id);
    onChange?.();
  }

  return { parentId, studentId, classId, chooseParent, chooseStudent, chooseClass };
}
