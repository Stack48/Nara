import { hasPermission } from "@/lib/rbac";

describe("RBAC — hasPermission", () => {

  it("ADMIN peut accéder aux routes ADMIN", () => {
    expect(hasPermission("ADMIN", "ADMIN")).toBe(true);
  });

  it("ADMIN peut accéder aux routes LEAD_LYRICIST", () => {
    expect(hasPermission("ADMIN", "LEAD_LYRICIST")).toBe(true);
  });

  it("ADMIN peut accéder aux routes READONLY", () => {
    expect(hasPermission("ADMIN", "READONLY")).toBe(true);
  });

  it("LEAD_LYRICIST peut accéder aux routes LYRICIST", () => {
    expect(hasPermission("LEAD_LYRICIST", "LYRICIST")).toBe(true);
  });

  it("LEAD_LYRICIST ne peut pas accéder aux routes ADMIN", () => {
    expect(hasPermission("LEAD_LYRICIST", "ADMIN")).toBe(false);
  });

  it("LYRICIST peut accéder aux routes READONLY", () => {
    expect(hasPermission("LYRICIST", "READONLY")).toBe(true);
  });

  it("LYRICIST ne peut pas accéder aux routes LEAD_LYRICIST", () => {
    expect(hasPermission("LYRICIST", "LEAD_LYRICIST")).toBe(false);
  });

  it("LYRICIST ne peut pas modifier directement", () => {
    expect(hasPermission("LYRICIST", "ADMIN")).toBe(false);
  });

  it("READONLY ne peut accéder qu'aux routes READONLY", () => {
    expect(hasPermission("READONLY", "READONLY")).toBe(true);
  });

  it("READONLY ne peut pas accéder aux routes LYRICIST", () => {
    expect(hasPermission("READONLY", "LYRICIST")).toBe(false);
  });

  it("READONLY ne peut pas accéder aux routes ADMIN", () => {
    expect(hasPermission("READONLY", "ADMIN")).toBe(false);
  });
});