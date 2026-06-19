import { Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Home from './pages/Home';
import Play from './pages/Play';
import WorldCup from './pages/WorldCup';
import Profile from './pages/Profile';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={<Play />} />
        <Route path="/worldcup" element={<WorldCup />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <Nav />
    </>
  );
}
