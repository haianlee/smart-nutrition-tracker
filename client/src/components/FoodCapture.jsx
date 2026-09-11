import React, { useState, useRef } from 'react';
import {
  Camera,
  Image as ImageIcon,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  AlertCircle,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { getLocalDateStr, getLocalTimeStr, stepDateStr } from '../utils/dateUtils';

export default function FoodCapture({
  selectedDate,
  setSelectedDate,
  meals = [],
  onMealAdded,
  onMealUpdated,
  onMealDeleted,
  onRefresh
}) {
  const todayStr = getLocalDateStr();
  const nowTime = getLocalTimeStr();

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [textInput, setTextInput] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  // Editing existing past meal modal
  const [editingMeal, setEditingMeal] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Date navigation helpers
  const handlePrevDay = () => {
    setSelectedDate(prev => stepDateStr(prev, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => stepDateStr(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(getLocalDateStr());
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
      setAnalysisResult(null);
      setEditMode(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setAnalysisResult(null);
    setEditMode(false);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!selectedImage && !textInput.trim()) {
      setStatusMsg('請先拍照/上傳照片或輸入食物名稱');
      setTimeout(() => setStatusMsg(''), 3000);
      return;
    }

    setIsAnalyzing(true);
    setStatusMsg('');

    try {
      const formData = new FormData();
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      if (textInput.trim()) {
        formData.append('textInput', textInput.trim());
      }

      const cachedKey = localStorage.getItem('gemini_api_key') || '';
      const headers = {};
      if (cachedKey) {
        headers['x-gemini-key'] = cachedKey;
      }

      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers,
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '分析失敗');
      }

      const data = await res.json();
      const ana = data.analysis;
      setAnalysisResult({
        ...ana,
        imageUrl: data.imageUrl || imagePreview
      });

      // Prepare edit form (defaults date to currently selectedDate)
      const baseW = Number(ana.estimated_weight_g) || 100;
      const baseCal = Number(ana.calories) || 0;
      const baseP = Number(ana.macros?.protein_g) || 0;
      const baseC = Number(ana.macros?.carbs_g) || 0;
      const baseF = Number(ana.macros?.fat_g) || 0;
      const baseFib = Number(ana.macros?.fiber_g) || 0;
      const baseIngs = (ana.ingredients || []).map(ing => ({ ...ing }));

      setEditForm({
        date: selectedDate,
        time: nowTime,
        mealType: mealType,
        foodName: ana.food_name,
        estimatedWeightG: ana.estimated_weight_g,
        calories: ana.calories,
        proteinG: baseP,
        carbsG: baseC,
        fatG: baseF,
        fiberG: baseFib,
        confidenceNote: ana.confidence_note,
        ingredients: ana.ingredients || [],
        baseWeightG: baseW,
        baseCalories: baseCal,
        baseProteinG: baseP,
        baseCarbsG: baseC,
        baseFatG: baseF,
        baseFiberG: baseFib,
        baseIngredients: baseIngs
      });
    } catch (err) {
      console.error(err);
      setStatusMsg(`辨識失敗: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveMeal = async () => {
    if (!editForm) return;

    try {
      const payload = {
        date: editForm.date || selectedDate,
        time: editForm.time || nowTime,
        mealType: editForm.mealType || mealType,
        foodName: editForm.foodName,
        estimatedWeightG: Number(editForm.estimatedWeightG) || 0,
        calories: Number(editForm.calories) || 0,
        macros: {
          proteinG: Number(editForm.proteinG) || 0,
          carbsG: Number(editForm.carbsG) || 0,
          fatG: Number(editForm.fatG) || 0,
          fiberG: Number(editForm.fiberG) || 0
        },
        ingredients: editForm.ingredients,
        confidenceNote: editForm.confidenceNote,
        imageUrl: analysisResult?.imageUrl || ''
      };

      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('儲存失敗');

      const saved = await res.json();
      onMealAdded(saved);
      clearImage();
      setTextInput('');
      setAnalysisResult(null);
      setEditForm(null);
      setEditMode(false);
      setStatusMsg(`✅ 已成功記錄至 ${payload.date}！`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg(`儲存失敗: ${err.message}`);
    }
  };

  // Proportionally rescale calories & macros when user changes weight in new meal form
  const handleWeightChange = (newWeight) => {
    const w = Number(newWeight);
    const baseW = Number(editForm.baseWeightG) || Number(editForm.estimatedWeightG) || 100;
    const baseCal = Number(editForm.baseCalories ?? editForm.calories) || 0;
    const baseP = Number(editForm.baseProteinG ?? editForm.proteinG) || 0;
    const baseC = Number(editForm.baseCarbsG ?? editForm.carbsG) || 0;
    const baseF = Number(editForm.baseFatG ?? editForm.fatG) || 0;
    const baseFib = Number(editForm.baseFiberG ?? editForm.fiberG) || 0;
    const baseIngs = editForm.baseIngredients || [];

    if (!w || w <= 0 || baseW <= 0) {
      setEditForm(prev => ({
        ...prev,
        estimatedWeightG: newWeight
      }));
      return;
    }

    const ratio = w / baseW;
    setEditForm(prev => ({
      ...prev,
      estimatedWeightG: newWeight,
      calories: Math.round(baseCal * ratio),
      proteinG: Math.round(baseP * ratio * 10) / 10,
      carbsG: Math.round(baseC * ratio * 10) / 10,
      fatG: Math.round(baseF * ratio * 10) / 10,
      fiberG: Math.round(baseFib * ratio * 10) / 10,
      ingredients: baseIngs.map(ing => ({
        ...ing,
        weight_g: Math.round((Number(ing.weight_g) || 0) * ratio),
        calories: Math.round((Number(ing.calories) || 0) * ratio)
      }))
    }));
  };

  // Open existing meal for editing
  const handleStartEditMeal = (meal) => {
    const w = Number(meal.estimatedWeightG) || 100;
    const cal = Number(meal.calories) || 0;
    const p = Number(meal.macros?.proteinG) || 0;
    const c = Number(meal.macros?.carbsG) || 0;
    const f = Number(meal.macros?.fatG) || 0;
    const fib = Number(meal.macros?.fiberG) || 0;

    setEditingMeal({
      id: meal.id,
      date: meal.date,
      time: meal.time,
      mealType: meal.mealType || 'lunch',
      foodName: meal.foodName,
      estimatedWeightG: meal.estimatedWeightG,
      calories: meal.calories,
      proteinG: p,
      carbsG: c,
      fatG: f,
      fiberG: fib,
      confidenceNote: meal.confidenceNote || '',
      baseWeightG: w,
      baseCalories: cal,
      baseProteinG: p,
      baseCarbsG: c,
      baseFatG: f,
      baseFiberG: fib
    });
  };

  // Rescale when editing existing meal
  const handleEditingWeightChange = (newWeight) => {
    const w = Number(newWeight);
    const baseW = Number(editingMeal.baseWeightG) || Number(editingMeal.estimatedWeightG) || 100;
    const baseCal = Number(editingMeal.baseCalories ?? editingMeal.calories) || 0;
    const baseP = Number(editingMeal.baseProteinG ?? editingMeal.proteinG) || 0;
    const baseC = Number(editingMeal.baseCarbsG ?? editingMeal.carbsG) || 0;
    const baseF = Number(editingMeal.baseFatG ?? editingMeal.fatG) || 0;
    const baseFib = Number(editingMeal.baseFiberG ?? editingMeal.fiberG) || 0;

    if (!w || w <= 0 || baseW <= 0) {
      setEditingMeal(prev => ({ ...prev, estimatedWeightG: newWeight }));
      return;
    }
    const ratio = w / baseW;
    setEditingMeal(prev => ({
      ...prev,
      estimatedWeightG: newWeight,
      calories: Math.round(baseCal * ratio),
      proteinG: Math.round(baseP * ratio * 10) / 10,
      carbsG: Math.round(baseC * ratio * 10) / 10,
      fatG: Math.round(baseF * ratio * 10) / 10,
      fiberG: Math.round(baseFib * ratio * 10) / 10
    }));
  };

  // Save updated meal
  const handleSaveUpdatedMeal = async () => {
    if (!editingMeal) return;
    setIsSavingEdit(true);
    try {
      const payload = {
        date: editingMeal.date,
        time: editingMeal.time,
        mealType: editingMeal.mealType,
        foodName: editingMeal.foodName,
        estimatedWeightG: Number(editingMeal.estimatedWeightG) || 0,
        calories: Number(editingMeal.calories) || 0,
        macros: {
          proteinG: Number(editingMeal.proteinG) || 0,
          carbsG: Number(editingMeal.carbsG) || 0,
          fatG: Number(editingMeal.fatG) || 0,
          fiberG: Number(editingMeal.fiberG) || 0
        },
        confidenceNote: editingMeal.confidenceNote
      };

      const res = await fetch(`/api/meals/${editingMeal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('更新失敗');

      const updated = await res.json();
      onMealUpdated(updated);
      setEditingMeal(null);
      setStatusMsg('✅ 飲食紀錄已成功更新！');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      alert(`更新失敗: ${err.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const totalDateCalories = meals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);

  return (
    <div className="space-y-5 pb-20">
      {/* Upload & Input Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
          <Camera className="text-emerald-500" size={20} />
          <span>拍照辨識 / 記錄飲食</span>
          {selectedDate !== todayStr && (
            <span className="text-xs font-normal text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
              記錄至 {selectedDate}
            </span>
          )}
        </h2>

        {/* Hidden File Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageChange}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        {/* Image Preview or Capture Buttons */}
        {imagePreview ? (
          <div className="relative rounded-2xl overflow-hidden mb-4 border border-slate-200 bg-slate-900 group">
            <img
              src={imagePreview}
              alt="Food preview"
              className="w-full h-56 object-cover"
            />
            <button
              onClick={clearImage}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition"
              title="移除照片"
            >
              <X size={18} />
            </button>
            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur-sm">
              已選取食物照片
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 transition active:scale-98"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2 text-emerald-600 shadow-sm">
                <Camera size={24} />
              </div>
              <span className="text-sm font-semibold">手機拍照</span>
              <span className="text-[11px] text-emerald-600/70 mt-0.5">呼叫相機即拍</span>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-700 transition active:scale-98"
            >
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-2 text-slate-600 shadow-sm">
                <ImageIcon size={24} />
              </div>
              <span className="text-sm font-semibold">相簿選擇</span>
              <span className="text-[11px] text-slate-400 mt-0.5">支援各格式圖片</span>
            </button>
          </div>
        )}

        {/* Meal Type Selector */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-slate-500">餐別：</span>
          <div className="grid grid-cols-4 gap-1.5 flex-1">
            {[
              { id: 'breakfast', label: '早餐' },
              { id: 'lunch', label: '午餐' },
              { id: 'dinner', label: '晚餐' },
              { id: 'snack', label: '點心/飲品' }
            ].map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setMealType(type.id)}
                className={`text-xs py-1.5 rounded-xl font-medium transition ${
                  mealType === type.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input / Override info */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-medium text-slate-500 flex items-center justify-between">
            <span>文字補充或直接輸入食物：</span>
            <span className="text-[11px] text-slate-400">可指定重量或品牌</span>
          </label>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="例：孔雀捲心餅63g、熟香蕉150g、牛肉麵半碗"
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50"
          />
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-60"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Gemini AI 視覺營養分析中...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>{imagePreview ? 'AI 視覺分析熱量與營養' : '文字查表 / AI 營養計算'}</span>
            </>
          )}
        </button>

        {statusMsg && (
          <div className="mt-3 p-2.5 rounded-xl text-xs flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 animate-fadeIn">
            <AlertCircle size={15} />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      {/* Analysis & Confirmation Card */}
      {analysisResult && editForm && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-200 animate-fadeIn">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-base font-bold text-slate-800">辨識分析結果</h3>
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className="text-xs flex items-center gap-1 text-slate-600 hover:text-emerald-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition"
            >
              <Edit3 size={13} />
              {editMode ? '完成微調' : '微調數據'}
            </button>
          </div>

          {analysisResult.isMock && (
            <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600" />
              <div>
                <strong>目前處於離線示範模式：</strong>
                尚未填寫 Gemini API Key，數據為離線估算。若要啟用真正的 <strong>Gemini 智慧聯網檢索</strong>，請點擊右上角 <strong>⚙️ 設定</strong> 填入 API Key！
              </div>
            </div>
          )}

          {/* Result view or Edit Form */}
          <div className="space-y-4">
            {/* Record Date & Time picker for this meal */}
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-500" />
                <span className="text-slate-500 font-medium">記錄日期：</span>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="font-semibold text-slate-800 bg-white px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-slate-500" />
                <input
                  type="time"
                  value={editForm.time}
                  onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                  className="font-semibold text-slate-800 bg-white px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {editMode ? (
                  <input
                    type="text"
                    value={editForm.foodName}
                    onChange={(e) => setEditForm({ ...editForm, foodName: e.target.value })}
                    className="font-bold text-lg text-slate-900 border-b border-slate-300 pb-0.5 w-full focus:outline-none focus:border-emerald-500"
                  />
                ) : (
                  <h4 className="font-bold text-lg text-slate-900">{editForm.foodName}</h4>
                )}
                <p className="text-xs text-slate-500 mt-0.5">
                  推估總重：
                  {editMode ? (
                    <input
                      type="number"
                      value={editForm.estimatedWeightG}
                      onChange={(e) => handleWeightChange(e.target.value)}
                      className="w-16 text-center font-semibold text-slate-800 border-b border-slate-300 focus:outline-none focus:border-emerald-500 mx-1"
                    />
                  ) : (
                    <span className="font-semibold text-slate-700">{editForm.estimatedWeightG}</span>
                  )}
                  g
                </p>
              </div>

              {/* Calories Badge */}
              <div className="text-right bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl">
                <span className="text-xs text-amber-700 block font-medium">總熱量</span>
                {editMode ? (
                  <input
                    type="number"
                    value={editForm.calories}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = Number(val);
                      setEditForm(prev => ({
                        ...prev,
                        calories: val,
                        baseCalories: !isNaN(num) && num > 0 ? num : prev.baseCalories,
                        baseWeightG: Number(prev.estimatedWeightG) > 0 ? Number(prev.estimatedWeightG) : prev.baseWeightG
                      }));
                    }}
                    className="w-16 text-center font-black text-xl text-amber-600 bg-transparent border-b border-amber-300 focus:outline-none"
                  />
                ) : (
                  <span className="font-black text-2xl text-amber-600">{editForm.calories}</span>
                )}
                <span className="text-[11px] text-amber-700 ml-0.5">kcal</span>
              </div>
            </div>

            {/* Macros 4-Grid */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-rose-50 border border-rose-100 p-2 rounded-2xl text-center">
                <span className="text-[11px] text-rose-600 block font-medium">蛋白質</span>
                {editMode ? (
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.proteinG}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = Number(val);
                      setEditForm(prev => ({
                        ...prev,
                        proteinG: val,
                        baseProteinG: !isNaN(num) && num >= 0 ? num : prev.baseProteinG,
                        baseWeightG: Number(prev.estimatedWeightG) > 0 ? Number(prev.estimatedWeightG) : prev.baseWeightG
                      }));
                    }}
                    className="w-12 text-center text-sm font-bold text-rose-700 bg-transparent border-b border-rose-300 focus:outline-none"
                  />
                ) : (
                  <span className="text-base font-bold text-rose-700">{editForm.proteinG}</span>
                )}
                <span className="text-[10px] text-rose-500 block">g</span>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-2 rounded-2xl text-center">
                <span className="text-[11px] text-amber-600 block font-medium">碳水</span>
                {editMode ? (
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.carbsG}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = Number(val);
                      setEditForm(prev => ({
                        ...prev,
                        carbsG: val,
                        baseCarbsG: !isNaN(num) && num >= 0 ? num : prev.baseCarbsG,
                        baseWeightG: Number(prev.estimatedWeightG) > 0 ? Number(prev.estimatedWeightG) : prev.baseWeightG
                      }));
                    }}
                    className="w-12 text-center text-sm font-bold text-amber-700 bg-transparent border-b border-amber-300 focus:outline-none"
                  />
                ) : (
                  <span className="text-base font-bold text-amber-700">{editForm.carbsG}</span>
                )}
                <span className="text-[10px] text-amber-500 block">g</span>
              </div>

              <div className="bg-cyan-50 border border-cyan-100 p-2 rounded-2xl text-center">
                <span className="text-[11px] text-cyan-600 block font-medium">脂肪</span>
                {editMode ? (
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.fatG}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = Number(val);
                      setEditForm(prev => ({
                        ...prev,
                        fatG: val,
                        baseFatG: !isNaN(num) && num >= 0 ? num : prev.baseFatG,
                        baseWeightG: Number(prev.estimatedWeightG) > 0 ? Number(prev.estimatedWeightG) : prev.baseWeightG
                      }));
                    }}
                    className="w-12 text-center text-sm font-bold text-cyan-700 bg-transparent border-b border-cyan-300 focus:outline-none"
                  />
                ) : (
                  <span className="text-base font-bold text-cyan-700">{editForm.fatG}</span>
                )}
                <span className="text-[10px] text-cyan-500 block">g</span>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-2xl text-center">
                <span className="text-[11px] text-emerald-600 block font-medium">纖維</span>
                {editMode ? (
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.fiberG}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = Number(val);
                      setEditForm(prev => ({
                        ...prev,
                        fiberG: val,
                        baseFiberG: !isNaN(num) && num >= 0 ? num : prev.baseFiberG,
                        baseWeightG: Number(prev.estimatedWeightG) > 0 ? Number(prev.estimatedWeightG) : prev.baseWeightG
                      }));
                    }}
                    className="w-12 text-center text-sm font-bold text-emerald-700 bg-transparent border-b border-emerald-300 focus:outline-none"
                  />
                ) : (
                  <span className="text-base font-bold text-emerald-700">{editForm.fiberG}</span>
                )}
                <span className="text-[10px] text-emerald-500 block">g</span>
              </div>
            </div>

            {/* Ingredients Breakdown */}
            {editForm.ingredients && editForm.ingredients.length > 0 && (
              <div className="bg-slate-50 rounded-2xl p-3 text-xs border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-1.5">🥗 細項食材拆解：</span>
                <div className="space-y-1">
                  {editForm.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600">
                      <span>• {ing.name} ({ing.weight_g}g)</span>
                      <span className="font-medium text-slate-800">{ing.calories} kcal</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence Note */}
            {editForm.confidenceNote && (
              <p className="text-xs text-slate-500 bg-slate-50/60 p-2.5 rounded-xl italic border border-slate-100">
                💡 判斷備註：{editForm.confidenceNote}
              </p>
            )}

            {/* Save Button */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveMeal}
                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition active:scale-98"
              >
                <Check size={18} />
                <span>存入 {editForm.date === todayStr ? '今日' : editForm.date} 紀錄</span>
              </button>
              <button
                onClick={() => {
                  setAnalysisResult(null);
                  setEditForm(null);
                }}
                className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-sm transition"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📅 Date Selector Banner (下移至飲食明細上方) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 flex items-center justify-between gap-2">
        <button
          onClick={handlePrevDay}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition active:scale-95"
          title="前一天"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-emerald-600 shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-bold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          />
          {selectedDate === todayStr ? (
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
              今天
            </span>
          ) : (
            <button
              onClick={handleToday}
              className="text-[11px] font-medium text-emerald-600 hover:underline flex items-center gap-0.5"
            >
              <RotateCcw size={12} />
              回今天
            </button>
          )}
        </div>

        <button
          onClick={handleNextDay}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition active:scale-95"
          title="後一天"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Selected Date Meals List */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Clock size={18} className="text-slate-500" />
            <span>{selectedDate === todayStr ? '今日' : selectedDate} 飲食明細</span>
            <span className="text-xs font-normal text-slate-400">({meals.length} 餐)</span>
          </h3>
          <span className="text-xs text-slate-600 font-bold bg-slate-100 px-2.5 py-1 rounded-lg">
            共 {totalDateCalories} kcal
          </span>
        </div>

        {meals.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            <p className="text-sm font-medium text-slate-500 mb-1">
              {selectedDate} 尚未登錄任何飲食
            </p>
            <p>可直接在上方的拍照或文字框登錄此日期的餐點！</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {meals.map(meal => (
              <div key={meal.id} className="py-3.5 flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg shrink-0 ${
                    meal.mealType === 'breakfast' ? 'bg-amber-50 text-amber-700' :
                    meal.mealType === 'lunch' ? 'bg-emerald-50 text-emerald-700' :
                    meal.mealType === 'dinner' ? 'bg-indigo-50 text-indigo-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {meal.mealType === 'breakfast' ? '早餐' : meal.mealType === 'lunch' ? '午餐' : meal.mealType === 'dinner' ? '晚餐' : '點心'}
                  </span>
                  <div className="truncate flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{meal.foodName}</p>
                    <p className="text-xs text-slate-400">
                      {meal.time} · {meal.estimatedWeightG}g · P:{meal.macros?.proteinG || 0} C:{meal.macros?.carbsG || 0} F:{meal.macros?.fatG || 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-sm font-bold text-amber-600 mr-1.5">
                    {meal.calories} <span className="text-[10px] font-normal text-slate-400">kcal</span>
                  </span>

                  {/* ✏️ Edit Existing Meal Button */}
                  <button
                    onClick={() => handleStartEditMeal(meal)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title="修改此餐紀錄"
                  >
                    <Edit3 size={16} />
                  </button>

                  {/* 🗑️ Delete Button */}
                  <button
                    onClick={() => {
                      if (window.confirm(`確定要刪除「${meal.foodName}」嗎？`)) {
                        onMealDeleted(meal.id);
                      }
                    }}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                    title="刪除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✏️ Modal: 修改過去/指定飲食紀錄 */}
      {editingMeal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Edit3 size={18} className="text-indigo-600" />
                修改飲食紀錄
              </h3>
              <button
                onClick={() => setEditingMeal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">日期 (可調整日期)</label>
                  <input
                    type="date"
                    value={editingMeal.date}
                    onChange={(e) => setEditingMeal({ ...editingMeal, date: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">時間</label>
                  <input
                    type="time"
                    value={editingMeal.time}
                    onChange={(e) => setEditingMeal({ ...editingMeal, time: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Meal Type */}
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">餐別</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'breakfast', label: '早餐' },
                    { id: 'lunch', label: '午餐' },
                    { id: 'dinner', label: '晚餐' },
                    { id: 'snack', label: '點心' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setEditingMeal({ ...editingMeal, mealType: t.id })}
                      className={`text-xs py-1.5 rounded-xl font-medium transition ${
                        editingMeal.mealType === t.id
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Food Name */}
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">餐點名稱</label>
                <input
                  type="text"
                  value={editingMeal.foodName}
                  onChange={(e) => setEditingMeal({ ...editingMeal, foodName: e.target.value })}
                  className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Weight and Calories */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">重量 (克 g)</label>
                  <input
                    type="number"
                    value={editingMeal.estimatedWeightG}
                    onChange={(e) => handleEditingWeightChange(e.target.value)}
                    className="w-full text-sm font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-500 text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">調整重量將連動等比換算</span>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">總熱量 (kcal)</label>
                  <input
                    type="number"
                    value={editingMeal.calories}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = Number(val);
                      setEditingMeal(prev => ({
                        ...prev,
                        calories: val,
                        baseCalories: !isNaN(num) && num > 0 ? num : prev.baseCalories,
                        baseWeightG: Number(prev.estimatedWeightG) > 0 ? Number(prev.estimatedWeightG) : prev.baseWeightG
                      }));
                    }}
                    className="w-full text-sm font-black px-3 py-2 rounded-xl border border-amber-200 bg-amber-50/50 focus:outline-none focus:border-amber-500 text-amber-600"
                  />
                </div>
              </div>

              {/* Macros */}
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1.5">三大營養素與纖維 (克)</label>
                <div className="grid grid-cols-4 gap-1.5">
                  <div className="bg-rose-50/70 p-2 rounded-xl border border-rose-100 text-center">
                    <span className="text-[10px] text-rose-600 block font-medium">蛋白質</span>
                    <input
                      type="number"
                      step="0.1"
                      value={editingMeal.proteinG}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = Number(val);
                        setEditingMeal(prev => ({
                          ...prev,
                          proteinG: val,
                          baseProteinG: !isNaN(num) && num >= 0 ? num : prev.baseProteinG,
                          baseWeightG: Number(prev.estimatedWeightG) > 0 ? Number(prev.estimatedWeightG) : prev.baseWeightG
                        }));
                      }}
                      className="w-full text-center text-xs font-bold text-rose-700 bg-transparent border-b border-rose-200 focus:outline-none"
                    />
                  </div>
                  <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-100 text-center">
                    <span className="text-[10px] text-amber-600 block font-medium">碳水</span>
                    <input
                      type="number"
                      step="0.1"
                      value={editingMeal.carbsG}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = Number(val);
                        setEditingMeal(prev => ({
                          ...prev,
                          carbsG: val,
                          baseCarbsG: !isNaN(num) && num >= 0 ? num : prev.baseCarbsG,
                          baseWeightG: Number(prev.estimatedWeightG) > 0 ? Number(prev.estimatedWeightG) : prev.baseWeightG
                        }));
                      }}
                      className="w-full text-center text-xs font-bold text-amber-700 bg-transparent border-b border-amber-200 focus:outline-none"
                    />
                  </div>
                  <div className="bg-cyan-50/70 p-2 rounded-xl border border-cyan-100 text-center">
                    <span className="text-[10px] text-cyan-600 block font-medium">脂肪</span>
                    <input
                      type="number"
                      step="0.1"
                      value={editingMeal.fatG}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = Number(val);
                        setEditingMeal(prev => ({
                          ...prev,
                          fatG: val,
                          baseFatG: !isNaN(num) && num >= 0 ? num : prev.baseFatG,
                          baseWeightG: Number(prev.estimatedWeightG) > 0 ? Number(prev.estimatedWeightG) : prev.baseWeightG
                        }));
                      }}
                      className="w-full text-center text-xs font-bold text-cyan-700 bg-transparent border-b border-cyan-200 focus:outline-none"
                    />
                  </div>
                  <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100 text-center">
                    <span className="text-[10px] text-emerald-600 block font-medium">纖維</span>
                    <input
                      type="number"
                      step="0.1"
                      value={editingMeal.fiberG}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = Number(val);
                        setEditingMeal(prev => ({
                          ...prev,
                          fiberG: val,
                          baseFiberG: !isNaN(num) && num >= 0 ? num : prev.baseFiberG,
                          baseWeightG: Number(prev.estimatedWeightG) > 0 ? Number(prev.estimatedWeightG) : prev.baseWeightG
                        }));
                      }}
                      className="w-full text-center text-xs font-bold text-emerald-700 bg-transparent border-b border-emerald-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">備註</label>
                <input
                  type="text"
                  value={editingMeal.confidenceNote}
                  onChange={(e) => setEditingMeal({ ...editingMeal, confidenceNote: e.target.value })}
                  placeholder="可選填備註或成分"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingMeal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                取消
              </button>
              <button
                onClick={handleSaveUpdatedMeal}
                disabled={isSavingEdit}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check size={15} />
                <span>{isSavingEdit ? '儲存中...' : '確認儲存修改'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
