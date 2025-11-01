// Mock for astro:content module in tests
export const getCollection = async (_name: string) => [];
// biome-ignore lint: generic type parameter required for type compatibility
export type CollectionEntry<_T> = any;
