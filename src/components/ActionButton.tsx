import React from "react";

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

const ActionButton: React.FC<ActionButtonProps> = ({ variant = "primary", className, children, ...props }) => {
  const baseStyles = "px-4 py-2 rounded-md font-medium transition";
  const variants = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "border border-gray-300 text-gray-700 hover:bg-gray-100"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default ActionButton;
