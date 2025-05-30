import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

export const useCounter = () => {
    const [count, setCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCount = async () => {
        try {
            const response = await fetch(`${API_URL}/counter`);
            const data = await response.json();
            setCount(data.value);
            setError(null);
        } catch (err) {
            setError('Failed to fetch counter');
        } finally {
            setLoading(false);
        }
    };

    const increment = async () => {
        try {
            const response = await fetch(`${API_URL}/counter/increment`, {
                method: 'POST',
            });
            const data = await response.json();
            setCount(data.value);
            setError(null);
        } catch (err) {
            setError('Failed to increment counter');
        }
    };

    useEffect(() => {
        fetchCount();
        // Poll for updates every 5 seconds
        const interval = setInterval(fetchCount, 5000);
        return () => clearInterval(interval);
    }, []);

    return {
        count,
        loading,
        error,
        increment,
        refresh: fetchCount
    };
}; 