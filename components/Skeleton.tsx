
import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'rectangular' | 'circular' | 'text';
    width?: string | number;
    height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rectangular', width, height }) => {
    const baseClasses = "animate-pulse bg-slate-200 dark:bg-slate-800";
    const variantClasses = {
        rectangular: "rounded-xl",
        circular: "rounded-full",
        text: "rounded h-4 w-full"
    };

    const style: React.CSSProperties = {
        width: width,
        height: height
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

export default Skeleton;
