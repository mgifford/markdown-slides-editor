const SA11Y_CSS_ID = "sa11y-stylesheet";
const SA11Y_CSS_URL = "https://cdn.jsdelivr.net/gh/ryersondmp/sa11y@4.4.1/dist/css/sa11y.min.css";
const SA11Y_LANG_URL = "https://cdn.jsdelivr.net/gh/ryersondmp/sa11y@4.4.1/dist/js/lang/en.umd.js";
const SA11Y_JS_URL = "https://cdn.jsdelivr.net/gh/ryersondmp/sa11y@4.4.1/dist/js/sa11y.umd.min.js";

let sa11yReadyPromise = null;
let sa11yInstance = null;

function loadStylesheet(id, href) {
  const existing = document.querySelector(`#${id}`);
  if (existing) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
    document.head.append(link);
  });
}

function loadScript(src) {
  const existing = [...document.scripts].find((script) => script.src === src);
  if (existing) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.append(script);
  });
}

async function ensureSa11yLoaded() {
  if (!sa11yReadyPromise) {
    sa11yReadyPromise = Promise.all([
      loadStylesheet(SA11Y_CSS_ID, SA11Y_CSS_URL),
      loadScript(SA11Y_LANG_URL),
      loadScript(SA11Y_JS_URL),
    ]).then(() => {
      if (!window.Sa11y || !window.Sa11yLangEn) {
        throw new Error("Sa11y did not initialize correctly.");
      }

      window.Sa11y.Lang.addI18n(window.Sa11yLangEn.strings);
      return window.Sa11y;
    });
  }

  return sa11yReadyPromise;
}

export async function runSa11y(checkRoot) {
  const Sa11yLib = await ensureSa11yLoaded();

  if (sa11yInstance?.destroy) {
    sa11yInstance.destroy();
  }

  sa11yInstance = new Sa11yLib.Sa11y({
    checkRoot,
    contrastPlugin: true,
    readabilityPlugin: true,
    warnings: true,
  });

  return sa11yInstance;
}
