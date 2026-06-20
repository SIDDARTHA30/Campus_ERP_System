import CrudPage from './CrudPage';
import { motion } from 'framer-motion';
import { BookOpen, Download, ExternalLink, FileText, Edit, Trash2, User, Folder } from 'lucide-react';

const fields = [
  { name: 'title', label: 'Title', required: true },
  { name: 'description', label: 'Description' },
  { name: 'subject', label: 'Subject ID', required: true, type: 'relation', relationEndpoint: '/subjects' },
  { name: 'faculty', label: 'Faculty ID', required: true, type: 'relation', relationEndpoint: '/faculty' },
  { name: 'classId', label: 'Class ID' },
  { name: 'fileUrl', label: 'File URL' }
];

export default function MaterialsPage() {
  const renderCustomList = (items, { onEdit, onDelete, canEdit, canDelete }) => {
    return (
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 pt-6 overflow-hidden">
        {items.map((it, idx) => {
          const id = it._id || it.id;
          const subjectName = it.subject?.name || it.subject?.code || 'General Course';
          const subjectCode = it.subject?.code || '';
          const facultyName = it.faculty?.name || 'Academic Faculty';
          const fileUrl = it.fileUrl || '';

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, type: "spring", stiffness: 100, damping: 15 }}
              whileHover={{ y: -5, scale: 1.01 }}
              className="group bg-white hover:bg-slate-50/20 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-300 dark:hover:border-slate-700/80 transition-all duration-300 rounded-2xl dark:rounded-3xl p-6 shadow-md shadow-slate-100 dark:shadow-xl dark:shadow-slate-950/40 flex flex-col justify-between"
            >
              <div>
                {/* Header Badge & Action Buttons */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200/60 dark:text-indigo-400 dark:bg-indigo-950/40 dark:border-indigo-900/40 rounded-full flex items-center gap-1.5 shadow-sm">
                    <FileText className="h-3 w-3" />
                    Lecture Notes
                  </span>
                  
                  {(canEdit || canDelete) && (
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canEdit && (
                        <button 
                          onClick={() => onEdit(it)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="Edit material"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button 
                          onClick={() => onDelete(id)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete material"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-2 group-hover:text-blue-600 dark:group-hover:text-indigo-400 transition-colors">
                  {it.title || 'Untitled Material'}
                </h3>

                {/* Description */}
                {it.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4 line-clamp-2 leading-relaxed">
                    {it.description}
                  </p>
                )}

                {/* Details list */}
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-indigo-400 flex-shrink-0" />
                    <span className="truncate text-slate-700 dark:text-slate-200" title={subjectName}>
                      {subjectCode ? `${subjectCode} • ` : ''}{subjectName}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <User className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    <span className="truncate text-slate-600 dark:text-slate-300">{facultyName}</span>
                  </div>

                  {it.classId && (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Folder className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      <span className="text-slate-600 dark:text-slate-300">Class: {it.classId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Download Card Button */}
              {fileUrl && (
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/40">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-transparent hover:from-blue-700 hover:to-indigo-700 dark:bg-indigo-950/60 dark:bg-none dark:text-indigo-400 dark:border-indigo-900 dark:hover:bg-indigo-600 dark:hover:text-white dark:hover:border-indigo-500 transition-all duration-300 shadow-md group/btn"
                  >
                    <Download className="h-4 w-4 group-hover/btn:-translate-y-0.5 transition-transform" />
                    Download PDF
                    <ExternalLink className="h-3 w-3 opacity-60 ml-0.5" />
                  </a>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  return <CrudPage title="Materials" endpoint="/materials" fields={fields} renderCustomList={renderCustomList} />;
}
