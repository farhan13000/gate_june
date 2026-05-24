import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import SiteContainer from "./SiteContainer";
import MainPanel from "./MainPanel";

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Skip default vertical padding (e.g. admin sub-layouts) */
  flush?: boolean;
  /** Skip white middle panel wrapper */
  bare?: boolean;
  /** Panel variant */
  panelVariant?: "default" | "auth";
}

/**
 * Site container + AtCoder-style middle white panel for all page content.
 */
export function PageContainer({
  className,
  flush,
  bare,
  panelVariant = "default",
  children,
  ...props
}: PageContainerProps) {
  return (
    <SiteContainer className={cn(!flush && "page-container", className)} {...props}>
      {bare ? children : <MainPanel variant={panelVariant}>{children}</MainPanel>}
    </SiteContainer>
  );
}

export default PageContainer;
