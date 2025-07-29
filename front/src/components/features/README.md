# Leo Chat Widget

A floating, draggable chat widget component that provides access to Leo, your AI wellness mentor, on any screen.

## Features

- **Floating Design**: Appears as a floating button that expands into a chat interface
- **Fully Draggable**: Both the chat widget AND the floating button can be dragged anywhere on the screen
- **Position Persistence**: Remembers your preferred widget position across sessions
- **Session Persistence**: Maintains chat history across page refreshes using localStorage
- **Real-time Communication**: Uses WebSocket connection for instant messaging
- **Markdown Support**: Leo's responses support markdown formatting
- **Responsive**: Works on both desktop and mobile devices
- **Context-Aware**: Leo has access to your wellness data and can provide personalized insights

## Usage

### Basic Usage

```tsx
import { LeoChatWidget } from '../features';

function MyScreen() {
  return (
    <div>
      {/* Your screen content */}
      <LeoChatWidget />
    </div>
  );
}
```

### With Custom Styling

```tsx
<LeoChatWidget className="custom-styles" />
```

## Drag Functionality

### How to Drag

#### Chat Widget (When Open)
- **Click and hold** the header area of the widget
- **Drag** to move the widget to any position on the screen
- **Release** to drop the widget in the new position

#### Floating Button (When Closed)
- **Click and hold** the floating button
- **Drag** to move the button to any position on the screen
- **Release** to drop the button in the new position
- **Click** (without dragging) to open the chat widget

### Smart Interaction
- **Click vs Drag Detection**: The widget intelligently distinguishes between clicking to open and dragging to move
- **Position Synchronization**: The button appears exactly where the chat widget was positioned
- **Seamless Experience**: Drag the button, then click to open the widget in the new location

### Visual Indicators
- **Grab cursor**: Appears when hovering over draggable elements
- **Grabbing cursor**: Appears while actively dragging
- **"Drag" indicator**: Small icon and text in the widget header showing it's draggable
- **Tooltip**: Button shows "Click to open, drag to move" on hover

### Position Constraints
- Both widget and button automatically **stay within the viewport** bounds
- Cannot be dragged off-screen
- Responsive to different screen sizes
- Smart boundary calculations for different element sizes

## Integration

The LeoChatWidget is currently integrated into:
- `DailyPlanScreen.tsx` - For getting guidance on daily routines
- `ProgressTrackingScreen.tsx` - For discussing progress and insights

## Technical Details

- **WebSocket Connection**: Connects to the same chat endpoint as the main AIChatScreen
- **Session Management**: Uses separate session IDs for widget vs main chat
- **Authentication**: Uses Clerk authentication tokens
- **Error Handling**: Graceful handling of connection issues and errors
- **Reconnection**: Automatic reconnection with exponential backoff
- **Position Storage**: Saves widget position to localStorage per user
- **Drag Detection**: Intelligent click vs drag detection with movement threshold

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `""` | Additional CSS classes for styling |

## Dependencies

- `react-use-websocket` - For WebSocket communication
- `react-markdown` - For rendering Leo's markdown responses
- `lucide-react` - For icons (including GripVertical for drag indicator)
- `@clerk/clerk-react` - For authentication

## Styling

The widget uses Tailwind CSS classes and can be customized by passing additional classes via the `className` prop. The default styling includes:

- Purple to blue gradient theme
- Rounded corners and shadows
- Responsive sizing (320px width, 384px height for widget, 56px for button)
- Fixed positioning with drag capability
- Smooth transitions and hover effects

## Browser Compatibility

The drag functionality works in all modern browsers that support:
- Mouse events (mousedown, mousemove, mouseup)
- CSS transforms and positioning
- localStorage for position persistence
- Movement detection for click vs drag distinction 