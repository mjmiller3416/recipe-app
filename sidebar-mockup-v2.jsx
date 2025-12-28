import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  BookOpen, 
  ShoppingCart, 
  Plus, 
  Settings,
  ChefHat,
  Sun,
  Moon,
  Clock,
  Heart
} from 'lucide-react';

const NavItem = ({ icon: Icon, label, active, notification, theme, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const isDark = theme === 'dark';
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl relative group"
      style={{
        background: active 
          ? (isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)')
          : isHovered 
            ? (isDark ? 'rgba(63, 63, 70, 0.7)' : 'rgba(0, 0, 0, 0.05)')
            : 'transparent',
        color: active 
          ? '#a78bfa' 
          : isHovered 
            ? (isDark ? '#e4e4e7' : '#18181b')
            : (isDark ? '#a1a1aa' : '#71717a'),
        transform: isPressed 
          ? 'scale(0.98)' 
          : isHovered && !active 
            ? 'translateX(4px)' 
            : 'none',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Active indicator bar */}
      <div 
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '4px',
          height: active ? '24px' : '0px',
          borderRadius: '9999px',
          background: '#8b5cf6',
          opacity: active ? 1 : 0,
          transition: 'all 0.3s ease',
        }}
      />
      
      {/* Icon container */}
      <div 
        style={{
          position: 'relative',
          padding: '6px',
          borderRadius: '8px',
          background: active 
            ? 'rgba(139, 92, 246, 0.3)' 
            : isHovered 
              ? (isDark ? 'rgba(63, 63, 70, 0.5)' : 'rgba(0, 0, 0, 0.05)')
              : 'transparent',
          transition: 'all 0.2s ease',
        }}
      >
        <Icon style={{ width: '20px', height: '20px' }} />
        {active && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(139, 92, 246, 0.2)',
            borderRadius: '8px',
            filter: 'blur(8px)',
          }} />
        )}
      </div>
      
      <span style={{ fontWeight: 500, fontSize: '14px' }}>{label}</span>
      
      {/* Notification - dot style */}
      {notification === 'dot' && (
        <div 
          style={{
            marginLeft: 'auto',
            width: '8px',
            height: '8px',
            borderRadius: '9999px',
            background: '#2dd4bf',
            animation: 'pulse 2s infinite',
          }}
        />
      )}
      
      {/* Notification - count badge style */}
      {typeof notification === 'number' && (
        <div 
          style={{
            marginLeft: 'auto',
            minWidth: '20px',
            height: '20px',
            padding: '0 6px',
            borderRadius: '9999px',
            background: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {notification}
        </div>
      )}
    </button>
  );
};

const RecentRecipeChip = ({ name, emoji, theme }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isDark = theme === 'dark';
  
  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '8px',
        background: isDark 
          ? (isHovered ? 'rgba(63, 63, 70, 0.7)' : 'rgba(63, 63, 70, 0.5)')
          : (isHovered ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)'),
        border: `1px solid ${isDark 
          ? (isHovered ? 'rgba(82, 82, 91, 1)' : 'rgba(63, 63, 70, 0.5)')
          : (isHovered ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.08)')}`,
        color: isDark 
          ? (isHovered ? '#e4e4e7' : '#a1a1aa')
          : (isHovered ? '#18181b' : '#71717a'),
        fontSize: '14px',
        cursor: 'pointer',
        transform: isHovered ? 'translateY(-2px)' : 'none',
        boxShadow: isHovered 
          ? '0 4px 12px rgba(0, 0, 0, 0.15)' 
          : '0 1px 2px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <span>{emoji}</span>
      <span style={{ 
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        whiteSpace: 'nowrap' 
      }}>
        {name}
      </span>
    </button>
  );
};

const WeightedButton = ({ children, variant = 'primary', theme }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const isDark = theme === 'dark';
  
  const colors = {
    primary: { bg: '#8b5cf6', hover: '#a78bfa' },
    teal: { bg: '#0d9488', hover: '#14b8a6' },
  };
  
  const color = colors[variant];
  
  // Layered shadow for depth
  const restShadow = `
    0 1px 2px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 8px 16px rgba(0, 0, 0, 0.1)
  `;
  
  const hoverShadow = `
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 8px 16px rgba(0, 0, 0, 0.2),
    0 16px 32px rgba(0, 0, 0, 0.15)
  `;
  
  const pressedShadow = `
    0 1px 2px rgba(0, 0, 0, 0.2),
    inset 0 2px 4px rgba(0, 0, 0, 0.2)
  `;
  
  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        padding: '10px 20px',
        borderRadius: '10px',
        background: isHovered ? color.hover : color.bg,
        color: 'white',
        fontSize: '14px',
        fontWeight: 500,
        border: 'none',
        cursor: 'pointer',
        transform: isPressed 
          ? 'scale(0.96) translateY(1px)' 
          : isHovered 
            ? 'translateY(-2px)' 
            : 'none',
        boxShadow: isPressed ? pressedShadow : (isHovered ? hoverShadow : restShadow),
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </button>
  );
};

const BouncyButton = ({ children, theme }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        padding: '10px 20px',
        borderRadius: '10px',
        background: isHovered ? '#14b8a6' : '#0d9488',
        color: 'white',
        fontSize: '14px',
        fontWeight: 500,
        border: 'none',
        cursor: 'pointer',
        transform: isPressed 
          ? 'scale(0.92)' 
          : isHovered 
            ? 'scale(1.05)' 
            : 'scale(1)',
        boxShadow: isHovered 
          ? '0 8px 24px rgba(13, 148, 136, 0.4)' 
          : '0 4px 12px rgba(13, 148, 136, 0.3)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {children}
    </button>
  );
};

const FlatButton = ({ children, theme }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '10px 20px',
        borderRadius: '10px',
        background: isHovered ? '#a78bfa' : '#8b5cf6',
        color: 'white',
        fontSize: '14px',
        fontWeight: 500,
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.15s ease',
      }}
    >
      {children}
    </button>
  );
};

export default function SidebarMockup() {
  const [activeItem, setActiveItem] = useState('recipes');
  const [theme, setTheme] = useState('dark');
  const [cardHovered, setCardHovered] = useState(false);
  
  const isDark = theme === 'dark';
  
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'planner', icon: CalendarDays, label: 'Meal Planner', notification: 'dot' },
    { id: 'recipes', icon: BookOpen, label: 'Recipe Browser' },
    { id: 'shopping', icon: ShoppingCart, label: 'Shopping List', notification: 24 },
    { id: 'add', icon: Plus, label: 'Add Recipe' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];
  
  const recentRecipes = [
    { name: 'Chili', emoji: '🌶️' },
    { name: 'Burgers', emoji: '🍔' },
    { name: 'Caesar', emoji: '🥗' },
  ];

  // Theme colors
  const colors = {
    bg: isDark ? '#09090b' : '#fafafa',
    sidebarBg: isDark ? '#18181b' : '#ffffff',
    sidebarBorder: isDark ? 'rgba(39, 39, 42, 0.8)' : 'rgba(0, 0, 0, 0.08)',
    cardBg: isDark ? '#27272a' : '#ffffff',
    cardBorder: isDark ? '#3f3f46' : 'rgba(0, 0, 0, 0.08)',
    textPrimary: isDark ? '#fafafa' : '#18181b',
    textSecondary: isDark ? '#a1a1aa' : '#71717a',
    textMuted: isDark ? '#71717a' : '#a1a1aa',
  };

  // Sidebar shadow (more visible in light mode)
  const sidebarShadow = isDark 
    ? '4px 0 24px rgba(0, 0, 0, 0.3)'
    : '4px 0 24px rgba(0, 0, 0, 0.08)';

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: colors.bg,
      display: 'flex',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
      `}</style>
      
      {/* Sidebar */}
      <aside style={{
        width: '256px',
        background: colors.sidebarBg,
        borderRight: `1px solid ${colors.sidebarBorder}`,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: sidebarShadow,
        position: 'relative',
        zIndex: 10,
      }}>
        
        {/* Logo Area */}
        <div style={{ 
          padding: '16px', 
          borderBottom: `1px solid ${colors.sidebarBorder}` 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Logo with glow */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                inset: '-4px',
                background: 'rgba(139, 92, 246, 0.3)',
                borderRadius: '16px',
                filter: 'blur(12px)',
              }} />
              <div style={{
                position: 'relative',
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
              }}>
                <ChefHat style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
            </div>
            <div>
              <h1 style={{ 
                fontWeight: 700, 
                fontSize: '18px', 
                color: colors.textPrimary,
                margin: 0,
              }}>
                Meal Genie
              </h1>
              <p style={{ 
                fontSize: '12px', 
                color: colors.textMuted,
                margin: 0,
              }}>
                Your kitchen companion
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(item => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeItem === item.id}
              notification={item.notification}
              theme={theme}
              onClick={() => setActiveItem(item.id)}
            />
          ))}
        </nav>
        
        {/* Recent Recipes */}
        <div style={{ padding: '16px', borderTop: `1px solid ${colors.sidebarBorder}` }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: '12px' 
          }}>
            <Clock style={{ width: '16px', height: '16px', color: colors.textMuted }} />
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 600, 
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Recent
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {recentRecipes.map(recipe => (
              <RecentRecipeChip key={recipe.name} {...recipe} theme={theme} />
            ))}
          </div>
        </div>
        
        {/* Favorites */}
        <div style={{ padding: '16px', borderTop: `1px solid ${colors.sidebarBorder}` }}>
          <button style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            borderRadius: '12px',
            background: isDark ? 'rgba(20, 184, 166, 0.1)' : 'rgba(20, 184, 166, 0.08)',
            border: '1px solid rgba(20, 184, 166, 0.2)',
            color: '#14b8a6',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}>
            <Heart style={{ width: '16px', height: '16px' }} />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Quick Favorites</span>
            <span style={{ 
              marginLeft: 'auto',
              fontSize: '12px',
              background: 'rgba(20, 184, 166, 0.2)',
              padding: '2px 8px',
              borderRadius: '9999px',
            }}>
              12
            </span>
          </button>
        </div>
        
        {/* User Area */}
        <div style={{ padding: '12px', borderTop: `1px solid ${colors.sidebarBorder}` }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px',
            borderRadius: '12px',
            cursor: 'pointer',
          }}>
            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #14b8a6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
                color: 'white',
                boxShadow: `0 0 0 2px ${colors.sidebarBg}, 0 0 0 4px rgba(139, 92, 246, 0.3)`,
              }}>
                M
              </div>
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '12px',
                height: '12px',
                borderRadius: '9999px',
                background: '#22c55e',
                border: `2px solid ${colors.sidebarBg}`,
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ 
                fontSize: '14px', 
                fontWeight: 500, 
                color: colors.textPrimary,
                margin: 0,
              }}>Mitchell</p>
              <p style={{ 
                fontSize: '12px', 
                color: colors.textMuted,
                margin: 0,
              }}>Free Plan</p>
            </div>
          </div>
          
          {/* Theme Toggle */}
          <div style={{
            display: 'flex',
            gap: '4px',
            marginTop: '8px',
            padding: '4px',
            background: isDark ? 'rgba(39, 39, 42, 0.5)' : 'rgba(0, 0, 0, 0.05)',
            borderRadius: '8px',
          }}>
            <button
              onClick={() => setTheme('dark')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: theme === 'dark' 
                  ? (isDark ? '#3f3f46' : '#e4e4e7')
                  : 'transparent',
                color: theme === 'dark' ? colors.textPrimary : colors.textMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <Moon style={{ width: '16px', height: '16px' }} />
            </button>
            <button
              onClick={() => setTheme('light')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: theme === 'light' 
                  ? (isDark ? '#3f3f46' : '#ffffff')
                  : 'transparent',
                color: theme === 'light' ? colors.textPrimary : colors.textMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: theme === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Sun style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '640px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 700, 
            color: colors.textPrimary,
            marginBottom: '8px',
          }}>
            Weight & Depth Concepts
          </h2>
          <p style={{ color: colors.textSecondary, marginBottom: '32px' }}>
            Hover and click elements to feel the difference
          </p>
          
          {/* Shadow Depth Demo */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: colors.textSecondary,
              marginBottom: '16px',
            }}>
              Shadow Depth Levels
            </h3>
            <div style={{ display: 'flex', gap: '24px' }}>
              {[
                { label: 'Flat', shadow: 'none' },
                { label: 'Raised', shadow: '0 1px 2px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.08)' },
                { label: 'Elevated', shadow: '0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.15), 0 16px 32px rgba(0,0,0,0.1)' },
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '16px',
                    background: colors.cardBg,
                    border: `1px solid ${colors.cardBorder}`,
                    boxShadow: item.shadow,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    color: colors.textSecondary,
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>
          
          {/* Button Weight Demo */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: colors.textSecondary,
              marginBottom: '16px',
            }}>
              Button Weight (hover & click)
            </h3>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <FlatButton theme={theme}>Flat (typical)</FlatButton>
              <WeightedButton theme={theme}>With Weight</WeightedButton>
              <BouncyButton theme={theme}>Bouncy</BouncyButton>
            </div>
          </div>
          
          {/* Card Demo */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: colors.textSecondary,
              marginBottom: '16px',
            }}>
              Card with Physical Feel
            </h3>
            <div
              onMouseEnter={() => setCardHovered(true)}
              onMouseLeave={() => setCardHovered(false)}
              style={{
                padding: '20px',
                borderRadius: '16px',
                background: colors.cardBg,
                border: `1px solid ${cardHovered ? colors.textMuted : colors.cardBorder}`,
                boxShadow: cardHovered 
                  ? '0 4px 8px rgba(0,0,0,0.1), 0 12px 24px rgba(0,0,0,0.15), 0 24px 48px rgba(0,0,0,0.1)'
                  : '0 1px 3px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.06)',
                transform: cardHovered ? 'translateY(-4px)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <p style={{ color: colors.textSecondary, fontSize: '14px', margin: 0 }}>
                Hover me — notice how the shadow deepens and I lift slightly. 
                This creates the illusion of physical interaction, like picking up a card from a table.
              </p>
            </div>
          </div>
          
          {/* Notification Styles */}
          <div>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: colors.textSecondary,
              marginBottom: '16px',
            }}>
              Notification Styles
            </h3>
            <div style={{
              padding: '20px',
              borderRadius: '16px',
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
            }}>
              <p style={{ color: colors.textSecondary, fontSize: '14px', margin: '0 0 12px 0' }}>
                <strong style={{ color: colors.textPrimary }}>Dot (pulse):</strong> Soft nudge — "something needs attention" (see Meal Planner)
              </p>
              <p style={{ color: colors.textSecondary, fontSize: '14px', margin: 0 }}>
                <strong style={{ color: colors.textPrimary }}>Count badge:</strong> Specific quantity — "24 items in your list" (see Shopping List)
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
