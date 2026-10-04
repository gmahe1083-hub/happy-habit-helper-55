import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bharat Surgicals Tracker — Devices & Rentals" },
      { name: "description", content: "Offline device buy/sell and rental tracker for Bharat Surgicals." },
      { property: "og:title", content: "Bharat Surgicals Tracker" },
      { property: "og:description", content: "Offline device buy/sell and rental tracker for Bharat Surgicals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

// The tracker itself is the original offline web app in public/app,
// which is also the folder Capacitor packages into the Android APK.
function Index() {
  return (
    <iframe
      src="/app/index.html"
      title="Bharat Surgicals Tracker"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: 0 }}
    />
  );
}
