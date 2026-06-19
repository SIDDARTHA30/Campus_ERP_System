import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingState from '../common/LoadingState';
import EmptyState from '../common/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer
} from 'recharts';
import { 
  Award, Target, TrendingUp, AlertTriangle, Activity, Flame,
  BookOpen, CheckCircle2, Search, Filter, Download, ArrowLeft, GraduationCap
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

// Branch Normalization Map
const ALL_BRANCHES = ['CSE', 'IT', 'AI&DS', 'AIML', 'CSBS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEMICAL', 'BIOTECH'];

const normalizeBranch = (dept) => {
  if (!dept) return 'Unknown';
  const d = String(dept).toUpperCase().replace(/[\s&_.-]/g, '').trim();
  
  if (d.includes('COMPUTER') || d.includes('CSE')) return 'CSE';
  if (d.includes('INFORMATION') || d === 'IT') return 'IT';
  if (d.includes('AIDS') || d.includes('AI&DS') || (d.includes('ARTIFICIALINTELLIGENCE') && d.includes('DATA'))) return 'AI&DS';
  if (d.includes('AIML') || (d.includes('ARTIFICIALINTELLIGENCE') && d.includes('MACHINE'))) return 'AIML';
  if (d.includes('CSBS') || d.includes('BUSINESS')) return 'CSBS';
  if (d.includes('ECE') || (d.includes('ELECTRONICS') && d.includes('COMMUNICATION'))) return 'ECE';
  if (d.includes('EEE') || d.includes('ELECTRICAL')) return 'EEE';
  if (d.includes('MECH') || d.includes('MECHANICAL')) return 'MECH';
  if (d.includes('CIVIL')) return 'CIVIL';
  if (d.includes('CHEM') || d.includes('CHEMICAL')) return 'CHEMICAL';
  if (d.includes('BIOTECH') || d.includes('BIOTECHNOLOGY')) return 'BIOTECH';
  
  return dept;
};

// Semester Normalization Map
const normalizeSemester = (sem) => {
  if (sem === undefined || sem === null) return 'Unknown';
  const s = String(sem).toLowerCase().replace(/[\s_.-]/g, '').trim();
  if (s.includes('sem1') || s.includes('semester1') || s === '1') return 'Semester 1';
  if (s.includes('sem2') || s.includes('semester2') || s === '2') return 'Semester 2';
  if (s.includes('sem3') || s.includes('semester3') || s === '3') return 'Semester 3';
  if (s.includes('sem4') || s.includes('semester4') || s === '4') return 'Semester 4';
  if (s.includes('sem5') || s.includes('semester5') || s === '5') return 'Semester 5';
  if (s.includes('sem6') || s.includes('semester6') || s === '6') return 'Semester 6';
  if (s.includes('sem7') || s.includes('semester7') || s === '7') return 'Semester 7';
  if (s.includes('sem8') || s.includes('semester8') || s === '8') return 'Semester 8';
  return `Semester ${sem}`;
};

export default function MarksAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [rawMarks, setRawMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rawLoading, setRawLoading] = useState(false);

  // Filters (Default to lowercase 'all' as requested)
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterExam, setFilterExam] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterPassFail, setFilterPassFail] = useState('all');
  
  // Student Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedStudent, setSearchedStudent] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const EXAM_TYPES = ['internal', 'mid', 'semester'];

  // Fast Initial Render + Delayed Progressive Hydration
  useEffect(() => {
    const fetchBase = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/marks/analytics/${user.role}`);
        setData(res.data.data);
      } catch (err) {
        console.error('Base analytics fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBase();

    // Lazy load the raw marks dataset to prevent initial blocking
    if (user.role !== 'student') {
      const fetchRaw = async () => {
        try {
          setRawLoading(true);
          const res = await api.get('/marks?limit=all');
          const rawItems = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.items || []);
          setRawMarks(rawItems);
        } catch (err) {
          console.error('Failed to fetch raw marks for filters', err);
        } finally {
          setRawLoading(false);
        }
      };
      
      const timer = setTimeout(fetchRaw, 400); // 400ms delay to let the page render instantly
      return () => clearTimeout(timer);
    }
  }, [user.role]);

  // Extract Dropdown options dynamically from loaded rawMarks
  const uniqueSubjects = useMemo(() => {
    const map = new Map();
    rawMarks.forEach(m => {
      if (m.subject) map.set(m.subject._id || m.subject.code, m.subject.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rawMarks]);

  const uniqueSemesters = useMemo(() => {
    const set = new Set();
    rawMarks.forEach(m => {
      if (m.subject && m.subject.semester !== undefined) {
        set.add(normalizeSemester(m.subject.semester));
      }
    });
    return Array.from(set).sort();
  }, [rawMarks]);

  // Dynamic Filtering Pipeline
  const filteredMarks = useMemo(() => {
    if (!rawMarks.length) return [];
    return rawMarks.filter(m => {
      if (!m.student || !m.subject) return false;

      // Normalize branch and semester values
      const branchNorm = normalizeBranch(m.student.department);
      const semNorm = normalizeSemester(m.subject.semester);

      const matchBranch = filterBranch === 'all' || branchNorm.toLowerCase() === filterBranch.toLowerCase();
      const matchExam = filterExam === 'all' || String(m.examType).toLowerCase() === filterExam.toLowerCase();
      const matchSemester = filterSemester === 'all' || semNorm.toLowerCase() === filterSemester.toLowerCase();
      const matchSubject = filterSubject === 'all' || m.subject._id === filterSubject || m.subject.code === filterSubject;

      const percentage = m.maxScore > 0 ? (m.score / m.maxScore) * 100 : 0;
      const isPass = percentage >= 40;
      const matchPassFail = filterPassFail === 'all' || 
                            (filterPassFail === 'pass' && isPass) || 
                            (filterPassFail === 'fail' && !isPass);

      return matchBranch && matchExam && matchSemester && matchSubject && matchPassFail;
    });
  }, [rawMarks, filterBranch, filterExam, filterSemester, filterSubject, filterPassFail]);

  // Unified Analytics Output
  const displayAnalytics = useMemo(() => {
    const isFiltered = filterBranch !== 'all' || 
                       filterExam !== 'all' || 
                       filterSemester !== 'all' || 
                       filterSubject !== 'all' || 
                       filterPassFail !== 'all';

    // A. Use backend pre-aggregated data (fast initial load) if no filters are active
    if (!isFiltered && data) {
      // Normalize department mapping from backend response
      const deptPerfMap = {};
      ALL_BRANCHES.forEach(b => deptPerfMap[b] = { score: 0, count: 0, passRate: 0, passCount: 0 });

      const backendPerfList = data.departmentPerformance || [];
      backendPerfList.forEach(dp => {
        const normName = normalizeBranch(dp.department);
        if (deptPerfMap[normName]) {
          deptPerfMap[normName].score += dp.averagePercentage || 0;
          deptPerfMap[normName].passRate += dp.passPercentage || 0;
          deptPerfMap[normName].count++;
        }
      });

      const branchPerformance = ALL_BRANCHES.map(b => {
        const d = deptPerfMap[b];
        return {
          department: b,
          averagePercentage: d.count > 0 ? Number((d.score / d.count).toFixed(1)) : 0,
          passPercentage: d.count > 0 ? Number((d.passRate / d.count).toFixed(1)) : 0
        };
      });

      const subjectRanking = (data.subjectDifficulty || []).map(s => ({
        subject: s.subject,
        code: s.code,
        average: s.average || 0,
        failRate: s.failRate || 0
      }));

      return {
        overallGpa: Number(data.summary?.estimatedGpa || 0).toFixed(2),
        overallPassRate: `${Number(data.summary?.passRate || 0).toFixed(1)}%`,
        topBranch: data.summary?.topDept ? normalizeBranch(data.summary.topDept) : 'N/A',
        atRiskCount: rawMarks.length > 0 ? rawMarks.filter(m => (m.score / m.maxScore) < 0.4).length : '...',
        branchPerformance,
        subjectRanking,
        isEmpty: false
      };
    }

    // B. If filters are active, compute metrics dynamically from filteredMarks
    if (filteredMarks.length > 0) {
      const deptMap = {};
      ALL_BRANCHES.forEach(b => deptMap[b] = { pass: 0, fail: 0, score: 0, max: 0 });
      
      filteredMarks.forEach(m => {
        const dept = normalizeBranch(m.student?.department);
        if (deptMap[dept]) {
          deptMap[dept].score += m.score;
          deptMap[dept].max += m.maxScore;
          if ((m.score / m.maxScore) >= 0.4) deptMap[dept].pass++;
          else deptMap[dept].fail++;
        }
      });

      const branchPerformance = ALL_BRANCHES.map(dept => {
        const d = deptMap[dept];
        const total = d.pass + d.fail;
        const avg = d.max > 0 ? (d.score / d.max) * 100 : 0;
        return {
          department: dept,
          averagePercentage: Number(avg.toFixed(1)),
          passPercentage: total > 0 ? Number(((d.pass / total) * 100).toFixed(1)) : 0
        };
      });

      // Subject Rankings
      const subMap = {};
      filteredMarks.forEach(m => {
        if (!m.subject) return;
        const code = m.subject.code;
        if (!subMap[code]) subMap[code] = { name: m.subject.name, code, score: 0, max: 0, pass: 0, fail: 0 };
        subMap[code].score += m.score;
        subMap[code].max += m.maxScore;
        if ((m.score / m.maxScore) >= 0.4) subMap[code].pass++;
        else subMap[code].fail++;
      });

      const subjectRanking = Object.values(subMap).map(s => {
        const total = s.pass + s.fail;
        return {
          subject: s.name,
          code: s.code,
          average: s.max > 0 ? Number(((s.score / s.max) * 100).toFixed(1)) : 0,
          failRate: total > 0 ? Number(((s.fail / total) * 100).toFixed(1)) : 0
        };
      }).sort((a, b) => b.failRate - a.failRate).slice(0, 8);

      const totalPassed = branchPerformance.reduce((acc, curr) => acc + deptMap[curr.department].pass, 0);
      const totalFailed = branchPerformance.reduce((acc, curr) => acc + deptMap[curr.department].fail, 0);
      const totalOverall = totalPassed + totalFailed;
      const overallPassRate = totalOverall > 0 ? ((totalPassed / totalOverall) * 100).toFixed(1) : 0;

      let totalScoreAll = 0, totalMaxAll = 0;
      filteredMarks.forEach(m => { totalScoreAll += m.score; totalMaxAll += m.maxScore; });
      const overallAvg = totalMaxAll > 0 ? ((totalScoreAll / totalMaxAll) * 100).toFixed(1) : 0;
      const overallGpa = (overallAvg / 9.5).toFixed(2);

      const topBranch = [...branchPerformance].sort((a,b)=>b.averagePercentage - a.averagePercentage)[0]?.department || 'N/A';
      const atRiskCount = filteredMarks.filter(m => (m.score / m.maxScore) < 0.4).length;

      return {
        overallGpa,
        overallPassRate: `${overallPassRate}%`,
        topBranch,
        atRiskCount,
        branchPerformance,
        subjectRanking,
        isEmpty: false
      };
    }

    // C. Dynamic Empty State (if filter yields 0 matches) fallback to blank state with overall cards preserved from base
    if (data) {
      return {
        overallGpa: Number(data.summary?.estimatedGpa || 0).toFixed(2),
        overallPassRate: `${Number(data.summary?.passRate || 0).toFixed(1)}%`,
        topBranch: data.summary?.topDept ? normalizeBranch(data.summary.topDept) : 'N/A',
        atRiskCount: 0,
        branchPerformance: ALL_BRANCHES.map(b => ({ department: b, averagePercentage: 0, passPercentage: 0 })),
        subjectRanking: [],
        isEmpty: true
      };
    }

    return null;
  }, [data, filteredMarks, rawMarks, filterBranch, filterExam, filterSemester, filterSubject, filterPassFail]);

  // Lazy load student search only on search submit
  const handleSearchStudent = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    console.log("Searching student for query:", searchQuery);
    try {
      const q = searchQuery.toLowerCase().trim();
      console.log("rawMarks length:", rawMarks.length);
      
      // Step 1: Attempt to search in loaded rawMarks first (instant)
      let studentObj = null;
      if (rawMarks.length > 0) {
        const match = rawMarks.find(m => {
          if (!m.student) return false;
          const sName = typeof m.student === 'object' ? m.student.name : '';
          const sNo = typeof m.student === 'object' ? m.student.admissionNo : '';
          return sNo.toLowerCase().includes(q) || sName.toLowerCase().includes(q);
        });
        if (match) {
          console.log("Found match in rawMarks:", match.student);
          studentObj = match.student;
        }
      }
      
      if (!studentObj) {
        console.log("Querying backend for search:", q);
        const searchRes = await api.get(`/marks?search=${q}&limit=1`);
        console.log("Backend search response data:", searchRes.data);
        const searchItems = Array.isArray(searchRes.data.data) ? searchRes.data.data : (searchRes.data.data?.items || []);
        const item = searchItems[0];
        if (item && item.student) {
          console.log("Found student in backend search response:", item.student);
          studentObj = item.student;
        }
      }

      if (!studentObj) {
        console.log("No studentObj resolved!");
        setSearchError('Student not found in active databases.');
        setSearchedStudent(null);
        return;
      }

      const studentId = typeof studentObj === 'object' ? studentObj._id : studentObj;
      console.log("Fetching analytics for student:", studentId);
      const res = await api.get(`/marks/analytics/student?studentId=${studentId}`);
      console.log("Student analytics response:", res.data);
      setSearchedStudent({
        details: typeof studentObj === 'object' ? studentObj : { name: searchQuery, admissionNo: searchQuery, _id: studentObj },
        analytics: res.data.data
      });
    } catch (err) {
      console.error("Error in handleSearchStudent:", err);
      setSearchError('Failed to fetch student profile details.');
    } finally {
      setSearching(false);
    }
  };

  const handleDownloadTranscript = (studentDetails, studentData) => {
    if (!studentData || !studentDetails) return;
    try {
      let csv = `VIGNAN ERP ACADEMIC TRANSCRIPT\n\n`;
      csv += `Student Name:,${studentDetails.name || 'N/A'}\n`;
      csv += `Roll Number:,${studentDetails.admissionNo || 'N/A'}\n`;
      csv += `Department:,${studentDetails.department || 'N/A'}\n`;
      csv += `Generated On:,${new Date().toLocaleDateString()}\n\n`;
      
      csv += `Subject Code,Subject Name,Exam Type,Score,Max Score,Percentage,Status\n`;
      
      if (studentData.subjectPerformance) {
        studentData.subjectPerformance.forEach(sub => {
          if (sub.exams && sub.exams.length > 0) {
            sub.exams.forEach(ex => {
              csv += `"${sub.code}","${sub.subject}","${(ex.type || 'Internal').toUpperCase()}",${ex.score},${ex.max},${ex.percentage.toFixed(1)}%,${ex.percentage >= 40 ? 'Pass' : 'Fail'}\n`;
            });
          } else {
            csv += `"${sub.code}","${sub.subject}","AGGREGATE",${sub.marksObtained},${sub.maxMarks},${sub.percentage.toFixed(1)}%,${sub.status}\n`;
          }
        });
      }
      
      csv += `\nSUMMARY\n`;
      csv += `Estimated GPA:,${studentData.summary?.estimatedGpa || 'N/A'}\n`;
      csv += `Average Percentage:,${studentData.summary?.averagePercentage || 'N/A'}%\n`;
      csv += `Passed Subjects:,${studentData.summary?.passedCount || 0}\n`;
      csv += `Failed Subjects:,${studentData.summary?.failedCount || 0}\n`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Transcript_${studentDetails.admissionNo || 'Student'}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch(e) {
      console.error('Export failed', e);
    }
  };

  if (loading) return <LoadingState label="Synthesizing academic intelligence..." />;
  if (!data || Object.keys(data).length === 0) return <EmptyState title="Telemetry Offline" description="We could not retrieve any academic markers for your account." />;

  // 1. STUDENT VIEW
  if (user.role === 'student') {
    const { summary = {}, subjectPerformance = [], trends = [], attendance = {} } = data || {};
    const safeGpa = Number(summary.estimatedGpa || 0).toFixed(2);
    const safeAvg = Number(summary.averagePercentage || 0).toFixed(1);
    
    if (!subjectPerformance || subjectPerformance.length === 0) {
      return <EmptyState title="Awaiting Grades" description="Your subject instructors have not uploaded grade records yet." />;
    }

    return (
      <StudentViewTemplate 
        user={user}
        summary={summary}
        subjectPerformance={subjectPerformance}
        trends={trends}
        attendance={attendance}
        safeGpa={safeGpa}
        safeAvg={safeAvg}
        onDownload={() => handleDownloadTranscript(user, data)}
      />
    );
  }

  // 2. ADMIN & FACULTY VIEW
  const viewLabel = user.role === 'admin' ? 'Institutional Analytics' : 'Course Analytics';

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      
      <AnimatePresence mode="wait">
        {searchedStudent ? (
          <motion.div 
            key="student-profile"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <button 
                onClick={() => setSearchedStudent(null)}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back to {viewLabel}
              </button>
              <button 
                onClick={() => handleDownloadTranscript(searchedStudent.details, searchedStudent.analytics)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all border border-indigo-100 dark:border-indigo-500/20"
              >
                <Download className="h-4 w-4" /> Download Transcript
              </button>
            </div>
            
            <StudentViewTemplate 
              user={{...searchedStudent.details, name: searchedStudent.details.name}}
              summary={searchedStudent.analytics.summary || {}}
              subjectPerformance={searchedStudent.analytics.subjectPerformance || []}
              trends={searchedStudent.analytics.trends || []}
              attendance={searchedStudent.analytics.attendance || {}}
              safeGpa={Number(searchedStudent.analytics.summary?.estimatedGpa || 0).toFixed(2)}
              safeAvg={Number(searchedStudent.analytics.summary?.averagePercentage || 0).toFixed(1)}
              hideDownload={true}
            />
          </motion.div>
        ) : (
          <motion.div key="general-analytics" variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
            
            {/* Expanded Smart Filter controls */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/80 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Branch Select */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Branch:</span>
                    <select 
                      value={filterBranch} 
                      onChange={(e) => setFilterBranch(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none border-none cursor-pointer"
                    >
                      <option value="all">All Branches</option>
                      {ALL_BRANCHES.map(b => <option key={b.toLowerCase()} value={b.toLowerCase()}>{b}</option>)}
                    </select>
                  </div>
                  
                  {/* Exam Type Select */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Exam:</span>
                    <select 
                      value={filterExam} 
                      onChange={(e) => setFilterExam(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none border-none cursor-pointer uppercase"
                    >
                      <option value="all">All Exams</option>
                      {EXAM_TYPES.map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
                    </select>
                  </div>

                  {/* Semester Select */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sem:</span>
                    <select 
                      value={filterSemester} 
                      onChange={(e) => setFilterSemester(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none border-none cursor-pointer"
                    >
                      <option value="all">All Semesters</option>
                      {uniqueSemesters.map(s => <option key={s.toLowerCase()} value={s.toLowerCase()}>{s}</option>)}
                    </select>
                  </div>

                  {/* Subject Select */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Subject:</span>
                    <select 
                      value={filterSubject} 
                      onChange={(e) => setFilterSubject(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none border-none cursor-pointer max-w-[120px] truncate"
                    >
                      <option value="all">All Subjects</option>
                      {uniqueSubjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                    </select>
                  </div>

                  {/* Pass/Fail Select */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status:</span>
                    <select 
                      value={filterPassFail} 
                      onChange={(e) => setFilterPassFail(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 outline-none border-none cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pass">Pass Only (&gt;= 40%)</option>
                      <option value="fail">Fail Only (&lt; 40%)</option>
                    </select>
                  </div>

                </div>

                <form onSubmit={handleSearchStudent} className="flex items-center gap-2 w-full lg:w-auto relative">
                  <div className="relative w-full lg:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search student Name/ID..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={searching || !searchQuery.trim()}
                    className="px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {searching ? '...' : 'Locate'}
                  </button>
                  {searchError && (
                    <span className="absolute -bottom-5 right-0 text-[10px] font-black text-red-500">{searchError}</span>
                  )}
                </form>
              </div>

              {rawLoading && (
                <div className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold flex items-center gap-1.5 animate-pulse">
                  <Activity className="h-3 w-3" /> Hydrating real-time filtering data cache...
                </div>
              )}
            </motion.div>

            {/* Top KPI Cards Grid */}
            <motion.div variants={itemVariants} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <InsightCard title="Estimated GPA Avg" value={displayAnalytics?.overallGpa || '0.00'} subtitle="Scale 10.0" icon={<Award />} color="purple" />
              <InsightCard title="Overall Pass Rate" value={displayAnalytics?.overallPassRate || '0.0%'} subtitle="Cleared Modules" icon={<CheckCircle2 />} color="emerald" />
              <InsightCard title="Top Performing Branch" value={displayAnalytics?.topBranch || 'N/A'} subtitle="By Average Score" icon={<TrendingUp />} color="blue" />
              <InsightCard title="At-Risk Submissions" value={displayAnalytics?.atRiskCount || '0'} subtitle="Failed Scores" icon={<AlertTriangle />} color="red" />
            </motion.div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-3">
              
              {/* Branch/Institutional Performance (Bar Chart) */}
              <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl w-full overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                    <Activity className="h-5 w-5 text-indigo-500" /> 
                    {user.role === 'admin' ? 'Institutional Performance Overview' : 'Assigned Student Cohort Performance'}
                  </h3>
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner uppercase">
                    {filterBranch} / {filterExam}
                  </span>
                </div>
                
                <div className="h-[320px] w-full relative">
                  {displayAnalytics?.isEmpty ? (
                    <div className="h-full w-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
                      <EmptyState title="No Filtered Matches" description="Select a different filter combination to view branch distributions." hideIcon />
                    </div>
                  ) : (
                    <div className="absolute inset-0 overflow-x-auto overflow-y-hidden custom-scrollbar">
                      <div className="h-full min-w-[650px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={displayAnalytics?.branchPerformance || []} margin={{ left: -20, right: 10, top: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                            <XAxis dataKey="department" stroke="currentColor" className="text-slate-500 dark:text-slate-400" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                            <YAxis unit="%" stroke="currentColor" className="text-slate-500 dark:text-slate-400" domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0f172a', fontWeight: 'bold' }} 
                              itemStyle={{ fontWeight: 'bold' }}
                              wrapperClassName="dark:!bg-slate-900 dark:!border-slate-700 dark:!text-white"
                              cursor={{ fill: 'currentColor', className: 'text-slate-50 dark:text-slate-800 opacity-50' }}
                            />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 'bold', paddingTop: 20 }} />
                            <Bar dataKey="averagePercentage" name="Average Score %" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={30} />
                            <Bar dataKey="passPercentage" name="Pass Rate %" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={30} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Subject Difficulty Ranking */}
              <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex flex-col">
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 tracking-tight">
                  <AlertTriangle className="h-5 w-5 text-red-500" /> High-Intervention Subjects
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                  {displayAnalytics?.subjectRanking?.length > 0 ? (
                    displayAnalytics.subjectRanking.map((sub) => (
                      <div key={sub.code} className="group flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
                        <div className="min-w-0 pr-3">
                          <h4 className="text-xs font-black text-slate-800 dark:text-white truncate" title={sub.subject}>{sub.subject}</h4>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mt-0.5">{sub.code}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                            {sub.failRate}% Fail
                          </span>
                          <p className="text-[9px] font-bold text-slate-500 mt-0.5">Avg: {sub.average}%</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState title="No Subject Data" description="No exams recorded for these filters." hideIcon />
                  )}
                </div>
              </motion.div>
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --------------------------------------------------------------------------------------
// SHARED COMPONENTS
// --------------------------------------------------------------------------------------

function InsightCard({ title, value, subtitle, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    purple: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    red: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
    amber: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  };
  
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }}
      className="p-5 rounded-3xl flex items-center gap-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md dark:shadow-none hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300"
    >
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border ${colors[color] || colors.blue} shadow-inner`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">{title}</p>
        <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">{value}</p>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-1 truncate">{subtitle}</p>
      </div>
    </motion.div>
  );
}

// --------------------------------------------------------------------------------------
// STUDENT PROFILE VIEW TEMPLATE (Reused for Student Login & Admin Student-Search)
// --------------------------------------------------------------------------------------
function StudentViewTemplate({ user, summary, subjectPerformance, trends, attendance, safeGpa, safeAvg, onDownload, hideDownload }) {
  const safeRank = summary.rank || '-';
  const safeTotal = summary.totalStudents || '-';
  const safePassed = summary.passedCount || 0;
  const badges = summary.badges || [];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Premium Profile Header */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-[2rem] bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/90 dark:to-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-[0.02] pointer-events-none">
          <GraduationCap className="w-64 h-64 rotate-12" />
        </div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="h-20 w-20 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shadow-inner">
            <Award className="h-10 w-10 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{user.name}</h2>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700">
                {user.admissionNo || 'N/A'}
              </span>
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                {user.department || 'Branch'} • Sec {user.section || 'A'}
              </span>
              <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Rank #{safeRank} / {safeTotal}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          {!hideDownload && (
            <button 
              onClick={onDownload}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              <Download className="h-4 w-4" /> Download Transcript
            </button>
          )}
        </div>
      </motion.div>

      {/* Metric Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <InsightCard title="Estimated GPA" value={safeGpa} subtitle="Scale 10.0" icon={<Award />} color="purple" />
        <InsightCard title="Average Score" value={`${safeAvg}%`} subtitle="Aggregate" icon={<Target />} color="blue" />
        <InsightCard title="Attendance Rate" value={`${attendance.percentage || 0}%`} subtitle="Current Term" icon={<Flame />} color={Number(attendance.percentage)<75 ? "red" : "amber"} />
        <InsightCard title="Pass Ratio" value={`${safePassed}/${subjectPerformance.length}`} subtitle="Subjects Cleared" icon={<CheckCircle2 />} color={summary.failedCount > 0 ? "red" : "emerald"} />
      </motion.div>

      {/* Advanced Visualizations Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Exam Progression Trend */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl w-full overflow-hidden">
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 tracking-tight">
            <TrendingUp className="h-5 w-5 text-indigo-500" /> Exam Progression Trajectory
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ left: -20, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis dataKey="examType" stroke="currentColor" className="text-slate-500 dark:text-slate-400" tickFormatter={(v) => (v || '').toUpperCase()} tick={{ fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis unit="%" stroke="currentColor" className="text-slate-500 dark:text-slate-400" domain={[0, 100]} tick={{ fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0f172a', fontWeight: 'bold' }} 
                  wrapperClassName="dark:!bg-slate-900 dark:!border-slate-700 dark:!text-white"
                />
                <Line type="monotone" dataKey="percentage" name="Score %" stroke="url(#lineGrad)" strokeWidth={5} dot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: '#ffffff' }} activeDot={{ r: 9 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Subject Insights */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex flex-col">
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 tracking-tight">
            <BookOpen className="h-5 w-5 text-indigo-500" /> Subject Proficiency
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {subjectPerformance.map((sub, idx) => (
              <div key={sub.code || idx} className="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
                <div className="min-w-0 pr-3">
                  <h4 className="text-sm font-black text-slate-800 dark:text-white truncate" title={sub.subject}>{sub.subject}</h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{sub.code}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                    sub.percentage >= 75 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' :
                    sub.percentage >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' :
                    'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20'
                  }`}>
                    {sub.percentage}% {sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
