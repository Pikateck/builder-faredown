import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#003580] text-white hover:bg-[#0071c2] shadow-lg hover:shadow-xl transition-all duration-300",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg",
        outline:
          "border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-[#003580] text-gray-900 transition-all duration-300",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-md transition-all duration-300",
        ghost: "hover:bg-gray-100 hover:text-gray-900 transition-all duration-300",
        link: "text-[#003580] underline-offset-4 hover:underline font-medium",
        yellow: "bg-[#febb02] hover:bg-[#e6a602] active:bg-[#d19900] text-black font-bold shadow-lg hover:shadow-xl transition-all duration-300",
        premium: "bg-gradient-to-r from-[#003580] to-[#0071c2] text-white hover:from-[#0071c2] hover:to-[#003580] shadow-lg hover:shadow-xl transition-all duration-300",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-lg px-4",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
