import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import VideoPlayerPage from './components/VideoPlayerPage'; // New page version

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', overflowY: 'auto' }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/videos/:videoId" element={<VideoPlayerPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
