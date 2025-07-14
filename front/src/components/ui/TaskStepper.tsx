import React, { useState } from 'react';
import { Task, TaskItem } from './TaskItem';
import { AnimatePresence, motion } from 'framer-motion';

interface TaskStepperProps {
  tasks: Task[];
  onTasksChange?: (tasks: Task[]) => void;
  title?: string;
}

/**
 * Vertical stepper that renders a list of TaskItems.
 */
export const TaskStepper: React.FC<TaskStepperProps> = ({ tasks: initialTasks, onTasksChange, title }) => {
  const [tasks, setTasks] = useState(initialTasks);

  const toggleTask = (id: Task['id']) => {
    const updated = tasks.map(t => (t.id === id ? { ...t, completed: !t.completed } : t));
    setTasks(updated);
    onTasksChange?.(updated);
  };

  return (
    <div className="space-y-4">
      {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
      <ul className="relative list-none">
        <AnimatePresence>
          {tasks.map((task, idx) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <TaskItem task={task} index={idx} onToggle={toggleTask} />
            </motion.div>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
};
