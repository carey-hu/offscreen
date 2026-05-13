# Implementation Plan - Restructure OffScreen to iPad-style Layout

This plan outlines the steps to transform the current OffScreen web app layout into the iPad-style horizontal layout shown in the reference screenshot.

## 1. Layout Overhaul (App.tsx)
- [ ] Change the main container to a full-screen, non-scrollable iPad-style layout.
- [ ] Implement a **Top Nav** with three sections:
    - **Left**: Sidebar toggle icon and "Add" button.
    - **Center**: Segmented control for "屏幕使用时间", "专注", "设置".
    - **Right**: Date display and Calendar icon.
- [ ] Split the main content into a two-column layout:
    - **Main Area (Left/Center)**: Content area for the timer and stats.
    - **Sidebar (Right)**: Fixed-width task list sidebar.

## 2. Rebuild Timer Panel (TimerPanel.tsx)
- [ ] **Mode Selector**: Change the mode selector to small pill-shaped buttons (番茄钟, 倒计时, 正计时).
- [ ] **Circular Timer**:
    - Style the circle with a thick purple/gray border as seen in the screenshot.
    - Add a "Wheel" style picker inside the circle (Hours on left, Minutes on right).
- [ ] **Start Button**: Implement a large "开始专注" pill button below the timer.
- [ ] **Summary Cards**: Add the three summary cards at the bottom of the main area:
    - "1小时16分钟 专注" (Lotus icon).
    - "13分钟 最新动态" (Clock icon).
    - "1次 失败次数" (Sad face icon).

## 3. Create Task Sidebar (TaskSidebar.tsx)
- [ ] Create a new component `TaskSidebar` to replace/augment the current `SessionList`.
- [ ] **Task Cards**:
    - Each card should feature an emoji, title, description ("--"), and a play button.
    - Use a clean, rounded-card design with light borders or shadows.

## 4. Styling and Theme
- [ ] Update the color palette to match the purple/lavender theme.
- [ ] Ensure the font and spacing follow the "iPad-style" clean aesthetic.
- [ ] Implement custom scrollbars for the main area and sidebar.

## 5. Integration and State
- [ ] Connect the new segmented control to switch between views.
- [ ] Ensure the "Start Focus" button in `TimerPanel` triggers the existing focus logic.

## Critical Files for Implementation
- src/App.tsx
- src/components/TimerPanel.tsx
- src/components/TaskSidebar.tsx
- src/components/StatsPanel.tsx
