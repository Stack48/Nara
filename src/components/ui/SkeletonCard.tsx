"use client";
import { Skeleton } from "./Skeleton";

export const SkeletonCard = ({ viewMode, type = "song" }: { viewMode: "grid" | "list", type?: "project" | "song" }) => {
    if (viewMode === "list") {
        return (
            <div className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl">
                <div className="col-span-4 flex items-center gap-4 pl-1">
                    <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
                <Skeleton className="col-span-2 h-3" />
                <Skeleton className="col-span-2 h-3" />
                <Skeleton className="col-span-2 h-3" />
                <Skeleton className="col-span-2 h-3" />
            </div>
        );
    }

    if (type === "project") {
        return (
            <div className="aspect-square rounded-2xl border border-n-border/80 bg-n-surface p-5 flex flex-col justify-end gap-3 relative overflow-hidden">
                <Skeleton className="absolute inset-0 w-full h-full opacity-10" />
                <div className="relative z-10 flex flex-col gap-2 w-full">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-6 w-3/4" />
                    <div className="mt-2 pt-3 border-t border-white/10 flex justify-between">
                        <Skeleton className="h-3 w-1/4" />
                        <Skeleton className="h-3 w-1/4" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="border border-n-border/80 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 bg-n-surface">
            <Skeleton className="w-full aspect-square sm:w-32 sm:h-32 rounded-xl flex-shrink-0" />
            <div className="flex flex-col flex-1 gap-3 py-1.5 justify-between">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="flex justify-between items-center">
                    <Skeleton className="h-3 w-1/4" />
                    <Skeleton className="h-5 w-12 rounded-md" />
                </div>
            </div>
        </div>
    );
};

export const SkeletonGrid = ({ count = 8, type = "song" }: { count?: number, type?: "project" | "song" }) => {
    const gridClass = type === "project" 
        ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
        : "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";

    return (
        <div className={gridClass}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} viewMode="grid" type={type} />
            ))}
        </div>
    );
};

export const SkeletonList = ({ count = 6 }: { count?: number }) => (
    <div className="flex flex-col gap-2">
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} viewMode="list" />
        ))}
    </div>
);