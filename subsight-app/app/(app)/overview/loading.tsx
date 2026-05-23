export default function Loading() {
  return (
    <div className="flex-1 min-w-0 animate-pulse">
      <div className="px-6 lg:px-8 pt-5 lg:pt-7 pb-5 border-b border-bg-edge">
        <div className="h-4 bg-bg-edge rounded w-48 mb-2" />
        <div className="h-8 bg-bg-edge rounded w-64" />
      </div>
      <div className="px-6 lg:px-8 pt-6 space-y-4">
        <div className="h-48 bg-bg-card rounded-2xl hairline" />
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="h-60 bg-bg-card rounded-2xl hairline" />
          <div className="h-60 bg-bg-card rounded-2xl hairline" />
        </div>
      </div>
    </div>
  );
}
