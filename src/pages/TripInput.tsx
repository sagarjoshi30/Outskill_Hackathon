import { useState } from 'react';
import { useNavigate } from '../hooks/useNavigate';
import { useAuth } from '../contexts/AuthContext';
import { useItinerary } from '../hooks/useItinerary';
import { EDGE_FUNCTION_URL, supabase } from '../lib/supabase';
import { Itinerary } from '../types';
import { ArrowLeft } from 'lucide-react';

const experienceOptions = [
  { id: 'rest', label: 'Rest' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'romance', label: 'Romance' },
  { id: 'cultural', label: 'Cultural' },
  { id: 'foodie', label: 'Foodie' },
];

export function TripInput() {
  const { workflowType, navigate } = useNavigate();
  const { user } = useAuth();
  const { setCurrentItinerary } = useItinerary();

  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('3');
  const [budget, setBudget] = useState('');
  const [experiences, setExperiences] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleExperience = (id: string) => {
    setExperiences((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const payload = {
        userId: user?.id,
        workflowType,
        destination,
        duration: parseInt(duration),
        budget: parseInt(budget),
        ...(workflowType === 'plan' && { experiences }),
      };

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate itinerary');
      }

      const itinerary: Itinerary = await response.json();
      setCurrentItinerary(itinerary);
      navigate('loading');

      setTimeout(() => {
        navigate('itinerary');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 pb-8">
      <div className="max-w-md mx-auto pt-6 space-y-6">
        <button
          onClick={() => navigate('dashboard')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div>
          <div className="inline-block px-4 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-full mb-4">
            {workflowType === 'plan' ? 'Detailed Planning' : 'Spontaneous Adventure'}
          </div>
          <h1 className="text-3xl font-serif text-slate-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Tell us about your journey
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white/60 backdrop-blur-md border border-slate-200/50 rounded-2xl p-6 shadow-lg space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Where to?
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Tokyo, Japan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                How many days?
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
                min="1"
                max="14"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Budget (per day, USD)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                required
                min="1"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="100"
              />
            </div>

            {workflowType === 'plan' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  What kind of experience?
                </label>
                <div className="flex flex-wrap gap-2">
                  {experienceOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleExperience(option.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        experiences.includes(option.id)
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-medium text-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? 'Generating...' : 'Generate Itinerary'}
          </button>
        </form>
      </div>
    </div>
  );
}
