import React from 'react';
import { Calendar, Sparkles, Moon, Target, Settings, Info } from 'lucide-react';

export interface DayCardProps {
  day: any;
  dayName: string;
  dayIndex: number;
  isEditing?: boolean;
  onUpdateField?: (dayIndex: number, field: string, value: any) => void;
  onUpdateSystemBuilding?: (dayIndex: number, habitIndex: number, field: string, value: string) => void;
}

export const DayCard: React.FC<DayCardProps> = ({ 
  day, 
  dayName, 
  dayIndex, 
  isEditing = false, 
  onUpdateField, 
  onUpdateSystemBuilding 
}) => {
  const getHabitTypeIcon = (habitType: string) => {
    switch (habitType) {
      case 'system_building': return <Settings className="w-4 h-4" />;
      case 'deep_focus': return <Target className="w-4 h-4" />;
      case 'evening_reflection': return <Moon className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getHabitTypeColor = (habitType: string) => {
    switch (habitType) {
      case 'system_building': return 'text-purple-600 bg-purple-100';
      case 'deep_focus': return 'text-blue-600 bg-blue-100';
      case 'evening_reflection': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderEditableField = (value: string, field: string, placeholder: string) => {
    if (isEditing) {
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onUpdateField?.(dayIndex, field, e.target.value)}
          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
        />
      );
    }
    return <div className="text-base font-medium text-gray-700">{value}</div>;
  };

  const renderEditableTextarea = (value: string, field: string, placeholder: string) => {
    if (isEditing) {
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onUpdateField?.(dayIndex, field, e.target.value)}
          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder={placeholder}
          rows={2}
        />
      );
    }
    return <div className="text-gray-700 text-sm">{value}</div>;
  };

  const renderHabit = (habitType: string, habitContent: string, title: string, icon: React.ReactNode, field: string) => {
    return (
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          {icon}
          <span className="ml-1">{title}</span>
        </h4>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex-1">
            {renderEditableTextarea(habitContent, field, `Enter ${title.toLowerCase()} content`)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/90 rounded-lg shadow-lg border border-gray-100 p-6 flex flex-col h-full min-h-[320px] self-stretch">
      <div className="flex items-center mb-3">
        <Calendar className="w-5 h-5 text-blue-500 mr-2" />
        <h3 className="text-lg font-bold text-gray-800">{dayName}</h3>
      </div>
      
      <div className="mb-3">
        <span className="text-xs font-semibold text-slate-500">Main Focus:</span>
        {renderEditableField(day.mainFocus, 'mainFocus', 'Enter main focus')}
      </div>

      {/* System Building */}
      {(Array.isArray(day.systemBuilding) ? day.systemBuilding : day.systemBuilding ? [day.systemBuilding] : []).map((habit: any, hIdx: number) => (
        <div key={hIdx} className="mb-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <Settings className="w-4 h-4 mr-1 text-purple-400" />
            System Building
          </h4>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex-1 space-y-2">
              {isEditing ? (
                <>
                  <div>
                    <span className="text-xs font-medium text-gray-600">Action:</span>
                    <input
                      type="text"
                      value={habit.action || ''}
                      onChange={(e) => onUpdateSystemBuilding?.(dayIndex, hIdx, 'action', e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter action"
                    />
                  </div>
                  {habit.trigger && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Trigger:</span>
                      <input
                        type="text"
                        value={habit.trigger || ''}
                        onChange={(e) => onUpdateSystemBuilding?.(dayIndex, hIdx, 'trigger', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter trigger"
                      />
                    </div>
                  )}
                  {habit.reward && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">Reward:</span>
                      <input
                        type="text"
                        value={habit.reward || ''}
                        onChange={(e) => onUpdateSystemBuilding?.(dayIndex, hIdx, 'reward', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter reward"
                      />
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-700 text-sm">
                  <b>Action:</b> {habit.action}
                  {habit.trigger && <> <b> | Trigger:</b> {habit.trigger}</>}
                  {habit.reward && <> <b> | Reward:</b> {habit.reward}</>}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Deep Focus */}
      {day.deepFocus && renderHabit(
        'deep_focus',
        day.deepFocus,
        'Deep Focus',
        <Target className="w-4 h-4 mr-1 text-blue-400" />,
        'deepFocus'
      )}

      {/* Evening Reflection */}
      {day.eveningReflection && renderHabit(
        'evening_reflection',
        day.eveningReflection,
        'Evening Reflection',
        <Moon className="w-4 h-4 mr-1 text-gray-500" />,
        'eveningReflection'
      )}

      <div className="mb-2">
        <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center">
          <Sparkles className="w-4 h-4 mr-1 text-pink-400" />
          Motivational Tip
        </h4>
        {renderEditableTextarea(day.motivationalTip, 'motivationalTip', 'Enter motivational tip')}
      </div>
    </div>
  );
};
