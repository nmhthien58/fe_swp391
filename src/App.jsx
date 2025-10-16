import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import LoginPage from "./pages/login/index.jsx";
import RegisterPage from "./pages/register/index.jsx";
import Dashboard from "./components/dashboard/admin.jsx";
import ManageStation from "./pages/manage-station/index.jsx";
import ManageUser from "./pages/manage-user/index.jsx";
import ManageBatteryRentPackage from "./pages/manage-batteryrentpackage/index.jsx";
import Overview from "./pages/overview-page/index.jsx";
import ManageComplaints from "./pages/complaints/index.jsx";
import Homepage from "./pages/homepage/index.jsx";
import StaffDashboard from "./components/dashboard/staff.jsx";
import ManageStockBattery from "./pages/manage-stockbattery/index.jsx";
import ManageBatterySwapTransaction from "./pages/manage-batteryswaptransaction/index.jsx";
import AuthGate from "./components/protected-route/index.jsx";

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

    // ✅ Dashboard (ADMIN) được bảo vệ bởi AuthGate
    {
      path: "/dashboard",
      element: (
        <AuthGate>
          <Dashboard />
        </AuthGate>
      ),
      children: [
        {
          index: true,
          element: <Navigate to="station" replace />,
        },
        { path: "station", element: <ManageStation /> },
        { path: "user", element: <ManageUser /> },
        { path: "rentpackage", element: <ManageBatteryRentPackage /> },
        { path: "overview", element: <Overview /> },
        { path: "complaints", element: <ManageComplaints /> },
      ],
    },

    // ✅ Staff Dashboard cũng bảo vệ bằng AuthGate
    {
      path: "/staff",
      element: (
        <AuthGate>
          <StaffDashboard />
        </AuthGate>
      ),
      children: [
        {
          index: true,
          element: <Navigate to="stock" replace />,
        },
        { path: "stock", element: <ManageStockBattery /> },
        { path: "swap", element: <ManageBatterySwapTransaction /> },
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
