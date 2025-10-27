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
import Homepage from "./components/homepage/layout.jsx";
import StaffDashboard from "./components/dashboard/staff.jsx";
import ManageStockBattery from "./pages/manage-stockbattery/index.jsx";
import ManageBatterySwapTransaction from "./pages/manage-batteryswaptransaction/index.jsx";
import AuthGate from "./components/protected-route/index.jsx";
import FindStation from "./pages/find-station/index.jsx";
import TransHistory from "./pages/transaction-history/index.jsx";
import Support from "./pages/support-ticket/index.jsx";
import Plans from "./pages/sub-plan/index.jsx";
import MyInfo from "./pages/my-info/index.jsx";
import ManageSupportTicket from "./pages/manage-support-ticket/index.jsx";
import ManageBooking from "./pages/manage-booking/index.jsx";
import AppLayout from "./components/homepage/layout.jsx";
import Home from "./pages/homepage/index.jsx";
import { useSelector } from "react-redux";
import { selectToken } from "./redux/accountSlice.js";
function RootRedirect() {
  const token = useSelector(selectToken);
  return token ? (
    <Navigate to="/stations" replace />
  ) : (
    <Navigate to="/home" replace />
  );
}
function App() {
  const router = createBrowserRouter([
    // ✅ Dashboard (ADMIN) được bảo vệ bởi AuthGate
    {
      path: "/dashboard",
      element: (
        <AuthGate allow={["ADMIN"]}>
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
        { path: "manageticket", element: <ManageSupportTicket /> },
      ],
    },

    // ✅ Staff Dashboard cũng bảo vệ bằng AuthGate
    {
      path: "/staff",
      element: (
        <AuthGate allow={["ADMIN", "STAFF"]}>
          <StaffDashboard />
        </AuthGate>
      ),
      children: [
        {
          index: true,
          element: <Navigate to="stock" replace />,
        },
        { path: "stock", element: <ManageStockBattery /> },
        { path: "booking", element: <ManageBooking /> },
        { path: "swap", element: <ManageBatterySwapTransaction /> },
      ],
    },

    {
      path: "/",
      element: <AppLayout />,
      children: [
        {
          index: true,
          element: <RootRedirect />, // Chuyển hướng dựa trên token
        },
        {
          path: "/home",
          element: <Home />,
        },
        {
          path: "/login",
          element: <LoginPage />,
        },
        {
          path: "/register",
          element: <RegisterPage />,
        },
        {
          path: "/stations",
          element: <FindStation />,
        },
        {
          path: "/history",
          element: <TransHistory />,
        },
        {
          path: "/support",
          element: <Support />,
        },
        {
          path: "/plans",
          element: <Plans />,
        },
        {
          path: "/account",
          element: <MyInfo />,
        },
      ],
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
