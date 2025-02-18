// TutorialUI.jsx
import React from "react";
import "./Tutorial.css";
import { Link } from "react-router-dom";

const TutorialUI = () => {
  return (
    <div className="tutorial-container">
      <h1 className="tutorial-title">How to Play Spyfall</h1>
      <p className="tutorial-description">
        Each player receives a role. One is the spy and doesn't know the location.
      </p>
      <p className="tutorial-description">
        Players ask each other questions to find the spy.
      </p>
      <Link to="/" className="tutorial-link">
        Back to Home
      </Link>
    </div>
  );
};

export default TutorialUI;