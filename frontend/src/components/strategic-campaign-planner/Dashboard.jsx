// src/components/strategic-campaign-planner/Dashboard.jsx
import React, { useState } from 'react';
import StrategyForm from './StrategyForm';
import Recommendations from './Recommendations';
import CompetitorInsights from './CompetitorInsights';
import MarketTrends from './MarketTrends';
import NoStrategyMessage from './NoStrategyMessage';
import './../../css/strategic-campaign-planner/StrategyForm.css';
import './../../css/strategic-campaign-planner/Dashboard.css';

const tabs = ['Strategy Builder', 'Market Trends', 'Recommendations', 'Competitor Analysis'];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Strategy Builder');
  const [submittedData, setSubmittedData] = useState(null);

  const handleFormSubmit = (data) => {
    setSubmittedData(data);
    setActiveTab('Market Trends');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Strategy Builder':
        return <StrategyForm onSubmit={handleFormSubmit} />;
      case 'Recommendations':
        return submittedData ? <Recommendations data={submittedData} /> : <NoStrategyMessage onBack={setActiveTab} />;
      case 'Competitor Analysis':
        return submittedData ? <CompetitorInsights data={submittedData} /> : <NoStrategyMessage onBack={setActiveTab} />;
      case 'Market Trends':
        return submittedData ? <MarketTrends data={submittedData} /> : <NoStrategyMessage onBack={setActiveTab} />;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">AI-Powered Marketing Campaign Planner</h1>
        <p className="dashboard-subtext">
          Design, analyze, and optimize your marketing campaigns with intelligent automation,<br />
          competitor insights, and real-time market data.
        </p>

        <div className="feature-cards">
          <div className="feature-card">
            <div className="feature-header">
              <div className="feature-icon" style={{ backgroundColor: '#7B3FE4' }}>🎯</div>
              <div className="feature-info">
                <div className="feature-title">Strategic Planning</div>
                <span>AI-powered campaign strategy builder</span>
              </div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-header">
              <div className="feature-icon" style={{ backgroundColor: '#22C55E' }}>👥</div>
              <div className="feature-info">
                <div className="feature-title">Competitor Analysis</div>
                <span>Real-time competitor insights & traffic data</span>
              </div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-header">
              <div className="feature-icon" style={{ backgroundColor: '#7B3FE4' }}>📈</div>
              <div className="feature-info">
                <div className="feature-title">Market Trends</div>
                <span>Live trend analysis & keyword insights</span>
              </div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-header">
              <div className="feature-icon" style={{ backgroundColor: '#22C55E' }}>⚡</div>
              <div className="feature-info">
                <div className="feature-title">Smart Recommendations</div>
                <span>Platform & campaign type suggestions</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="workspace-section">
        <div className="workspace-header">
            <h2>Campaign Planning Workspace</h2>
            <p>Build your strategic marketing campaign step by step</p>
        </div>

        <div className="tabs">
            {tabs.map((tab) => (
            <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
            >
                {tab}
            </button>
            ))}
        </div>

        <div className="tab-content">
            {renderTabContent()}
        </div>
      </section>

    </div>
  );
};

export default Dashboard;
