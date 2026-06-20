function SummaryCard({ label, value, icon: Icon, color = "text-blue-600", helper, onClick }) {
  const CardContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex flex-col">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
          {helper && <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{helper}</span>}
        </div>
      </div>
      {Icon && (
        <div className={`h-12 w-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-inner border border-slate-100 dark:border-slate-700 ${color} transition-all duration-300 group-hover:scale-110`}>
          <Icon className="h-6 w-6" strokeWidth={2.5} />
        </div>
      )}
    </div>
  );

  const baseClasses = "bg-white/80 dark:bg-slate-900/60 backdrop-blur-lg rounded-2xl shadow-md p-6 flex items-center transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 border border-slate-200/60 dark:border-slate-800 cursor-pointer";

  if (!onClick) {
    return <div className={baseClasses}>{CardContent}</div>;
  }

  return (
    <button 
      onClick={onClick}
      className={`${baseClasses} text-left w-full focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20`}
    >
      {CardContent}
    </button>
  );
}

export default SummaryCard;
