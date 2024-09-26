import React, { useEffect, useState } from 'react';
import { fetchTasks, addTask, removeTask } from '../api/taskService';

interface TaskItemProps {
    task: string;
    onRemove: (task: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onRemove }) => {
    return (
        <div className="flex justify-between items-center p-4 mb-2 border-b border-gray-300 transition-transform duration-200 hover:bg-gray-100">
            <span className="text-gray-800 font-medium">{task}</span>
            <button 
                onClick={() => onRemove(task)} 
                className="p-2 text-gray-700 text-lg">
                &times;
            </button>
        </div>
    );
};

const TaskList: React.FC = () => {
    const [tasks, setTasks] = useState<string[]>([]);
    const [newTask, setNewTask] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const getTasks = async () => {
            try {
                const taskData = await fetchTasks();
                setTasks(taskData || []);
            } catch (error) {
                console.error('Error fetching tasks:', error);
                setTasks([]);
            }
        };
        getTasks();
    }, []);

    const handleAddTask = async () => {
        if (newTask.trim() === '') {
            setError('Task cannot be empty');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await addTask(newTask);
            setTasks(prevTasks => [...prevTasks, newTask]);
            setNewTask('');
            setSuccessMessage('Task added successfully!');
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            setError('Failed to add task');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveTask = async (task: string) => {
        setLoading(true);
        setError(null);

        try {
            await removeTask(task);
            setTasks(prevTasks => prevTasks.filter(t => t !== task));
        } catch (err) {
            setError('Failed to remove task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-700 to-indigo-500">
            <div className="bg-white rounded-xl p-8 shadow-lg w-[400px] h-[600px] flex flex-col border border-gray-300">
                <h1 className="text-2xl font-bold mb-6 text-gray-800 text-left">To-Do List</h1>
                <div className="mb-4 flex space-x-2">
                    <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Add new task"
                        className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                    />
                    <button
                        onClick={handleAddTask}
                        className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors duration-200 font-semibold shadow-md"
                        disabled={loading}
                    >
                        {loading ? 'Adding...' : 'Add'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-center">{error}</p>}
                {successMessage && <p className="text-green-500 text-center">{successMessage}</p>}
                <div className="flex-grow overflow-y-auto mt-4">
                    {tasks.length === 0 ? (
                        <p className="text-center text-gray-400">No tasks found</p>
                    ) : (
                        tasks.map((task, index) => (
                            <TaskItem key={index} task={task} onRemove={handleRemoveTask} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskList;
