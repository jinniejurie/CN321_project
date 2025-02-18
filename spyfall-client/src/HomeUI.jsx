// HomeUI.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const HomeUI = () => {
  return (
    <div className="home-container">
      <h1 className="home-title">Spyfall Game</h1>
      <div className="home-buttons">
        <Link to="/lobby">
          <button>Start Game</button>
        </Link>
        <Link to="/tutorial">
          <button>How to Play</button>
        </Link>
      </div>
    </div>
  );
};

export default HomeUI;