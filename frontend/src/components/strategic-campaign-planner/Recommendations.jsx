// Enhanced Recommendations.jsx with framer-motion
import React, { useEffect, useState, useRef } from 'react';
import './../../css/strategic-campaign-planner/Recommendations.css';
import { FiDownload } from 'react-icons/fi';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { motion } from 'framer-motion';

const Recommendations = () => {
  const [recommendation, setRecommendation] = useState(null);
  const pdfRef = useRef();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("campaignData");
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecommendation(parsed);
      }
    } catch (error) {
      console.error("Invalid campaign data in localStorage:", error);
    }
  }, []);

  const handleDownload = async (e) => {
    e.preventDefault();
    const element = pdfRef.current;
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pageWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
      pdf.save('campaign-recommendation.pdf');
    } catch (error) {
      console.error('PDF generation error:', error);
    }
  };

  const platformIcons = {
    "Google Ads": '🔍',
    "LinkedIn Ads": '🔗',
    "Facebook Ads": '📘',
    "YouTube Ads": '🎥',
    "TikTok Ads": '📈',
    "Pinterest Ads": '📌',
    "Amazon Ads": '🛒',
    "Snapchat Ads": '👻'
  };

  const getMatchLabel = (score, index, highestScore) => {
    if (index === 0) return "Highly Recommended";
    if (!score || !highestScore) return "Unknown Match";
    const percent = Math.round((score / highestScore) * 100);
    return `${percent}% Match`;
  };

  const renderPlatformCards = (platforms, highestScore, isRecommended) => (
    <div className={`recommendation-cards ${isRecommended ? '' : 'not-recommended'}`}>
      {platforms.map((platform, index) => (
        <motion.div
          key={index}
          className={`recommendation-card ${isRecommended ? '' : 'faded'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="icon-title">
            <span className="icon-box">{platformIcons[platform.name] || '📊'}</span>
            <h4>{platform.name || "Unnamed Platform"}</h4>
          </div>
          <div className="match-budget">
            <span className={`badge ${isRecommended ? '' : 'gray'}`}>
              {isRecommended
                ? getMatchLabel(platform.matchScore, index, highestScore)
                : (platform.matchScore ? `${platform.matchScore}% Match` : "Unknown Match")}
            </span>
          </div>
          <div className="section">
            <strong>{isRecommended ? 'AI Reasoning:' : 'Why Not Recommended:'}</strong>
            <p>{platform.rationale || "No explanation provided."}</p>
          </div>
          {isRecommended && Array.isArray(platform.campaignTypes) && platform.campaignTypes.length > 0 && (
            <div className="section">
              <strong>Recommended Campaign Types:</strong>
              <div className="tag-list">
                {platform.campaignTypes.map((type, i) => (
                  <span key={i} className="tag">{type}</span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );

  const renderPlatforms = () => {
    if (!recommendation || !Array.isArray(recommendation.recommendedPlatforms)) {
      return <p>No campaign recommendations found. Please generate a strategy first.</p>;
    }

    const sortedRecommended = [...recommendation.recommendedPlatforms].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    const highestScore = sortedRecommended[0]?.matchScore || 1;

    return (
      <>
        

        {recommendation.localContext && (
          <div className="local-context-banner">
            <h2>🌤️ Weather Insights</h2>
            <p>{recommendation.localContext.weatherSummary}</p>

            {Array.isArray(recommendation.localContext.eventsSummary) && recommendation.localContext.eventsSummary.length > 0 && (
              <div className="events-summary">
                <h3>📅 Relevant Upcoming Events</h3>
                <div className="event-grid">
                  {recommendation.localContext.eventsSummary.map((event, i) => (
                    <div key={i} className="event-card">
                      <h5>{event.name}</h5>
                      <p><strong>Date:</strong> {event.date}</p>
                      <p><strong>Location:</strong> {event.location?.street}, {event.location?.city}, {event.location?.state} {event.location?.zip}</p>
                      <p><strong>Relevance:</strong> {event.relevance}</p>
                      {event.location?.mapsLink && (
                        <p>
                          <a href={event.location.mapsLink} target="_blank" rel="noopener noreferrer">
                            📍 Open in Google Maps
                          </a>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <h2>Channel Recommended Platforms</h2>
        {renderPlatformCards(sortedRecommended, highestScore, true)}

        {Array.isArray(recommendation.notRecommendedPlatforms) && recommendation.notRecommendedPlatforms.length > 0 && (
          <>
            <h2>Channel Platforms Not Recommended</h2>
            {renderPlatformCards(recommendation.notRecommendedPlatforms, 100, false)}
          </>
        )}

        {Array.isArray(recommendation.strategyTips) && recommendation.strategyTips.length > 0 && (
          <div className="strategy-tips-box">
            <h2 className="tips-title">💡 Strategy Tips</h2>
            <ul className="tips-list">
              {recommendation.strategyTips.map((tip, idx) => (
                <li key={idx} className="tip-item">👉 {tip}</li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  };

  return (
    <div>
      <div className="recommendation-header">
        <div>
          <h2>AI Campaign Recommendations</h2>
          <p>Personalized strategies based on your goals and industry benchmarks</p>
        </div>
        <button className="export-btn" onClick={handleDownload}>
          <FiDownload /> Export Blueprint
        </button>
      </div>

      <div className="recommendation-wrapper" ref={pdfRef}>
        {renderPlatforms()}
      </div>
    </div>
  );
};

export default Recommendations;