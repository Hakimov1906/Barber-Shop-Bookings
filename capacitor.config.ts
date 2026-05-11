import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.hairline.booking",
  appName: "HairLine",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    hostname: "localhost",
    androidScheme: "http",
  },
};

export default config;
