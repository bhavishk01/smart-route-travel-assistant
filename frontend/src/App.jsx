import { useState, useEffect } from 'react';
import { GoogleLogin, googleLogout } from '@react-oauth/google';

const presets = [
  { label: 'Bengaluru to Mysuru', origin: 'Bengaluru', destination: 'Mysuru' },
  { label: 'Mysuru to Ooty', origin: 'Mysuru', destination: 'Ooty' },
  { label: 'Bengaluru to Madikeri', origin: 'Bengaluru', destination: 'Madikeri' },
];

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

const fieldLabelClass = 'block font-label-sm text-label-sm text-on-surface-variant mb-1';

function IconInput({ icon, ...props }) {
  return (
    <div className="relative">
      <Icon name={icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none" />
      <input
        {...props}
        className="w-full pl-10 pr-space-md py-2.5 rounded-lg bg-surface text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-sm border border-outline-variant transition-shadow"
      />
    </div>
  );
}

function IconSelect({ icon, children, ...props }) {
  return (
    <div className="relative">
      <Icon name={icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none" />
      <select
        {...props}
        className="w-full pl-10 pr-space-md py-2.5 rounded-lg bg-surface text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary/40 shadow-sm border border-outline-variant appearance-none"
      >
        {children}
      </select>
    </div>
  );
}

function App() {
  const [formData, setFormData] = useState({
    startLocation: '',
    destination: '',
    tripDays: 1,
    roundTrip: true,
    numberOfTravellers: 1,
    vehicleType: 'car',
    fuelType: 'petrol',
    mileage: 15,
    fuelPrice: 100,
    requiresStay: false,
    availableTimeHours: '',
  });

  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [authUser, setAuthUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('authUser');
    if (savedToken && savedUser) {
      setAuthToken(savedToken);
      setAuthUser(JSON.parse(savedUser));
    }
  }, []);

  function persistSession(data) {
    setAuthToken(data.token);
    setAuthUser(data.user);
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('authUser', JSON.stringify(data.user));
  }

  async function handleGoogleSuccess(credentialResponse) {
    try {
      const response = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await response.json();
      if (response.ok) {
        persistSession(data);
      } else {
        setAuthError(data.message || 'Google sign-in failed');
      }
    } catch (error) {
      setAuthError('Could not reach the server');
    }
  }

  function handleAuthFormChange(event) {
    const { name, value } = event.target;
    setAuthForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const body = authMode === 'login'
      ? { email: authForm.email, password: authForm.password }
      : { name: authForm.name, email: authForm.email, password: authForm.password };

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        persistSession(data);
        setAuthForm({ name: '', email: '', password: '' });
      } else {
        setAuthError(data.message || 'Something went wrong');
      }
    } catch (error) {
      setAuthError('Could not reach the server');
    }

    setAuthLoading(false);
  }

  function handleLogout() {
    googleLogout();
    setAuthToken(null);
    setAuthUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function applyPreset(preset) {
    setFormData((previous) => ({
      ...previous,
      startLocation: preset.origin,
      destination: preset.destination,
    }));
  }

  function getMileageLabel() {
    return formData.fuelType === 'electric' ? 'Mileage (km per kWh)' : 'Mileage (km per litre)';
  }

  function getFuelPriceLabel() {
    if (formData.fuelType === 'electric') return 'Electricity price (per kWh)';
    return 'Fuel price (per litre)';
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
          availableTimeHours: formData.availableTimeHours ? Number(formData.availableTimeHours) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors || [data.message]);
      } else {
        setResult(data);
        setCategoryFilter('All');
      }
    } catch (error) {
      setErrors(['Could not reach the server']);
    }

    setLoading(false);
  }

  const categories = result
    ? ['All', ...new Set(result.recommendedPlaces.map((place) => place.category))]
    : [];

  const filteredPlaces = result
    ? result.recommendedPlaces.filter(
      (place) => categoryFilter === 'All' || place.category === categoryFilter
    )
    : [];

  if (!authUser) {
    return (
      <div className="min-h-screen bg-background font-body-md text-body-md text-on-surface flex items-center justify-center p-margin-mobile">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-xl p-space-xl">
          <div className="flex items-center gap-2 justify-center mb-space-lg">
            <Icon name="route" className="text-primary text-[28px]" />
            <span className="font-title-lg text-title-lg text-primary">Smart Route</span>
          </div>

          <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-lg mb-space-lg">
            <button type="button" onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className={`flex-1 py-2 rounded font-label-md text-label-md transition-all ${authMode === 'login' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant'}`}>
              Log in
            </button>
            <button type="button" onClick={() => { setAuthMode('signup'); setAuthError(''); }}
              className={`flex-1 py-2 rounded font-label-md text-label-md transition-all ${authMode === 'signup' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant'}`}>
              Sign up
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-space-md">
            {authMode === 'signup' && (
              <div>
                <label className={fieldLabelClass}>Name</label>
                <IconInput icon="person" name="name" value={authForm.name} onChange={handleAuthFormChange} required />
              </div>
            )}
            <div>
              <label className={fieldLabelClass}>Email</label>
              <IconInput icon="mail" type="email" name="email" value={authForm.email} onChange={handleAuthFormChange} required />
            </div>
            <div>
              <label className={fieldLabelClass}>Password</label>
              <IconInput icon="lock" type="password" name="password" value={authForm.password} onChange={handleAuthFormChange} required />
              {authMode === 'signup' && (
                <p className="text-xs text-on-surface-variant mt-1">At least 8 characters</p>
              )}
            </div>

            {authError && (
              <p className="text-sm text-error flex items-center gap-1.5">
                <Icon name="error" className="text-[16px]" />
                {authError}
              </p>
            )}

            <button type="submit" disabled={authLoading}
              className="w-full py-3 rounded-lg bg-primary hover:bg-primary-container text-white font-label-lg text-label-lg shadow-md transition-all disabled:opacity-60">
              {authLoading ? 'Please wait...' : authMode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-space-lg">
            <div className="flex-1 h-px bg-outline-variant"></div>
            <span className="text-xs text-on-surface-variant">or</span>
            <div className="flex-1 h-px bg-outline-variant"></div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setAuthError('Google sign-in failed')} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body-md text-body-md text-on-surface">
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto h-16 px-margin-mobile lg:px-margin flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon name="route" className="text-primary text-[24px]" />
            <span className="font-title-md text-title-md text-primary">Smart Route</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Travel Assistant</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-label-md text-label-md text-on-surface-variant">{authUser.name}</span>
            <button onClick={handleLogout} className="text-sm text-secondary hover:text-primary transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </header>

      {loading && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-md flex items-center justify-center p-space-md">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-xl p-space-xl shadow-2xl text-center space-y-space-md">
            <svg className="animate-spin w-16 h-16 text-secondary-container mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
              <path className="opacity-75 text-secondary" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor"></path>
            </svg>
            <h3 className="font-headline-sm text-headline-sm text-primary">Planning your trip</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Fetching your route, finding tourist places nearby, checking their reliability, and writing a short guide for each stop.
            </p>
          </div>
        </div>
      )}

      {!result ? (
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin py-space-xl">
          <div className="max-w-2xl space-y-space-xs mb-space-lg">
            <h1 className="font-headline-xl text-headline-xl text-primary">Plan your next road trip</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Get a real route, tourist places worth the detour, an honest cost estimate, and an AI-written guide for each stop.
            </p>
          </div>

          <div className="flex flex-col gap-space-xs mb-space-lg">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Try a sample route</span>
            <div className="flex flex-wrap gap-space-xs">
              {presets.map((preset) => (
                <button key={preset.label} type="button" onClick={() => applyPreset(preset)}
                  className="px-space-md py-1.5 rounded-full bg-surface-container-lowest shadow-sm hover:bg-surface-container hover:shadow-md text-on-surface font-label-md text-label-md transition-all flex items-center gap-1.5">
                  <Icon name="near_me" className="text-[16px] text-secondary" />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            <form onSubmit={handleSubmit} className="lg:col-span-8 flex flex-col gap-space-md">
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
                <div className="flex items-center justify-between mb-space-md">
                  <div className="flex items-center gap-2">
                    <Icon name="timeline" className="text-secondary text-[22px]" />
                    <h2 className="font-title-lg text-title-lg text-primary">Route and travel basics</h2>
                  </div>
                  <div className="bg-surface-container-low p-1 rounded-lg flex items-center gap-1">
                    <button type="button" onClick={() => setFormData((p) => ({ ...p, roundTrip: false }))}
                      className={`px-space-md py-1 rounded font-label-md text-label-md transition-all ${!formData.roundTrip ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                      One-way
                    </button>
                    <button type="button" onClick={() => setFormData((p) => ({ ...p, roundTrip: true }))}
                      className={`px-space-md py-1 rounded font-label-md text-label-md transition-all ${formData.roundTrip ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                      Round trip
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md mb-space-md">
                  <div>
                    <label className={fieldLabelClass}>Start location</label>
                    <IconInput icon="trip_origin" name="startLocation" value={formData.startLocation} onChange={handleChange} />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Destination</label>
                    <IconInput icon="location_on" name="destination" value={formData.destination} onChange={handleChange} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div>
                    <label className={fieldLabelClass}>Trip duration in days</label>
                    <IconInput icon="calendar_today" type="number" name="tripDays" value={formData.tripDays} onChange={handleChange} />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Number of travellers</label>
                    <IconInput icon="group" type="number" name="numberOfTravellers" value={formData.numberOfTravellers} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
                <div className="flex items-center gap-2 mb-space-md">
                  <Icon name="directions_car" className="text-secondary text-[22px]" />
                  <h2 className="font-title-lg text-title-lg text-primary">Vehicle and fuel</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md mb-space-md">
                  <div>
                    <label className={fieldLabelClass}>Vehicle type</label>
                    <IconInput icon="directions_car" name="vehicleType" value={formData.vehicleType} onChange={handleChange} />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>Fuel type</label>
                    <IconSelect icon="local_gas_station" name="fuelType" value={formData.fuelType} onChange={handleChange}>
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="cng">CNG</option>
                      <option value="electric">Electric</option>
                    </IconSelect>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div>
                    <label className={fieldLabelClass}>{getMileageLabel()}</label>
                    <IconInput icon="speed" type="number" name="mileage" value={formData.mileage} onChange={handleChange} />
                  </div>
                  <div>
                    <label className={fieldLabelClass}>{getFuelPriceLabel()}</label>
                    <IconInput icon="attach_money" type="number" name="fuelPrice" value={formData.fuelPrice} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm">
                <div className="flex items-center gap-2 mb-space-md">
                  <Icon name="hotel_class" className="text-secondary text-[22px]" />
                  <h2 className="font-title-lg text-title-lg text-primary">Stopover preferences</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
                  <div className="p-space-md rounded-xl bg-surface-container-low flex items-start justify-between gap-space-sm">
                    <div>
                      <p className="font-title-sm text-title-sm text-primary flex items-center gap-1.5">
                        <Icon name="bed" className="text-[18px] text-secondary" />
                        Need a place to stay
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">We'll recommend places near your destination</p>
                    </div>
                    <button type="button" onClick={() => setFormData((p) => ({ ...p, requiresStay: !p.requiresStay }))}
                      className={`relative w-12 h-6 rounded-full p-0.5 transition-colors shrink-0 ${formData.requiresStay ? 'bg-primary-container' : 'bg-surface-container-high'}`}>
                      <span className={`block w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${formData.requiresStay ? 'translate-x-6' : 'translate-x-0'}`}></span>
                    </button>
                  </div>
                  <div className="p-space-md rounded-xl bg-surface-container-low">
                    <label className="font-title-sm text-title-sm text-primary flex items-center gap-1.5 mb-1">
                      <Icon name="schedule" className="text-[18px] text-secondary" />
                      Sightseeing time available, in hours
                    </label>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">Optional, leave blank to skip itinerary planning</p>
                    <IconInput icon="hourglass_top" type="number" name="availableTimeHours" value={formData.availableTimeHours} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-lg bg-primary hover:bg-primary-container text-white font-label-lg text-label-lg shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                <Icon name="auto_awesome" className="text-[20px]" />
                Plan my trip
                <Icon name="arrow_forward" className="text-[20px]" />
              </button>
            </form>

            <aside className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md">
              <span className="font-label-sm text-label-sm text-secondary font-semibold">Why plan with Smart Route</span>
              <div className="space-y-space-md">
                <div className="flex items-start gap-space-sm">
                  <Icon name="verified" className="text-secondary text-[20px] mt-0.5" />
                  <div>
                    <h4 className="font-title-sm text-title-sm text-primary">Grounded, not guessed</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      Tourist information is checked against real reference sources before it's written.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-space-sm">
                  <Icon name="alt_route" className="text-secondary text-[20px] mt-0.5" />
                  <div>
                    <h4 className="font-title-sm text-title-sm text-primary">Real detour cost</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      Every place shows exactly how much extra driving it adds to your trip.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-space-sm">
                  <Icon name="signpost" className="text-secondary text-[20px] mt-0.5" />
                  <div>
                    <h4 className="font-title-sm text-title-sm text-primary">Spread across your journey</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      Recommendations are picked across the whole route, not clustered near your start point.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {errors.length > 0 && (
            <div className="mt-space-md rounded-xl bg-error-container/40 border border-error/20 p-space-md flex items-start gap-2">
              <Icon name="error" className="text-error text-[20px] mt-0.5" />
              <div>
                {errors.map((error, index) => (
                  <p key={index} className="text-sm text-error">{error}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="results-enter max-w-7xl mx-auto px-margin-mobile lg:px-margin py-space-md flex flex-col gap-space-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <button onClick={() => setResult(null)}
                className="inline-flex items-center gap-space-xs text-secondary hover:text-primary font-label-lg text-label-lg transition-colors w-fit">
                <Icon name="arrow_back" className="text-[18px]" />
                Edit trip details
              </button>
              <div className="flex flex-wrap items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
                <span className="font-title-sm text-title-sm text-on-surface">{result.trip.startLocation} to {result.trip.destination}</span>
                <span className="px-space-xs py-0.5 bg-surface-container rounded">{result.trip.tripDays} days</span>
                <span className="px-space-xs py-0.5 bg-surface-container rounded">{result.trip.numberOfTravellers} travellers</span>
                <span className="px-space-xs py-0.5 bg-surface-container rounded">{result.trip.vehicleType}, {result.trip.fuelType}</span>
              </div>
            </div>
          </div>

          <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary-container to-secondary text-white p-space-lg md:p-space-xl shadow-xl">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-space-md">
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-space-md">
                <div className="flex items-center gap-1.5 text-white/70">
                  <Icon name="straighten" className="text-[18px]" />
                  <span className="font-label-sm text-label-sm uppercase">Distance</span>
                </div>
                <div className="mt-1 font-headline-md text-headline-md">{(result.route.distanceMeters / 1000).toFixed(1)} km</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-space-md">
                <div className="flex items-center gap-1.5 text-white/70">
                  <Icon name="schedule" className="text-[18px]" />
                  <span className="font-label-sm text-label-sm uppercase">Duration</span>
                </div>
                <div className="mt-1 font-headline-md text-headline-md">{(result.route.durationSeconds / 3600).toFixed(1)} hrs</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-space-md">
                <div className="flex items-center gap-1.5 text-white/70">
                  <Icon name="explore" className="text-[18px]" />
                  <span className="font-label-sm text-label-sm uppercase">Places found</span>
                </div>
                <div className="mt-1 font-headline-md text-headline-md">{result.recommendedPlaces.length}</div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-space-sm">
            <h2 className="font-title-lg text-title-lg text-on-surface">Estimated trip cost</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
              <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-title-sm text-title-sm text-on-surface-variant">Fuel</span>
                  <Icon name="local_gas_station" className="text-secondary text-[20px]" />
                </div>
                <div className="mt-space-sm font-headline-md text-headline-md text-on-surface">₹{result.cost.estimatedFuelCost}</div>
              </div>
              <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-title-sm text-title-sm text-on-surface-variant">Stay</span>
                  <Icon name="bed" className="text-secondary text-[20px]" />
                </div>
                <div className="mt-space-sm font-headline-md text-headline-md text-on-surface">₹{result.cost.estimatedStayCost}</div>
              </div>
              <div className="p-space-lg bg-primary-container text-white rounded-xl shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-title-sm text-title-sm text-white/80">Total</span>
                  <Icon name="account_balance_wallet" className="text-[20px]" />
                </div>
                <div className="mt-space-sm font-headline-md text-headline-md">₹{result.cost.estimatedTotalCost}</div>
              </div>
              <div className="p-space-lg bg-secondary-container/40 rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-title-sm text-title-sm text-on-secondary-container">Per person</span>
                  <Icon name="group" className="text-on-secondary-container text-[20px]" />
                </div>
                <div className="mt-space-sm font-headline-md text-headline-md text-on-surface">₹{result.cost.estimatedCostPerPerson}</div>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant italic flex items-center gap-1.5">
              <Icon name="info" className="text-[16px]" />
              {result.cost.note}
            </p>
          </section>

          <section className="flex flex-col gap-space-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
              <h2 className="font-headline-md text-headline-md text-on-surface">Recommended places along your route</h2>
              <div className="flex items-center gap-space-xs flex-wrap">
                {categories.map((category) => (
                  <button key={category} onClick={() => setCategoryFilter(category)}
                    className={`px-space-md py-1 rounded-full font-label-md text-label-md transition-colors shadow-sm ${categoryFilter === category ? 'bg-primary text-white' : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'}`}>
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-space-md">
              {filteredPlaces.map((place) => (
                <article key={place.placeId} className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-space-md">
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex flex-wrap items-center gap-space-xs">
                      <span className="px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-container text-on-secondary-container">{place.category}</span>
                      {place.verified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container-high text-on-surface">
                          <Icon name="check_circle" className="text-[14px] text-secondary" />
                          Verified
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface-variant">
                        <Icon name="turn_sharp_right" className="text-[14px]" />
                        Adds {place.detourKm} km ({place.detourPercent}%) to your trip
                      </span>
                    </div>
                    <h3 className="font-title-lg text-title-lg text-on-surface">{place.name}</h3>
                    {place.description && <p className="font-body-md text-body-md text-on-surface-variant">{place.description}</p>}
                    {place.explanation && (
                      <div className="bg-surface-container-low rounded-lg p-space-sm">
                        <p className="font-body-sm text-body-sm italic text-secondary">{place.explanation.summary}</p>
                      </div>
                    )}
                  </div>

                  {(place.history || place.travelTips || place.bestVisitingTime) && (
                    <details>
                      <summary className="font-label-md text-label-md text-primary cursor-pointer hover:text-primary-container transition-colors w-fit">More details</summary>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md p-space-md bg-surface-container-low rounded-lg mt-space-sm">
                        {place.history && (
                          <div>
                            <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-secondary mb-1">
                              <Icon name="history_edu" className="text-[16px]" />
                              History
                            </div>
                            <p className="font-body-sm text-body-sm text-on-surface">{place.history}</p>
                          </div>
                        )}
                        {place.travelTips && (
                          <div>
                            <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-secondary mb-1">
                              <Icon name="lightbulb" className="text-[16px]" />
                              Travel tip
                            </div>
                            <p className="font-body-sm text-body-sm text-on-surface">{place.travelTips}</p>
                          </div>
                        )}
                        {place.bestVisitingTime && (
                          <div>
                            <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-secondary mb-1">
                              <Icon name="schedule" className="text-[16px]" />
                              Best visiting time
                            </div>
                            <p className="font-body-sm text-body-sm text-on-surface">{place.bestVisitingTime}</p>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </article>
              ))}
            </div>
          </section>

          {result.itinerary && (
            <section className="flex flex-col gap-space-md bg-surface-container-lowest p-space-lg md:p-space-xl rounded-xl shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-xs">
                  <Icon name="map" className="text-secondary text-[22px]" />
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">Suggested itinerary</h2>
                  <span className="px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-container text-on-secondary-container">
                    {(result.itinerary.timeBudgetMinutes / 60).toFixed(1)} hour budget
                  </span>
                </div>
                <span className="font-label-lg text-label-lg text-primary font-semibold">
                  Total planned: {(result.itinerary.totalTimeMinutes / 60).toFixed(1)} hrs
                </span>
              </div>

              <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                <div className="bg-primary h-full transition-all" style={{ width: `${Math.min((result.itinerary.totalTimeMinutes / result.itinerary.timeBudgetMinutes) * 100, 100)}%` }}></div>
              </div>

              <div className="relative pl-8 flex flex-col gap-space-lg mt-space-sm">
                <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-secondary-container"></div>
                {result.itinerary.selectedPlaces.map((item, index) => (
                  <div key={item.placeId} className="relative flex flex-col md:flex-row md:items-center justify-between gap-space-sm bg-surface-container-low/50 p-space-md rounded-lg">
                    <div className="absolute -left-8 top-5 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <span className="font-title-md text-title-md text-on-surface">{item.name}</span>
                      <span className="ml-2 px-2 py-0.5 rounded font-label-sm text-label-sm bg-secondary-container text-on-secondary-container">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-space-md font-label-md text-label-md text-on-surface">
                      <span className="flex items-center gap-1">
                        <Icon name="timer" className="text-[16px] text-secondary" />
                        Visit: {item.estimatedVisitMinutes} mins
                      </span>
                      <span className="flex items-center gap-1 text-on-surface-variant">
                        <Icon name="turn_sharp_right" className="text-[16px]" />
                        Detour: {item.estimatedDetourMinutes} mins
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {result.recommendedStays.length > 0 && (
            <section className="flex flex-col gap-space-md">
              <div className="flex items-center gap-2">
                <Icon name="hotel" className="text-secondary text-[22px]" />
                <h2 className="font-headline-md text-headline-md text-on-surface">Places to stay near your destination</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md">
                {result.recommendedStays.map((stay) => (
                  <div key={stay.stayId} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
                    <div className="flex items-center justify-between mb-space-xs">
                      <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-primary text-white">{stay.type}</span>
                      <span className="font-headline-sm text-headline-sm text-primary">₹{stay.pricePerNight}</span>
                    </div>
                    <h3 className="font-title-md text-title-md text-on-surface">{stay.name}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 flex items-center gap-1">
                      <Icon name="location_on" className="text-[14px]" />
                      {stay.distanceFromDestinationKm} km from your destination
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <footer className="border-t border-outline-variant py-space-xl text-center mt-space-xxl">
        <p className="font-body-sm text-body-sm text-on-surface-variant">Smart Route Travel Assistant — a student project</p>
      </footer>
    </div>
  );
}

export default App;