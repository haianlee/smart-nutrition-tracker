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
    }
  };

  const fetchAllData = async () => {
    try {
      await fetchMealsForDate(selectedDate);

      // Fetch weights
      const weightRes = await fetch('/api/weights');
      if (weightRes.ok) {
        const data = await weightRes.json();
        setWeights(data);
      }

      // Fetch settings
      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedDate]);

  const dateCalories = mealsForDate.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weightKg : null;

  const handleMealAdded = (newMeal) => {
    if (newMeal.date === selectedDate) {
      setMealsForDate(prev => [newMeal, ...prev]);
    } else {
      setSelectedDate(newMeal.date);
    }
  };

  const handleMealUpdated = (updatedMeal) => {
    if (updatedMeal.date === selectedDate) {
      setMealsForDate(prev => prev.map(m => m.id === updatedMeal.id ? updatedMeal : m));
    } else {
      // If the user changed the meal's date to another day, remove from current view
      setMealsForDate(prev => prev.filter(m => m.id !== updatedMeal.id));
    }
  };

  const handleMealDeleted = async (id) => {
    try {
      const res = await fetch(`/api/meals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMealsForDate(prev => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWeightSaved = (newRecord) => {
    setWeights(prev => {
      const filtered = prev.filter(w => w.date !== newRecord.date);
      return [...filtered, newRecord].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const handleWeightDeleted = async (id) => {
    try {
      const res = await fetch(`/api/weights/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setWeights(prev => prev.filter(w => w.id !== id));
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
          <ReportsView onDataChanged={fetchTodayData} />
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
