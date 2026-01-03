import React, { useState } from "react";
import api from "../services/api";

//import axios from "axios";
import { useNavigate, Link } from "react-router-dom"; // 👈 Import Link

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false); // 👈 Add loading state
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
      const res = await api.post("/api/auth/login", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user._id);

      // Give a brief moment for the user to see the success message
      setMessage("Login successful! Redirecting...");
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);

    } catch (err) {
      // Use Bootstrap class for error messages
      setMessage(
        <span className="text-danger fw-bold">
          {err.response?.data?.error || "Login failed. Please check your credentials."}
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
            {/* Login Card: Clean design with shadow */}
            <div className="card shadow-lg p-4 p-md-5 border-0 rounded-4">
              <div className="card-body">
                
                {/* Logo/Title */}
                <h2 className="card-title text-center mb-4 fw-bold">
                  InterviewIQ
                </h2>
                <p className="text-center text-muted mb-4">
                    Sign in to continue your interview practice.
                </p>

                {/* Status Message */}
                {message && (
                  <div className={`alert text-center ${message.props?.className?.includes('text-danger') ? 'alert-danger' : 'alert-success'}`} role="alert">
                    {message}
                  </div>
                )}
                
                {/* Login Form */}
                <form onSubmit={handleSubmit}>
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
                      aria-describedby="emailHelp"
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
                    <label htmlFor="passwordInput">Password</label>
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
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </button>
                </form>

                {/* Signup Link */}
                <div className="text-center mt-4">
                    <p className="text-muted mb-0">
                        Don't have an account? <Link to="/signup" className="text-primary fw-bold text-decoration-none">Create an account</Link>
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

export default Login;