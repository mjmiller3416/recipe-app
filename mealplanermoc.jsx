import React, { useState } from 'react';

const MealPlannerRefined = () => {
  const [selectedIndex, setSelectedIndex] = useState(2);
  
  const meals = [
    { id: 1, day: 'Monday', name: 'Noodles with Garlicky Cream Sauce', time: '30m', servings: 4, favorite: false, inCart: true, completed: false, image: '🍝', sides: ['Salad Kit'] },
    { id: 2, day: 'Tuesday', name: 'Chicken Tetrazzini', time: '50m', servings: 6, favorite: true, inCart: true, completed: false, image: '🍗', sides: ['Garlic Bread', 'Veggies'] },
    { id: 3, day: 'Wednesday', name: 'Bruschetta Shrimp Pasta', time: '35m', servings: 4, favorite: true, inCart: true, completed: false, image: '🦐', sides: ['Salad Kit', 'Red Lobster Biscuits'] },
    { id: 4, day: 'Thursday', name: 'Spinach Stuffed Chicken', time: '1h', servings: 4, favorite: false, inCart: true, completed: false, image: '🥬', sides: ['Mashed Potatoes'] },
    { id: 5, day: 'Friday', name: 'Meatloaf', time: '1h 30m', servings: 6, favorite: true, inCart: false, completed: false, image: '🍖', sides: ['BBQ Sauce', 'Potatoes', 'Veggies'] },
    { id: 6, day: 'Saturday', name: 'Chicken Chimichangas', time: '1h', servings: 4, favorite: false, inCart: false, completed: false, image: '🌯', sides: [] },
    // Completed meals
    { id: 7, day: 'Completed', name: 'Ribeye Steak', time: '45m', servings: 2, favorite: true, inCart: true, completed: true, image: '🥩', sides: ['Garlic Butter Potatoes'] },
    { id: 8, day: 'Completed', name: 'Korean Beef Bowl', time: '40m', servings: 4, favorite: false, inCart: true, completed: true, image: '🍚', sides: [] },
  ];
  
  const activeMeals = meals.filter(m => !m.completed);
  const completedMeals = meals.filter(m => m.completed);
  const selectedMeal = meals[selectedIndex];

  // First two meals get larger cards
  const MealCard = ({ meal, index, isSelected, isLarge, onSelect }) => {
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
          className={`w-full flex items-center justify-center ${isLarge ? 'h-40 text-6xl' : 'h-32 text-5xl'} ${isCompleted ? 'grayscale' : ''}`}
          style={{ backgroundColor: '#2F2F2F' }}
        >
          {meal.image}
        </div>
        
        {/* Content */}
        <div className="p-3">
          <h3 className={`font-semibold text-white truncate mb-1 ${isLarge ? 'text-base' : 'text-sm'}`}>
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
        
        {/* Completed badge */}
        {isCompleted && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-zinc-700 text-xs text-zinc-400">
            Done
          </div>
        )}
      </button>
    );
  };

  const AddMealCard = ({ isLarge }) => (
    <button 
      className={`w-full rounded-xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center gap-2 text-zinc-500 hover:border-purple-500 hover:text-purple-400 transition-colors ${isLarge ? 'h-52' : 'h-44'}`}
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
        <button className="flex items-center gap-2 text-zinc-400 hover:text-zinc-300 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear Completed
        </button>
      </div>
      
      {/* Main Content */}
      <div className="flex gap-6">
        {/* Left: Meal Grid */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white mb-4">This Week's Menu</h2>
          
          {/* First row - Large cards (Monday/Tuesday) */}
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <span className="text-sm text-zinc-400 mb-2 block">Monday</span>
              <MealCard 
                meal={activeMeals[0]} 
                index={0} 
                isSelected={selectedIndex === 0}
                isLarge={true}
                onSelect={setSelectedIndex}
              />
            </div>
            <div>
              <span className="text-sm text-zinc-400 mb-2 block">Tuesday</span>
              <MealCard 
                meal={activeMeals[1]} 
                index={1} 
                isSelected={selectedIndex === 1}
                isLarge={true}
                onSelect={setSelectedIndex}
              />
            </div>
          </div>
          
          {/* Remaining days - Smaller cards */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            {activeMeals.slice(2).map((meal, idx) => {
              const actualIndex = idx + 2;
              const days = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
              return (
                <div key={meal.id}>
                  <span className="text-sm text-zinc-400 mb-2 block">{days[idx]}</span>
                  <MealCard 
                    meal={meal} 
                    index={actualIndex} 
                    isSelected={selectedIndex === actualIndex}
                    isLarge={false}
                    onSelect={setSelectedIndex}
                  />
                </div>
              );
            })}
            {/* Add meal slot if less than 7 active meals */}
            {activeMeals.length < 7 && (
              <div>
                <span className="text-sm text-zinc-400 mb-2 block">
                  {['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][activeMeals.length - 2] || 'Sunday'}
                </span>
                <AddMealCard isLarge={false} />
              </div>
            )}
          </div>
          
          {/* Completed Section */}
          {completedMeals.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Completed ({completedMeals.length})
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {completedMeals.map((meal, idx) => (
                  <MealCard 
                    key={meal.id}
                    meal={meal} 
                    index={activeMeals.length + idx} 
                    isSelected={selectedIndex === activeMeals.length + idx}
                    isLarge={false}
                    onSelect={setSelectedIndex}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Right: Selected Meal Panel */}
        <div className="w-80 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white mb-4">Selected Meal</h2>
          
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#252525' }}>
            {/* Image */}
            <div 
              className={`h-44 flex items-center justify-center text-7xl ${selectedMeal?.completed ? 'grayscale opacity-50' : ''}`}
              style={{ backgroundColor: '#2F2F2F' }}
            >
              {selectedMeal?.image}
            </div>
            
            {/* Details */}
            <div className="p-4">
              <h3 className="text-xl font-semibold text-white mb-2">{selectedMeal?.name}</h3>
              
              <div className="flex items-center gap-3 text-sm text-zinc-400 mb-4">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {selectedMeal?.servings} servings
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {selectedMeal?.time} total
                </span>
              </div>
              
              {/* Sides */}
              <div className="space-y-2 mb-4">
                {selectedMeal?.sides.map((side, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded-lg"
                    style={{ backgroundColor: '#2F2F2F' }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center text-lg">
                      🥗
                    </div>
                    <span className="text-sm text-white">{side}</span>
                  </div>
                ))}
                
                {/* Add Side button */}
                {!selectedMeal?.completed && (
                  <button className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-zinc-600 text-zinc-500 hover:border-purple-500 hover:text-purple-400 transition-colors">
                    <span>+</span>
                    <span className="text-sm">Add Side</span>
                  </button>
                )}
              </div>
              
              {/* Actions */}
              {!selectedMeal?.completed ? (
                <div className="space-y-2 pt-4 border-t border-zinc-700">
                  <button className="w-full px-4 py-2.5 rounded-lg font-medium text-sm bg-purple-500 text-white hover:bg-purple-600 transition-colors">
                    Mark Complete
                  </button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      className="px-4 py-2.5 rounded-lg font-medium text-sm text-zinc-300 transition-colors"
                      style={{ backgroundColor: '#2F2F2F', border: '1px solid #3F3F46' }}
                    >
                      Edit Meal
                    </button>
                    <button 
                      className="px-4 py-2.5 rounded-lg font-medium text-sm text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
                      style={{ backgroundColor: '#2F2F2F', border: '1px solid #3F3F46' }}
                    >
                      <span className={selectedMeal?.favorite ? 'text-red-400' : ''}>
                        {selectedMeal?.favorite ? '♥' : '♡'}
                      </span>
                      {selectedMeal?.favorite ? 'Unfavorite' : 'Favorite'}
                    </button>
                  </div>
                  
                  <button 
                    className="w-full px-4 py-2.5 rounded-lg font-medium text-sm text-red-400 transition-colors hover:bg-red-400/10"
                    style={{ border: '1px solid rgba(248, 113, 113, 0.5)' }}
                  >
                    Remove from Menu
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-zinc-700">
                  <div className="flex items-center justify-center gap-2 text-zinc-500 mb-3">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">Completed</span>
                  </div>
                  <button 
                    className="w-full px-4 py-2.5 rounded-lg font-medium text-sm text-zinc-400 transition-colors hover:text-zinc-300"
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
    </div>
  );
};

export default MealPlannerRefined;