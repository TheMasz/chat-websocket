import "./styles/global.css";
import { Route, Routes } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import ProtectedRoute from "./hooks/ProtectedRoute";

const App = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Homepage />
          </ProtectedRoute>
        }
      />

      <Route path="/signin" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  );
};

export default App;
