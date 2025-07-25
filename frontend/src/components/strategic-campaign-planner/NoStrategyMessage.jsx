// components/shared/NoStrategyMessage.jsx

import React from 'react';
import './../../css/strategic-campaign-planner/NoStrategyMessage.css';

const NoStrategyMessage = ({ onBack }) => {
  return (
    <div className="no-strategy">
      <div className="icon">🎯</div>
      <h2>No Strategy Created Yet</h2>
      <p>Complete the Strategy Builder first to get personalized recommendations.</p>
      <button onClick={() => onBack('strategy')}>
        Go to Strategy Builder →
      </button>
    </div>
  );
};

export default NoStrategyMessage;
