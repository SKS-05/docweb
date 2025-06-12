"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface AnchorProps {
  href: string;
  children: ReactNode;
  className?: string;
  absolute?: boolean;
  activeClassName?: string;
  disabled?: boolean;
}

export default function Anchor(props: AnchorProps) {
  const path = usePathname();
  let isMatch = props.absolute
    ? props.href.toString().split("/")[1] === (path?.split("/")[1] || "")
    : path === props.href;

  if (props.href.toString().includes("http")) isMatch = false;

  if (props.disabled)
    return (
      <div className={cn(props.className, "cursor-not-allowed")}>{props.children}</div>
    );
  return (
    <Link
      href={props.href}
      className={`${
        isMatch
          ? "text-[#FF6B00] font-semibold"
          : "text-gray-600 hover:text-[#FF6B00]"
      } ${props.className || ""}`}
    >
      {props.children}
    </Link>
  );
}
