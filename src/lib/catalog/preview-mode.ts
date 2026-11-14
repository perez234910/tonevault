type PreviewEnvironment = { NODE_ENV?: string; TONEVAULT_MOCK_DATA?: string };

/** Server callers only. Never infer preview from missing credentials or a public flag. */
export function isCatalogPreview(env: PreviewEnvironment = process.env): boolean {
  return env.NODE_ENV === "development" && env.TONEVAULT_MOCK_DATA === "true";
}
