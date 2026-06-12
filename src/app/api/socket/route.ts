import { NextRequest, NextResponse } from "next/server";
import { getSocketServer } from "@/server/socket.server";

export async function GET(request: NextRequest) {
    try {
        getSocketServer();
        return NextResponse.json({ status: "Socket.io server running" });
    } catch (error) {
        console.error("Socket.io error:", error);
        return NextResponse.json({ error: "Socket.io failed" }, { status: 500 });
    }
}