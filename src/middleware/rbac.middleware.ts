import * as originalRbac from "@/lib/rbac";
import { NextRequest, NextResponse } from "next/server";

export type Role =
  | "ADMIN"
  | "LEAD_LYRICIST"
  | "LYRICIST"
  | "READONLY"
  | "LEAD_PAROLIER"
  | "PAROLIER"
  | "LECTURE_SEULE";

const ROLE_MAP: Record<string, string> = {
  ADMIN: "ADMIN",
  LEAD_LYRICIST: "LEAD_LYRICIST",
  LYRICIST: "LYRICIST",
  READONLY: "READONLY",
  LEAD_PAROLIER: "LEAD_LYRICIST",
  PAROLIER: "LYRICIST",
  LECTURE_SEULE: "READONLY",
};

export function mapRole(role: string): any {
  return ROLE_MAP[role] || role;
}

export function hasPermission(userRole: any, requiredRole: any): boolean {
  return originalRbac.hasPermission(mapRole(userRole), mapRole(requiredRole));
}

export async function getProjectMember(cognitoId: string, projectId: string) {
  const result = await originalRbac.getProjectMember(cognitoId, projectId);
  if (!result) return null;
  return {
    ...result,
    role: mapRole(result.role),
  };
}

export async function requireRole(
  cognitoId: string,
  projectId: string,
  requiredRole: any
) {
  return originalRbac.requireRole(cognitoId, projectId, mapRole(requiredRole));
}

export const getCognitoId = originalRbac.getCognitoId;
export const forbidden = originalRbac.forbidden;
export const unauthorized = originalRbac.unauthorized;
