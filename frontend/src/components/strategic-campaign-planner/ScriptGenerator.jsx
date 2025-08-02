import React, { useState, useEffect } from 'react';
import VideoGeneration from './VideoGeneration';
import ImageGenerator from './ImageGenerator';
import '../../css/strategic-campaign-planner/ScriptGenerator.css';

const ScriptGenerator = () => {
  const [platform, setPlatform] = useState('');
  const [availablePlatforms, setAvailablePlatforms] = useState([]);
  const [adType, setAdType] = useState('');
  const [adTypeOptions, setAdTypeOptions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGenerateImage, setShowGenerateImage] = useState(false);
  const [showGenerateVideo, setShowGenerateVideo] = useState(false);

  const stored = JSON.parse(localStorage.getItem('campaignData')) || {};

  useEffect(() => {
    const savedScript = localStorage.getItem('generatedScript');
    const savedAnswers = JSON.parse(localStorage.getItem('scriptQA'));
    if (savedScript) setScript(savedScript);
    if (savedAnswers) setAnswers(savedAnswers);

    const platforms = stored?.recommendedPlatforms?.map(p => p.name) || [];
    setAvailablePlatforms(platforms);
  }, []);

  const handlePlatformChange = async (e) => {
    const selected = e.target.value;
    setPlatform(selected);
    setQuestions([]);
    setAnswers({});
    setCurrentStep(0);
    setScript('');
    setAdType('');
    setAdTypeOptions([]);
    setShowGenerateImage(false);
    setShowGenerateVideo(false);
    localStorage.removeItem('scriptQA');
    try {
      const res = await fetch('http://127.0.0.1:8000/script/ask-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: selected, campaignData: stored })
      });
      const data = await res.json();
      setAdTypeOptions(data.recommendedAdTypes);
    } catch (err) {
      console.error('Error fetching ad types:', err);
    }
  };

  const handleAdTypeSelect = async (e) => {
    const selectedAdType = e.target.value;
    setAdType(selectedAdType);
    setQuestions([]);
    setAnswers({});
    setCurrentStep(0);
    setShowGenerateImage(false);
    setShowGenerateVideo(false);
    localStorage.removeItem('scriptQA');
    try {
      const res = await fetch(`http://127.0.0.1:8000/script/ask-questions/${encodeURIComponent(selectedAdType)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, campaignData: stored })
      });
      const data = await res.json();
      setQuestions(data.questions);
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  const handleAnswerSubmit = () => {
    const currentQuestion = questions[currentStep]?.question;
    if (!currentQuestion || !answers[currentQuestion]) return;
    setCurrentStep((prev) => prev + 1);
  };

  const handleInputChange = (e) => {
    const question = questions[currentStep]?.question;
    const updatedAnswers = { ...answers, [question]: e.target.value };
    setAnswers(updatedAnswers);
    localStorage.setItem('scriptQA', JSON.stringify(updatedAnswers));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        platform,
        adType,
        campaignData: stored,
        answers
      };
      const response = await fetch('http://127.0.0.1:8000/script/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      const finalScript = data.script || 'No script returned';
      setScript(finalScript);
      localStorage.setItem('generatedScript', finalScript);

      if (adType.includes('Video')) setShowGenerateVideo(true);
      if (adType.includes('Image')) setShowGenerateImage(true);
    } catch (err) {
      console.error('Error generating script:', err);
      setScript('Failed to generate script.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => navigator.clipboard.writeText(script);
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
      <h2>🎬 AI Script Generator</h2>

      <div className="script-form">
        <label>
          Platform:
          <select value={platform} onChange={handlePlatformChange} className="form-select" required>
            <option value="">🎯 Select Platform</option>
            {availablePlatforms.map((p, i) => (
              <option key={i} value={p}>{p}</option>
            ))}
          </select>
        </label>

        {adTypeOptions.length > 0 && (
          <label>
            Ad Type:
            <select value={adType} onChange={handleAdTypeSelect} className="form-select" required>
              <option value="">📢 Choose Ad Type</option>
              {adTypeOptions.map((type, i) => (
                <option key={i} value={type}>{type}</option>
              ))}
            </select>
          </label>
        )}

        {questions.length > 0 && currentStep < questions.length && (
          <div className="question-step">
            <label>
              <span className="question-label">Q{currentStep + 1}:</span>
              <span className="question-text">{questions[currentStep].question}</span>
              <input
                type="text"
                className="question-input"
                value={answers[questions[currentStep].question] || ''}
                onChange={handleInputChange}
                required
              />
            </label>
            <button className="next-btn" onClick={handleAnswerSubmit}>Next ➡️</button>
            <p className="progress-bar">
              {currentStep + 1} / {questions.length} answered
            </p>
          </div>
        )}

        {questions.length > 0 && currentStep === questions.length && (
          <div className="generate-button">
            <p className="ready-text">✅ All Questions Answered</p>
            <button className="generate-script-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? '⏳ Generating...' : '🚀 Generate Script'}
            </button>
          </div>
        )}
      </div>

      {script && (
        <div className="generated-script">
          <h3>📝 Generated Ad Script</h3>
          <pre>{script}</pre>
          <div className="script-buttons">
            <button onClick={handleCopy}>📋 Copy</button>
            <button onClick={handleDownload}>⬇️ Download</button>
          </div>
        </div>
      )}

      {script && showGenerateVideo && <VideoGeneration script={script} />}
      {script && showGenerateImage && <ImageGenerator script={script} />}
    </div>
  );
};

export default ScriptGenerator;
