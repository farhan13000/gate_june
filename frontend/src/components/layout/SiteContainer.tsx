import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SiteContainerElement = "div" | "section" | "main" | "header" | "footer";

export interface SiteContainerProps extends HTMLAttributes<HTMLElement> {
  as?: SiteContainerElement;
}

/**
 * Universal horizontal layout shell — max-width, centered, responsive padding.
 * Use in Navbar, Footer, and as the base for all page content.
 */
export function SiteContainer({ as: Comp = "div", className, ...props }: SiteContainerProps) {
  return <Comp className={cn("site-container", className)} {...props} />;
}

export default SiteContainer;
