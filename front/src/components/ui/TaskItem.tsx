import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export interface Task {
  id: string | number;
  title: string;
  details?: string | string[];
  completed?: boolean;
  category?: string; // optional, can be used for color coding
}

interface TaskItemProps {
  task: Task;
  index: number;
  onToggle?: (id: Task["id"]) => void;
}

/**
 * Single row inside a TaskStepper.
 * Shows a circle with either the step number or a check icon, plus title & details.
 */
export const TaskItem: React.FC<TaskItemProps> = ({ task, index, onToggle }) => {
  const handleToggle = () => onToggle?.(task.id);

  return (
    <li className="relative pl-10 py-3">
      {/* vertical line */}
      <span className="absolute left-4 top-0 h-full w-px bg-gray-300" aria-hidden="true" />

      {/* circle */}
      <button
        onClick={handleToggle}
        className={`absolute left-0 top-1.5 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors duration-200
          ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-500'}`}
        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {task.completed ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-medium">{index + 1}</span>}
      </button>

      {/* content */}
      <div className="ml-4">
        <p className="font-medium text-gray-800">{task.title}</p>
        {task.details && (
          Array.isArray(task.details) ? (
            <ul className="list-disc list-inside text-xs text-gray-500 mt-1 space-y-1">
              {task.details.map((item: any, idx: number) => (
                <li key={idx}>{typeof item === 'string' ? item.trim() : String(item || '')}</li>
              ))}
            </ul>
          ) : typeof task.details === 'string' && task.details.includes(',') ? (
            <ul className="list-disc list-inside text-xs text-gray-500 mt-1 space-y-1">
              {task.details.split(',').map((item: any, idx) => (
                <li key={idx}>{typeof item === 'string' ? item.trim() : String(item || '')}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 mt-1">{task.details}</p>
          )
        )}
      </div>
    </li>
  );
};
