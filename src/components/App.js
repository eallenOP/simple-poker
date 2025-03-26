// src/components/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Auth from './Auth';
import CreateGame from './CreateGame';
import GameList from './GameList';
import GameRoom from './GameRoom';
import './App.css';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Auth>
          <div className="app-container">
            <header className="app-header">
              <h1>Simple Poker</h1>
            </header>
            
            <main className="app-content">
              <Routes>
                <Route path="/games" element={<GameList />} />
                <Route path="/create-game" element={<CreateGame />} />
                <Route path="/game/:gameId" element={<GameRoom />} />
                <Route path="*" element={<Navigate to="/games" replace />} />
              </Routes>
            </main>
            
            <footer className="app-footer">
              <p>Simple Poker Game © {new Date().getFullYear()}</p>
            </footer>
          </div>
        </Auth>
      </Router>
    </AuthProvider>
  );
};

export default App;



