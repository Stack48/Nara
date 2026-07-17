import LyricsEditorScreen from "@/components/lyricsEditor/LyricsEditorScreen";
import { prisma } from "@/lib/prisma";

export default async function WritePage({
    params,
}: {
    params: Promise<{ lyricsId: string }>;
}) {
    const { lyricsId } = await params;
    
    const lyrics = await prisma.lyrics.findUnique({
        where: { id: lyricsId },
        select: { projectId: true }
    });
    
    return <LyricsEditorScreen lyricsId={lyricsId} projectId={lyrics?.projectId || undefined} />;
}
