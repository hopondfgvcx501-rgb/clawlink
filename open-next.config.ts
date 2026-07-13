export default {
  default: {
    buildCommand: "npx next build", 
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: async () => {},
      tagCache: () => {},
      queue: "direct"
    }
  },
  edgeExternals: ["node:crypto"],
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: async () => {},
      tagCache: () => {},
      queue: "direct"
    }
  }
};