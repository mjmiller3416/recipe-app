import React, { useState } from 'react';
import { ShoppingCart, Check, ChevronDown, ChevronUp, Trash2, Plus, X, Filter } from 'lucide-react';

// Mock data
const initialCategories = [
  {
    id: 'bakery',
    name: 'Bakery',
    emoji: '🥖',
    items: [
      { id: 1, name: 'Corn Bread', recipeId: 'chili', qty: '1', unit: 'package', collected: false, isManual: false },
      { id: 2, name: 'Hamburger Buns', recipeId: 'burgers', qty: '2', unit: 'packages', collected: false, isManual: false },
      { id: 3, name: 'Sourdough Loaf', recipeId: null, qty: '1', unit: 'loaf', collected: false, isManual: true },
    ]
  },
  {
    id: 'dairy',
    name: 'Dairy',
    emoji: '🧀',
    items: [
      { id: 4, name: 'Mild Cheddar Shredded Cheese', recipeId: 'chili', qty: '1', unit: 'cup', collected: false, isManual: false },
      { id: 5, name: 'American Cheese', recipeId: 'burgers', qty: '8', unit: 'slices', collected: true, isManual: false },
      { id: 6, name: 'Sour Cream', recipeId: 'chili', qty: '1', unit: 'cup', collected: true, isManual: false },
      { id: 7, name: 'Butter', recipeId: null, qty: '1', unit: 'stick', collected: false, isManual: true },
    ]
  },
  {
    id: 'produce',
    name: 'Produce',
    emoji: '🥬',
    items: [
      { id: 8, name: 'Yellow Onion', recipeId: 'chili', qty: '1', unit: 'large', collected: false, isManual: false },
      { id: 9, name: 'Tomatoes', recipeId: 'burgers', qty: '2', unit: 'whole', collected: true, isManual: false },
      { id: 10, name: 'Lettuce', recipeId: 'burgers', qty: '1', unit: 'head', collected: false, isManual: false },
      { id: 11, name: 'Jalapeños', recipeId: 'chili', qty: '2', unit: 'whole', collected: false, isManual: false },
      { id: 12, name: 'Avocado', recipeId: 'salad', qty: '2', unit: 'whole', collected: false, isManual: false },
      { id: 13, name: 'Lime', recipeId: 'salad', qty: '1', unit: 'whole', collected: false, isManual: false },
    ]
  },
  {
    id: 'meat',
    name: 'Meat',
    emoji: '🥩',
    items: [
      { id: 14, name: 'Ground Beef', recipeId: 'burgers', qty: '2', unit: 'lbs', collected: false, isManual: false },
      { id: 15, name: 'Ground Beef', recipeId: 'chili', qty: '1', unit: 'lb', collected: false, isManual: false },
      { id: 16, name: 'Bacon', recipeId: 'burgers', qty: '1', unit: 'package', collected: true, isManual: false },
    ]
  },
  {
    id: 'pantry',
    name: 'Pantry',
    emoji: '🫙',
    items: [
      { id: 17, name: 'Kidney Beans', recipeId: 'chili', qty: '2', unit: 'cans', collected: false, isManual: false },
      { id: 18, name: 'Diced Tomatoes', recipeId: 'chili', qty: '2', unit: 'cans', collected: false, isManual: false },
      { id: 19, name: 'Chili Powder', recipeId: 'chili', qty: '3', unit: 'tbsp', collected: true, isManual: false },
    ]
  }
];

const recipes = [
  { id: 'chili', name: 'Chili', emoji: '🌶️' },
  { id: 'burgers', name: 'Classic Burgers', emoji: '🍔' },
  { id: 'salad', name: 'Avocado Salad', emoji: '🥗' },
];

const categoryOptions = [
  { id: 'bakery', name: 'Bakery', emoji: '🥖' },
  { id: 'dairy', name: 'Dairy', emoji: '🧀' },
  { id: 'produce', name: 'Produce', emoji: '🥬' },
  { id: 'meat', name: 'Meat', emoji: '🥩' },
  { id: 'pantry', name: 'Pantry', emoji: '🫙' },
  { id: 'frozen', name: 'Frozen', emoji: '🧊' },
  { id: 'beverages', name: 'Beverages', emoji: '🥤' },
  { id: 'other', name: 'Other', emoji: '📦' },
];

const qtyOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '12', '16', '24'];

const unitOptions = [
  'item',
  'items',
  'lb',
  'lbs',
  'oz',
  'g',
  'kg',
  'cup',
  'cups',
  'tbsp',
  'tsp',
  'can',
  'cans',
  'package',
  'packages',
  'bottle',
  'bottles',
  'bag',
  'bags',
  'box',
  'boxes',
  'bunch',
  'head',
  'slice',
  'slices',
  'whole',
  'dozen',
  'pint',
  'quart',
  'gallon',
];

export default function ShoppingListMockup() {
  const [categories, setCategories] = useState(initialCategories);
  const [expandedCategories, setExpandedCategories] = useState(
    initialCategories.reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {})
  );
  const [filterRecipeId, setFilterRecipeId] = useState(null);
  
  // Quick add state
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddQty, setQuickAddQty] = useState('1');
  const [quickAddUnit, setQuickAddUnit] = useState('item');
  const [quickAddCategory, setQuickAddCategory] = useState('other');
  
  // Dropdown visibility
  const [showQtySelect, setShowQtySelect] = useState(false);
  const [showUnitSelect, setShowUnitSelect] = useState(false);
  const [showCategorySelect, setShowCategorySelect] = useState(false);

  const toggleItem = (categoryId, itemId) => {
    setCategories(cats => cats.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => 
            item.id === itemId ? { ...item, collected: !item.collected } : item
          )
        };
      }
      return cat;
    }));
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const closeAllDropdowns = () => {
    setShowQtySelect(false);
    setShowUnitSelect(false);
    setShowCategorySelect(false);
  };

  const handleQuickAdd = () => {
    if (!quickAddName.trim()) return;
    
    const categoryOption = categoryOptions.find(c => c.id === quickAddCategory);
    
    setCategories(cats => {
      const existingCategory = cats.find(c => c.id === quickAddCategory);
      
      if (existingCategory) {
        return cats.map(cat => {
          if (cat.id === quickAddCategory) {
            return {
              ...cat,
              items: [...cat.items, {
                id: Date.now(),
                name: quickAddName,
                qty: quickAddQty,
                unit: quickAddUnit,
                recipeId: null,
                collected: false,
                isManual: true,
              }]
            };
          }
          return cat;
        });
      } else {
        return [...cats, {
          id: quickAddCategory,
          name: categoryOption.name,
          emoji: categoryOption.emoji,
          items: [{
            id: Date.now(),
            name: quickAddName,
            qty: quickAddQty,
            unit: quickAddUnit,
            recipeId: null,
            collected: false,
            isManual: true,
          }]
        }];
      }
    });
    
    setExpandedCategories(prev => ({ ...prev, [quickAddCategory]: true }));
    setQuickAddName('');
    setQuickAddQty('1');
    setQuickAddUnit('item');
  };

  // Calculate totals
  const allItems = categories.flatMap(c => c.items);
  const totalItems = allItems.length;
  const collectedItems = allItems.filter(i => i.collected).length;
  const remainingItems = totalItems - collectedItems;
  const progressPercent = totalItems > 0 ? Math.round((collectedItems / totalItems) * 100) : 0;

  // Calculate items per recipe
  const recipeItemCounts = recipes.map(recipe => ({
    ...recipe,
    itemCount: allItems.filter(i => i.recipeId === recipe.id).length,
    collectedCount: allItems.filter(i => i.recipeId === recipe.id && i.collected).length,
  }));
  
  const manualItemCount = allItems.filter(i => i.isManual).length;

  // Filter categories based on selected recipe
  const getFilteredItems = (items) => {
    if (!filterRecipeId) return items;
    if (filterRecipeId === 'manual') return items.filter(i => i.isManual);
    return items.filter(i => i.recipeId === filterRecipeId);
  };

  const colors = {
    background: '#1a1a1a',
    backgroundSubtle: '#212121',
    sidebar: '#252525',
    elevated: '#2f2f2f',
    hover: '#3d3d3d',
    border: '#3d3d3d',
    borderSubtle: '#2d2d2d',
    foreground: '#f5f5f5',
    muted: '#b3b3b3',
    primary: '#8b5cf6',
    primaryLight: '#a78bfa',
    primaryDark: '#7c3aed',
    secondary: '#14b8a6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  const shadowRaised = '0 1px 2px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.1)';

  // Dropdown component
  const Dropdown = ({ value, options, isOpen, onToggle, onSelect, width = '100px', renderOption }) => (
    <div style={{ position: 'relative' }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          closeAllDropdowns();
          onToggle();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '12px 12px',
          borderRadius: '10px',
          border: `1px solid ${isOpen ? colors.primary : colors.border}`,
          background: colors.elevated,
          color: colors.foreground,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          width: width,
          minWidth: width,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {renderOption ? renderOption(value) : value}
        </span>
        <ChevronUp 
          style={{ 
            width: '14px', 
            height: '14px', 
            color: colors.muted,
            transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
          }} 
        />
      </button>
      
      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: '8px',
            padding: '8px',
            borderRadius: '12px',
            background: colors.elevated,
            border: `1px solid ${colors.border}`,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
            minWidth: width,
            maxHeight: '240px',
            overflowY: 'auto',
            zIndex: 100,
          }}
        >
          {options.map(opt => {
            const optValue = typeof opt === 'object' ? opt.id : opt;
            const optLabel = renderOption ? renderOption(opt) : (typeof opt === 'object' ? opt.name : opt);
            return (
              <button
                key={optValue}
                onClick={() => {
                  onSelect(optValue);
                  onToggle();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: value === optValue ? `${colors.primary}20` : 'transparent',
                  color: value === optValue ? colors.primary : colors.foreground,
                  fontSize: '14px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.1s ease',
                }}
                onMouseOver={(e) => {
                  if (value !== optValue) {
                    e.currentTarget.style.background = colors.hover;
                  }
                }}
                onMouseOut={(e) => {
                  if (value !== optValue) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {optLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: colors.background,
        color: colors.foreground,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: '80px',
      }}
      onClick={closeAllDropdowns}
    >
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '32px 24px',
      }}>
        
        {/* Header - Full Width */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div 
                style={{
                  padding: '12px',
                  borderRadius: '16px',
                  background: `${colors.primary}20`,
                  color: colors.primary,
                }}
              >
                <ShoppingCart style={{ width: '28px', height: '28px' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>Shopping List</h1>
                <p style={{ fontSize: '14px', color: colors.muted, margin: '4px 0 0 0' }}>
                  Items from your meal plan
                </p>
              </div>
            </div>
            <button 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '10px',
                border: `1px solid ${colors.border}`,
                background: colors.elevated,
                color: colors.muted,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: shadowRaised,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = colors.hover;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = colors.elevated;
              }}
            >
              <Trash2 style={{ width: '16px', height: '16px' }} />
              Clear collected
            </button>
          </div>
        </div>

        {/* Stats Cards - Full Width */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {[
            { value: totalItems, label: 'Total Items', color: colors.primary },
            { value: collectedItems, label: 'Collected', color: colors.success },
            { value: remainingItems, label: 'Remaining', color: colors.warning },
          ].map((stat, i) => (
            <div 
              key={i}
              style={{
                padding: '20px',
                borderRadius: '16px',
                background: colors.elevated,
                border: `1px solid ${colors.border}`,
                boxShadow: shadowRaised,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'default',
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '14px', color: colors.muted }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Progress Bar - Full Width */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div 
            style={{
              flex: 1,
              height: '8px',
              background: colors.hover,
              borderRadius: '9999px',
              overflow: 'hidden',
            }}
          >
            <div 
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: colors.success,
                borderRadius: '9999px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <span style={{ fontSize: '14px', color: colors.muted, fontVariantNumeric: 'tabular-nums', minWidth: '40px' }}>
            {progressPercent}%
          </span>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'flex', gap: '24px' }}>
          
          {/* Main Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Active Filter Indicator */}
            {filterRecipeId && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  borderRadius: '10px',
                  background: `${colors.primary}15`,
                  border: `1px solid ${colors.primary}30`,
                }}
              >
                <Filter style={{ width: '16px', height: '16px', color: colors.primary }} />
                <span style={{ fontSize: '14px', color: colors.primary }}>
                  Filtering by: {filterRecipeId === 'manual' ? 'Manual items' : recipes.find(r => r.id === filterRecipeId)?.name}
                </span>
                <button
                  onClick={() => setFilterRecipeId(null)}
                  style={{
                    marginLeft: 'auto',
                    padding: '4px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'transparent',
                    color: colors.primary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            )}

            {/* Category Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {categories.map(category => {
                const filteredItems = getFilteredItems(category.items);
                if (filterRecipeId && filteredItems.length === 0) return null;
                
                const categoryCollected = filteredItems.filter(i => i.collected).length;
                const categoryTotal = filteredItems.length;
                const isExpanded = expandedCategories[category.id];
                const isComplete = categoryTotal > 0 && categoryCollected === categoryTotal;
                const categoryProgress = categoryTotal > 0 ? (categoryCollected / categoryTotal) * 100 : 0;

                return (
                  <div 
                    key={category.id}
                    style={{
                      borderRadius: '16px',
                      border: `1px solid ${isComplete ? `${colors.success}40` : colors.border}`,
                      background: isComplete ? `${colors.success}08` : colors.elevated,
                      boxShadow: shadowRaised,
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category.id)}
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: colors.foreground,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = `${colors.hover}50`}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>{category.emoji}</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 600, fontSize: '16px' }}>{category.name}</span>
                            {isComplete && (
                              <span 
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  background: `${colors.success}20`,
                                  color: colors.success,
                                  fontWeight: 600,
                                }}
                              >
                                Complete
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '13px', color: colors.muted, marginTop: '2px' }}>
                            {categoryCollected} of {categoryTotal} items
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div 
                          style={{
                            width: '100px',
                            height: '6px',
                            background: colors.hover,
                            borderRadius: '9999px',
                            overflow: 'hidden',
                          }}
                        >
                          <div 
                            style={{
                              height: '100%',
                              width: `${categoryProgress}%`,
                              background: isComplete ? colors.success : colors.primary,
                              borderRadius: '9999px',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                        {isExpanded ? (
                          <ChevronUp style={{ width: '20px', height: '20px', color: colors.muted }} />
                        ) : (
                          <ChevronDown style={{ width: '20px', height: '20px', color: colors.muted }} />
                        )}
                      </div>
                    </button>

                    {/* Items */}
                    {isExpanded && (
                      <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {filteredItems.map(item => (
                          <div
                            key={item.id}
                            onClick={() => toggleItem(category.id, item.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 16px',
                              borderRadius: '12px',
                              background: item.collected ? `${colors.background}80` : colors.hover,
                              cursor: 'pointer',
                              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                            onMouseOver={(e) => {
                              if (!item.collected) {
                                e.currentTarget.style.transform = 'translateX(4px)';
                              }
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateX(0)';
                            }}
                          >
                            {/* Checkbox */}
                            <div 
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '6px',
                                border: `2px solid ${item.collected ? colors.success : colors.muted}`,
                                background: item.collected ? colors.success : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                                flexShrink: 0,
                              }}
                            >
                              {item.collected && <Check style={{ width: '14px', height: '14px', color: 'white' }} />}
                            </div>
                            
                            {/* Quantity + Unit badge */}
                            <div 
                              style={{
                                padding: '4px 10px',
                                borderRadius: '8px',
                                background: item.collected ? colors.border : `${colors.primary}20`,
                                color: item.collected ? colors.muted : colors.primaryLight,
                                fontSize: '13px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {item.qty} {item.unit}
                            </div>
                            
                            {/* Item details */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div 
                                style={{
                                  fontWeight: 500,
                                  color: item.collected ? colors.muted : colors.foreground,
                                  textDecoration: item.collected ? 'line-through' : 'none',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {item.name}
                              </div>
                              <div 
                                style={{
                                  fontSize: '12px',
                                  color: item.isManual ? colors.secondary : (item.collected ? `${colors.muted}80` : colors.muted),
                                  marginTop: '2px',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {item.isManual ? 'Manual' : `from ${recipes.find(r => r.id === item.recipeId)?.name || 'Unknown'}`}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Sidebar - Recipes in this list */}
          <div style={{ width: '280px', flexShrink: 0 }}>
            <div 
              style={{
                position: 'sticky',
                top: '32px',
                padding: '20px',
                borderRadius: '16px',
                background: colors.elevated,
                border: `1px solid ${colors.border}`,
                boxShadow: shadowRaised,
              }}
            >
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: colors.muted, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Recipes in this list
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recipeItemCounts.map(recipe => (
                  <button
                    key={recipe.id}
                    onClick={() => setFilterRecipeId(filterRecipeId === recipe.id ? null : recipe.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '10px',
                      border: filterRecipeId === recipe.id ? `1px solid ${colors.primary}50` : `1px solid transparent`,
                      background: filterRecipeId === recipe.id ? `${colors.primary}15` : colors.hover,
                      cursor: 'pointer',
                      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                      textAlign: 'left',
                      width: '100%',
                    }}
                    onMouseOver={(e) => {
                      if (filterRecipeId !== recipe.id) {
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{recipe.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontWeight: 500, 
                        fontSize: '14px', 
                        color: filterRecipeId === recipe.id ? colors.primary : colors.foreground,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {recipe.name}
                      </div>
                      <div style={{ fontSize: '12px', color: colors.muted }}>
                        {recipe.collectedCount}/{recipe.itemCount} items
                      </div>
                    </div>
                  </button>
                ))}
                
                {/* Manual items */}
                {manualItemCount > 0 && (
                  <>
                    <div style={{ height: '1px', background: colors.border, margin: '8px 0' }} />
                    <button
                      onClick={() => setFilterRecipeId(filterRecipeId === 'manual' ? null : 'manual')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '10px',
                        border: filterRecipeId === 'manual' ? `1px solid ${colors.secondary}50` : `1px solid transparent`,
                        background: filterRecipeId === 'manual' ? `${colors.secondary}15` : colors.hover,
                        cursor: 'pointer',
                        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                        textAlign: 'left',
                        width: '100%',
                      }}
                      onMouseOver={(e) => {
                        if (filterRecipeId !== 'manual') {
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>✏️</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontWeight: 500, 
                          fontSize: '14px', 
                          color: filterRecipeId === 'manual' ? colors.secondary : colors.foreground,
                        }}>
                          Manual items
                        </div>
                        <div style={{ fontSize: '12px', color: colors.muted }}>
                          {manualItemCount} items
                        </div>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Quick Add Bar */}
      <div 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          background: colors.sidebar,
          borderTop: `1px solid ${colors.border}`,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Qty dropdown */}
          <Dropdown
            value={quickAddQty}
            options={qtyOptions}
            isOpen={showQtySelect}
            onToggle={() => setShowQtySelect(!showQtySelect)}
            onSelect={setQuickAddQty}
            width="75px"
          />
          
          {/* Unit dropdown */}
          <Dropdown
            value={quickAddUnit}
            options={unitOptions}
            isOpen={showUnitSelect}
            onToggle={() => setShowUnitSelect(!showUnitSelect)}
            onSelect={setQuickAddUnit}
            width="110px"
          />
          
          {/* Item name input */}
          <input
            type="text"
            placeholder="Item name"
            value={quickAddName}
            onChange={(e) => setQuickAddName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleQuickAdd();
            }}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '10px',
              border: `1px solid ${colors.border}`,
              background: colors.background,
              color: colors.foreground,
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = colors.primary}
            onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
          />
          
          {/* Category dropdown */}
          <Dropdown
            value={quickAddCategory}
            options={categoryOptions}
            isOpen={showCategorySelect}
            onToggle={() => setShowCategorySelect(!showCategorySelect)}
            onSelect={setQuickAddCategory}
            width="130px"
            renderOption={(opt) => typeof opt === 'object' ? opt.name : categoryOptions.find(c => c.id === opt)?.name || opt}
          />
          
          {/* Add button */}
          <button
            onClick={handleQuickAdd}
            disabled={!quickAddName.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '10px',
              border: 'none',
              background: quickAddName.trim() ? colors.primary : colors.hover,
              color: quickAddName.trim() ? 'white' : colors.muted,
              fontSize: '14px',
              fontWeight: 500,
              cursor: quickAddName.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: quickAddName.trim() ? shadowRaised : 'none',
            }}
            onMouseOver={(e) => {
              if (quickAddName.trim()) {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Plus style={{ width: '18px', height: '18px' }} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
