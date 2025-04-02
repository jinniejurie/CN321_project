// HomeUI.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";

const HomeUI = () => {
  return (
    <div className="home-body">
      <div className="home-container">
        <img className="home-img" src="https://i.ibb.co/k2JWmmtf/homeicon.png" alt='Spyfall Game Logo'/>
        <div className="home-buttons">
          <Link to="/lobby">
            <button className="start">Start Game</button>
          </Link>
          <Link to="/tutorial">
            <button className="tut">Tutorial</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomeUI;