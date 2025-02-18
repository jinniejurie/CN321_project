import React from "react";
import { Link } from "react-router-dom";

function Tutorial() {
  return (
    <div>
      <h1>How to Play Spyfall</h1>
      <p>Each player receives a role. One is the spy and doesn't know the location.</p>
      <p>Players ask each other questions to find the spy.</p>
      <Link to="/">Back to Home</Link>
    </div>
  );
}

export default Tutorial;
