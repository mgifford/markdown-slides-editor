function normalizePathname(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function restoreRedirectPath() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("redirect") !== "1") {
    return;
  }

  const pathname = params.get("pathname") || "/";
  const search = params.get("search") || "";
  const hash = params.get("hash") || "";
  const target = `${pathname}${search}${hash}`;
  window.history.replaceState({}, "", target);
}

export function getCurrentRoute(pathname) {
  const normalized = normalizePathname(pathname);

  if (normalized.endsWith("/presenter")) {
    return "presenter";
  }

  if (normalized.endsWith("/present")) {
    return "present";
  }

  return "editor";
}
