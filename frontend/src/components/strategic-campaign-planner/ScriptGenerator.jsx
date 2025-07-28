// src/components/strategic-campaign-planner/ScriptGenerator.jsx
import React, { useEffect, useState } from 'react';
import '../../css/strategic-campaign-planner/ScriptGenerator.css';

const ScriptGenerator = () => {
  const [platform, setPlatform] = useState('');
  const [adType, setAdType] = useState('');
  const [tone, setTone] = useState('Professional');
  const [topic, setTopic] = useState('');
  const [keyword, setKeyword] = useState('');
  const [cta, setCta] = useState('');
  const [length, setLength] = useState('Short');
  const [script, setScript] = useState('');

  const stored = JSON.parse(localStorage.getItem('campaignData')) || {};
  const business = stored.businessName || 'your business';
  const location = stored.location || 'your city';

  const handleSubmit = async (e) => {
    e.preventDefault();

    const prompt = `Write a ${adType} for ${platform} targeting ${business} in ${location}. It should be based on the topic \"${topic}\" and optimized for the keyword \"${keyword}\". Tone: ${tone}. CTA: ${cta}. Length: ${length}.`;

    try {
      const response = await fetch('http://localhost:8000/recommendation/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      setScript(data.script || 'No script returned');
    } catch (err) {
      console.error('Error generating script:', err);
      setScript('Failed to generate script.');
    }
  };

  return (
    <div className="script-gen-container">
      <h2>🎬 AI Ad Script Generator</h2>
      <form className="script-form" onSubmit={handleSubmit}>
        <label>
          Platform:
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} required>
            <option value="">Select</option>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="YouTube">YouTube</option>
          </select>
        </label>

        <label>
          Ad Type:
          <select value={adType} onChange={(e) => setAdType(e.target.value)} required>
            <option value="">Select</option>
            <option value="Image Ad">Image Ad</option>
            <option value="Video Ad">Video Ad</option>
          </select>
        </label>

        <label>
          Tone:
          <input type="text" value={tone} onChange={(e) => setTone(e.target.value)} required />
        </label>

        <label>
          Topic:
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} required />
        </label>

        <label>
          Keyword:
          <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} required />
        </label>

        <label>
          CTA:
          <input type="text" value={cta} onChange={(e) => setCta(e.target.value)} required />
        </label>

        <label>
          Length:
          <select value={length} onChange={(e) => setLength(e.target.value)}>
            <option value="Short">Short</option>
            <option value="Medium">Medium</option>
            <option value="Long">Long</option>
          </select>
        </label>

        <button type="submit">Generate Script</button>
      </form>

      {script && (
        <div className="generated-script">
          <h3>Generated Script ✨</h3>
          <pre>{script}</pre>
        </div>
      )}
    </div>
  );
};

export default ScriptGenerator;
