import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // React state: a variable that, when changed, tells React to re-render the UI.
  // useState(null) means "start with no value yet."
  const [healthStatus, setHealthStatus] = useState(null);

  // useEffect runs code after the component renders.
  // The empty array [] at the end means "run this only once, when the page first loads."
  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then((response) => response.json())
      .then((data) => setHealthStatus(data))
      .catch((error) => {
        console.error('Failed to reach backend:', error);
        setHealthStatus({ status: 'error', message: 'Could not reach backend' });
      });
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Smart Route Travel Assistant</h1>
      <h2>Backend Connection Test</h2>
      {healthStatus ? (
        <pre>{JSON.stringify(healthStatus, null, 2)}</pre>
      ) : (
        <p>Checking backend connection...</p>
      )}
    </div>
  );
}

export default App;