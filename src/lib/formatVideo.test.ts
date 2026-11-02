import { describe, expect, it } from "vitest";
import { formaterDuree } from "./formatVideo";

describe("formaterDuree", () => {
  it("affiche minutes et secondes", () => {
    expect(formaterDuree(165)).toBe("2 min 45 s");
    expect(formaterDuree(180)).toBe("3 min");
    expect(formaterDuree(42.4)).toBe("42 s");
  });
});
