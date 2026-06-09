import { useParams } from "react-router-dom";
import Problems from "./Problems";

export default function PYQProblems() {
  const { subjectId } = useParams();
  const initialSubjectId = subjectId && subjectId !== "all" ? subjectId : undefined;

  return <Problems mode="pyq" initialSubjectId={initialSubjectId} />;
}
