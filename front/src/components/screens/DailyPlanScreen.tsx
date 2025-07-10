import React, { useEffect, useState } from 'react';
import { useApi } from '../../utils/useApi';
import { RotateCcw, Calendar, CheckCircle2 } from 'lucide-react';

interface DailyPlanScreenProps {
  onBack: () => void;
}

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
        setPlan(data.daily_plan?.dailyPlan || []);
      } catch (err: any) {
        // If 404, try to generate the plan automatically
        if (err?.response?.status === 404 || err?.status === 404) {
          try {
            setGenerating(true);
            await makeRequest('generate-daily-plan', { method: 'POST' });
            // Try fetching again
            const data = await makeRequest('daily-plan');
            setPlan(data.daily_plan?.dailyPlan || []);
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

  if (loading || generating) return <div className="text-center py-20">{generating ? 'Generating your daily plan...' : 'Loading your daily plan...'}</div>;
  if (error) return (
    <div className="text-center py-20">
      <div className="mb-4 text-red-600">{error}</div>
      <button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-full inline-flex items-center">
        <RotateCcw className="w-4 h-4 mr-2" />Back
      </button>
    </div>
  );
  if (!plan.length) return (
    <div className="text-center py-20">
      <div className="mb-4 text-gray-600">No daily plan available.</div>
      <button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-full inline-flex items-center">
        <RotateCcw className="w-4 h-4 mr-2" />Back
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center mb-2">
        <span className="bg-yellow-200 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full mr-3">Beta Version</span>
      </div>
      <div className="flex items-center mb-8">
        <Calendar className="w-8 h-8 text-blue-500 mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">Your Personalized 7-Day Plan</h2>
      </div>
      <div className="space-y-6">
        {plan.map((day: any, idx: number) => (
          <div key={idx} className="bg-white rounded-xl shadow p-6 border border-blue-100">
            <div className="flex items-center mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
              <span className="font-semibold text-blue-700">Day {day.day}: {day.mainFocus}</span>
            </div>
            <ul className="list-disc ml-6 mb-2">
              {day.actionableTasks.map((task: string, i: number) => (
                <li key={i} className="text-gray-700">{task}</li>
              ))}
            </ul>
            <div className="text-sm text-purple-700 italic mb-1">Tip: {day.motivationalTip}</div>
            <div className="text-xs text-gray-500">Why: {day.rationale}</div>
          </div>
        ))}
      </div>
      <div className="text-center mt-10">
        <button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-full inline-flex items-center">
          <RotateCcw className="w-4 h-4 mr-2" />Back
        </button>
      </div>
    </div>
  );
}; 