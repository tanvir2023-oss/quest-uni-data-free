/** Local error reporting shim retained for compatibility after removing Lovable telemetry. */
export function reportApplicationError(error: unknown, context?: Record<string, unknown>) {
  console.error("Application error", error, context ?? {});
}
