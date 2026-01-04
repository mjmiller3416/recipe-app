"use client";

import React, { useState } from 'react';

const MealPlannerHorizontal = () => {
  const [selectedIndex, setSelectedIndex] = useState(2);
  const [showCompleted, setShowCompleted] = useState(false);
  
  const meals = [
    { id: 1, name: 'Noodles with Garlicky Cream Sauce', time: '30m', servings: 4, favorite: false, inCart: true, completed: false, image: '🍝', sides: ['Salad Kit'] },
    { id: 2, name: 'Chicken Tetrazzini', time: '50m', servings: 6, favorite: true, inCart: true, completed: false, image: '🍗', sides: ['Garlic Bread', 'Veggies'] },
    { id: 3, name: 'Bruschetta Shrimp Pasta', time: '35m', servings: 4, favorite: true, inCart: true, completed: false, image: '🦐', sides: ['Salad Kit', 'Red Lobster Biscuits'] },
    { id: 4, name: 'Spinach Stuffed Chicken', time: '1h', servings: 4, favorite: false, inCart: true, completed: false, image: '🥬', sides: ['Mashed Potatoes'] },
    { id: 5, name: 'Meatloaf', time: '1h 30m', servings: 6, favorite: true, inCart: false, completed: false, image: '🍖', sides: ['BBQ Sauce', 'Potatoes', 'Veggies'] },
    { id: 6, name: 'Chicken Chimichangas', time: '1h', servings: 4, favorite: false, inCart: false, completed: false, image: '🌯', sides: [] },
    // Completed meals
    { id: 7, name: 'Ribeye Steak', time: '45m', servings: 2, favorite: true, inCart: true, completed: true, image: '🥩', sides: ['Garlic Butter Potatoes'] },
    { id: 8, name: 'Korean Beef Bowl', time: '40m', servings: 4, favorite: false, inCart: true, completed: true, image: '🍚', sides: [] },
  ];
  
  const activeMeals = meals.filter(m => !m.completed);
  const completedMeals = meals.filter(m => m.completed);
  const selectedMeal = meals[selectedIndex];

  const MealCard = ({ meal, index, isSelected, onSelect }: {
    meal: typeof meals[number];
    index: number;
    isSelected: boolean;
    onSelect: (index: number) => void;
  }) => {
    const isCompleted = meal.completed;
    
    return (
      <button
        onClick={() => onSelect(index)}
        className={`relative rounded-xl overflow-hidden transition-all duration-200 text-left w-full ${
          isSelected 
            ? 'ring-2 ring-purple-500' 
            : isCompleted 
              ? 'opacity-50 hover:opacity-70' 
              : 'hover:ring-1 hover:ring-zinc-600'
        }`}
        style={{ backgroundColor: '#252525' }}
      >
        {/* Image */}
        <div 
          className={`w-full h-28 flex items-center justify-center text-5xl ${isCompleted ? 'grayscale' : ''}`}
          style={{ backgroundColor: '#2F2F2F' }}
        >
          {meal.image}
        </div>
        
        {/* Content */}
        <div className="p-3">
          <h3 className="text-sm font-semibold text-white truncate mb-1">
            {meal.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {meal.servings} servings
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {meal.time}
            </span>
          </div>
        </div>
        
        {/* Status icons */}
        <div className="absolute top-2 right-2 flex gap-1">
          {meal.inCart && (
            <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
              <span className="text-teal-400 text-xs">🛒</span>
            </div>
          )}
          {meal.favorite && (
            <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
              <span className="text-red-400 text-xs">♥</span>
            </div>
          )}
        </div>
      </button>
    );
  };

  const AddMealCard = () => (
    <button 
      className="w-full h-44 rounded-xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center gap-2 text-zinc-500 hover:border-purple-500 hover:text-purple-400 transition-colors"
    >
      <span className="text-2xl">+</span>
      <span className="text-sm font-medium">Add Meal</span>
    </button>
  );
  
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#1A1A1A' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Meal Planner</h1>
          <p className="text-zinc-500 text-sm">Plan your weekly meals</p>
        </div>
        
        {/* Completed Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-300 text-sm px-3 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: showCompleted ? '#252525' : 'transparent' }}
          >
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Completed ({completedMeals.length})
            <svg className={`w-4 h-4 transition-transform ${showCompleted ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Dropdown */}
          {showCompleted && (
            <div 
              className="absolute right-0 top-full mt-2 w-72 rounded-xl shadow-xl border border-zinc-700 overflow-hidden z-50"
              style={{ backgroundColor: '#252525' }}
            >
              {completedMeals.length > 0 ? (
                <>
                  <div className="p-2 space-y-1">
                    {completedMeals.map((meal, idx) => (
                      <button
                        key={meal.id}
                        onClick={() => {
                          setSelectedIndex(activeMeals.length + idx);
                          setShowCompleted(false);
                        }}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl grayscale opacity-60"
                          style={{ backgroundColor: '#2F2F2F' }}
                        >
                          {meal.image}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-white truncate block">{meal.name}</span>
                          <span className="text-xs text-zinc-500">{meal.time} · {meal.servings} servings</span>
                        </div>
                        {meal.favorite && (
                          <span className="text-red-400 text-sm">♥</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-zinc-700 p-2">
                    <button className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear Completed
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-zinc-500 text-sm">
                  No completed meals yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* This Week's Menu - Full Width Grid */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">This Week's Menu</h2>
        
        <div className="grid grid-cols-4 gap-4">
          {activeMeals.map((meal, index) => (
            <MealCard 
              key={meal.id}
              meal={meal} 
              index={index} 
              isSelected={selectedIndex === index}
              onSelect={setSelectedIndex}
            />
          ))}
          <AddMealCard />
        </div>
      </div>
      
      {/* Selected Meal - Horizontal Layout */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-4">Selected Meal</h2>
        
        <div 
          className="rounded-xl overflow-hidden flex"
          style={{ backgroundColor: '#252525' }}
        >
          {/* Left: Image */}
          <div 
            className={`w-64 flex-shrink-0 flex items-center justify-center text-8xl ${selectedMeal?.completed ? 'grayscale opacity-50' : ''}`}
            style={{ backgroundColor: '#2F2F2F' }}
          >
            {selectedMeal?.image}
          </div>
          
          {/* Middle: Details & Sides */}
          <div className="flex-1 p-6 border-r border-zinc-700">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-semibold text-white mb-2">{selectedMeal?.name}</h3>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {selectedMeal?.servings} servings
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {selectedMeal?.time} total
                  </span>
                  {selectedMeal?.favorite && (
                    <span className="flex items-center gap-1.5 text-red-400">
                      ♥ Favorite
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Sides - Horizontal */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Sides</h4>
              <div className="flex gap-2 flex-wrap">
                {selectedMeal?.sides.map((side, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: '#2F2F2F' }}
                  >
                    <span className="text-base">🥗</span>
                    <span className="text-sm text-white">{side}</span>
                  </div>
                ))}
                {!selectedMeal?.completed && selectedMeal?.sides.length < 3 && (
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-zinc-600 text-zinc-500 hover:border-purple-500 hover:text-purple-400 transition-colors">
                    <span>+</span>
                    <span className="text-sm">Add Side</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* AI Suggestions - Moved here */}
            <div 
              className="rounded-xl p-4 border"
              style={{ backgroundColor: 'rgba(139, 92, 246, 0.08)', borderColor: 'rgba(139, 92, 246, 0.2)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-purple-400">✨</span>
                <h4 className="text-sm font-medium text-purple-300">AI Suggestions</h4>
              </div>
              <p className="text-sm text-purple-300/80 leading-relaxed">
                Try adding a squeeze of lemon juice to brighten the dish. A side of crusty bread would pair well.
              </p>
              <button className="mt-3 text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Get new suggestion
              </button>
            </div>
          </div>
          
          {/* Right: Stats & Actions */}
          <div className="w-80 flex-shrink-0 p-6 space-y-4">
            {/* Meal Stats */}
            <div 
              className="rounded-xl p-4 border"
              style={{ backgroundColor: 'rgba(20, 184, 166, 0.08)', borderColor: 'rgba(20, 184, 166, 0.2)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="text-sm font-medium text-teal-300">Meal Stats</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-teal-400/70">Times cooked</span>
                  <span className="text-teal-300 font-medium">4 times</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-teal-400/70">Last cooked</span>
                  <span className="text-teal-300 font-medium">2 weeks ago</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-teal-400/70">Added</span>
                  <span className="text-teal-300 font-medium">1 month ago</span>
                </div>
              </div>
            </div>
            
            {/* Actions - 2x2 Grid */}
            {!selectedMeal?.completed ? (
              <div className="grid grid-cols-2 gap-3">
                <button className="px-4 py-3 rounded-lg font-medium text-sm bg-purple-500 text-white hover:bg-purple-600 transition-colors">
                  Mark Complete
                </button>
                <button 
                  className="px-4 py-3 rounded-lg font-medium text-sm text-zinc-300 transition-colors"
                  style={{ backgroundColor: '#2F2F2F', border: '1px solid #3F3F46' }}
                >
                  Edit Meal
                </button>
                <button 
                  className="px-4 py-3 rounded-lg font-medium text-sm text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
                  style={{ backgroundColor: '#2F2F2F', border: '1px solid #3F3F46' }}
                >
                  <span className={selectedMeal?.favorite ? 'text-red-400' : ''}>
                    {selectedMeal?.favorite ? '♥' : '♡'}
                  </span>
                  {selectedMeal?.favorite ? 'Unfavorite' : 'Favorite'}
                </button>
                <button 
                  className="px-4 py-3 rounded-lg font-medium text-sm text-red-400 transition-colors hover:bg-red-400/10"
                  style={{ border: '1px solid rgba(248, 113, 113, 0.5)' }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-zinc-500 py-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Completed</span>
                </div>
                <button 
                  className="w-full px-4 py-3 rounded-lg font-medium text-sm text-zinc-400 transition-colors hover:text-zinc-300"
                  style={{ backgroundColor: '#2F2F2F', border: '1px solid #3F3F46' }}
                >
                  Add to Menu Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlannerHorizontal;