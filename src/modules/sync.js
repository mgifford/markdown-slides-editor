const CHANNEL_NAME = "markdown-slides-editor.presenter";

export function createSyncChannel() {
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    return {
      postMessage: (value) => channel.postMessage(value),
      subscribe: (handler) => {
        channel.addEventListener("message", (event) => handler(event.data));
      },
    };
  }

  return {
    postMessage: (value) => {
      localStorage.setItem(CHANNEL_NAME, JSON.stringify({ ...value, timestamp: Date.now() }));
    },
    subscribe: (handler) => {
      window.addEventListener("storage", (event) => {
        if (event.key !== CHANNEL_NAME || !event.newValue) return;
        handler(JSON.parse(event.newValue));
      });
    },
  };
}
