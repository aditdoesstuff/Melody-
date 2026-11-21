import ShareView from "@/components/ShareView";

// The shared content travels in the URL hash, so this page is static and fetches nothing.
export const metadata = { title: "Shared from aaroh" };

export default function SharePage() {
  return <ShareView />;
}
