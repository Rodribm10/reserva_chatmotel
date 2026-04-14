import * as React from "react";

/**
 * Stub component to completely disable Confetti functionality for debugging purposes.
 * This component renders a plain button and uses no React hooks or complex dependencies
 * to help isolate potential errors.
 */
export const Confetti: React.FC = () => null;

export const ConfettiButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button {...props}>{props.children}</button>
);
