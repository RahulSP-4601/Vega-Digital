import React, { useEffect, useState } from 'react';
import './../../css/strategic-campaign-planner/MarketTrends.css';
import { BiTrendingUp } from 'react-icons/bi';

const MarketTrends = () => {
  const [globalKeywords, setGlobalKeywords] = useState([]);
  const [localKeywords, setLocalKeywords] = useState([]);
  const [location, setLocation] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem("campaignData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const keywords = parsed.keywords || {};
        setGlobalKeywords(keywords.globalKeywords || []);
        setLocalKeywords(keywords.localKeywords || []);
        setLocation(parsed.location || parsed?.input?.location || 'your region');
      } catch (err) {
        console.error("Error parsing campaignData in MarketTrends.jsx:", err);
      }
    }
  }, []);

  const renderKeywordCards = (keywords) => (
    <div className="trend-grid">
      {keywords.map((k, i) => (
        <div key={i} className="trend-card">
          <BiTrendingUp className="trend-icon" />
          <span className="keyword-text">
            <strong>{typeof k === 'string' ? k : k.keyword}</strong>
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="market-trends-section">
      <div className="market-header">
        <div>
          <h2>📈 Trending Keywords</h2>
          <p>AI-generated keywords validated with market signals</p>
        </div>
      </div>

      {globalKeywords.length === 0 && localKeywords.length === 0 ? (
        <p>No trending keywords found. Please generate a strategy.</p>
      ) : (
        <>
          {globalKeywords.length > 0 && (
            <div className="trend-group">
              <h3>🌍 Global Trends</h3>
              {renderKeywordCards(globalKeywords)}
            </div>
          )}

          {localKeywords.length > 0 && (
            <div className="trend-group">
              <h3>📍 Trends in {location}</h3>
              {renderKeywordCards(localKeywords)}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MarketTrends;
