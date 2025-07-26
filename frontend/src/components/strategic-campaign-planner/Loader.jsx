import React from 'react';
import '../../css/strategic-campaign-planner/Loader.css';

const Loader = () => {
  return (
    <div className="loader-overlay">
      <div className="loader-spinner"></div>
      <p className="loader-text">Generating your personalized strategy...</p>
    </div>
  );
};

export default Loader;
