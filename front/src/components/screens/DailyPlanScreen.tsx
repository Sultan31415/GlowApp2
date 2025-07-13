import React, { useEffect, useState } from 'react';
import { useApi } from '../../utils/useApi';
import { RotateCcw } from 'lucide-react';
import { DayCard } from './DayCard'; // Import the new DayCard component

interface DailyPlanScreenProps {
  onBack: () => void;
}

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const DailyPlanScreen: React.FC<DailyPlanScreenProps> = ({ onBack }) => {
  const { makeRequest } = useApi();
  const [plan, setPlan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await makeRequest('daily-plan');
        setPlan(Array.isArray(data.daily_plan) ? data.daily_plan : []);
      } catch (err: any) {
        if (err?.response?.status === 404 || err?.status === 404) {
          try {
            setGenerating(true);
            await makeRequest('generate-daily-plan', { method: 'POST' });
            const data = await makeRequest('daily-plan');
            setPlan(Array.isArray(data.daily_plan) ? data.daily_plan : []);
            setError(null);
          } catch (genErr: any) {
            setError('Failed to generate your daily plan. Please try again later.');
          } finally {
            setGenerating(false);
          }
        } else {
          setError('No daily plan found. Please generate your plan first.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [makeRequest]);

  if (loading || generating) {
    return <div className="text-center py-20 text-xl font-semibold text-gray-700">{generating ? 'Generating your personalized plan...' : 'Loading your plan...'}</div>;
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="mb-4 text-red-600 font-semibold">{error}</div>
        <button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-full inline-flex items-center">
          <RotateCcw className="w-4 h-4 mr-2" />Back
        </button>
      </div>
    );
  }

  if (!plan.length) {
    return (
      <div className="text-center py-20">
        <div className="mb-4 text-gray-600">No daily plan available.</div>
        <button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-full inline-flex items-center">
          <RotateCcw className="w-4 h-4 mr-2" />Back
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">Weekly Work Plan</h1>
      <p className="text-center text-gray-500 mb-10">Your personalized 7-day productivity roadmap.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {plan.map((day: any, idx: number) => (
          <DayCard key={idx} day={day} dayName={dayNames[idx % 7]} />
        ))}
      </div>

      <div className="text-center mt-12">
        <button onClick={onBack} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-full inline-flex items-center transition-colors duration-300">
          <RotateCcw className="w-5 h-5 mr-2" />
          <span>Go Back</span>
        </button>
      </div>
    </div>
  );
}; 