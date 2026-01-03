import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "./Header";

const SummaryPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sessionId = state?.sessionId;

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }

    const fetchSessionSummary = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:5000/api/interview/session/${sessionId}/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSessionData(res.data);
      } catch (err) {
        console.error("Error fetching session summary:", err);
        setError("Failed to load session summary");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionSummary();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading summary...</p>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 text-center">
        <div className="alert alert-warning" role="alert">
          {error || "No summary data available."}
        </div>
      </div>
    );
  }

  return (
    <>
      <Header title="Interview Summary" />
      <div className="home-container" style={{ minHeight: '100vh', paddingTop: '0' }}>
        <div className="gradient-bg"></div>
        <div className="container-fluid d-flex flex-column align-items-center position-relative py-5" style={{ zIndex: 1, minHeight: 'calc(100vh - 80px)' }}>
          <div className="card-glass rounded-3 p-4 p-md-5 w-100 animate-fade-in" style={{ maxWidth: "900px" }}>
          <h2 className="card-title text-center text-primary fw-bold mb-4">
            Interview Summary - {sessionData.role}
          </h2>

          {/* Performance Overview */}
          <div className="row mb-4">
            <div className="col-md-3 text-center">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <h4>{sessionData.performance?.overallScore || 'N/A'}</h4>
                  <small>Overall Score</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 text-center">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <h4>{sessionData.performance?.completionRate || 0}%</h4>
                  <small>Completion Rate</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 text-center">
              <div className="card bg-info text-white">
                <div className="card-body">
                  <h4>{sessionData.questionsAnswered || sessionData.answers?.length || 0}</h4>
                  <small>Questions Answered</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 text-center">
              <div className="card bg-warning text-white">
                <div className="card-body">
                  <h4>{Math.round(sessionData.duration / 60) || 'N/A'}m</h4>
                  <small>Duration</small>
                </div>
              </div>
            </div>
          </div>

          {/* Category Scores */}
          {sessionData.performance?.categoryScores && (
            <div className="mb-4">
              <h5 className="text-primary mb-3">Performance Breakdown</h5>
              <div className="row">
                {Object.entries(sessionData.performance.categoryScores).map(([category, score]) => (
                  <div key={category} className="col-md-3 mb-2">
                    <div className="text-center">
                      <div className="progress mb-1" style={{height: '8px'}}>
                        <div 
                          className="progress-bar bg-primary" 
                          style={{width: `${(score/10)*100}%`}}
                        ></div>
                      </div>
                      <small className="text-capitalize">{category}: {score}/10</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions and Answers */}
          <h5 className="text-primary mb-3">Interview Details</h5>
          <div className="list-group list-group-flush mb-4">
            {sessionData.answers?.map((answer, i) => (
              <div key={i} className="list-group-item">
                <p className="fw-semibold text-dark mb-2">
                  <span className="text-secondary me-2">Q{i + 1}:</span> 
                  {answer.question}
                </p>
                <p className="text-muted mb-2">
                  <small><strong>Your Answer:</strong></small><br/>
                  {answer.answer}
                </p>
                {answer.isVoiceAnswer && (
                  <small className="badge bg-info">Voice Answer</small>
                )}
                {answer.responseTime && (
                  <small className="text-muted ms-2">
                    Response time: {Math.round(answer.responseTime)}s
                  </small>
                )}
              </div>
            ))}
          </div>

          {/* Detailed Feedback */}
          {sessionData.summary && (
            <div className="mb-4">
              <h5 className="text-primary mb-3">AI Feedback Summary</h5>
              <div className="alert alert-info">
                <p><strong>Overall Grade:</strong> 
                  {sessionData.summary.overallScore >= 8 ? 'Excellent' : 
                   sessionData.summary.overallScore >= 6 ? 'Good' : 
                   sessionData.summary.overallScore >= 4 ? 'Fair' : 'Needs Improvement'}
                </p>
                <p><strong>Average Score:</strong> {sessionData.summary.overallScore || 0}/10</p>
                
                {sessionData.summary.strengths?.length > 0 && (
                  <div className="mb-2">
                    <strong>Key Strengths:</strong>
                    <ul className="mb-0">
                      {sessionData.summary.strengths.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {sessionData.summary.weaknesses?.length > 0 && (
                  <div className="mb-2">
                    <strong>Areas for Improvement:</strong>
                    <ul className="mb-0">
                      {sessionData.summary.weaknesses.map((area, i) => (
                        <li key={i}>{area}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {sessionData.summary.recommendations?.length > 0 && (
                  <div>
                    <strong>Recommendations:</strong>
                    <ul className="mb-0">
                      {sessionData.summary.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="d-grid gap-2 d-md-flex justify-content-md-end">
            <button
              onClick={() => navigate("/setup")}
              className="btn btn-success me-md-2"
            >
              Start New Interview
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SummaryPage;