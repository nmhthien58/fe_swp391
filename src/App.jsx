import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import LoginPage from "./pages/login/index.jsx";
import RegisterPage from "./pages/register/index.jsx";

function App() {
  const router = createBrowserRouter([
    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "/register",
      element: <RegisterPage />,
    },
  ]);

  return (
    <>
      <ToastContainer />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
