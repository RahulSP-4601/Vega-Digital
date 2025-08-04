// src/components/strategic-campaign-planner/VideoGeneration.jsx
import React, { useState } from 'react';
import '../../css/strategic-campaign-planner/VideoGeneration.css';

const VideoGeneration = () => {
  const [videoUrl] = useState('/yoga.mp4');

  const handleEditClick = () => {
    alert('Edit functionality coming soon!');
  };

  return (
    <div className="video-generator-container">
      <h2 className="video-generator-title">
        <span role="img" aria-label="video">🎞️</span> AI Video Generator & Editor
      </h2>


      <div className="video-panel-wrapper">
        {/* Final Video */}
        <div className="video-card glass">
          <h3 className="video-section-title">Final Video</h3>
          <video src={videoUrl} controls className="video-preview" />
          <div className="video-button-center">
            <a href={videoUrl} download="final-video.mp4" className="button button-download">
              ⬇️ Download
            </a>
          </div>
        </div>

        {/* Editable Video */}
        <div className="video-card glass">
          <h3 className="video-section-title">Editable Video</h3>
          <video src={videoUrl} controls className="video-preview" />
          <div className="video-button-center">
            <button onClick={handleEditClick} className="button button-edit">
              ✏️ Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGeneration;
