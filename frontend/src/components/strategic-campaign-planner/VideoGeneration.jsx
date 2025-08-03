// src/components/strategic-campaign-planner/VideoGeneration.jsx
import React, { useState } from 'react';
import '../../css/strategic-campaign-planner/ImageGenerator.css';

const VideoGeneration = () => {
  const [videoUrl] = useState('/yoga.mp4');

  const handleEditClick = () => {
    alert('Edit functionality coming soon!');
    // You can later add FFmpeg or editor launch logic here
  };

  return (
    <div className="image-generator-container">
      <h2 className="image-generator-title">🎞️ AI Video Generator & Editor</h2>

      <div className="image-panel-wrapper">
        {/* Final Video */}
        <div className="image-card">
          <h3>Final Video</h3>
          <video src={videoUrl} controls className="editable-image" />
          <a href={videoUrl} download="final-video.mp4" className="button button-download">
            ⬇️ Download Video
          </a>
        </div>

        {/* Editable Video (Same as left, with edit button) */}
        <div className="image-card">
          <h3>Editable Video</h3>
          <video src={videoUrl} controls className="editable-image" />
          <button onClick={handleEditClick} className="button button-edit">
            ✏️ Edit Video
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoGeneration;
