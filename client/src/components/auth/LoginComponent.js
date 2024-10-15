import { React, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLogin } from "../../hooks/useLogin";
import { GoogleLogin } from "@react-oauth/google"; // Import Google OAuth component
import { jwtDecode } from "jwt-decode"; // For decoding the JWT token

function LoginComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, error, isLoading } = useLogin();
  const [csrfToken, setCsrfToken] = useState("");

  // Handle email/password login
  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  useEffect(() => {
    // Fetch CSRF token when component mounts
    fetch("/api/csrf-token", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setCsrfToken(data.csrfToken);
        localStorage.setItem("csrfToken", data.csrfToken);
      })
      .catch((err) => console.error("Error fetching CSRF token:", err));
  }, []);

  // Handle Google OAuth success
  const handleGoogleSuccess = (credentialResponse) => {
    const token = credentialResponse.credential;
    const userInfo = jwtDecode(token); // Decode JWT to get user info
    const { email, name } = userInfo;

    // Send token to backend for verification or account creation
    fetch("http://localhost:5050/api/users/auth/google/callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        // Store the returned token/user data (you might store token in localStorage)
        localStorage.setItem("user", JSON.stringify(data));
        // Navigate user to account page
        window.location.href = "/account";
      })
      .catch((err) => console.error("Google login error:", err));
  };

  // Handle Google OAuth failure
  const handleGoogleError = (error) => {
    console.log("Google Sign-In Error:", error);
  };

  return (
    <div className="ltn__login-area pb-65">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="section-title-area text-center">
              <h1 className="section-title">
                Sign In <br />
                To Your Account
              </h1>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-6">
            <div className="account-login-inner">
              <form
                onSubmit={handleSubmit}
                className="ltn__form-box contact-form-box "
                style={{ width: "500px" }}
              >
                {error && <p style={{ color: "red" }}>*{error}</p>}
                <input
                  type="text"
                  name="email"
                  placeholder="Email*"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password*"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="btn-wrapper mt-0">
                  <button
                    disabled={isLoading}
                    className="theme-btn-1 btn btn-block"
                    type="submit"
                  >
                    SIGN IN
                  </button>{" "}
                  <div
                    className="w-full"
                    style={{
                      width: "full",
                      display: "flex",
                      justifyContent: "center",
                      marginTop: "10px",
                    }}
                  >
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      width={5000}
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="account-create text-center pt-50">
              <h4>DON'T HAVE AN ACCOUNT?</h4>
              <div className="btn-wrapper">
                <Link reloadDocument to="/signup">
                  <a className="theme-btn-1 btn black-btn">CREATE ACCOUNT</a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginComponent;
