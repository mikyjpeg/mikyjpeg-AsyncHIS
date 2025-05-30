import React, { useState } from 'react';
import './GameMap.css';

export const GameMap: React.FC = () => {
    const [imageError, setImageError] = useState<boolean>(false);

    const handleImageError = () => {
        console.error('Failed to load the map image');
        setImageError(true);
    };

    return (
        <div className="game-map-container">
            <div className="game-map-wrapper">
                <h1>Here I Stand</h1>
                <div className="map-container">
                    {imageError ? (
                        <div className="error-message">
                            Failed to load the map. Please check the server configuration.
                            <div className="debug-info">
                                <p>Expected image path: /resources/HereIStandMap6.jpg</p>
                                <p>You can test the image directly at: <a href="/test-resources" target="_blank" rel="noopener noreferrer">/test-resources</a></p>
                            </div>
                        </div>
                    ) : (
                        <img 
                            src="/resources/HereIStandMap6.jpg" 
                            alt="Here I Stand Game Map" 
                            className="game-map"
                            onError={handleImageError}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}; 