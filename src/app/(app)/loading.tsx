import { Skeleton } from "@/components/ui/skeleton";

/** Shown inside the app shell while a page's data loads. Mirrors the common page layout. */
export default function Loading() {
  return (
    <div aria-busy="true" className="flex flex-1 flex-col">
      <div className="flex h-14 items-center gap-3 border-b px-3 sm:px-5">
        <Skeleton className="size-7 rounded-md" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="ml-auto h-7 w-40" />
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-5">
          <Skeleton className="h-72 rounded-xl lg:col-span-3" />
          <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
