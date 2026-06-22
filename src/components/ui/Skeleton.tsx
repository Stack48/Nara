"use client";

export const Skeleton = ({ className }: { className?: string }) => (
    <div className={`bg-n-hover/60 rounded-lg skeleton-pulse ${className}`} />
);