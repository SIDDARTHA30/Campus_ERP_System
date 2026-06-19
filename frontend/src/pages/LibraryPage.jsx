import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import FormModal from '../components/common/FormModal';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

function toDateInput(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function isOverdue(issue) {
  if (!issue || issue.status !== 'issued' || !issue.dueDate) return false;
  return new Date(issue.dueDate) < new Date(toDateInput(new Date()));
}

export default function LibraryPage() {
  const { user } = useAuth();

  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [issueSearch, setIssueSearch] = useState('');
  const [issueModalOpen, setIssueModalOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const issueFields = useMemo(() => ([
    {
      name: 'book',
      label: 'Book',
      type: 'select',
      options: books
        .filter((b) => Number(b.copiesAvailable) > 0)
        .map((b) => ({ value: b._id || b.id, label: `${b.title} (${b.copiesAvailable} available)` }))
    },
    {
      name: 'student',
      label: 'Student',
      type: 'select',
      options: students.map((s) => ({ value: s._id || s.id, label: `${s.admissionNo} - ${s.name}` }))
    },
    { name: 'issueDate', label: 'Issue Date', type: 'date', required: true },
    { name: 'dueDate', label: 'Due Date', type: 'date', required: true }
  ]), [books, students]);

  const defaultIssueValues = useMemo(() => {
    const issueDate = toDateInput(new Date());
    const due = new Date();
    due.setDate(due.getDate() + 14);
    return { issueDate, dueDate: toDateInput(due) };
  }, []);

  const bookById = useMemo(() => {
    const map = {};
    books.forEach((b) => { map[b._id || b.id] = b; });
    return map;
  }, [books]);

  const studentById = useMemo(() => {
    const map = {};
    students.forEach((s) => { map[s._id || s.id] = s; });
    return map;
  }, [students]);

  const loadLibraryData = async () => {
    setLoading(true);
    setError('');
    try {
      const [booksRes, issuesRes, studentsRes] = await Promise.all([
        api.get('/library/books'),
        api.get('/library/issues'),
        api.get('/students')
      ]);

      setBooks(booksRes.data.data.items || []);
      setIssues(issuesRes.data.data.items || []);
      setStudents(studentsRes.data.data.items || []);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load library data';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibraryData();
  }, []);

  const filteredBooks = useMemo(() => {
    const term = bookSearch.trim().toLowerCase();
    if (!term) return books;
    return books.filter((b) =>
      [b.title, b.author, b.isbn, b.category, b.location]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [books, bookSearch]);

  const filteredIssues = useMemo(() => {
    const term = issueSearch.trim().toLowerCase();
    if (!term) return issues;
    return issues.filter((issue) => {
      const book = bookById[issue.book];
      const student = studentById[issue.student];
      return [
        issue.status,
        issue.issueDate,
        issue.dueDate,
        book?.title,
        student?.name,
        student?.admissionNo
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [issues, issueSearch, bookById, studentById]);

  const openIssueModal = () => setIssueModalOpen(true);
  const closeIssueModal = () => setIssueModalOpen(false);

  const handleIssueBook = async (formData) => {
    setSaving(true);
    try {
      await api.post('/library/issue', {
        book: formData.book,
        student: formData.student,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        issuedBy: user?.name || ''
      });

      toast.success('Book issued successfully');
      closeIssueModal();
      await loadLibraryData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue book');
    } finally {
      setSaving(false);
    }
  };

  const handleReturnBook = async (issue) => {
    if (!isAdmin) return;

    try {
      await api.post('/library/return', {
        issue: issue,
        returnDate: toDateInput(new Date())
      });

      toast.success('Book returned successfully');
      await loadLibraryData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to return book');
    }
  };

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Library</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Books, availability, issue and return management.</p>
          </div>

          <div className="flex gap-3">
            <input
              className="input w-full md:w-72"
              type="search"
              placeholder="Search books"
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
            />
            {isAdmin ? (
              <button className="btn-primary whitespace-nowrap cursor-pointer" type="button" onClick={openIssueModal}>
                Issue Book
              </button>
            ) : null}
          </div>
        </div>

        {error ? <p className="mt-4 rounded-xl bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</p> : null}
      </section>

      <section className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Books</h3>
        </div>
        <div className="overflow-x-auto p-4 md:p-6">
          {loading ? (
            <LoadingState label="Loading books..." />
          ) : !filteredBooks.length ? (
            <EmptyState title="No books found" />
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-left text-sm">
                <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">ISBN</th>
                    <th className="px-5 py-4 font-medium">Title</th>
                    <th className="px-5 py-4 font-medium">Author</th>
                    <th className="px-5 py-4 font-medium">Category</th>
                    <th className="px-5 py-4 font-medium">Available</th>
                    <th className="px-5 py-4 font-medium">Total</th>
                    <th className="px-5 py-4 font-medium">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900/40">
                  {filteredBooks.map((book) => {
                    const bId = book._id || book.id;
                    return (
                      <tr key={bId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{book.isbn}</td>
                        <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">{book.title}</td>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{book.author}</td>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{book.category}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${Number(book.copiesAvailable) > 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                            {book.copiesAvailable}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{book.copiesTotal}</td>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{book.location || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Issued Books</h3>
          <input
            className="input w-full max-w-xs"
            type="search"
            placeholder="Search issues"
            value={issueSearch}
            onChange={(e) => setIssueSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto p-4 md:p-6">
          {loading ? (
            <LoadingState label="Loading issues..." />
          ) : !filteredIssues.length ? (
            <EmptyState title="No issued books found" description="Issue records will appear here." />
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-left text-sm">
                <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">Book</th>
                    <th className="px-5 py-4 font-medium">Student</th>
                    <th className="px-5 py-4 font-medium">Issue Date</th>
                    <th className="px-5 py-4 font-medium">Due Date</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredIssues.map((issue) => {
                    const iId = issue._id || issue.id;
                    const book = bookById[issue.bookId];
                    const student = studentById[issue.studentId];
                    const isReturned = issue.status === 'returned';
                    const overdue = isOverdue(issue);

                    return (
                      <tr key={iId} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${overdue ? 'bg-amber-50/60 dark:bg-amber-900/20' : ''}`}>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{book?.title || issue.bookId}</td>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{student ? `${student.admissionNo} - ${student.name}` : issue.studentId}</td>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{issue.issueDate?.slice(0, 10)}</td>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{issue.dueDate?.slice(0, 10)}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${isReturned ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' : overdue ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-brand-50 text-brand-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                            {overdue ? 'overdue' : issue.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {isAdmin && !isReturned ? (
                            <button className="btn-secondary cursor-pointer !px-3 !py-1.5 text-xs" type="button" onClick={() => handleReturnBook(iId)}>
                              Return
                            </button>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {issueModalOpen && (issueFields || []).length > 0 && (
        <FormModal
          open={issueModalOpen}
          title="Issue Book"
          fields={issueFields || []}
          initialValues={defaultIssueValues}
          onClose={closeIssueModal}
          onSubmit={handleIssueBook}
          loading={saving}
        />
      )}
    </div>
  );
}
