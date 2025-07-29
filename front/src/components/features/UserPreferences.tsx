import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2, CheckCircle, Clock, Target, Heart } from 'lucide-react';
import { useApi } from '../../utils/useApi';
import { useTranslation } from 'react-i18next';

interface UserPreferencesProps {
  onClose: () => void;
  onPreferencesUpdated?: () => void;
}

interface CustomHabit {
  id: number;
  name: string;
  description: string;
  category: string;
  trigger: string;
  action: string;
  reward: string;
  difficulty_level: string;
  frequency: string;
  estimated_duration: string;
  completion_count: number;
  last_completed?: string;
  is_active: string;
}

interface UserPreferences {
  preferred_wake_time?: string;
  preferred_sleep_time?: string;
  preferred_exercise_time?: string;
  preferred_exercise_intensity?: string;
  work_schedule?: any;
  family_obligations?: any;
  dietary_preferences?: any;
  cultural_context?: any;
  primary_goals?: string[];
  focus_areas?: string[];
  avoid_areas?: string[];
  preferred_motivation_style?: string;
  preferred_planning_style?: string;
}

export const UserPreferences: React.FC<UserPreferencesProps> = ({ onClose, onPreferencesUpdated }) => {
  const { t } = useTranslation();
  const { makeRequest } = useApi();
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [customHabits, setCustomHabits] = useState<CustomHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'preferences' | 'habits'>('preferences');
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<CustomHabit | null>(null);

  // Form states
  const [habitForm, setHabitForm] = useState({
    name: '',
    description: '',
    category: 'physical',
    trigger: '',
    action: '',
    reward: '',
    difficulty_level: 'medium',
    frequency: 'daily',
    estimated_duration: '5 minutes'
  });

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      setLoading(true);
      const data = await makeRequest('preferences');
      setPreferences(data.preferences || {});
      setCustomHabits(data.custom_habits || []);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: Partial<UserPreferences>) => {
    try {
      setSaving(true);
      await makeRequest('preferences', {
        method: 'POST',
        body: JSON.stringify(newPreferences)
      });
      setPreferences(prev => ({ ...prev, ...newPreferences }));
      
      // Call the callback if provided
      if (onPreferencesUpdated) {
        onPreferencesUpdated();
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const createCustomHabit = async () => {
    try {
      setSaving(true);
      await makeRequest('habits/custom', {
        method: 'POST',
        body: JSON.stringify(habitForm)
      });
      await loadUserPreferences();
      setShowHabitForm(false);
      setHabitForm({
        name: '',
        description: '',
        category: 'physical',
        trigger: '',
        action: '',
        reward: '',
        difficulty_level: 'medium',
        frequency: 'daily',
        estimated_duration: '5 minutes'
      });
    } catch (error) {
      console.error('Error creating custom habit:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateCustomHabit = async (habitId: number) => {
    try {
      setSaving(true);
      await makeRequest(`habits/custom/${habitId}`, {
        method: 'PUT',
        body: JSON.stringify(habitForm)
      });
      await loadUserPreferences();
      setShowHabitForm(false);
      setEditingHabit(null);
      setHabitForm({
        name: '',
        description: '',
        category: 'physical',
        trigger: '',
        action: '',
        reward: '',
        difficulty_level: 'medium',
        frequency: 'daily',
        estimated_duration: '5 minutes'
      });
    } catch (error) {
      console.error('Error updating custom habit:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCustomHabit = async (habitId: number) => {
    if (!confirm('Are you sure you want to delete this habit?')) return;
    
    try {
      await makeRequest(`habits/custom/${habitId}`, {
        method: 'DELETE'
      });
      await loadUserPreferences();
    } catch (error) {
      console.error('Error deleting custom habit:', error);
    }
  };

  const completeCustomHabit = async (habitId: number) => {
    try {
      await makeRequest(`habits/custom/${habitId}/complete`, {
        method: 'POST'
      });
      await loadUserPreferences();
    } catch (error) {
      console.error('Error completing custom habit:', error);
    }
  };

  const editHabit = (habit: CustomHabit) => {
    setEditingHabit(habit);
    setHabitForm({
      name: habit.name,
      description: habit.description,
      category: habit.category,
      trigger: habit.trigger,
      action: habit.action,
      reward: habit.reward,
      difficulty_level: habit.difficulty_level,
      frequency: habit.frequency,
      estimated_duration: habit.estimated_duration
    });
    setShowHabitForm(true);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-2 text-center">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Settings className="w-6 h-6 mr-2" />
              {t('preferences.title', 'Personalize Your Experience')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'preferences'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('preferences.settings', 'Settings')}
            </button>
            <button
              onClick={() => setActiveTab('habits')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'habits'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('preferences.customHabits', 'Custom Habits')}
            </button>
          </div>

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              {/* Schedule Preferences */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  {t('preferences.schedule', 'Schedule Preferences')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('preferences.wakeTime', 'Preferred Wake Time')}
                    </label>
                    <input
                      type="time"
                      value={preferences.preferred_wake_time || ''}
                      onChange={(e) => savePreferences({ preferred_wake_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('preferences.sleepTime', 'Preferred Sleep Time')}
                    </label>
                    <input
                      type="time"
                      value={preferences.preferred_sleep_time || ''}
                      onChange={(e) => savePreferences({ preferred_sleep_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Exercise Preferences */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  {t('preferences.exercise', 'Exercise Preferences')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('preferences.exerciseTime', 'Preferred Exercise Time')}
                    </label>
                    <select
                      value={preferences.preferred_exercise_time || ''}
                      onChange={(e) => savePreferences({ preferred_exercise_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select time</option>
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('preferences.exerciseIntensity', 'Exercise Intensity')}
                    </label>
                    <select
                      value={preferences.preferred_exercise_intensity || ''}
                      onChange={(e) => savePreferences({ preferred_exercise_intensity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select intensity</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Goals and Focus Areas */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  {t('preferences.goals', 'Goals & Focus Areas')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('preferences.primaryGoals', 'Primary Goals')}
                    </label>
                    <textarea
                      value={preferences.primary_goals?.join('\n') || ''}
                      onChange={(e) => savePreferences({ primary_goals: e.target.value.split('\n').filter(Boolean) })}
                      placeholder="Enter your primary wellness goals, one per line"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('preferences.focusAreas', 'Areas to Focus On')}
                    </label>
                    <textarea
                      value={preferences.focus_areas?.join('\n') || ''}
                      onChange={(e) => savePreferences({ focus_areas: e.target.value.split('\n').filter(Boolean) })}
                      placeholder="Enter areas you want to focus on, one per line"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('preferences.avoidAreas', 'Areas to Avoid')}
                    </label>
                    <textarea
                      value={preferences.avoid_areas?.join('\n') || ''}
                      onChange={(e) => savePreferences({ avoid_areas: e.target.value.split('\n').filter(Boolean) })}
                      placeholder="Enter areas you want to avoid, one per line"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'habits' && (
            <div className="space-y-6">
              {/* Custom Habits List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{t('preferences.customHabits', 'Custom Habits')}</h3>
                  <button
                    onClick={() => setShowHabitForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('preferences.addHabit', 'Add Habit')}
                  </button>
                </div>

                {customHabits.map((habit) => (
                  <div key={habit.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{habit.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            habit.category === 'physical' ? 'bg-blue-100 text-blue-800' :
                            habit.category === 'mental' ? 'bg-purple-100 text-purple-800' :
                            habit.category === 'social' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {habit.category}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{habit.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-500">
                          <div><strong>Trigger:</strong> {habit.trigger || 'None'}</div>
                          <div><strong>Action:</strong> {habit.action}</div>
                          <div><strong>Reward:</strong> {habit.reward || 'None'}</div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Difficulty: {habit.difficulty_level}</span>
                          <span>Frequency: {habit.frequency}</span>
                          <span>Duration: {habit.estimated_duration}</span>
                          <span>Completed: {habit.completion_count} times</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => completeCustomHabit(habit.id)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                          title="Mark as completed"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => editHabit(habit)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                          title="Edit habit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCustomHabit(habit.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                          title="Delete habit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {customHabits.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>{t('preferences.noHabits', 'No custom habits yet. Create your first one!')}</p>
                  </div>
                )}
              </div>

              {/* Habit Form */}
              {showHabitForm && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">
                    {editingHabit ? t('preferences.editHabit', 'Edit Habit') : t('preferences.createHabit', 'Create New Habit')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('preferences.habitName', 'Habit Name')}
                      </label>
                      <input
                        type="text"
                        value={habitForm.name}
                        onChange={(e) => setHabitForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Morning meditation"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('preferences.category', 'Category')}
                      </label>
                      <select
                        value={habitForm.category}
                        onChange={(e) => setHabitForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="physical">Physical</option>
                        <option value="mental">Mental</option>
                        <option value="social">Social</option>
                        <option value="spiritual">Spiritual</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('preferences.description', 'Description')}
                      </label>
                      <textarea
                        value={habitForm.description}
                        onChange={(e) => setHabitForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Describe your habit"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('preferences.trigger', 'Trigger (When)')}
                      </label>
                      <input
                        type="text"
                        value={habitForm.trigger}
                        onChange={(e) => setHabitForm(prev => ({ ...prev, trigger: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., After waking up"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('preferences.action', 'Action (What)')}
                      </label>
                      <input
                        type="text"
                        value={habitForm.action}
                        onChange={(e) => setHabitForm(prev => ({ ...prev, action: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Meditate for 10 minutes"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('preferences.reward', 'Reward')}
                      </label>
                      <input
                        type="text"
                        value={habitForm.reward}
                        onChange={(e) => setHabitForm(prev => ({ ...prev, reward: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Feel calm and focused"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('preferences.difficulty', 'Difficulty')}
                      </label>
                      <select
                        value={habitForm.difficulty_level}
                        onChange={(e) => setHabitForm(prev => ({ ...prev, difficulty_level: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('preferences.frequency', 'Frequency')}
                      </label>
                      <select
                        value={habitForm.frequency}
                        onChange={(e) => setHabitForm(prev => ({ ...prev, frequency: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('preferences.duration', 'Estimated Duration')}
                      </label>
                      <input
                        type="text"
                        value={habitForm.estimated_duration}
                        onChange={(e) => setHabitForm(prev => ({ ...prev, estimated_duration: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 10 minutes"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => editingHabit ? updateCustomHabit(editingHabit.id) : createCustomHabit()}
                      disabled={saving || !habitForm.name || !habitForm.action}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : (editingHabit ? 'Update Habit' : 'Create Habit')}
                    </button>
                    <button
                      onClick={() => {
                        setShowHabitForm(false);
                        setEditingHabit(null);
                        setHabitForm({
                          name: '',
                          description: '',
                          category: 'physical',
                          trigger: '',
                          action: '',
                          reward: '',
                          difficulty_level: 'medium',
                          frequency: 'daily',
                          estimated_duration: '5 minutes'
                        });
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 