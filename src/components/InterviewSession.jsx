import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "./Header";

const InterviewSession = () => {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingController, setProcessingController] = useState(null);
  const [isTranscribed, setIsTranscribed] = useState(false);
  const [audioFilePath, setAudioFilePath] = useState(null);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes default
  const [timerActive, setTimerActive] = useState(false);
  const [currentQuestionData, setCurrentQuestionData] = useState(null);
  const [progress, setProgress] = useState(0); // Progress percentage
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);

  // 🔊 Refs for audio recording
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  useEffect(() => {
    const storedId = localStorage.getItem("sessionId");
    if (!storedId) {
      setMessage("No active session found. Redirecting...");
      setTimeout(() => navigate("/setup"), 1000);
      return;
    }
    setSessionId(storedId);
    fetchSession(storedId);
  }, [navigate]); // Added navigate to dependencies

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      // Time's up - auto submit
      setTimerActive(false);
      
      // Don't auto-submit if currently processing audio or recording
      if (processing || recording) {
        setMessage("Time's up! Please wait for audio processing to complete or stop recording.");
        return;
      }
      
      if (answer.trim() || isTranscribed) {
        setMessage("Time's up! Submitting your answer...");
        handleSubmitAnswer();
      } else {
        // Submit with a default message for empty answers
        setAnswer("No answer provided");
        setMessage("Time's up! Submitting empty answer...");
        setTimeout(() => {
          handleSubmitAnswer();
        }, 1000);
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, answer, isTranscribed, processing, recording]);

  const fetchSession = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/interview/session/${id}/question`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.data.completed || res.data.shouldRedirectToSummary) {
        console.log("🎯 Interview completed, redirecting to summary:", res.data);
        setMessage("Interview completed!");
        setTimeout(() => navigate("/summary", { state: { sessionId: id } }), 1500);
      } else {
        setCurrentQuestion(res.data.question.text);
        setCurrentQuestionData(res.data.question);
        
        // Initialize progress tracking
        if (res.data.progress !== undefined) {
          setProgress(res.data.progress);
        }
        if (res.data.question?.index !== undefined) {
          setCurrentQuestionNumber(res.data.question.index + 1);
        }
        if (res.data.totalQuestions !== undefined) {
          setTotalQuestions(res.data.totalQuestions);
        }
        
        // Start timer when new question loads
        const questionTimeLimit = res.data.question.timeLimit || 120;
        setTimeLeft(questionTimeLimit);
        setTimerActive(true);
        // Reset answer state
        setAnswer("");
        setIsTranscribed(false);
        setAudioFilePath(null);
      }
    } catch (err) {
      console.error("Session fetch error:", err);
      if (err.response?.data?.error) {
        setMessage(`Error: ${err.response.data.error}`);
      } else {
        setMessage("Failed to load session. Try again.");
      }
      
      // If session is not active, check if it's completed or truly expired
      if (err.response?.status === 400 && err.response?.data?.error?.includes("not active")) {
        // Try to fetch session details to see if it's completed
        try {
          const token = localStorage.getItem("token");
          const sessionRes = await axios.get(`http://localhost:5000/api/interview/session/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (sessionRes.data.status === 'completed') {
            console.log("🎯 Session is completed, redirecting to summary");
            setMessage("Interview completed! Redirecting to results...");
            setTimeout(() => navigate("/summary", { state: { sessionId: id } }), 2000);
            return;
          }
        } catch (detailError) {
          console.log("Could not fetch session details:", detailError);
        }
        
        setMessage("Session expired. Redirecting to start a new interview...");
        setTimeout(() => {
          localStorage.removeItem("sessionId");
          navigate("/setup");
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🎤 Start recording
  const startRecording = async () => {
    // Prevent multiple recordings or recording during processing
    if (recording || processing || loading) {
      console.log("⚠️ Recording blocked: already recording or processing");
      return;
    }
    
    try {
      // Check session status before starting recording
      const token = localStorage.getItem("token");
      const sessionCheck = await axios.get(`http://localhost:5000/api/interview/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (sessionCheck.data.status !== 'active') {
        setMessage("Session is no longer active. Please start a new interview.");
        navigate("/setup");
        return;
      }
      
      // Request high-quality audio for better transcription
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,  // Mono audio
          sampleRate: 16000,  // 16kHz sample rate (Whisper optimal)
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Try to use a better codec if available
      let options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'audio/webm' };
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = handleRecordingStop;

      mediaRecorderRef.current.start();
      setRecording(true);
      setMessage("Recording started...");
    } catch (err) {
      console.error("Error accessing microphone:", err);
      if (err.response?.status === 404) {
        setMessage("Session not found. Please start a new interview.");
        navigate("/setup");
      } else {
        setMessage("Microphone access denied or session error.");
      }
    }
  };

  // ⏹️ Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setMessage("Processing your answer...");
    }
  };

  // 🧠 Handle when recording stops
  const handleRecordingStop = async () => {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", blob, "answer.webm");
    formData.append("responseTime", Date.now()); // Add timestamp

    const token = localStorage.getItem("token");
    setLoading(true);
    setProcessing(true);
    setMessage("Processing your answer... This may take up to 60 seconds for AI transcription and feedback.");
    
    // Pause timer while processing audio
    setTimerActive(false);

    try {
      // Add timeout to the request (35 seconds)
      const controller = new AbortController();
      setProcessingController(controller);
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const res = await axios.post(`http://localhost:5000/api/interview/session/${sessionId}/voice-answer`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        signal: controller.signal,
        timeout: 90000
      });

      clearTimeout(timeoutId);

      const data = res.data;
      if (data.transcript && data.transcript.trim()) {
        setAnswer(data.transcript);
        setIsTranscribed(true);
        setAudioFilePath(data.audioFilePath); // Store the audio file path
        setMessage(`🗣️ Transcribed: "${data.transcript}"\n\n✏️ Please review the transcription above and edit if needed, then click Submit Answer.`);
        // Resume timer after successful transcription
        if (timeLeft > 0) {
          setTimerActive(true);
        }
      } else {
        setMessage("Could not transcribe audio. Please try typing your answer instead.");
        // Resume timer even if transcription failed
        if (timeLeft > 0) {
          setTimerActive(true);
        }
      }
    } catch (err) {
      console.error("Error processing audio:", err);
      let errorMessage = "Error processing audio. Please try typing your answer instead.";
      
      if (err.name === 'AbortError' || err.code === 'ECONNABORTED') {
        errorMessage = "Audio processing timeout. Please try a shorter recording or type your answer.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error during transcription. Please try recording again or type your answer.";
      } else if (err.response?.data?.error) {
        errorMessage = `Transcription failed: ${err.response.data.error}`;
      } else if (err.code === 'NETWORK_ERROR') {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (!err.response) {
        errorMessage = "Connection lost during audio processing. Please try again.";
      }
      
      setMessage(errorMessage);
      
      // Resume timer after error
      if (timeLeft > 0) {
        setTimerActive(true);
      }
    } finally {
      setLoading(false);
      setProcessing(false);
      setProcessingController(null);
    }
  };

  // Cancel processing
  const cancelProcessing = () => {
    if (processingController) {
      processingController.abort();
      setProcessing(false);
      setLoading(false);
      setProcessingController(null);
      setIsTranscribed(false);
      setMessage("Processing cancelled. You can type your answer or try recording again.");
      // Resume timer after cancelling
      if (timeLeft > 0) {
        setTimerActive(true);
      }
    }
  };


  // ✍️ Submit answer (called by form submit or timer)
  const handleSubmitAnswer = async () => {
    if (loading || processing) {
      console.log("⚠️ Submission blocked: already loading or processing");
      return; // Prevent double submission and submission during processing
    }
    
    const finalAnswer = answer.trim() || "No answer provided";
    
    // Additional check to prevent empty submissions
    if (!finalAnswer || finalAnswer === "No answer provided") {
      if (!window.confirm("Submit empty answer? This will count as 'No answer provided'.")) {
        return;
      }
    }
    
    try {
      setLoading(true);
      setTimerActive(false); // Stop timer
      setMessage("Submitting answer...");
      
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Authentication error. Please log in again.");
        navigate("/login");
        return;
      }
      
      if (!sessionId) {
        setMessage("Session error. Please start a new interview.");
        navigate("/setup");
        return;
      }
      
      console.log("Submitting answer:", { sessionId, answerLength: finalAnswer.length, isTranscribed });
      
      const res = await axios.post(
        `http://localhost:5000/api/interview/session/${sessionId}/answer`,
        {
          answer: finalAnswer,
          isVoiceAnswer: isTranscribed,
          audioFilePath: audioFilePath
        },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 60000 // 60 second timeout for AI processing
        }
      );
      
      const data = res.data;
      console.log("Answer submission response:", data);
      console.log(`📊 Progress: ${data.progress}% complete`);
      
      // Update progress state
      if (data.progress !== undefined) {
        setProgress(data.progress);
      }
      
      if (data.completed) {
        console.log("✅ Interview marked as completed by backend");
        setMessage("Interview complete! Redirecting...");
        setTimeout(() => navigate("/summary", { state: { sessionId } }), 1000);
      } else {
        console.log("➡️ Loading next question:", data.nextQuestion?.text);
        setCurrentQuestion(data.nextQuestion.text);
        setCurrentQuestionData(data.nextQuestion);
        
        // Update question number based on progress or next question index
        if (data.nextQuestion?.index !== undefined) {
          setCurrentQuestionNumber(data.nextQuestion.index + 1);
        }
        
        // Start timer for next question
        const questionTimeLimit = data.nextQuestion.timeLimit || 120;
        setTimeLeft(questionTimeLimit);
        setTimerActive(true);
        setAnswer("");
        setIsTranscribed(false);
        setAudioFilePath(null); // Clear audio file path
        setProcessing(false); // Reset processing state
        setMessage("Answer saved! Next question loaded.");
      }
    } catch (err) {
      console.error("Answer submission error:", err);
      
      if (err.response) {
        // Server responded with error status
        const errorMsg = err.response.data?.error || `Server error: ${err.response.status}`;
        setMessage(`Error: ${errorMsg}`);
      } else if (err.request) {
        // Request was made but no response received
        setMessage("Network error. Please check your connection and try again.");
      } else {
        // Something else happened
        setMessage("Unexpected error. Please try again.");
      }
      
      // Re-enable timer if submission failed and not processing
      if (!processing && timeLeft > 0) {
        setTimerActive(true);
      }
      
      // If session is not active, redirect to setup
      if (err.response?.status === 400 && err.response?.data?.error?.includes("not active")) {
        setMessage("Session expired. Redirecting to start a new interview...");
        setTimeout(() => {
          localStorage.removeItem("sessionId");
          navigate("/setup");
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim()) {
      setMessage("Please provide an answer before submitting.");
      return;
    }
    if (loading) {
      setMessage("Please wait, already submitting...");
      return;
    }
    await handleSubmitAnswer();
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer color based on time left
  const getTimerColor = () => {
    if (timeLeft <= 30) return 'text-danger'; // Red for last 30 seconds
    if (timeLeft <= 60) return 'text-warning'; // Yellow for last minute
    return 'text-success'; // Green for plenty of time
  };

  return (
    <>
      <Header title="Interview Session" />
      <div className="home-container" style={{ minHeight: '100vh', paddingTop: '0' }}>
        <div className="gradient-bg"></div>
        <div className="container-fluid d-flex flex-column justify-content-center align-items-center position-relative" style={{ zIndex: 1, minHeight: 'calc(100vh - 80px)', padding: '2rem' }}>
          <div className="card-glass w-100 animate-fade-in" style={{ maxWidth: "700px", padding: '2rem' }}>
          <h2 className="card-title text-center text-primary fw-bold mb-3">
            Interview Session
          </h2>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small">Question {currentQuestionNumber} of {totalQuestions}</span>
              <span className="text-muted small">{progress}% Complete</span>
            </div>
            <div className="progress" style={{ height: '8px' }}>
              <div 
                className="progress-bar bg-primary progress-bar-striped progress-bar-animated" 
                role="progressbar" 
                style={{ width: `${progress}%` }}
                aria-valuenow={progress}
                aria-valuemin="0" 
                aria-valuemax="100"
              ></div>
            </div>
          </div>
          
          {loading && !currentQuestion ? (
            <div className="text-center text-secondary">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading session...</p>
            </div>
          ) : currentQuestion ? (
            <>
              <p className="card-text fs-5 mb-4">{currentQuestion}</p>
              
              {/* Timer Display */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                  <span className="badge bg-secondary me-2">
                    {currentQuestionData?.difficulty || 'Medium'}
                  </span>
                  <span className="badge bg-info">
                    {currentQuestionData?.category || 'General'}
                  </span>
                </div>
                <div className={`fs-4 fw-bold ${getTimerColor()}`}>
                  <i className={`bi ${processing ? 'bi-pause-circle' : 'bi-clock'} me-2`}></i>
                  {formatTime(timeLeft)}
                  {processing && (
                    <span className="ms-2 text-warning">
                      <small>(Paused)</small>
                    </span>
                  )}
                  {timeLeft <= 10 && !processing && (
                    <span className="ms-2">
                      <i className="bi bi-exclamation-triangle text-danger"></i>
                    </span>
                  )}
                </div>
              </div>

              {/* Time warning alerts */}
              {timeLeft <= 30 && timeLeft > 10 && (
                <div className="alert alert-warning py-2 mb-3">
                  <i className="bi bi-clock-history me-2"></i>
                  <strong>30 seconds remaining!</strong> Wrap up your answer.
                </div>
              )}
              {timeLeft <= 10 && timeLeft > 0 && (
                <div className="alert alert-danger py-2 mb-3">
                  <i className="bi bi-alarm me-2"></i>
                  <strong>Time almost up!</strong> Submit your answer now.
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  {isTranscribed && (
                    <div className="alert alert-info py-2 mb-2">
                      <small>
                        <i className="bi bi-mic-fill me-1"></i>
                        <strong>Voice transcribed!</strong> Review and edit the text below if needed.
                      </small>
                    </div>
                  )}
                  <textarea
                    value={answer}
                    onChange={(e) => {
                      setAnswer(e.target.value);
                      // Clear transcribed flag when user starts editing
                      if (isTranscribed && e.target.value !== answer) {
                        setIsTranscribed(false);
                      }
                    }}
                    placeholder="Type your answer here or use voice recording..."
                    className={`form-control ${isTranscribed ? 'border-info' : ''}`}
                    rows="5"
                  />
                  {isTranscribed && (
                    <small className="text-info">
                      <i className="bi bi-pencil me-1"></i>
                      You can edit the transcribed text above before submitting.
                    </small>
                  )}
                </div>
                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || processing}
                  >
                    {loading ? "Saving..." : "Submit Answer"}
                  </button>
                  
                  {processing ? (
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-warning flex-grow-1"
                        disabled
                      >
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Processing Audio...
                      </button>
                      <button
                        type="button"
                        onClick={cancelProcessing}
                        className="btn btn-outline-danger"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : isTranscribed ? (
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        onClick={startRecording}
                        className="btn btn-outline-success flex-grow-1"
                        disabled={loading}
                      >
                        🎤 Re-record Answer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAnswer("");
                          setIsTranscribed(false);
                          setMessage("");
                        }}
                        className="btn btn-outline-secondary"
                      >
                        Clear & Type
                      </button>
                    </div>
                  ) : !recording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="btn btn-success"
                      disabled={loading}
                    >
                      🎤 Start Recording
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="btn btn-danger"
                    >
                      ⏹️ Stop Recording
                    </button>
                  )}
                </div>
              </form>
            </>
          ) : (
            <p className="text-center text-secondary">No question found.</p>
          )}

          {message && (
            <div className={`mt-4 text-center ${
              message.includes('Error') || message.includes('Failed') || message.includes('timeout') 
                ? 'text-danger' 
                : message.includes('Processing') || message.includes('Saving') 
                ? 'text-warning' 
                : message.includes('complete') || message.includes('saved') || message.includes('Transcribed')
                ? 'text-success'
                : 'text-info'
            }`} style={{ fontSize: '0.875rem' }}>
              {message.split('\n').map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  );
};

export default InterviewSession;