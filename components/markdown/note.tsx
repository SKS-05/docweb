import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

type NoteProps = PropsWithChildren & {
  title?: string;
  type?: "note" | "danger" | "warning" | "success";
};

export default function Note({
  children,
}: NoteProps) {
  return (
    <div
      className={cn(
        "border rounded-md mt-5 mb-7 text-sm tracking-wide",
        "bg-orange-100 border-orange-200 dark:bg-orange-950 dark:border-orange-900",
        "p-4"
      )}
    >
      <div className="inline font-bold mr-1">Note:</div> {children}
    </div>
  );
}
