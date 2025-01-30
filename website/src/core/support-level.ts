/**
 * Support levels for authentik.
 */
export type SupportLevel = "authentik" | "community" | "vendor" | "deprecated";

/**
 * Mapping of support levels to badge classes.
 */
export const SupportLevelToLabel = {
    authentik: "authentik",
    community: "Community",
    vendor: "Vendor",
    deprecated: "Deprecated",
} as const satisfies Record<SupportLevel, string>;

/**
 * Type-predicate to determine if a string is a known support level.
 */
export function isSupportLevel(input: string): input is SupportLevel {
    return Object.hasOwn(SupportLevelToLabel, input);
}
