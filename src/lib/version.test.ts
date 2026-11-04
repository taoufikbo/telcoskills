import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { libelleVersion } from "./version";

describe("version affichée", () => {
  it("donne le numéro et le commit quand on les connaît", () => {
    expect(libelleVersion("0.2.0", "1a2b3c4")).toBe("v0.2.0 · 1a2b3c4");
  });
  it("n'affiche que le numéro sans commit (build hors Vercel)", () => {
    expect(libelleVersion("0.2.0", "")).toBe("v0.2.0");
  });
  it("n'affiche rien si la version est inconnue", () => {
    expect(libelleVersion("", "1a2b3c4")).toBe("");
  });
  it("le numéro de package.json est une version sémantique", () => {
    const { version } = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "..", "package.json"), "utf8"));
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
