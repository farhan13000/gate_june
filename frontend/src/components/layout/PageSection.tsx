import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface PageSectionProps extends HTMLAttributes<HTMLElement> {
  as?: "section" | "div";
}

/** Consistent vertical spacing between major page blocks. */
export function PageSection({ as: Comp = "section", className, ...props }: PageSectionProps) {
  return <Comp className={cn("page-section", className)} {...props} />;
}

export default PageSection;
