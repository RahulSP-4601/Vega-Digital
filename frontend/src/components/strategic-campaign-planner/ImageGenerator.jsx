// src/components/strategic-campaign-planner/ImageGenerator.jsx
import React, { useState, useRef } from 'react';
import ImageEditor from 'react-filerobot-image-editor';
import '../../css/strategic-campaign-planner/ImageGenerator.css';

const ImageGenerator = () => {
  const [showEditor, setShowEditor] = useState(false);
  const [imageUrl] = useState('/yoga.png');
  const [editedImage, setEditedImage] = useState(null);
  const imageRef = useRef(null);
  const overlayRef = useRef(null);

  const handleSave = ({ imageBase64 }) => {
    setEditedImage(imageBase64);
    setShowEditor(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = editedImage || imageUrl;
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

  return (
    <div className="image-generator-container">
      <h2 className="image-generator-title">🖼️ AI Image Generator & Editor</h2>

      <div className="image-panel-wrapper">
        <div className="image-card" style={{ position: 'relative' }}>
          <h3>Final Image</h3>
          <img
            src={editedImage || imageUrl}
            ref={imageRef}
            alt="Final"
            className="editable-image"
          />
          <button onClick={handleDownload} className="button button-download">
            ⬇️ Download Image
          </button>
        </div>
        <div className="image-card">
          <h3>Edit Panel</h3>
          <img
            src={imageUrl}
            alt="Editable"
            className="editable-image"
          />
          <button onClick={() => setShowEditor(true)} className="button button-edit">
            ✏️ Open Editor
          </button>
        </div>
      </div>

      {showEditor && (
        <ImageEditor
          source={imageUrl}
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
