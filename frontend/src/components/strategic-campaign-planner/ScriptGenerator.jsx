// src/components/strategic-campaign-planner/ScriptGenerator.jsx
import React, { useState } from 'react';
import '../../css/strategic-campaign-planner/ScriptGenerator.css';

const ScriptGenerator = () => {
  const [adType, setAdType] = useState('');
  const [platform, setPlatform] = useState('');
  const [tone, setTone] = useState('Professional');
  const [topic, setTopic] = useState('');
  const [keyword, setKeyword] = useState('');
  const [cta, setCta] = useState('');

  const [length, setLength] = useState('Shorts (30 sec)');
  const [sceneStart, setSceneStart] = useState('');
  const [weather, setWeather] = useState('');
  const [numCharacters, setNumCharacters] = useState('');
  const [mainProduct, setMainProduct] = useState('');

  const [script, setScript] = useState('');
  const stored = JSON.parse(localStorage.getItem('campaignData')) || {};

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      adType,
      platform,
      tone,
      topic,
      keyword,
      cta,
      campaignData: stored,
    };

    if (adType === 'Video Ad') {
      payload.length = length;
      payload.sceneStart = sceneStart;
      payload.weather = weather;
      payload.numCharacters = numCharacters;
      payload.mainProduct = mainProduct;
    }

    try {
      const response = await fetch('http://localhost:8000/script/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setScript(data.script || 'No script returned');
    } catch (err) {
      console.error('Error generating script:', err);
      setScript('Failed to generate script.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
  };

  const handleDownload = () => {
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'generated_ad_script.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="script-gen-container">
      <h2>🎬 AI Ad Script Generator</h2>

      <form className="script-form" onSubmit={handleSubmit}>
        <label>
          Ad Type:
          <select value={adType} onChange={(e) => setAdType(e.target.value)} required>
            <option value="">Select Ad Type</option>
            <option value="Image Ad">Image Ad</option>
            <option value="Video Ad">Video Ad</option>
          </select>
        </label>

        {adType && (
          <>
            <label>
              Platform:
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} required>
                <option value="">Select Platform</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="YouTube">YouTube</option>
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

            {adType === 'Video Ad' && (
              <>
                <label>
                  Length:
                  <select value={length} onChange={(e) => setLength(e.target.value)}>
                    <option value="Shorts (30 sec)">Shorts (30 sec)</option>
                    <option value="Ads (1.5–2 mins)">Ads (1.5–2 mins)</option>
                  </select>
                </label>

                <label>
                  Scene Start:
                  <input type="text" value={sceneStart} onChange={(e) => setSceneStart(e.target.value)} required />
                </label>

                <label>
                  Weather:
                  <input type="text" value={weather} onChange={(e) => setWeather(e.target.value)} required />
                </label>

                <label>
                  Number of Characters:
                  <input type="number" value={numCharacters} onChange={(e) => setNumCharacters(e.target.value)} required />
                </label>

                <label>
                  Main Product to Promote:
                  <input type="text" value={mainProduct} onChange={(e) => setMainProduct(e.target.value)} required />
                </label>
              </>
            )}

            <button type="submit">Generate Script</button>
          </>
        )}
      </form>

      {script && (
        <div className="generated-script">
          <h3>Generated Script ✨</h3>
          <pre>{script}</pre>

          <div className="script-buttons">
            <button onClick={handleCopy}>📋 Copy</button>
            <button onClick={handleDownload}>⬇️ Download</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptGenerator;
