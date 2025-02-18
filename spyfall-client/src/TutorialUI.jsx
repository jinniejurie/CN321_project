// TutorialUI.jsx
import React from "react";
import "./Tutorial.css";
import { Link } from "react-router-dom";
 
const TutorialUI = () => {
  return (
    <div className="tutorial-container">
      <h1 className="tutorial-title">How to Play</h1>
      <div className="tutorial-description">
        <p>
          • When the game begins, a location and roles will be randomly assigned. All players will share the same location, except for the spy, who will be unaware of the location.        </p>
        <p>
          • Each player will take turns asking questions via the chat system in order to identify the spy.
        </p>
        <p>
          • When the 5-minute timer expires, all players must vote for the person they believe to be the spy.
        </p>
        <p>
          • The outcome of the game is determined as follows:
        </p>
        <p>
          If the civilians identify the spy: the civilians win, and the spy loses.
        </p>
        <p>
          If the civilians fail to identify the spy: the civilians lose, and the spy wins.
        </p>
      </div>
 
      <Link to="/" className="tutorial-link">
      <p>back to home</p>
      </Link>
    </div>
  );
};
 
export default TutorialUI;