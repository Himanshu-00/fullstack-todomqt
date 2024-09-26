import axios from 'axios';

const API_URL = 'http://localhost:4000';

export const fetchTasks = async (): Promise<string[]> => {
    try {
        const response = await axios.get<{ tasks: string[] }>(`${API_URL}/fetchAllTasks`);
        return response.data.tasks;
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }
};

export const addTask = async (task: string): Promise<string[]> => {
    try {
        const response = await axios.post<{ tasks: string[] }>(`${API_URL}/addTask`, { task });
        return response.data.tasks;
    } catch (error) {
        console.error('Error adding task:', error);
        return [];
    }
};

export const removeTask = async (task: string): Promise<string[]> => {
    try {
        const response = await axios.delete<{ tasks: string[] }>(`${API_URL}/removeTask`, { data: { task } });
        return response.data.tasks;
    } catch (error) {
        console.error('Error removing task:', error);
        return [];
    }
};
