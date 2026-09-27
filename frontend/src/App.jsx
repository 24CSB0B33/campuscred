import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { auth, googleProvider } from './config/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { fetchProfile, fetchTransactions, adjustCreditsLocally } from './redux/walletSlice';
import api from './api/client';
import FindMatch from './pages/FindMatch';
import SessionChat from './components/SessionChat';
import {
  BookOpen,
  Calendar,
  CreditCard,
  LogOut,
  Search,
  MessageSquare,
  User,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Check,
  X
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sessions, setSessions] = useState([]);
  const [activeChatSession, setActiveChatSession] = useState(null);
  
  // Form fields for skills and free time
  const [allSkills, setAllSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('');
  const [selectedTagSkill, setSelectedTagSkill] = useState('');
  const [tagType, setTagType] = useState('teach');
  const [tagProficiency, setTagProficiency] = useState('intermediate');
  const [availDay, setAvailDay] = useState(1); // 1 = Monday
  const [availStart, setAvailStart] = useState('09:00');
  const [availEnd, setAvailEnd] = useState('17:00');

  const dispatch = useDispatch();
  const { profile, transactions, status: walletStatus } = useSelector((state) => state.wallet);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoadingAuth(false);
      if (firebaseUser) {
        dispatch(fetchProfile());
        dispatch(fetchTransactions());
        loadSessions();
        loadSkillsList();
      }
    });
    return () => unsubscribe();
  }, [dispatch]);

  const loadSessions = async () => {
    try {
      const res = await api.get('/sessions/mine');
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to load sessions', err);
    }
  };

  const loadSkillsList = async () => {
    try {
      const res = await api.get('/skills');
      setAllSkills(res.data);
    } catch (err) {
      console.error('Failed to load master skills list', err);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign-in error:', err);
      alert(`Authentication failed: ${err.message} (${err.code || 'unknown'})\n\nMake sure your Firebase keys are correctly configured in .env.`);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
    setActiveChatSession(null);
  };

  const handleStatusUpdate = async (sessionId, newStatus) => {
    try {
      await api.put(`/sessions/${sessionId}/status`, { status: newStatus });
      loadSessions();
      dispatch(fetchProfile());
      dispatch(fetchTransactions());
    } catch (err) {
      console.error('Failed to update session status', err);
      alert('Status update failed');
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    try {
      await api.post('/skills', { name: newSkillName, category: newSkillCategory });
      setNewSkillName('');
      setNewSkillCategory('');
      loadSkillsList();
      alert('Skill added to database successfully!');
    } catch (err) {
      console.error('Failed to add skill', err);
    }
  };

  const handleTagSkill = async (e) => {
    e.preventDefault();
    if (!selectedTagSkill) return;
    try {
      await api.post('/skills/tag', {
        skillId: parseInt(selectedTagSkill),
        type: tagType,
        proficiency: tagProficiency
      });
      alert('Skill tag added successfully!');
    } catch (err) {
      console.error('Failed to tag skill', err);
    }
  };

  const handleAddAvailability = async (e) => {
    e.preventDefault();
    try {
      await api.post('/skills/availability', {
        dayOfWeek: parseInt(availDay),
        startTime: availStart,
        endTime: availEnd
      });
      alert('Availability slot added successfully!');
    } catch (err) {
      console.error('Failed to add availability', err);
    }
  };

  if (loadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />
        <div className="glass-panel w-full max-w-md rounded-2xl p-8 text-center shadow-2xl relative z-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400">
            <BookOpen className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight font-sans text-white mb-2">CampusCred</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Trade your skills using credits instead of cash. Learn guitar by teaching Python. No money — just knowledge exchange.
          </p>
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-medium py-3 px-4 rounded-xl transition duration-200 shadow-lg shadow-brand-600/20"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold font-sans tracking-tight">CampusCred</span>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => { setActiveTab('dashboard'); setActiveChatSession(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition duration-150 ${
                activeTab === 'dashboard'
                  ? 'bg-brand-600/10 text-brand-400 border border-brand-500/20'
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <User className="h-4.5 w-4.5" />
              Dashboard
            </button>
            <button
              onClick={() => { setActiveTab('find'); setActiveChatSession(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition duration-150 ${
                activeTab === 'find'
                  ? 'bg-brand-600/10 text-brand-400 border border-brand-500/20'
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Search className="h-4.5 w-4.5" />
              Find Teachers
            </button>
            <button
              onClick={() => { setActiveTab('sessions'); loadSessions(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition duration-150 relative ${
                activeTab === 'sessions'
                  ? 'bg-brand-600/10 text-brand-400 border border-brand-500/20'
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Calendar className="h-4.5 w-4.5" />
              My Sessions
              {sessions.filter(s => s.status === 'pending').length > 0 && (
                <span className="absolute right-3 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {sessions.filter(s => s.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('skills-settings'); setActiveChatSession(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition duration-150 ${
                activeTab === 'skills-settings'
                  ? 'bg-brand-600/10 text-brand-400 border border-brand-500/20'
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Plus className="h-4.5 w-4.5" />
              Manage Skills
            </button>
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="border-t border-slate-900 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt={user.displayName}
              className="h-9 w-9 rounded-full ring-2 ring-brand-500/20"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.displayName || user.email}</p>
              <p className="text-xs text-brand-400 font-medium">
                {profile ? `${profile.credits} Credits` : 'Loading...'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition duration-150"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Welcome, {user.displayName || 'Learner'}</h2>
              <p className="text-slate-400 mt-1">Track your wallet balance and audit your skills interactions.</p>
            </div>

            {/* Widgets grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Credit Balance</p>
                  <p className="text-2xl font-bold mt-1 text-white">{profile?.credits ?? '0'} 🪙</p>
                </div>
              </div>
              <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Sessions</p>
                  <p className="text-2xl font-bold mt-1 text-white">
                    {sessions.filter(s => s.status === 'completed').length}
                  </p>
                </div>
              </div>
              <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending/Active</p>
                  <p className="text-2xl font-bold mt-1 text-white">
                    {sessions.filter(s => ['pending', 'confirmed'].includes(s.status)).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Transactions Section */}
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">Transaction Ledger</h3>
              {transactions.length === 0 ? (
                <p className="text-sm text-slate-500">No transactions recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-400 font-semibold">
                        <th className="pb-3">Type</th>
                        <th className="pb-3">Note</th>
                        <th className="pb-3 text-right">Amount</th>
                        <th className="pb-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-900/20">
                          <td className="py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              t.type === 'credit' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {t.type}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-300">{t.note}</td>
                          <td className={`py-3.5 text-right font-bold ${
                            t.type === 'credit' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {t.amount > 0 ? `+${t.amount}` : t.amount} 🪙
                          </td>
                          <td className="py-3.5 text-right text-slate-500">
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'find' && (
          <div>
            <FindMatch onSessionBooked={() => {
              loadSessions();
              dispatch(fetchProfile());
            }} />
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Your Sessions</h2>
              <p className="text-slate-400 mt-1">Accept bookings, join rooms, and trade knowledge.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sessions List */}
              <div className="lg:col-span-2 space-y-3">
                {sessions.length === 0 ? (
                  <p className="text-sm text-slate-500">You do not have any sessions scheduled.</p>
                ) : (
                  sessions.map((s) => {
                    const isTeacher = s.teacher_id === profile?.id;
                    const partnerName = isTeacher ? s.learner_name : s.teacher_name;
                    return (
                      <div
                        key={s.id}
                        className={`glass-panel p-4 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4 transition duration-200 ${
                          activeChatSession?.id === s.id ? 'border-brand-500 bg-brand-500/5' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-base">{s.skill_name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              s.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                              s.status === 'confirmed' ? 'bg-blue-500/10 text-blue-400' :
                              s.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                              'bg-yellow-500/10 text-yellow-400'
                            }`}>
                              {s.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300 mt-1">
                            {isTeacher ? 'Student: ' : 'Teacher: '}
                            <span className="font-semibold text-slate-200">{partnerName}</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(s.scheduled_at).toLocaleString()} · {s.duration_minutes} min ({s.credits_cost} credit)
                          </p>
                        </div>

                        {/* Interactive Buttons */}
                        <div className="flex items-center gap-2 self-start md:self-center">
                          {/* Confirm Booking for Teacher */}
                          {isTeacher && s.status === 'pending' && (
                            <button
                              onClick={() => handleStatusUpdate(s.id, 'confirmed')}
                              className="bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                            >
                              <Check className="h-3.5 w-3.5" /> Accept
                            </button>
                          )}

                          {/* Complete Session */}
                          {['confirmed', 'pending'].includes(s.status) && (
                            <button
                              onClick={() => handleStatusUpdate(s.id, 'completed')}
                              className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                            >
                              Complete
                            </button>
                          )}

                          {/* Cancel Session */}
                          {['pending', 'confirmed'].includes(s.status) && (
                            <button
                              onClick={() => handleStatusUpdate(s.id, 'cancelled')}
                              className="text-slate-400 hover:text-red-400 hover:bg-red-500/5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                            >
                              Cancel
                            </button>
                          )}

                          {/* Chat Button */}
                          <button
                            onClick={() => setActiveChatSession(s)}
                            className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Chat
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Sidebar Area */}
              <div className="lg:col-span-1">
                {activeChatSession ? (
                  <div className="glass-panel p-4 rounded-2xl">
                    <h3 className="text-sm font-bold border-b border-slate-900 pb-3 mb-4 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-brand-400" />
                      Chat: {activeChatSession.skill_name}
                    </h3>
                    <SessionChat sessionId={activeChatSession.id} />
                  </div>
                ) : (
                  <div className="glass-panel p-6 rounded-2xl text-center text-slate-500 text-sm">
                    Select a session from the list to open the real-time chat room.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills-settings' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Skills & Availability</h2>
              <p className="text-slate-400 mt-1">Add items to the master skills list, define what you teach/learn, and configure your weekly timeslots.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Add New Master Skill */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold border-b border-slate-900 pb-3">Create a Skill</h3>
                <form onSubmit={handleAddSkill} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Skill Name</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-brand-500"
                      placeholder="e.g. Node.js, French Conversation, Ukulele"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Category</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-brand-500"
                      placeholder="e.g. Programming, Languages, Music"
                      value={newSkillCategory}
                      onChange={(e) => setNewSkillCategory(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2 px-4 rounded-xl text-sm transition"
                  >
                    Add Skill
                  </button>
                </form>
              </div>

              {/* Tag Skill (Teach / Learn) */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold border-b border-slate-900 pb-3">Tag Your Skills</h3>
                <form onSubmit={handleTagSkill} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Select Skill</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-brand-500"
                      value={selectedTagSkill}
                      onChange={(e) => setSelectedTagSkill(e.target.value)}
                    >
                      <option value="">Choose a skill...</option>
                      {allSkills.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.category || 'uncategorized'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">I want to...</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="tagType"
                          value="teach"
                          checked={tagType === 'teach'}
                          onChange={() => setTagType('teach')}
                          className="text-brand-600 focus:ring-brand-500"
                        />
                        Teach
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name="tagType"
                          value="learn"
                          checked={tagType === 'learn'}
                          onChange={() => setTagType('learn')}
                          className="text-brand-600 focus:ring-brand-500"
                        />
                        Learn
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Proficiency</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-brand-500"
                      value={tagProficiency}
                      onChange={(e) => setTagProficiency(e.target.value)}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2 px-4 rounded-xl text-sm transition"
                  >
                    Tag Skill
                  </button>
                </form>
              </div>

              {/* Set Weekly Availability */}
              <div className="glass-panel p-6 rounded-2xl space-y-4 md:col-span-2">
                <h3 className="text-lg font-bold border-b border-slate-900 pb-3">Set Teaching Availability</h3>
                <form onSubmit={handleAddAvailability} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Day of the Week</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none"
                      value={availDay}
                      onChange={(e) => setAvailDay(e.target.value)}
                    >
                      <option value="0">Sunday</option>
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Start Time</label>
                    <input
                      type="time"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none"
                      value={availStart}
                      onChange={(e) => setAvailStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">End Time</label>
                    <input
                      type="time"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none"
                      value={availEnd}
                      onChange={(e) => setAvailEnd(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition"
                  >
                    Add Slot
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
