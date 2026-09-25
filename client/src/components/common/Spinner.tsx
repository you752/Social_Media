import { Loader2 } from "lucide-react";
import clsx from "clsx";

export function Spinner({ size = 24, className }: { size?: number; className?: string }) {
  return <Loader2 className={clsx("spin", className)} size={size} />;
}

export function PageSpinner() {
  return (
    <div className="page-spinner">
      <Spinner size={32} />
    </div>
  );
}
