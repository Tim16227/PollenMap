import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Dashboard from './components/view/Dashboard';
import './App.css';

// Hauptanwendungskomponente, die das Routing und die Struktur der Anwendung verwaltet.
const App = () => {
    return (
        <Router>
            <div className="App">
                {/* Direktes Routing zum Dashboard, ohne Authentifizierung zu überprüfen */}
                <Route path="/" exact component={Dashboard} />
            </div>
        </Router>
    );
};

export default App;