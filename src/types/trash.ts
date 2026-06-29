export interface TrashedFile {
    id: string;
    name: string; 
    mimeType: string;
    size: number; 
    deletedAt: string; 

    expiresAt?: string;
}