import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import FoodCapture from './components/FoodCapture';
import WeightTracker from './components/WeightTracker';
import ChartsView from './components/ChartsView';
import ReportsView from './components/ReportsView';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('food');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [mealsForDate, setMealsForDate] = useState([]);
  const [weights, setWeights] = useState([]);
  const [settings, setSettings] = useState({
    tdee: 2200,
    targetCalories: 1900,
    userProfile: { heightCm: 175 }
  });

  const fetchMealsForDate = async (date) => {
    try {
      const mealRes = await fetch(`/api/meals?date=${date}`);
      if (mealRes.ok) {
        const data = await mealRes.json();
        setMealsForDate(data);
      }
    } catch (err) {
      console.error('Error fetching meals for date:', err);
      const cachedMeals = JSON.parse(localStorage.getItem('nt_all_meals') || '[]');
      setMealsForDate(cachedMeals.filter(m => m.date === date));
    }
  };

  const fetchAllData = async () => {
    try {
      // 1. Immediately show cached data from phone storage
      const cachedMeals = JSON.parse(localStorage.getItem('nt_all_meals') || '[]');
      const cachedWeights = JSON.parse(localStorage.getItem('nt_all_weights') || '[]');
      if (cachedWeights.length > 0 && weights.length === 0) {
        setWeights(cachedWeights);
      }
      if (cachedMeals.length > 0 && mealsForDate.length === 0) {
        setMealsForDate(cachedMeals.filter(m => m.date === selectedDate));
      }

      // 2. Fetch server all meals & weights to compare
      const allMealsRes = await fetch('/api/meals');
      const allServerMeals = allMealsRes.ok ? await allMealsRes.json() : [];

      const weightRes = await fetch('/api/weights');
      const allServerWeights = weightRes.ok ? await weightRes.json() : [];

      // If server has fewer items than local phone cache (e.g. Render redeploy wiped server disk), auto-restore!
      if (cachedMeals.length > allServerMeals.length || cachedWeights.length > allServerWeights.length) {
        console.log('🔄 偵測到雲端新部署重置，手機端自動向伺服器同步還原舊紀錄...');
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meals: cachedMeals, weights: cachedWeights })
        });
        await fetchMealsForDate(selectedDate);
        setWeights(cachedWeights);
      } else {
        // Server has equal or more data, update phone cache
        if (allServerMeals.length > 0) {
          localStorage.setItem('nt_all_meals', JSON.stringify(allServerMeals));
        }
        if (allServerWeights.length > 0) {
          localStorage.setItem('nt_all_weights', JSON.stringify(allServerWeights));
          setWeights(allServerWeights);
        }
        await fetchMealsForDate(selectedDate);
      }

      // Fetch settings
      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Sync error (using phone offline cache):', err);
      const cachedMeals = JSON.parse(localStorage.getItem('nt_all_meals') || '[]');
      setMealsForDate(cachedMeals.filter(m => m.date === selectedDate));
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedDate]);

  const dateCalories = mealsForDate.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weightKg : null;

  const handleMealAdded = (newMeal) => {
    // Update state
    if (newMeal.date === selectedDate) {
      setMealsForDate(prev => [newMeal, ...prev]);
    } else {
      setSelectedDate(newMeal.date);
    }
    // Update local cache
    const cachedMeals = JSON.parse(localStorage.getItem('nt_all_meals') || '[]');
    const updatedAll = [newMeal, ...cachedMeals.filter(m => m.id !== newMeal.id)];
    localStorage.setItem('nt_all_meals', JSON.stringify(updatedAll));
  };

  const handleMealUpdated = (updatedMeal) => {
    if (updatedMeal.date === selectedDate) {
      setMealsForDate(prev => prev.map(m => m.id === updatedMeal.id ? updatedMeal : m));
    } else {
      setMealsForDate(prev => prev.filter(m => m.id !== updatedMeal.id));
    }
    // Update local cache
    const cachedMeals = JSON.parse(localStorage.getItem('nt_all_meals') || '[]');
    const updatedAll = cachedMeals.map(m => m.id === updatedMeal.id ? updatedMeal : m);
    localStorage.setItem('nt_all_meals', JSON.stringify(updatedAll));
  };

  const handleMealDeleted = async (id) => {
    try {
      const res = await fetch(`/api/meals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMealsForDate(prev => prev.filter(m => m.id !== id));
        const cachedMeals = JSON.parse(localStorage.getItem('nt_all_meals') || '[]');
        const updatedAll = cachedMeals.filter(m => m.id !== id);
        localStorage.setItem('nt_all_meals', JSON.stringify(updatedAll));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWeightSaved = (newRecord) => {
    setWeights(prev => {
      const filtered = prev.filter(w => w.date !== newRecord.date);
      const updated = [...filtered, newRecord].sort((a, b) => a.date.localeCompare(b.date));
      localStorage.setItem('nt_all_weights', JSON.stringify(updated));
      return updated;
    });
  };

  const handleWeightDeleted = async (id) => {
    try {
      const res = await fetch(`/api/weights/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setWeights(prev => {
          const updated = prev.filter(w => w.id !== id);
          localStorage.setItem('nt_all_weights', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenSettings={() => setSettingsOpen(true)}
        todayWeight={latestWeight}
        todayCalories={dateCalories}
        tdee={settings.tdee || 2200}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-5">
        {activeTab === 'food' && (
          <FoodCapture
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            meals={mealsForDate}
            onMealAdded={handleMealAdded}
            onMealUpdated={handleMealUpdated}
            onMealDeleted={handleMealDeleted}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'weight' && (
          <WeightTracker
            weights={weights}
            onWeightSaved={handleWeightSaved}
            onWeightDeleted={handleWeightDeleted}
            heightCm={settings.userProfile?.heightCm || 175}
          />
        )}

        {activeTab === 'charts' && (
          <ChartsView
            tdee={settings.tdee || 2200}
            targetCalories={settings.targetCalories || 1900}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView onDataChanged={fetchAllData} />
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSettingsUpdated={(newSettings) => setSettings(newSettings)}
      />
    </div>
  );
}
