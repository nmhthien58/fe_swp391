import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import LoginPage from "./pages/login/index.jsx";
import RegisterPage from "./pages/register/index.jsx";
import Dashboard from "./components/dashboard/index.jsx";
import ManageStation from "./pages/manage-station/index.jsx";
import ManageUser from "./pages/manage-user/index.jsx";
import ManageBatteryRentPackage from "./pages/manage-batteryrentpackage/index.jsx";
import Overview from "./pages/overview-page/index.jsx";
import ManageComplaints from "./pages/complaints/index.jsx";
import Homepage from "./pages/homepage/index.jsx";

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
    {
      path: "/dashboard",
      element: <Dashboard />,
      children: [
        {
          index: true, // This makes it the default
          element: <Navigate to="station" replace />,
        },
        {
          path: "station",
          element: <ManageStation />,
        },
        {
          path: "user",
          element: <ManageUser />,
        },
        {
          path: "rentpackage",
          element: <ManageBatteryRentPackage />,
        },
        {
          path: "overview",
          element: <Overview />,
        },
        {
          path: "complaints",
          element: <ManageComplaints />,
        },
      ],
    },
    {
      path: "/",
      element: <Homepage />,
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
