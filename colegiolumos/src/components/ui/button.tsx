
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { clsx } from "clsx"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "btn btn-primary",
        destructive: "btn btn-destructive",
        outline: "btn btn-outline",
        secondary: "btn btn-secondary",
        ghost: "btn btn-ghost",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "btn-md",
        sm: "btn-sm",
        lg: "btn-lg",
        icon: "h-10 w-10",
        none: "",           // 👈 novo size “sem estilo de tamanho”
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)


export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  responsive?: boolean;
  mobileText?: string;
  desktopText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, responsive = false, mobileText, desktopText, children, ...props }, ref) => {
    const renderContent = () => {
      if (responsive && mobileText && desktopText) {
        return (
          <>
            <span className="sm:hidden">{mobileText}</span>
            <span className="hidden sm:inline">{desktopText}</span>
          </>
        );
      }
      return children;
    };

    return (
      <button
        className={clsx(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      >
        {renderContent()}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
