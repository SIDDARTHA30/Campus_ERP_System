function ModulePage({ title }) {
  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">
        This is the placeholder screen for {title.toLowerCase()} operations. You can wire API tables and forms here next.
      </p>
    </div>
  );
}

export default ModulePage;