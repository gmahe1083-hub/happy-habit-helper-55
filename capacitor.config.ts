import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bharatsurgicals.tracker",
  appName: "Bharat Surgicals Tracker",
  webDir: "public/app",
  backgroundColor: "#0f968d",
  android: {
    allowMixedContent: false,
  },
};

export default config;
