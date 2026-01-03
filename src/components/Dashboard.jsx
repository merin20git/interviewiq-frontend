import React, { useEffect, useState } from "react";
import api from "../services/api";

//import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Header from "./Header";

function Dashboard() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  const navigate = useNavigate();

  // Calculate stats from dashboard data
  const totalInterviews = dashboardData?.stats?.totalSessions ?? 0;
  const averageScore = dashboardData?.stats?.averageScore ?? "N/A";
  // Show weakest area when available from backend
  const weakestArea = dashboardData?.stats?.weakestArea || "N/A";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/api/dashboard", {
  headers: { Authorization: `Bearer ${token}` },
});

        setInterviews(res.data.interviews || []);
        setDashboardData(res.data);
      } catch (err) {
        setError("Failed to load interview history.");
        console.error("Failed to fetch interviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStartInterview = () => {
    navigate("/setup");
  };
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="text-center p-4">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
          <p className="mt-3">Please try again later or <Link to="/login" className="alert-link">log in</Link> again.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header title="Dashboard" />
      <div className="container py-5">
        {/* Header and Start New Interview Button */}
        <div className="d-flex justify-content-between align-items-center mb-5 flex-column flex-md-row">
          <h1 className="display-5 fw-bold text-dark mb-3 mb-md-0">Dashboard</h1>
          <button className="btn btn-primary btn-lg" onClick={handleStartInterview}>
            <i className="bi bi-play-circle me-2"></i> Start New Interview
          </button>
        </div>

        <hr className="my-5" />

        {/* Key Metrics Section */}
        <section className="mb-5">
          <h2 className="h4 fw-bold text-primary mb-4">Your Progress at a Glance</h2>
          <div className="row g-4">
            {/* Card for Total Interviews */}
            <div className="col-lg-4 col-md-6">
              <div className="card h-100 border-0 shadow-sm rounded-4 text-center">
                <div className="card-body d-flex flex-column justify-content-center">
                  <p className="text-uppercase fw-semibold text-muted mb-2">Interviews Completed</p>
                  <h3 className="display-4 fw-bold text-primary">{totalInterviews}</h3>
                  {totalInterviews === 0 && (
                    <small className="text-muted">Start your first interview to see progress</small>
                  )}
                </div>
              </div>
            </div>
            {/* Card for Average Score */}
            <div className="col-lg-4 col-md-6">
              <div className="card h-100 border-0 shadow-sm rounded-4 text-center">
                <div className="card-body d-flex flex-column justify-content-center">
                  <p className="text-uppercase fw-semibold text-muted mb-2">Average Score</p>
                  <h3 className="display-4 fw-bold text-success">
                    {averageScore === "N/A" || averageScore === 0 ? "--" : averageScore}
                  </h3>
                  {(averageScore === "N/A" || averageScore === 0) && (
                    <small className="text-muted">Complete interviews to see your score</small>
                  )}
                </div>
              </div>
            </div>
            {/* Card for Weakest Area */}
            <div className="col-lg-4 col-md-12">
              <div className="card h-100 border-0 shadow-sm rounded-4 text-center">
                <div className="card-body d-flex flex-column justify-content-center">
                  <p className="text-uppercase fw-semibold text-muted mb-2">Areas to Improve</p>
                  <h3 className="display-6 fw-bold text-warning">
                    {weakestArea === "N/A" ? "TBD" : weakestArea}
                  </h3>
                  {weakestArea === "N/A" && (
                    <small className="text-muted">We'll identify areas after your interviews</small>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="my-5" />

        {/* Interview History Section */}
        <section>
          <h2 className="h4 fw-bold text-primary mb-4">Interview History</h2>
          {interviews.length === 0 ? (
            <div className="text-center p-5 border rounded-4 shadow-sm bg-light">
              <h5 className="fw-bold mb-3">No interviews found.</h5>
              <p className="text-muted">
                Start your first practice session now to receive personalized feedback.
              </p>
              <button className="btn btn-primary mt-3" onClick={handleStartInterview}>
                Start Practice
              </button>
            </div>
          ) : (
            <div className="row g-4">
              {interviews.map((interview) => (
                <div key={interview.id} className="col-lg-6">
                  <div className="card h-100 shadow-sm border rounded-4">
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="card-title fw-semibold text-primary mb-0">
                          {interview.role}
                        </h5>
                        <span className={`badge ${interview.status === 'completed' ? 'bg-success' : interview.status === 'active' ? 'bg-warning' : 'bg-secondary'}`}>
                          {interview.status}
                        </span>
                      </div>
                      
                      <div className="row text-center mb-3">
                        <div className="col-4">
                          <small className="text-muted d-block">Score</small>
                          <strong className="text-success">{interview.overallScore || 'N/A'}</strong>
                        </div>
                        <div className="col-4">
                          <small className="text-muted d-block">Progress</small>
                          <strong>{interview.questionsAnswered}/{interview.totalQuestions}</strong>
                        </div>
                        <div className="col-4">
                          <small className="text-muted d-block">Completion</small>
                          <strong>{interview.completionRate || 0}%</strong>
                        </div>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {interview.completedAt 
                            ? `Completed: ${new Date(interview.completedAt).toLocaleDateString()}`
                            : `Started: ${new Date(interview.startedAt).toLocaleDateString()}`
                          }
                        </small>
                        {interview.status === 'completed' && (
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(`/summary`, { state: { sessionId: interview.id } })}
                          >
                            View Results
                          </button>
                        )}
                      </div>
                      {interview.hasResume && (
                        <small className="badge bg-info">With Resume</small>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default Dashboard;