import React, { useState } from 'react';
import './../../css/strategic-campaign-planner/StrategyForm.css';
import Loader from './Loader';

const steps = ['Business Info', 'Business Goals', 'Target Audience', 'Review & Generate'];

const initialData = {
  businessName: '',
  businessDescription: '',
  businessGoals: [],
  demographics: [],
  interests: [],
  location: '',
  industry: ''
};

const StrategyForm = ({ onSubmit }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleCheckboxChange = (e, field) => {
    const { value, checked } = e.target;
    const updated = checked
      ? [...data[field], value]
      : data[field].filter(item => item !== value);

    setData(prev => ({
      ...prev,
      [field]: updated,
      ...(field === 'interests' ? { industry: updated.join(', ') } : {})
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    const newErrors = {};

    if (step === 0) {
      if (!data.businessName.trim()) newErrors.businessName = 'Business name is required';
      if (!data.businessDescription.trim()) newErrors.businessDescription = 'Business description is required';
    }

    if (step === 1) {
      if (data.businessGoals.length === 0) newErrors.businessGoals = 'Select at least one goal';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/recommendation/generate-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to generate strategy: ${errorText}`);
      }

      const result = await res.json();

      const requiredKeys = ["recommendedPlatforms", "notRecommendedPlatforms", "keywords", "competitors", "strategyTips", "localContext"];
      const missing = requiredKeys.filter(key => !(key in result));
      if (missing.length) {
        console.error("❌ Missing keys in API response:", missing);
        throw new Error("Incomplete response from AI");
      }

      localStorage.setItem("campaignData", JSON.stringify(result));
      onSubmit && onSubmit(result);
    } catch (err) {
      console.error("Recommendation API error:", err);
      alert("❌ Failed to generate recommendation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {steps.map((label, index) => (
        <div key={index} className={`step-card ${step === index ? 'active' : ''}`}>
          <div className="step-icon">{['🏢', '🎯', '👥', '📄'][index]}</div>
          <div className="step-title">{label}</div>
          <div className="step-subtitle">
            {index === 0 ? 'Describe your business'
              : index === 1 ? 'Define your campaign objectives'
              : index === 2 ? 'Identify your ideal customers'
              : 'Finalize your strategy'}
          </div>
        </div>
      ))}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="step-form business-info">
            <h3 className="step-title">🏢 Business Info</h3>
            <p className="step-description">Let's start with the basics. Tell us about your business.</p>

            <div className="input-card">
              <label htmlFor="businessName">Your Business Name</label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                placeholder="e.g. Vega Digital"
                value={data.businessName}
                onChange={handleChange}
              />
              {errors.businessName && <p className="error-msg">{errors.businessName}</p>}
            </div>

            <div className="input-card">
              <label htmlFor="businessDescription">Business Description</label>
              <textarea
                id="businessDescription"
                name="businessDescription"
                placeholder="Briefly describe what your business does, who your customers are, and your unique value."
                value={data.businessDescription}
                onChange={handleChange}
                rows={5}
              />
              {errors.businessDescription && <p className="error-msg">{errors.businessDescription}</p>}
            </div>
          </div>
        );

      case 1:
        return (
          <div>
            <h3>🎯 Business Goals</h3>
            <p>What are your primary business goals?</p>
            <div className="checkbox-grid">
              {[ 'Increase Brand Awareness', 'Boost Sales Conversions', 'Expand Market Reach', 'Generate Leads', 'Launch New Product', 'Build Email List', 'Drive Website Traffic', 'Improve Customer Retention' ].map(goal => (
                <label key={goal}>
                  <input
                    type="checkbox"
                    value={goal}
                    onChange={e => handleCheckboxChange(e, 'businessGoals')}
                    checked={data.businessGoals.includes(goal)}
                  />
                  {goal}
                </label>
              ))}
            </div>
            {errors.businessGoals && <p className="error-msg">{errors.businessGoals}</p>}
          </div>
        );

      case 2:
        return (
          <div>
            <h3>👥 Target Audience</h3>
            <p>Target Demographics:</p>
            <div className="checkbox-grid">
              {[ '18–24 years', '25–34 years', '35–44 years', '45–54 years', '55+ years', 'College Students', 'Young Professionals', 'Parents', 'Retirees' ].map(item => (
                <label key={item}>
                  <input
                    type="checkbox"
                    value={item}
                    onChange={e => handleCheckboxChange(e, 'demographics')}
                    checked={data.demographics.includes(item)}
                  />
                  {item}
                </label>
              ))}
            </div>
            <p>Target Interests (Industry):</p>
            <div className="checkbox-grid">
              {[ 'Technology', 'Health & Fitness', 'Food & Cooking', 'Travel', 'Finance', 'Education', 'Fashion', 'Entertainment', 'Business', 'Sports' ].map(item => (
                <label key={item}>
                  <input
                    type="checkbox"
                    value={item}
                    onChange={e => handleCheckboxChange(e, 'interests')}
                    checked={data.interests.includes(item)}
                  />
                  {item}
                </label>
              ))}
            </div>
            <input
              type="text"
              name="location"
              placeholder="Primary Location / Market"
              value={data.location}
              onChange={handleChange}
            />
          </div>
        );

      case 3:
        return (
          <div>
            <h3>📄 Review & Generate</h3>
            <div className="review-box">
              <h4>Business Name</h4>
              <p><strong>{data.businessName}</strong></p>

              <h4>Business Description</h4>
              <p>{data.businessDescription}</p>

              <h4>Business Goals</h4>
              <p>{data.businessGoals.join(', ')}</p>

              <h4>Target Demographics</h4>
              <p>{data.demographics.join(', ')}</p>

              <h4>Target Interests (Industry)</h4>
              <p>{data.interests.join(', ')}</p>

              <h4>Primary Location</h4>
              <p>{data.location}</p>

              <h4>Industry</h4>
              <p>{data.industry}</p>
            </div>

            <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Strategy'}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="strategy-form">
      {renderStepIndicator()}
      <div className="step-body">
        <div className="step-header">Step {step + 1} of {steps.length}</div>
        {renderStep()}
        <div className="step-controls">
          {step > 0 && <button onClick={prevStep}>Previous</button>}
          {step < steps.length - 1 && <button onClick={nextStep}>Next</button>}
        </div>
      </div>

      {loading && <Loader />}
    </div>
  );
};

export default StrategyForm;
