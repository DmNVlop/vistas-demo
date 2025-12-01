import React from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      {/* Aquí irían otros providers globales en el futuro (AuthContext, ThemeContext, Redux) */}
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
