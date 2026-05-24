import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface MainPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Narrow centered panel for login/register */
  variant?: "default" | "auth";
}

/**
 * AtCoder-style centered content shell — white panel on gray page background.
 * All primary page content should render inside this component.
 */
export function MainPanel({ className, variant = "default", children, ...props }: MainPanelProps) {
  return (
    <div
      className={cn(
        "site-main-panel",
        variant === "auth" && "site-main-panel-auth",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default MainPanel;
