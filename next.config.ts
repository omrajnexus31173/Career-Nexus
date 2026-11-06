import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // pdfkit and bcryptjs read files / use node internals; keep them out of the webpack bundle.
  serverExternalPackages: ["pdfkit", "bcryptjs"],

};

export default nextConfig;
