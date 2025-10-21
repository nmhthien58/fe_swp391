// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";

// 1) Redux store
import { Provider } from "react-redux";
import { store, persistor } from "./redux/store.js";

// 2) inject store vào axios TRƯỚC KHI import App (để mọi module dưới App đều thấy store)
import { injectStore } from "./config/axios.js";
injectStore(store);

// 3) PersistGate
import { PersistGate } from "redux-persist/integration/react";

// 4) App và css
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
);
