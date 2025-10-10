import { Button } from "antd";
import React from "react";

const Homepage = () => {
  return (
    <div>
      <Button href={"/dashboard"}>Admin dashboard</Button>
      <Button href={"/login"}>Login</Button>
      <Button href={"/register"}>Register</Button>
    </div>
  );
};

export default Homepage;
