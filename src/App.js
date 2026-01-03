//import logo from './logo.svg';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import InterviewSetup from './components/InterviewSetup';
import InterviewSession from './components/InterviewSession';
import SummaryPage from './components/SummaryPage';


function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup/>} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/setup" element={<InterviewSetup />} />
      <Route path="/interview/session" element={<InterviewSession/> } />
      <Route path="/summary" element={<SummaryPage/> } />
    </Routes>
    </BrowserRouter>
      
  );
}

export default App;
