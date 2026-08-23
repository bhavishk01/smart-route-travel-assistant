import { useState } from 'react';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    startLocation: '',
    destination: '',
    tripDays: 1,
    roundTrip: true,
    numberOfTravellers: 1,
    vehicleType: 'car',
    mileage: 15,
    fuelPrice: 100,
    requiresStay: false,
  });

  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors([]);
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/trips/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tripDays: Number(formData.tripDays),
          numberOfTravellers: Number(formData.numberOfTravellers),
          mileage: Number(formData.mileage),
          fuelPrice: Number(formData.fuelPrice),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors || [data.message]);
      } else {
        setResult(data);
      }
    } catch (error) {
      setErrors(['Could not reach the server']);
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '500px' }}>
      <h1>Smart Route Travel Assistant</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Start Location</label>
          <input name="startLocation" value={formData.startLocation} onChange={handleChange} />
        </div>

        <div>
          <label>Destination</label>
          <input name="destination" value={formData.destination} onChange={handleChange} />
        </div>

        <div>
          <label>Trip Days</label>
          <input type="number" name="tripDays" value={formData.tripDays} onChange={handleChange} />
        </div>

        <div>
          <label>
            <input type="checkbox" name="roundTrip" checked={formData.roundTrip} onChange={handleChange} />
            Round Trip
          </label>
        </div>

        <div>
          <label>Number of Travellers</label>
          <input type="number" name="numberOfTravellers" value={formData.numberOfTravellers} onChange={handleChange} />
        </div>

        <div>
          <label>Vehicle Type</label>
          <input name="vehicleType" value={formData.vehicleType} onChange={handleChange} />
        </div>

        <div>
          <label>Mileage (km/l)</label>
          <input type="number" name="mileage" value={formData.mileage} onChange={handleChange} />
        </div>

        <div>
          <label>Fuel Price (per litre)</label>
          <input type="number" name="fuelPrice" value={formData.fuelPrice} onChange={handleChange} />
        </div>

        <div>
          <label>
            <input type="checkbox" name="requiresStay" checked={formData.requiresStay} onChange={handleChange} />
            Requires Stay
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Planning...' : 'Plan Trip'}
        </button>
      </form>

      {errors.length > 0 && (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          {errors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '1rem' }}>
          <h2>Route</h2>
          <p>Distance: {(result.route.distanceMeters / 1000).toFixed(1)} km</p>
          <p>Duration: {(result.route.durationSeconds / 3600).toFixed(1)} hours</p>
        </div>
      )}
    </div>
  );
}

export default App;