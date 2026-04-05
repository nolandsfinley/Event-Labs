# 🎬 Project Animation Guide

## Overview
The Events App now includes smooth entrance and exit animations when navigating between the Home (Library) view and the Editor view.

## Animation Details

### 1. **Entrance Animation** ✨
**Trigger:** Clicking a project or creating a new project
- **Visual:** Smooth zoom-in with fade effect
- **Scale:** 0.85 → 1.0
- **Duration:** 0.5 seconds
- **Easing:** `cubic-bezier(0.34, 1.56, 0.64, 1)` (bouncy spring effect)
- **CSS Class:** `.view-enter-animation`
- **Applied to:** Editor view container

```css
@keyframes viewEnterZoom {
    from { opacity: 0; transform: scale(0.85); }
    to { opacity: 1; transform: scale(1); }
}
```

### 2. **Exit Animation** 🚀
**Trigger:** Clicking "Back" button (← แฟ้มงาน)
- **Visual:** Smooth zoom-out with fade effect
- **Scale:** 1.0 → 0.9
- **Duration:** 0.5 seconds
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (smooth deceleration)
- **CSS Class:** `.view-exit-animation`
- **Applied to:** Home view container

```css
@keyframes viewExitZoom {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(0.9); }
}
```

### 3. **Card Hover Effects** 🎯
- **Scale:** Increases by 5% on hover (`hover:scale-105`)
- **Shadow:** Enhances shadow on hover
- **Transition:** Smooth cubic-bezier transition
- **Applied to:** Project cards in library view

## Implementation Architecture

### State Management
```javascript
const [isAnimating, setIsAnimating] = useState(false);
const [animationDirection, setAnimationDirection] = useState('enter'); // 'enter' or 'exit'
```

### Key Functions

**`loadLayout(l)`** - Triggered when clicking existing project
```javascript
setIsAnimating(true);
setAnimationDirection('enter');
setTimeout(() => {
    // Load project data
    setCurrentView('editor');
    setIsAnimating(false);
}, 50);
```

**`handleCreateNew()`** - Triggered when creating new project
```javascript
setIsAnimating(true);
setAnimationDirection('enter');
setTimeout(() => {
    // Initialize new project
    setCurrentView('editor');
    setIsAnimating(false);
}, 50);
```

**`goToHome()`** - Triggered when clicking Back button
```javascript
setIsAnimating(true);
setAnimationDirection('exit');
setTimeout(() => {
    setCurrentView('home');
    setIsAnimating(false);
}, 500);
```

## User Interactions

### Entering a Project
1. User sees library of projects on Home view
2. User hovers over a project card → Card scales up slightly
3. User clicks project card
4. Animation triggers: Zoom in + Fade in effect
5. Editor view appears with smooth animation

### Creating New Project
1. User clicks "สร้างงานใหม่" (Create New Project) button
2. Animation triggers: Zoom in + Fade in effect
3. New blank editor view appears

### Exiting Project (Return to Library)
1. User clicks "← แฟ้มงาน" (Back to Library) button
2. Animation triggers: Zoom out + Fade out effect
3. Home view returns with smooth animation

## Performance Considerations
- Animations use CSS transforms for GPU acceleration (better performance)
- Duration set to 0.5 seconds for snappy but not rushed feel
- `forwards` fill-mode ensures state persists after animation
- Minimal JavaScript overhead using simple state flags

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Uses standard CSS3 animations and transforms
- Fallback: If CSS animation not supported, views switch instantly

## Testing Checklist
- ✅ Click project card → See zoom-in animation
- ✅ Click "Create New" → See zoom-in animation
- ✅ Click "Back" button → See zoom-out animation
- ✅ Hover project cards → See scale + shadow effects
- ✅ Multiple rapid clicks → No animation glitches
- ✅ All transitions smooth without stuttering

## Files Modified
1. **app.js** - Added animation state, functions, and class bindings
2. **style.css** - Added keyframes and animation classes

## Future Enhancement Ideas
- Add slide-in/slide-out animations for sidebars
- Add staggered animations for project card lists
- Add micro-interactions on button clicks
- Add page transition animations for tab switching (meetings, schedule)
