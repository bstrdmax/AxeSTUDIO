
import React from 'react';

interface IconProps {
    children: React.ReactNode;
    className?: string;
}

export const Icon: React.FC<IconProps> = ({ children, className }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-full w-full ${className}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
        >
            {children}
        </svg>
    );
};
