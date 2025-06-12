"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Anchor from "./anchor";
import { ChevronDown } from "lucide-react";

interface SubLinkProps {
  title: string;
  href: string;
  level?: number;
  isSheet?: boolean;
  items?: SubLinkProps[];
}

export default function SubLink({
  title,
  href,
  level = 0,
  isSheet = false,
  items,
}: SubLinkProps) {
  const [isOpen, setIsOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    if (path && (path === href || path.includes(href))) setIsOpen(true);
  }, [href, path]);

  const Comp = (
    <div
      className={cn(
        "flex flex-col gap-2",
        level > 0 && "ml-4",
        isSheet && "text-base"
      )}
    >
      <div className="flex items-center justify-between">
        <Anchor
          href={href}
          className={cn(
            "text-muted-foreground hover:text-foreground",
            isSheet && "text-base"
          )}
        >
          {title}
        </Anchor>
        {items && items.length > 0 && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-muted rounded-md"
          >
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                isOpen && "transform rotate-180"
              )}
            />
          </button>
        )}
      </div>
      {isOpen &&
        items?.map((item, index) => (
          <SubLink
            key={item.title + index}
            {...item}
            level={level + 1}
            isSheet={isSheet}
          />
        ))}
    </div>
  );

  return Comp;
}
