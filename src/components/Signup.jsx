import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom"; // 👈 Import Link and useNavigate for redirection

function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(""); // Clear previous messages

    try {
      const res = await axios.post("http://localhost:5000/api/auth/signup", form);

      // Success Message and Auto-Redirect
      setMessage(
        <span className="fw-bold">
          Account created successfully! Redirecting to login...
        </span>
      );
      
      // Auto-redirect to the login page after a short delay
      setTimeout(() => {
        navigate("/login"); 
      }, 1500);

    } catch (err) {
      // Use Bootstrap class for error messages
      setMessage(
        <span className="text-danger fw-bold">
          {err.response?.data?.error || "Signup failed. Please try again."}
        </span>
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // Full screen container for background and centering the card
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-7 col-sm-9">
            {/* Signup Card: Clean design with shadow */}
            <div className="card shadow-lg p-4 p-md-5 border-0 rounded-4">
              <div className="card-body">
                
                {/* Title and Tagline */}
                <h2 className="card-title text-center mb-2 fw-bold">
                  InterviewIQ
                </h2>
                <p className="text-center text-muted mb-4">
                    Create your account to unlock AI-powered interview practice.
                </p>

                {/* Status Message */}
                {message && (
                  <div 
                    className={`alert text-center ${
                      message.props?.className?.includes('text-danger') ? 'alert-danger' : 'alert-success'
                    }`} 
                    role="alert"
                  >
                    {message}
                  </div>
                )}
                
                {/* Signup Form */}
                <form onSubmit={handleSubmit}>
                  
                  {/* Name Input */}
                  <div className="form-floating mb-3">
                    <input
                      name="name"
                      type="text"
                      placeholder="Full Name"
                      className="form-control"
                      id="nameInput"
                      onChange={handleChange}
                      required
                    />
                    <label htmlFor="nameInput">Full Name</label>
                  </div>

                  {/* Email Input */}
                  <div className="form-floating mb-3">
                    <input
                      name="email"
                      type="email"
                      placeholder="Email"
                      className="form-control"
                      id="emailInput"
                      onChange={handleChange}
                      required
                    />
                    <label htmlFor="emailInput">Email address</label>
                  </div>

                  {/* Password Input */}
                  <div className="form-floating mb-4">
                    <input
                      name="password"
                      type="password"
                      placeholder="Password"
                      className="form-control"
                      id="passwordInput"
                      onChange={handleChange}
                      required
                    />
                    <label htmlFor="passwordInput">Choose a Strong Password</label>
                  </div>

                  {/* Submit Button: Full width and primary color */}
                  <button 
                    className="btn btn-primary btn-lg w-100 fw-bold" 
                    type="submit" 
                    disabled={loading} // Disable during loading
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating Account...
                      </>
                    ) : (
                      "Sign Up"
                    )}
                  </button>
                </form>

                {/* Login Link */}
                <div className="text-center mt-4">
                    <p className="text-muted mb-0">
                        Already have an account? <Link to="/login" className="text-primary fw-bold text-decoration-none">Login here</Link>
                    </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;