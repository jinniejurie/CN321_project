// HomeUI.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const HomeUI = () => {
  return (
      <body className="home-body">
      <div className="home-container">
          <img className="home-img" src="https://i.ibb.co/k2JWmmtf/homeicon.png"/>
          <div className="home-buttons">
              <Link to="/lobby">
                  <button className="start">Start !</button>
              </Link>
              <Link to="/tutorial">
                  <button className="tut">Tutorial</button>
              </Link>
          </div>
      </div>
      </body>
  );
};

export default HomeUI;
