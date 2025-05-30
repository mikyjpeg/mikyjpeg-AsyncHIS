import React from 'react';
import { useCounter } from '../hooks/useCounter';
import './Counter.css';

export const Counter: React.FC = () => {
    const { count, loading, error, increment } = useCounter();

    if (loading) {
        return (
            <div className="counter-container">
                <div className="counter-card loading">
                    <div className="loading-spinner" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="counter-container">
                <div className="counter-card error">
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="counter-container">
            <div className="counter-card">
                <h2>Discord Counter</h2>
                <div className="counter-value">{count}</div>
                <p className="counter-description">
                    This counter is synchronized with Discord!<br />
                    Try typing <code>!increment</code> in Discord.
                </p>
                <button className="increment-button" onClick={increment}>
                    Increment
                </button>
            </div>
        </div>
    );
}; 