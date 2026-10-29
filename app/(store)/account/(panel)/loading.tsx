import { Skeleton } from "@/components/ui/Skeleton";

// Each account page reads the session and the database, so it streams in behind this placeholder
// (the layout's Suspense only covers the first load, not navigations between account pages).
export default function AccountLoading() {
  return <Skeleton className="h-96" />;
}
