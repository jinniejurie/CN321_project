import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <h1>Spyfall Game</h1>
      <Link to="/lobby"><button>Start Game</button></Link>
      <Link to="/tutorial"><button>How to Play</button></Link>
    </div>
  );
}

export default Home;
