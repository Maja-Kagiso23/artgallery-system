import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import dashboardpage from './pages/DashboardPage';
function App() {
  return (
    <BrowserRouter>
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
	        <Route path="/dashboard" element={<dashboardpage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;