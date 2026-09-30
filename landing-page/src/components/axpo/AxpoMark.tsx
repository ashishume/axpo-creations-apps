import { cn } from "@/lib/utils";

type AxpoMarkProps = {
  className?: string;
  alt?: string;
  /** Swap to the dark artwork when inside `.theme-axpo-system` and the OS is dark. */
  followSystem?: boolean;
  loading?: "eager" | "lazy";
};

/** The AXPO app mark, shared with the native iOS and Android apps. */
export function AxpoMark({ className, alt = "AXPO", followSystem = false, loading }: AxpoMarkProps) {
  if (!followSystem) {
    return <img src="/axpo-mark.png" alt={alt} className={className} loading={loading} />;
  }
  return (
    <>
      <img src="/axpo-mark.png" alt={alt} className={cn("axpo-mark-light", className)} loading={loading} />
      <img src="/axpo-mark-dark.png" alt={alt} className={cn("axpo-mark-dark", className)} loading={loading} />
    </>
  );
}
