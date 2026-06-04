if (typeof globalThis.process === "undefined") {
  (
    globalThis as unknown as { process: { env: Record<string, string> } }
  ).process = {
    env: {},
  };
}
