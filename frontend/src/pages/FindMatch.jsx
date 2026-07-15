import { useState, useEffect } from 'react';
import api from '../api/client';
import { Search, Calendar, Clock, CreditCard, Sparkles, BookOpen } from 'lucide-react';

export default function FindMatch({ onSessionBooked }) {
  const [skills, setSkills] = useState([]);
  const [skillId, setSkillId] = useState('');
  
  // Search parameters for availability matching
  const [searchDay, setSearchDay] = useState('');
  const [searchStart, setSearchStart] = useState('');
  const [searchEnd, setSearchEnd] = useState('');

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  // Booking Modal State
  const [bookingTeacher, setBookingTeacher] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('12:00');
  const [bookingDuration, setBookingDuration] = useState('60');
  const [bookingCredits, setBookingCredits] = useState('1');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  useEffect(() => {
    api.get('/skills').then((res) => setSkills(res.data));
  }, []);

  const search = async () => {
    if (!skillId) return;
    setLoading(true);
    try {
      let url = `/match?skillId=${skillId}`;
      if (searchDay) url += `&day=${searchDay}`;
      if (searchStart) url += `&start=${searchStart}`;
      if (searchEnd) url += `&end=${searchEnd}`;

      const res = await api.get(url);
      setMatches(res.data.matches);
    } catch (err) {
      console.error(err);
      alert('Error fetching matches');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBooking = (teacher) => {
    setBookingTeacher(teacher);
    // Initialize booking date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingDate(tomorrow.toISOString().split('T')[0]);
  };

  const handleCloseBooking = () => {
    setBookingTeacher(null);
  };

  const handleBookSession = async (e) => {
    e.preventDefault();
    if (!bookingTeacher || !bookingDate || !bookingTime) return;

    setBookingSubmitting(true);
    try {
      const scheduledAt = `${bookingDate}T${bookingTime}:00`;
      
      const payload = {
        teacherId: bookingTeacher.teacherId,
        skillId: parseInt(skillId),
        scheduledAt,
        durationMinutes: parseInt(bookingDuration),
        creditsCost: parseInt(bookingCredits),
      };

      await api.post('/sessions', payload);
      alert(`Successfully booked session with ${bookingTeacher.name}! 1 Credit is currently held in escrow.`);
      handleCloseBooking();
      if (onSessionBooked) onSessionBooked();
      
      // Refresh matches list (load scores might change)
      search();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Booking failed. Make sure you have enough credits.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Find a Teacher</h2>
        <p className="text-slate-400 mt-1">
          Search for a skill. Our matching engine rates teachers using skill proficiency, historical reviews, and availability overlap.
        </p>
      </div>

      {/* Advanced Search Parameters */}
      <div className="glass-panel p-6 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-1">
          <label className="text-xs font-semibold text-slate-400 block mb-1">Select Skill</label>
          <select
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none"
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
          >
            <option value="">Choose a skill...</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">Preferred Day</label>
          <select
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none"
            value={searchDay}
            onChange={(e) => setSearchDay(e.target.value)}
          >
            <option value="">Any day</option>
            <option value="0">Sunday</option>
            <option value="1">Monday</option>
            <option value="2">Tuesday</option>
            <option value="3">Wednesday</option>
            <option value="4">Thursday</option>
            <option value="5">Friday</option>
            <option value="6">Saturday</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-1">Start Time</label>
            <input
              type="time"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none"
              value={searchStart}
              onChange={(e) => setSearchStart(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-1">End Time</label>
            <input
              type="time"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none"
              value={searchEnd}
              onChange={(e) => setSearchEnd(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={search}
          disabled={!skillId || loading}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold py-2 px-4 rounded-xl text-sm transition shadow-lg shadow-brand-600/10"
        >
          <Search className="h-4 w-4" />
          {loading ? 'Finding matches...' : 'Find Matches'}
        </button>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          </div>
        )}

        {!loading && matches.length === 0 && skillId && (
          <div className="glass-panel p-8 text-center rounded-2xl text-slate-500 text-sm">
            No active teachers found for this skill. Try tagging a skill as "teach" with another test account first!
          </div>
        )}

        {!loading && matches.map((m) => (
          <div
            key={m.teacherId}
            className="glass-panel glass-panel-hover p-5 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white">{m.name}</span>
                <span className="bg-brand-500/10 text-brand-400 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {Math.round(m.score * 100)}% Match
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Rating: <span className="text-yellow-400 font-semibold">{m.rating > 0 ? `${m.rating}/5.0` : 'New Teacher'}</span> · {m.ratingCount} reviews
              </p>
              <div className="flex gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {m.activeSessions} active student slots</span>
              </div>
            </div>

            <button
              onClick={() => handleOpenBooking(m)}
              className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2 px-5 rounded-xl text-sm transition md:self-center self-start"
            >
              Book Session
            </button>
          </div>
        ))}
      </div>

      {/* Booking Form Dialog Modal */}
      {bookingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold mb-1 flex items-center gap-2 text-white">
              <Calendar className="h-5 w-5 text-brand-400" />
              Schedule Session
            </h3>
            <p className="text-sm text-slate-400 mb-6">Book a 1-on-1 session with <span className="text-slate-200 font-semibold">{bookingTeacher.name}</span></p>

            <form onSubmit={handleBookSession} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Date</label>
                <input
                  type="date"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-brand-500"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Time</label>
                  <input
                    type="time"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-brand-500"
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Duration</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-brand-500"
                    value={bookingDuration}
                    onChange={(e) => setBookingDuration(e.target.value)}
                  >
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                    <option value="120">120 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Cost</label>
                <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-900 rounded-xl px-3 py-2 text-sm text-slate-400 font-medium">
                  <CreditCard className="h-4.5 w-4.5 text-brand-400" />
                  <span>1 Credit (escrow hold, released on completion)</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={handleCloseBooking}
                  disabled={bookingSubmitting}
                  className="bg-transparent hover:bg-slate-900 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2 px-5 rounded-xl text-sm transition shadow-lg shadow-brand-600/10"
                >
                  {bookingSubmitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
