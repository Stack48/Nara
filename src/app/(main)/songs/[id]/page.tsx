"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LyricsEditorPage() {
    const params = useParams();
    const router = useRouter();

    useEffect(() => {
        if (params?.id) {
            router.replace(`/write/${params.id}`);
        }
    }, [params, router]);

    return null;
}