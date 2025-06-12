"use client";

import { usePathname } from "next/navigation";
import { routes } from "@/lib/routes-config";
import { cn } from "@/lib/utils";
import Anchor from "./anchor";

export default function DocsMenu({ isSheet = false }) {
  const pathname = usePathname();
  if (!pathname || !pathname.startsWith("/docs")) return null;

  return (
    <div className="flex flex-col gap-3.5 mt-5 pr-2 pb-6 sm:text-base text-[14.5px]">
      {routes.map((route) => (
        <div key={route.title} className="flex flex-col gap-2">
          <h3 className="font-semibold text-foreground">{route.title}</h3>
          {route.items.map((item) => (
            <Anchor
              key={item.href}
              href={item.href}
              className={cn(
                "text-muted-foreground hover:text-foreground",
                isSheet && "text-base"
              )}
            >
              {item.title}
            </Anchor>
          ))}
        </div>
      ))}
    </div>
  );
}
