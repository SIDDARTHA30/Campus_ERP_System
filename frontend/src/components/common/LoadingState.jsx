function LoadingState({ label = 'Processing request...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="w-full max-w-md space-y-4">
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-12 w-full opacity-80" />
        <div className="skeleton h-12 w-full opacity-60" />
        <div className="skeleton h-12 w-full opacity-40" />
      </div>
      <p className="mt-8 text-sm font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">
        {label}
      </p>
    </div>
  );
}

export default LoadingState;
