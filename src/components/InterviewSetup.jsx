import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";


const InterviewSetup = () => {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useResume, setUseResume] = useState(false);
  const [, setResumeFile] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [activeResume, setActiveResume] = useState(null);
  const navigate = useNavigate();

  // Check for existing resume on component mount
useEffect(() => {
  const checkActiveResume = async () => {
    try {
      const res = await api.get("/api/resume/active");

      if (res.data.hasResume) {
        setActiveResume(res.data.resume);
        setResumeUploaded(true);
      }
    } catch (error) {
      console.log("No active resume found");
    }
  };

  checkActiveResume();
}, []);


const handleResumeUpload = async (file) => {
  if (!file) return;

  try {
    setResumeUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("resume", file);

    const res = await api.post("/api/resume/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    setActiveResume(res.data.resume);
    setResumeUploaded(true);
    setResumeFile(null);
  } catch (error) {
    console.error("Resume upload error:", error);
    setError(error.response?.data?.error || "Failed to upload resume");
  } finally {
    setResumeUploading(false);
  }
};


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError("Please upload a PDF or Word document");
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      
      setResumeFile(file);
      setError("");
      handleResumeUpload(file);
    }
  };

const handleStartInterview = async () => {
  if (!role.trim()) {
    setError("Please enter a role to continue.");
    return;
  }

  try {
    setLoading(true);
    setError("");

    const res = await api.post("/api/interview/start", {
      role,
      useResume: useResume && resumeUploaded
    });

    if (res.data.sessionId) {
      localStorage.setItem("selectedRole", role);
      localStorage.setItem("sessionId", res.data.sessionId);
      navigate("/interview/session");
    }
  } catch (err) {
    console.error(err);
    setError(
      err.response?.data?.error ||
      "Failed to start interview. Please try again."
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="container-fluid d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light p-4">
      <div className="card shadow-lg p-4 p-md-5 w-100" style={{ maxWidth: "500px" }}>
        <div className="card-body">
          <h1 className="card-title text-center text-primary fw-bold mb-4">
            Start Your Mock Interview
          </h1>

          <div className="mb-3">
            <label htmlFor="interviewRole" className="form-label fw-medium">
              Select Role / Position
            </label>
            <input
              type="text"
              id="interviewRole"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Software Engineer"
              className="form-control"
            />
          </div>

          {/* Resume Upload Section */}
          <div className="mb-4">
            <div className="card border-0 bg-light">
              <div className="card-body p-3">
                <h6 className="card-title mb-3">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  Resume (Optional)
                </h6>
                <p className="text-muted small mb-3">
                  Upload your resume to get personalized interview questions based on your experience.
                </p>

                {!resumeUploaded ? (
                  <div>
                    <div className="mb-3">
                      <input
                        type="file"
                        id="resumeFile"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="form-control"
                        disabled={resumeUploading}
                      />
                      <div className="form-text">
                        Supported formats: PDF, DOC, DOCX (Max 5MB)
                      </div>
                    </div>
                    
                    {resumeUploading && (
                      <div className="text-center">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                        <span className="text-primary">Uploading and processing resume...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="alert alert-success d-flex align-items-center">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    <div className="flex-grow-1">
                      <strong>Resume uploaded:</strong> {activeResume?.originalName}
                      <br />
                      <small className="text-muted">
                        Skills found: {activeResume?.skills?.slice(0, 3).join(", ")}
                        {activeResume?.skills?.length > 3 && ` +${activeResume.skills.length - 3} more`}
                      </small>
                    </div>
                  </div>
                )}

                <div className="form-check mt-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="useResumeCheck"
                    checked={useResume}
                    onChange={(e) => setUseResume(e.target.checked)}
                    disabled={!resumeUploaded}
                  />
                  <label className="form-check-label" htmlFor="useResumeCheck">
                    Use my resume to generate personalized questions
                  </label>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleStartInterview}
            disabled={loading}
            className="btn btn-primary w-100 mt-2"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Starting...
              </>
            ) : (
              "Start Interview"
            )}
          </button>

          {error && <p className="text-danger mt-3 text-center small">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default InterviewSetup;