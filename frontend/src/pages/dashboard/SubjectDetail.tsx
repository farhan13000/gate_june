import { useParams } from "react-router-dom";

export default function SubjectDetail() {
  const { subjectId } = useParams();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif font-bold text-foreground">Subject Details: {subjectId}</h1>
      <p className="text-sm text-muted-foreground">Detailed chapter and topic reports.</p>
      <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-lg">
        Detailed report for {subjectId} coming soon.
      </div>
    </div>
  );
}
