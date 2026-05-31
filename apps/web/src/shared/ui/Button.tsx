/**
 * shared/ui — 汎用 UI キット。ドメイン知識ゼロ。
 * 「LikeButton」のようなドメイン語彙はここに置かない（それは features/like-post/ui）。
 */
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "ghost";
}

export function Button({ children, variant = "primary", ...rest }: ButtonProps) {
  return (
    <button data-variant={variant} {...rest}>
      {children}
    </button>
  );
}
