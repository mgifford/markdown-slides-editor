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
  if (pathname.endsWith("/presenter")) {
    return "presenter";
  }

  if (pathname.endsWith("/present")) {
    return "present";
  }

  return "editor";
}
