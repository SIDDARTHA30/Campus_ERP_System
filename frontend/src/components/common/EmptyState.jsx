function EmptyState({ title = 'No items available', description = 'Try adding an item or adjusting filters' }) {
  return (
    <div className="text-center py-20 px-6 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
      <div className="h-24 w-24 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800 rotate-6 shadow-xl shadow-slate-200/20 dark:shadow-black/20">
        <span className="text-5xl opacity-40 grayscale">📭</span>
      </div>
      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-xs mx-auto">{description}</p>
    </div>
  );
}

export default EmptyState;
