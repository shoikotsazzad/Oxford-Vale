import { Container } from "@/components/Container";
import { ProductGridSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <Container className="py-8 md:py-12" aria-busy="true">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-5 h-10 w-72" />
      <div className="mt-10"><ProductGridSkeleton count={10} /></div>
    </Container>
  );
}
