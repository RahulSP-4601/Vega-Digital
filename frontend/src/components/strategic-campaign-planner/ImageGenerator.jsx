// src/components/strategic-campaign-planner/ImageGenerator.jsx

import React, { useState, useRef } from 'react';
import ImageEditor from 'react-filerobot-image-editor';
import '../../css/strategic-campaign-planner/ImageGenerator.css';

const ImageGenerator = () => {
  const [showEditor, setShowEditor] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [editedImage, setEditedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const imageRef = useRef(null);
  const overlayRef = useRef(null);

  const getFullImageSrc = (base64) => `data:image/png;base64,${base64}`;

  const handleSave = ({ imageBase64 }) => {
    setEditedImage(getFullImageSrc(imageBase64));
    setShowEditor(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = editedImage || getFullImageSrc(imageUrl);
    link.download = 'edited-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMouseDown = (e) => {
    const overlay = overlayRef.current;
    const shiftX = e.clientX - overlay.getBoundingClientRect().left;
    const shiftY = e.clientY - overlay.getBoundingClientRect().top;

    const moveAt = (pageX, pageY) => {
      overlay.style.left = `${pageX - shiftX}px`;
      overlay.style.top = `${pageY - shiftY}px`;
    };

    const onMouseMove = (e) => moveAt(e.pageX, e.pageY);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', onMouseMove);
    }, { once: true });
  };

  const handleGenerateImage = async () => {
    setLoading(true);
    try {
      const campaignData = JSON.parse(localStorage.getItem('campaignData'));
      const scriptQA = JSON.parse(localStorage.getItem('scriptQA'));
      const script = localStorage.getItem('generatedScript');

      const response = await fetch('http://localhost:8000/generate-image-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignData, scriptQA, script })
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      setImageUrl(data.imageUrl); // Base64 string only, prefix will be handled
    } catch (err) {
      alert('Error generating image');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-generator-container">
      <h2 className="image-generator-title">🖼️ AI Image Generator & Editor</h2>

      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <button onClick={handleGenerateImage} className="button button-generate" disabled={loading}>
          {loading ? 'Generating...' : '✨ Generate Ad Image'}
        </button>
      </div>

      <div className="image-panel-wrapper">
        <div className="image-card" style={{ position: 'relative' }}>
          <h3>Final Image</h3>
          {imageUrl && (
            <img
              src={editedImage || getFullImageSrc(imageUrl)}
              ref={imageRef}
              alt="Final"
              className="editable-image"
            />
          )}
          {imageUrl && (
            <button onClick={handleDownload} className="button button-download">
              ⬇️ Download Image
            </button>
          )}
        </div>

        <div className="image-card">
          <h3>Edit Panel</h3>
          {imageUrl && (
            <>
              <img
                src={getFullImageSrc(imageUrl)}
                alt="Editable"
                className="editable-image"
              />
              <button onClick={() => setShowEditor(true)} className="button button-edit">
                ✏️ Open Editor
              </button>
            </>
          )}
        </div>
      </div>

      {showEditor && imageUrl && (
        <ImageEditor
          source={getFullImageSrc(imageUrl)}
          onSave={handleSave}
          onClose={() => setShowEditor(false)}
          showInModal
          annotationsCommon={{ fill: '#f97316' }}
          Text={{ text: 'Edit this image with Filerobot!' }}
          savingPixelRatio={1}
          previewPixelRatio={1}
          reduceBeforeEdit={{ mode: 'manual', widthLimit: 1280, heightLimit: 720 }}
        />
      )}
    </div>
  );
};

export default ImageGenerator;
