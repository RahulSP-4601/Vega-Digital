import React, { useEffect, useState } from 'react';
import '../../css/strategic-campaign-planner/CompetitorInsights.css';
import { BsDiamondFill } from 'react-icons/bs';
import { FaChartLine, FaBullseye, FaExclamationTriangle } from 'react-icons/fa';

const CompetitorInsights = () => {
  const [competitors, setCompetitors] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("campaignData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const rawCompetitors = parsed.competitors || [];

        // Normalize channel field for safety
        const normalized = rawCompetitors.map((comp) => ({
          ...comp,
          traffic: comp.estimatedMonthlyTraffic || comp.traffic || 'N/A',
          channels: comp.marketingChannels || [],
        }));

        setCompetitors(normalized);
      } catch (err) {
        console.error("Failed to parse campaignData:", err);
      }
    }
  }, []);

  return (
    <div className="competitor-insights">
      <h2 className="title">🏁 Competitor Analysis</h2>
      <p className="subtitle">
        Deep dive into your top local competitors. Use this insight to improve positioning, strategy, and differentiation.
      </p>

      {competitors.length === 0 ? (
        <div className="empty-box">
          <h4>No Competitor Data</h4>
          <p>This section will display competitors once strategy is generated from the form.</p>
        </div>
      ) : (
        <div className="competitor-grid">
          {competitors.map((comp, idx) => (
            <div key={idx} className="competitor-card">
              <h3><BsDiamondFill className="diamond-icon" /> {comp.name}</h3>
              <p className="desc">{comp.description}</p>

              <div className="metric">
                <FaChartLine /> <strong>Monthly Traffic:</strong> {comp.traffic}
              </div>

              <div className="channels">
                <FaBullseye className="icon" /> <strong>Channels:</strong>
                {Array.isArray(comp.channels) && comp.channels.length > 0 ? (
                  <ul>
                    {comp.channels.map((ch, i) => (
                      <li key={i}>{ch}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ marginLeft: '1.5rem' }}>N/A</p>
                )}
              </div>

              <div className="strength-weakness">
                <p><span className="label strength">Strength:</span> {comp.strength || 'N/A'}</p>
                <p>
                  <span className="label weakness">
                    <FaExclamationTriangle /> Weakness:
                  </span> {comp.weakness || 'N/A'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompetitorInsights;
