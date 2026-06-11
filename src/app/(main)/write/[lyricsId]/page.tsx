import LyricsEditorScreen from "@/components/LyricsEditor/LyricsEditorScreen";

export default async function WritePage({
    params,
}: {
    params: Promise<{ lyricsId: string }>;
}) {
    const { lyricsId } = await params;
    return <LyricsEditorScreen lyricsId={lyricsId} />;
}
