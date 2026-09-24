/// Returns whether [target] has the same web origin as [allowed].
///
/// Paths, queries, and fragments may differ because they do not change an
/// origin. Scheme, host, and effective port must match exactly.
bool isAllowedWebAppUri({required Uri allowed, required Uri target}) {
  return target.scheme == allowed.scheme &&
      target.host == allowed.host &&
      target.port == allowed.port;
}
