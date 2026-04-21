import { NextResponse } from "next/server";

export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function handleError(e: unknown): NextResponse {
  if (e instanceof AppError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
}
