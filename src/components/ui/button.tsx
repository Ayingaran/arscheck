import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
  {
    variants: {
      variant: {
        default: "bg-zinc-950 text-white shadow-sm hover:bg-zinc-800 hover:-translate-y-px",
        outline: "border border-zinc-200 bg-white/70 text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300",
        ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
        gold: "bg-[#D4AF37] text-zinc-950 hover:bg-[#e0bd55] shadow-[0_10px_30px_rgba(212,175,55,.2)]",
        danger: "bg-red-50 text-red-700 border border-red-100 hover:bg-red-100",
      },
      size: { default: "h-10 px-4", sm: "h-9 px-3 text-xs", lg: "h-12 px-5" },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
));
Button.displayName = "Button";
