import yaml from "js-yaml";
import type { BaseConfig, BaseView, Filter } from "./types";

/**
 * Raw YAML structure as loaded (before validation)
 */
interface RawBaseYAML {
  views?: unknown[];
  filters?: unknown;
  formulas?: unknown;
  properties?: unknown;
}

interface RawViewYAML {
  type?: string;
  name?: string;
  description?: string;
  properties?: string[];
  sort?: {
    by: string;
    order?: "asc" | "desc";
  };
  filter?: string;
  [key: string]: unknown;
}

/**
 * Parse a .base file (YAML format) into a BaseConfig object
 *
 * @param content - Raw YAML content from .base file
 * @returns Parsed BaseConfig object
 * @throws Error if YAML is invalid or structure is incorrect
 */
export function parseBaseFile(content: string): BaseConfig {
  try {
    const parsed = yaml.load(content) as RawBaseYAML;

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Base file must contain a valid YAML object");
    }

    if (
      !parsed.views ||
      !Array.isArray(parsed.views) ||
      parsed.views.length === 0
    ) {
      throw new Error(
        'Base file must contain at least one view in the "views" array',
      );
    }

    // Validate and normalize views
    const views: BaseView[] = parsed.views.map(
      (view: unknown, index: number) => {
        const rawView = view as RawViewYAML;
        if (!rawView || typeof rawView !== "object") {
          throw new Error(`View at index ${index} must be an object`);
        }

        if (
          !rawView.type ||
          !["table", "cards", "list", "map"].includes(rawView.type)
        ) {
          throw new Error(
            `View at index ${index} must have a valid type (table, cards, list, or map)`,
          );
        }

        if (!rawView.name || typeof rawView.name !== "string") {
          throw new Error(`View at index ${index} must have a name`);
        }

        return {
          type: rawView.type as BaseView["type"],
          name: rawView.name,
          limit: rawView.limit ? Number(rawView.limit) : undefined,
          filters: rawView.filters as Filter | undefined,
          order: Array.isArray(rawView.order)
            ? (rawView.order as string[])
            : undefined,
          image: rawView.image as string | undefined,
          imageFit: rawView.imageFit as BaseView["imageFit"] | undefined,
          imageAspectRatio: rawView.imageAspectRatio
            ? Number(rawView.imageAspectRatio)
            : undefined,
          cardSize: rawView.cardSize ? Number(rawView.cardSize) : undefined,
        };
      },
    );

    const config: BaseConfig = {
      views,
      filters: parsed.filters as Filter | undefined,
      formulas: parsed.formulas as Record<string, string> | undefined,
      properties: parsed.properties as Record<string, unknown> | undefined,
    };

    return config;
  } catch (error) {
    if (error instanceof yaml.YAMLException) {
      throw new Error(`Invalid YAML in base file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Normalize a filter structure
 * Ensures filters are in the correct format
 *
 * @param filter - Raw filter object/string
 * @returns Normalized filter
 */
export function normalizeFilter(filter: string | object | Filter | undefined | null): Filter | undefined {
  if (!filter) return undefined;

  // String expression - return as-is
  if (typeof filter === "string") {
    return filter.trim();
  }

  // Object with conjunctions
  if (typeof filter === "object") {
    // Check for valid conjunctions
    const validConjunctions = ["and", "or", "not"];
    const keys = Object.keys(filter);

    if (keys.length === 0) return undefined;

    // Validate that all keys are valid conjunctions
    const hasInvalidKeys = keys.some((key) => !validConjunctions.includes(key));
    if (hasInvalidKeys) {
      throw new Error(
        `Invalid filter conjunction. Must be one of: ${validConjunctions.join(", ")}`,
      );
    }

    // Normalize nested filters
    const normalized: Record<string, Filter | Filter[] | undefined> = {};
    for (const key of keys) {
      const value = filter[key];
      if (Array.isArray(value)) {
        normalized[key] = value
          .map((v) => normalizeFilter(v))
          .filter((v) => v !== undefined);
      } else {
        normalized[key] = normalizeFilter(value);
      }
    }

    return normalized;
  }

  return undefined;
}

/**
 * Combine global and view-specific filters
 * Global filters are AND'ed with view filters
 *
 * @param globalFilters - Filters from base level
 * @param viewFilters - Filters from view level
 * @returns Combined filter
 */
export function combineFilters(
  globalFilters?: Filter,
  viewFilters?: Filter,
): Filter | undefined {
  if (!globalFilters && !viewFilters) return undefined;
  if (!globalFilters) return viewFilters;
  if (!viewFilters) return globalFilters;

  // Combine with AND
  return {
    and: [globalFilters, viewFilters],
  };
}

/**
 * Validate that property names in order are strings
 *
 * @param order - Array of property names
 * @throws Error if any property name is invalid
 */
export function validateOrder(order?: string[]): void {
  if (!order) return;

  if (!Array.isArray(order)) {
    throw new Error("order must be an array of strings");
  }

  order.forEach((prop, index) => {
    if (typeof prop !== "string" || prop.trim() === "") {
      throw new Error(`order[${index}] must be a non-empty string`);
    }
  });
}
