import axios from "axios";

// Set config defaults when creating the instance
const api = axios.create({
  baseURL: "https://ev-battery-swap-station-m-ngement-system.onrender.com/"
});

export default api;