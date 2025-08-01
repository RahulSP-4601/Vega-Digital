// src/components/strategic-campaign-planner/VideoGeneration.jsx
import React, { useState } from 'react';

const VideoGeneration = ({ script }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  const handleGenerateVideo = async () => {
    setIsGenerating(true);
    try {
      // Replace this with actual video generation API call
      setTimeout(() => {
        setVideoUrl('https://samplelib.com/lib/preview/mp4/sample-5s.mp4'); // Mock preview
        setIsGenerating(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to generate video:', error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="video-gen-container">
      <h4>🎥 Generate Video Ad</h4>
      <button onClick={handleGenerateVideo} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : '🎬 Generate Video Ad'}
      </button>

      {videoUrl && (
        <div style={{ marginTop: '1rem' }}>
          <video width="100%" controls>
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
};

export default VideoGeneration;
