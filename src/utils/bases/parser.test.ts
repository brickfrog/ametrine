import { describe, it, expect } from "vitest";
import {
  parseBaseFile,
  normalizeFilter,
  combineFilters,
  validateOrder,
} from "./parser";

describe("parseBaseFile", () => {
  it("should parse valid base config with single table view", () => {
    const yaml = `
views:
  - type: table
    name: All Notes
    `;

    const result = parseBaseFile(yaml);
    expect(result.views).toHaveLength(1);
    expect(result.views[0].type).toBe("table");
    expect(result.views[0].name).toBe("All Notes");
  });

  it("should parse multiple views with different types", () => {
    const yaml = `
views:
  - type: table
    name: Table View
  - type: cards
    name: Card View
  - type: list
    name: List View
  - type: map
    name: Map View
    `;

    const result = parseBaseFile(yaml);
    expect(result.views).toHaveLength(4);
    expect(result.views.map((v) => v.type)).toEqual([
      "table",
      "cards",
      "list",
      "map",
    ]);
  });

  it("should parse numeric fields correctly", () => {
    const yaml = `
views:
  - type: cards
    name: Cards
    limit: 10
    cardSize: 300
    imageAspectRatio: 1.5
    `;

    const result = parseBaseFile(yaml);
    expect(result.views[0].limit).toBe(10);
    expect(result.views[0].cardSize).toBe(300);
    expect(result.views[0].imageAspectRatio).toBe(1.5);
  });

  it("should handle string numbers in numeric fields", () => {
    const yaml = `
views:
  - type: cards
    name: Cards
    limit: "20"
    cardSize: "400"
    `;

    const result = parseBaseFile(yaml);
    expect(result.views[0].limit).toBe(20);
    expect(result.views[0].cardSize).toBe(400);
  });

  it("should preserve global filters, formulas, and properties", () => {
    const yaml = `
filters:
  and:
    - "status == 'published'"
    - "tags.includes('blog')"
formulas:
  wordCount: "note.body.split(' ').length"
properties:
  status:
    displayName: Publication Status
views:
  - type: table
    name: All
    `;

    const result = parseBaseFile(yaml);
    expect(result.filters).toBeDefined();
    expect(result.formulas).toHaveProperty("wordCount");
    expect(result.properties).toHaveProperty("status");
  });

  it("should throw on invalid YAML syntax", () => {
    const yaml = `
views:
  - type: table
    name: Broken
    invalid: [unclosed
    `;

    expect(() => parseBaseFile(yaml)).toThrow(/Invalid YAML/);
  });

  it("should throw when views array is missing", () => {
    const yaml = `
filters:
  and: []
    `;

    expect(() => parseBaseFile(yaml)).toThrow(/must contain at least one view/);
  });

  it("should throw when views array is empty", () => {
    const yaml = `
views: []
    `;

    expect(() => parseBaseFile(yaml)).toThrow(/must contain at least one view/);
  });

  it("should throw when view type is invalid", () => {
    const yaml = `
views:
  - type: invalid
    name: Test
    `;

    expect(() => parseBaseFile(yaml)).toThrow(/must have a valid type/);
  });

  it("should throw when view name is missing", () => {
    const yaml = `
views:
  - type: table
    `;

    expect(() => parseBaseFile(yaml)).toThrow(/must have a name/);
  });

  it("should throw when view name is not a string", () => {
    const yaml = `
views:
  - type: table
    name: 123
    `;

    expect(() => parseBaseFile(yaml)).toThrow(/must have a name/);
  });

  it("should throw when view is not an object", () => {
    const yaml = `
views:
  - "just a string"
    `;

    expect(() => parseBaseFile(yaml)).toThrow(/must be an object/);
  });

  it("should throw when entire content is not an object", () => {
    const yaml = `["array", "of", "values"]`;

    // Arrays are objects in JS, so this hits the "missing views" check instead
    expect(() => parseBaseFile(yaml)).toThrow(/must contain at least one view/);
  });

  it("should handle order array", () => {
    const yaml = `
views:
  - type: table
    name: Ordered
    order: [title, date, tags]
    `;

    const result = parseBaseFile(yaml);
    expect(result.views[0].order).toEqual(["title", "date", "tags"]);
  });

  it("should ignore order if not an array", () => {
    const yaml = `
views:
  - type: table
    name: Test
    order: "not an array"
    `;

    const result = parseBaseFile(yaml);
    expect(result.views[0].order).toBeUndefined();
  });
});

describe("normalizeFilter", () => {
  it("should return string filters as-is (trimmed)", () => {
    expect(normalizeFilter("  status == 'active'  ")).toBe(
      "status == 'active'",
    );
  });

  it("should return undefined for null/undefined", () => {
    expect(normalizeFilter(null)).toBeUndefined();
    expect(normalizeFilter(undefined)).toBeUndefined();
  });

  it("should normalize simple and filter", () => {
    const filter = {
      and: ["status == 'active'", "published == true"],
    };

    const result = normalizeFilter(filter);
    expect(result).toEqual({
      and: ["status == 'active'", "published == true"],
    });
  });

  it("should normalize nested filters recursively", () => {
    const filter = {
      and: [
        "status == 'active'",
        {
          or: ["tags.includes('blog')", "tags.includes('article')"],
        },
      ],
    };

    const result = normalizeFilter(filter);
    expect(result).toEqual(filter);
  });

  it("should filter out undefined nested filters", () => {
    const filter = {
      and: ["valid", null, undefined, "also valid"],
    };

    const result = normalizeFilter(filter);
    expect(result).toEqual({
      and: ["valid", "also valid"],
    });
  });

  it("should throw on invalid conjunction keys", () => {
    const filter = {
      invalid: ["test"],
    };

    expect(() => normalizeFilter(filter)).toThrow(/Invalid filter conjunction/);
  });

  it("should throw when mixing valid and invalid conjunctions", () => {
    const filter = {
      and: ["test"],
      badKey: ["bad"],
    };

    expect(() => normalizeFilter(filter)).toThrow(/Invalid filter conjunction/);
  });

  it("should return undefined for empty object", () => {
    expect(normalizeFilter({})).toBeUndefined();
  });

  it("should handle not conjunction", () => {
    const filter = {
      not: "draft == true",
    };

    const result = normalizeFilter(filter);
    expect(result).toEqual(filter);
  });
});

describe("combineFilters", () => {
  it("should return undefined when both filters are undefined", () => {
    expect(combineFilters(undefined, undefined)).toBeUndefined();
  });

  it("should return view filter when global is undefined", () => {
    const viewFilter = "status == 'active'";
    expect(combineFilters(undefined, viewFilter)).toBe(viewFilter);
  });

  it("should return global filter when view is undefined", () => {
    const globalFilter = "published == true";
    expect(combineFilters(globalFilter, undefined)).toBe(globalFilter);
  });

  it("should combine both filters with AND", () => {
    const globalFilter = "published == true";
    const viewFilter = "status == 'active'";

    const result = combineFilters(globalFilter, viewFilter);
    expect(result).toEqual({
      and: [globalFilter, viewFilter],
    });
  });

  it("should combine complex filters", () => {
    const globalFilter = {
      or: ["type == 'blog'", "type == 'article'"],
    };
    const viewFilter = "draft != true";

    const result = combineFilters(globalFilter, viewFilter);
    expect(result).toEqual({
      and: [globalFilter, viewFilter],
    });
  });
});

describe("validateOrder", () => {
  it("should pass for valid string array", () => {
    expect(() => validateOrder(["title", "date", "tags"])).not.toThrow();
  });

  it("should pass for undefined", () => {
    expect(() => validateOrder(undefined)).not.toThrow();
  });

  it("should throw when order is not an array", () => {
    expect(() => validateOrder("not an array" as any)).toThrow(
      /must be an array/,
    );
  });

  it("should throw when order contains non-string", () => {
    expect(() => validateOrder(["title", 123, "date"] as any)).toThrow(
      /must be a non-empty string/,
    );
  });

  it("should throw when order contains empty string", () => {
    expect(() => validateOrder(["title", "", "date"])).toThrow(
      /must be a non-empty string/,
    );
  });

  it("should throw when order contains whitespace-only string", () => {
    expect(() => validateOrder(["title", "   ", "date"])).toThrow(
      /must be a non-empty string/,
    );
  });

  it("should pass for array with single element", () => {
    expect(() => validateOrder(["title"])).not.toThrow();
  });
});
