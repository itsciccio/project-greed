# Project Greed

A React-based search interface for finding item information from your game data, with an intelligent upgrade checklist system to help you track what you've completed and what you still need.

## Features

- **Search for items by name** - Fast, case-insensitive search with autocomplete suggestions and keyboard navigation:
  - Auto-highlights the first suggestion in the dropdown
  - **Enter** key to select the highlighted item (visual indicator shows which item will be selected)
  - **Arrow Up/Down** keys to navigate through suggestions (dropdown automatically scrolls to keep highlighted item visible)
  - **Escape** key to close the dropdown
- **Visual Item Identification** - Items display with their icons/images for easy recognition:
  - Item images in search results and autocomplete dropdown
  - Images in Recyclable Items browser
  - Default placeholder for items without images
- **Upgrade Checklist System** 🔥 - Track your progress and automatically exclude completed requirements:
  - **Four organized tabs**: Stations, Projects (Expedition Stages), Quests, and Scrappy Levels
  - **Cascading selection**: Selecting a higher level automatically selects all lower levels (and vice versa when unchecking)
  - **Persistent storage**: Your checklist is saved in localStorage and persists across reloads and redeployments
  - **Smart item ghosting**: Items needed for completed upgrades are automatically ghosted in search results
  - **Completed badges**: Completed upgrades show a "✓ Completed" badge and are sorted to the bottom
  - **Total calculations**: Total Amount Required automatically excludes items from completed upgrades
  - **Original total display**: Shows the original total (before subtractions) when upgrades are checked
  - **Completion messages**: Shows "0" or "All items collected!" when all requirements are met
- **View item status across multiple categories**:
  - **Safe to Recycle** - Items that can be safely recycled
  - **Required for Quests** - Items needed for quests (with quest name and required amount)
  - **Required for Expedition Stages** - Items needed for Expedition-1 Project stages (with stage name and amount)
  - **Station Upgrades** - Items required for station upgrades (with station name, level, and amount)
  - **Scrappy Levels** - Items required for Scrappy level upgrades (with level and amount)
  - **Blueprint Recipes** - Items used in blueprint crafting recipes (with workshop, level, and other ingredients)
- **Total Amount Summary** (Toggleable) - Shows a highlighted summary card with the total amount required:
  - Includes: Quests (from checklist), Projects, Station Upgrades, Expedition Stages, and Scrappy Levels (Blueprints excluded)
  - Shows original total (ghosted) when upgrades are checked off
  - Automatically excludes items from completed upgrades in your checklist
  - Displays completion message when all items are collected
- **Recyclable Items Browser** - Quick access modal to view all recyclable items at a glance, with search functionality, item images, and click-to-search integration
- **Settings Menu** - Accessible via the settings icon next to the search box, allows you to toggle extra features and access additional tools
- **Live Twitch Stream** - Embedded Twitch stream panel that automatically opens when the streamer is live and closes when offline, with live status detection and visual indicators
- **Keyboard shortcuts**:
  - **Escape key** closes any open modal (Upgrade Checklist, Recyclable Items)
- Items can appear in multiple categories simultaneously
- Modern, responsive UI with Material Design icons
- Mobile-optimized layout with proper alignment

## Getting Started

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

### Building for Production

```bash
npm run build
```

## Usage

1. **Set up your Upgrade Checklist** (Recommended):
   - Click the "NEW FEATURE! 🔥 Try the new upgrade checklist!" button at the top of the page
   - A modal will open with four tabs: **Stations**, **Projects**, **Quests**, and **Scrappy**
   - **Stations Tab**: Check off completed station upgrades (e.g., Medical Lab Level 1, Gunsmith Level 2)
     - Selecting a higher level automatically checks all lower levels
     - Unchecking a level automatically unchecks all higher levels
   - **Projects Tab**: Check off completed Expedition-1 Project stages (all 6 stages included)
     - Shows stage descriptions and required items
     - Stage 5 (Load Stage) shows category-based credit requirements
     - Stage 6 (Departure) has no specific item requirements
   - **Quests Tab**: Check off completed quests that require specific items
     - Only shows quests that have item requirements
   - **Scrappy Tab**: Check off completed Scrappy levels
     - Cascading selection works the same as stations
   - Your checklist is automatically saved and persists across reloads
   - Press **Escape** or click outside the modal to close

2. **Search for items** (e.g., "Accordion", "Leaper Pulse Unit"):
   - **Autocomplete dropdown** appears automatically with matching suggestions (items show with their icons)
   - **Keyboard Navigation**:
     - The first item is automatically highlighted
     - Press **Enter** to select the highlighted item (a keyboard icon (↵) shows which item will be selected)
     - Use **Arrow Up/Down** keys to navigate through the suggestions (the dropdown automatically scrolls to keep the highlighted item visible)
     - Press **Escape** to close the dropdown
   - **Mouse Navigation**: Click any item in the dropdown to select it
   - Click "Search" button or press Enter (when dropdown is closed) to perform a search

3. **View the item's comprehensive information**:
   - **Item Image** - Visual representation of the item (or placeholder if not available)
   - **Safe to Recycle** - Green card indicating the item can be recycled
   - **Required for Quests** - Lists all quests that require this item (with quest name and amount)
   - **Required for Expedition Stages** - Lists all Expedition stages that require this item (with stage name and amount)
   - **Station Upgrades** - Lists all stations and levels that require this item
     - Completed upgrades are sorted to the bottom and show a "✓ Completed" badge
     - Items needed for completed upgrades are ghosted (dimmed with reduced opacity)
   - **Scrappy Levels** - Lists all Scrappy levels that require this item
     - Same sorting and ghosting behavior as station upgrades
   - **Blueprint Recipes** - Shows all blueprints that use this item, including other required ingredients

4. **Enable Total Amount Summary** (Optional):
   - Click the settings icon (⚙️) next to the search box
   - Toggle "Total Amount Summary" to see a highlighted card with the total amount required
   - The total includes: Quests (from checklist), Projects, Station Upgrades, Expedition Stages, and Scrappy Levels (Blueprints excluded)
   - When upgrades are checked off, shows:
     - Current total (after excluding completed upgrades)
     - Original total (ghosted, before subtractions)
     - Note indicating that items from completed upgrades are excluded
   - Shows "0" or "All items collected!" when all requirements are met
   - Your preference is saved in your browser's localStorage

5. **View Recyclable Items** (Optional):
   - Click the settings icon (⚙️) next to the search box
   - Select "♻️ View Recyclable Items" from the settings menu
   - A modal will open showing all recyclable items in a searchable grid with item images
   - Use the search box in the modal to filter items
   - Click any item to search for it and automatically close the modal
   - Press **Escape**, click outside the modal, or use the close button (X) to dismiss

6. **Watch Live Twitch Stream** (Optional):
   - A compact Twitch stream panel appears in the top-right corner when the streamer is live
   - The panel automatically opens when the stream goes live and closes when offline
   - When live: The panel shows the live stream with a pulsing "LIVE" indicator and cannot be closed
   - When offline: The panel is closed by default, but can be opened manually to see the offline message
   - A toggle button in the top-right shows "LIVE" (pulsing purple) when live or "OFFLINE" (gray) when offline
   - Click the toggle button to manually open/close the stream panel
   - Stream status is checked automatically every 60 seconds

## Examples

- **Accordion**: Shows as "Safe to Recycle"
- **ARC Alloy**: 
  - Shows "Required for Expedition Stages" (e.g., Foundation Stage 1, amount: 80)
  - Shows "Required for Station Upgrades" (e.g., Medical Lab Level 1, amount: 6)
  - With Total Summary enabled: Shows total including all requirements
  - If you check off "Foundation" in the Projects tab, the Expedition Stage requirement is ghosted and excluded from the total
- **Light Bulb**:
  - Shows "Required for Expedition Stages" (Framework Stage 3, amount: 5)
  - If you check off "Framework" in the Projects tab, the requirement is ghosted and the total decreases by 5
- **Leaper Pulse Unit**: 
  - Shows "Required for Quests" (e.g., Into the Fray, amount: 1)
  - Shows "Required for Expedition Stages" (Outfitting Stage 4, amount: 3)
  - Shows "Required for Station Upgrades" (e.g., Utility Station Level 3, amount: 4)
  - With Total Summary enabled: Shows total of all requirements
  - If you check off completed upgrades in the checklist, those amounts are excluded from the total

## Data Structure

The app uses multiple JSON data files:
- **`items.json`** - Consolidated file combining:
  - `safe_to_recycle.json` (items marked as safe to recycle)
  - All items from the [dataset API](https://metaforge.app/api/arc-raiders/items)
  - Item images from the dataset API (stored in the `image` field)
  - Note: `keep_for_quests` and `keep_for_projects` have been removed - quest and project requirements are now handled through `quests.json` and `expedition.json`
- **`stations.json`** - Station upgrade requirements (used in the Upgrade Checklist)
- **`scrappy.json`** - Scrappy level requirements (used in the Upgrade Checklist)
- **`blueprints.json`** - Blueprint crafting recipes
- **`expedition.json`** - Expedition-1 Project stages and requirements (used in the Upgrade Checklist Projects tab)
  - Includes all 6 stages, including Stage 5 (Load Stage) with category requirements and Stage 6 (Departure)
- **`quests.json`** - Quest requirements fetched from the [MetaForge API](https://metaforge.app/api/arc-raiders/quests) (used in the Upgrade Checklist Quests tab)
  - Contains quest names and required items with quantities
  - Automatically fetched and stored locally
- **`public/images/item-placeholder.svg`** - Default placeholder image for items without images

Items are indexed by name, and each item can have multiple category flags. Items also include image URLs from the dataset API for visual identification. The app searches across station upgrades, scrappy levels, expedition stages, quests, and blueprint recipes to provide comprehensive item information.

### Quest Data

Quest data is automatically fetched from the MetaForge API and stored in `quests.json`. The app handles pagination and fetches all available quests. Quest requirements are matched to items by both item ID and item name, with intelligent normalization to handle variations (e.g., "arc-alloy" matches "ARC Alloy", "wires-recipe" matches "Wires").

### Updating Items from API

To fetch the latest items from the dataset API and merge them with your existing category data:

```bash
npm run fetch-items
```

This script will:
1. Fetch all items from the dataset API (handling pagination automatically)
2. Merge them with your existing `items.json` file
3. Preserve all your existing category information (safe_to_recycle)
4. Add image URLs from the API to items (stored in the `image` field)
5. Add any new items found in the API
6. Display a summary showing how many items received images

Items found in the API but without category information will show as "found in database" with a message indicating no category info is available. Items without images from the API will use a default placeholder image in the UI.

### Updating Quests from API

Quest data is automatically fetched when the app runs. To manually update quest data, you can fetch from the MetaForge API:

```bash
# The quests.json file is automatically populated from:
# https://metaforge.app/api/arc-raiders/quests
```

The app handles pagination automatically and stores all quests with their required items.

## Technical Details

- **Framework**: React 18 with Vite
- **Icons**: Material Design icons via `react-icons`
- **Images**: Item images from dataset API CDN with local placeholder fallback
- **Storage**: 
  - Settings preferences stored in browser localStorage
  - Upgrade checklist state persisted in localStorage (survives reloads and redeployments)
- **Client-Side Processing**: All calculations and data processing happen client-side for fast performance
- **Responsive Design**: Mobile-friendly interface that adapts to different screen sizes
  - Mobile layout maintains proper alignment between search input and settings button
  - Upgrade Checklist modal anchored to top to prevent shifting when switching tabs
- **Image Handling**: Automatic fallback to placeholder for missing or broken images
- **Keyboard Navigation**: 
  - Escape key closes modals (Upgrade Checklist, Recyclable Items)
  - Full keyboard support for search autocomplete
- **Smart Calculations**: 
  - Total amounts automatically exclude items from completed upgrades
  - Original totals shown for reference when upgrades are checked
  - Completion detection shows helpful messages

## Credits

- **Item Data & Images**: Item data and images provided by the [MetaForge ARC Raiders Dataset API](https://metaforge.app/api/arc-raiders/items)
- **Favicon/Icon Design**: Based on ARC Raiders Key Art & Graphic Design by [Robert Sammelin](https://www.pinterest.com/pin/arc-raiders-key-art-graphic-design--465911523961206075/)
- **Icons**: Material Design Icons from [react-icons](https://react-icons.github.io/react-icons/)

