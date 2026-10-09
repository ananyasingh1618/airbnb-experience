import { EmptyState } from "@/components/ui/States";

export default function NotFound() {
  return <EmptyState title="We can't find that page" body="The link may be broken or the page may have been removed." action={{ label: "Back to Airbnb", href: "/" }} />;
}
