import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [chartUrl, setChartUrl] = useState(null);
  const [error, setError] = useState(null);
  const [modelDetails, setModelDetails] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showMetrics, setShowMetrics] = useState({ history: false, confusion: false });
  const [loading, setLoading] = useState(false); 

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);
    setError(null); 
    if (uploadedFile && uploadedFile.type.startsWith("image/")) {
      const imageUrl = URL.createObjectURL(uploadedFile);
      setPrediction({ ...prediction, imageUrl }); 
      handleSubmit(uploadedFile); 
    }
  };
  

  const handleSubmit = async (fileToUpload = file) => {
    if (!fileToUpload) {
      setError('Please upload a file.');
      return;
    }
  
    const formData = new FormData();
    formData.append('file', fileToUpload);
  
    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
  
      const data = await response.json();
      setPrediction((prev) => ({
        ...prev,
        ...data, 
        imageUrl: fileToUpload ? URL.createObjectURL(fileToUpload) : null, 
      }));
      setChartUrl(null); 
    } catch (err) {
      setError(`Failed to ge prediction: ${err.message}`);
    }
  };
  

  const handleShowModelDetails = async () => {
    setLoading(true); 
    try {
      const response = await fetch('http://localhost:5000/model-details');
      if (!response.ok) {
        throw new Error('Failed to fetch model details');
      }
      const modelDetailsData = await response.json();
      setModelDetails(modelDetailsData);
    } catch (err) {
      setError(`Failed to get model details: ${err.message}`);
    } finally {
      setLoading(false); 
    }
  };

  const handleFileProcess = (event) => {
    const uploadedFile = event.target.files[0];

    if (!uploadedFile) {
      setError('Please upload a valid file.');
      return;
    }

    setFile(uploadedFile);
    setError(null);

    if (uploadedFile.type === "text/plain") {
      handleTxtSubmit(uploadedFile);
    } else {
      handleFileChange(event);
    }
  };

  const handleTxtSubmit = async (fileToUpload) => {
    const formData = new FormData();
    formData.append('file', fileToUpload);

    setLoading(true); 

    try {
      const response = await fetch('http://localhost:5000/predict-txt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      const data = await response.json();
      setPrediction(data);
      setChartUrl(data.chartUrl);
    } catch (err) {
      setError(`Failed to get prediction: ${err.message}`);
    } finally {
      setLoading(false); 
    }
  };

  const handleImageClick = (url) => {
    setSelectedImage(url);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setShowMetrics((prev) => ({ ...prev, [name]: checked }));
  };

  return (
    <div className="App">
      <div className="background"></div>
      <div className="container">
        <h1>Method of Neural Network Detection of Defects Based on the Analysis of Vibrations of Rotating Machines</h1>
        <form>
          <label htmlFor="file-upload" className="custom-file-upload">
            Choose File
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".png, .jpg, .jpeg, .txt"
            onChange={handleFileProcess}
          />
          <button type="button" className="details-button" onClick={handleShowModelDetails}>
            Show Model Details
          </button>
        </form>
        {error && (
          <div className="error-popup">
            <p>{error}</p>
            <span className="close-btn" onClick={() => setError(null)}>&times;</span>
          </div>
        )}
        {loading && ( 
        <div className="loading-overlay">
          <div className="loading-animation">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      )}
        {prediction && (
          <div className="result">
            <h2>Prediction Result:</h2>
            <p>Prediction: {prediction.prediction === 1 ? 'Class 1 (Damage Detected)' : 'Class 0 (No Damage)'}</p>
            <p>Accuracy: {(prediction.accuracy * 100).toFixed(2)}%</p>
            {prediction.imageUrl && ( 
              <div className="uploaded-image">
                <img src={prediction.imageUrl} alt="Uploaded" className="preview-image" />
              </div>
            )}
            {chartUrl && (
              <img
                src={`${chartUrl}?t=${new Date().getTime()}`} 
                alt="Chart from .txt file"
                onClick={() => handleImageClick(chartUrl)} 
                className="chart-image"
              />
            )}
          </div>
        )}
        {modelDetails && (
          <div className="model-details-popup">
            <div className="model-details-content">
              <span className="close-btn" onClick={() => setModelDetails(null)}>&times;</span>
              <h2>Model RESNET50: Training Details</h2>
              <h3>Select Metrics to Display:</h3>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="historyACC"
                    checked={showMetrics.historyACC}
                    onChange={handleCheckboxChange}
                  />
                  Training Accuracy History
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="historyLOSS"
                    checked={showMetrics.historyLOSS}
                    onChange={handleCheckboxChange}
                  />
                  Training Loss History
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="confusion"
                    checked={showMetrics.confusion}
                    onChange={handleCheckboxChange}
                  />
                  Confusion Matrix
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="architecture"
                    checked={showMetrics.architecture}
                    onChange={handleCheckboxChange}
                  />
                  Architecture
                </label>
              </div>
              <h3>Graphs:</h3>
              {showMetrics.historyACC && (
                <img
                  src={modelDetails.trainingGraphACCURUrl}
                  alt="Training Accuracy Graph"
                  onClick={() => handleImageClick(modelDetails.trainingGraphACCURUrl)}
                  className="graph-image"
                />
              )}
              {showMetrics.historyLOSS && (
                <img
                  src={modelDetails.trainingGraphLOSTUrl}
                  alt="Training Loss Graph"
                  onClick={() => handleImageClick(modelDetails.trainingGraphLOSTUrl)}
                  className="graph-image"
                />
              )}
              {showMetrics.confusion && (
                <img
                  src={modelDetails.matrixGraphUrl}
                  alt="Matrix Graph"
                  onClick={() => handleImageClick(modelDetails.matrixGraphUrl)}
                  className="graph-image"
                />
              )}
              {showMetrics.architecture && (
                <img
                  src={modelDetails.arctGraphUrl}
                  alt="Arc Graph"
                  onClick={() => handleImageClick(modelDetails.arctGraphUrl)}
                  className="graph-image"
                />
              )}
            </div>
          </div>
        )}
        {selectedImage && (
          <div className="zoom-modal" onClick={handleCloseModal}>
            <img src={selectedImage} alt="Zoomed" className="zoomed-image" />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;