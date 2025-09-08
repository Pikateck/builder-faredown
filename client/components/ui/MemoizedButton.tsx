import React, { memo } from "react";
import { Button, ButtonProps } from "./button";

/**
 * Memoized Button component to prevent unnecessary re-renders
 * Use this for buttons that don't change frequently
 */
export const MemoizedButton = memo<ButtonProps>(function MemoizedButton(props) {
  return <Button {...props} />;
});

// Custom comparison function for specific use cases
export const MemoizedButtonWithCustomComparison = memo<ButtonProps>(
  function MemoizedButtonWithCustomComparison(props) {
    return <Button {...props} />;
  },
  (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
      prevProps.children === nextProps.children &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.variant === nextProps.variant &&
      prevProps.size === nextProps.size &&
      prevProps.className === nextProps.className
    );
  }
);
