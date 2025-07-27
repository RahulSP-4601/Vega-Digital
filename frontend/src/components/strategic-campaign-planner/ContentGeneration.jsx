// src/components/strategic-campaign-planner/ContentGeneration.jsx
import React, { useEffect, useState } from 'react';
import '../../css/strategic-campaign-planner/ContentGeneration.css';
import { motion } from 'framer-motion';

const ContentGeneration = () => {
  const [contentData, setContentData] = useState([]);

  useEffect(() => {
    const fetchContent = async () => {
      const stored = localStorage.getItem('campaignData');
      if (!stored) return;

      const parsed = JSON.parse(stored);
      if (!parsed.contentRecommendation) return;

      setContentData(parsed.contentRecommendation);
    };

    fetchContent();
  }, []);

  return (
    <div className="content-gen-container">
      <h2 className="title">🧠 AI-Powered Content Recommendations</h2>
      <p className="subtitle">Platform-specific post ideas and strategic rationale</p>

      {contentData.length === 0 ? (
        <p className="empty-msg">No content available. Please generate a strategy first.</p>
      ) : (
        <div className="content-grid">
          {contentData.map((platform, index) => (
            <motion.div
              className="platform-wrapper"
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="platform-header">
                <span className="badge">{platform.platform}</span>
              </div>

              {platform.recommendations.map((rec, i) => (
                <div key={i} className="sub-card">
                  <h4 className="caption-title">📣 Caption {i + 1}</h4>
                  <p className="caption-text">{rec.caption}</p>

                  <h4 className="explanation-title">💡 Why This Helps</h4>
                  <p className="explanation-text">{rec.explanation}</p>

                  <h4 className="hashtag-title">🏷️ Hashtags</h4>
                  <div className="hashtags">
                    {rec.hashtags.map((tag, j) => (
                      <span key={j} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentGeneration;
