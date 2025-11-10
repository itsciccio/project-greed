import { useState, useEffect, useRef } from 'react'
import itemsData from '../items.json'
import stationsData from '../stations.json'
import scrappyLevelsData from '../scrappy.json'
import './App.css'

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isSearching, setIsSearching] = useState(false)
  const searchInputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Get all item names
  const allItems = Object.keys(itemsData)

  // Filter items based on search term
  const filteredItems = searchTerm.trim()
    ? allItems.filter(item =>
        item.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10) // Limit to 10 suggestions
    : []

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setHighlightedIndex(-1)
    setIsSearching(false) // Reset search flag when user types
    // Clear results when user starts typing a new search
    if (results && value.trim() === '') {
      setResults(null)
    }
  }

  // Handle item selection from dropdown
  const selectItem = (itemName) => {
    setSearchTerm(itemName)
    setShowDropdown(false)
    setHighlightedIndex(-1)
    setIsSearching(true)
    performSearch(itemName)
  }

  // Find where an item is required in stations
  const findStationRequirements = (itemName) => {
    const requirements = []
    
    stationsData.stations.forEach(station => {
      station.levels.forEach(level => {
        level.requirements.forEach(req => {
          // Case-insensitive comparison
          if (req.name.toLowerCase() === itemName.toLowerCase()) {
            requirements.push({
              station: station.name,
              level: level.level,
              amount: req.amount
            })
          }
        })
      })
    })
    
    return requirements
  }

  // Find where an item is required for scrappy levels
  const findScrappyLevelRequirements = (itemName) => {
    const requirements = []
    
    scrappyLevelsData.scrappyLevelRequirementsRates.forEach(levelData => {
      levelData.requirements.forEach(req => {
        // Case-insensitive comparison
        if (req.name.toLowerCase() === itemName.toLowerCase()) {
          requirements.push({
            title: levelData.title,
            level: levelData.level,
            amount: req.amount
          })
        }
      })
    })
    
    return requirements
  }

  // Perform the actual search
  const performSearch = (term) => {
    const trimmedTerm = term.trim()
    
    if (!trimmedTerm) {
      setResults(null)
      return
    }

    // Case-insensitive search
    const itemName = Object.keys(itemsData).find(
      name => name.toLowerCase() === trimmedTerm.toLowerCase()
    )

    // Find station requirements
    const stationRequirements = findStationRequirements(trimmedTerm)
    
    // Find scrappy level requirements
    const scrappyLevelRequirements = findScrappyLevelRequirements(trimmedTerm)

    if (itemName) {
      setResults({
        name: itemName,
        data: itemsData[itemName],
        stationRequirements: stationRequirements,
        scrappyLevelRequirements: scrappyLevelRequirements
      })
    } else {
      setResults({ 
        name: trimmedTerm, 
        data: null,
        stationRequirements: stationRequirements,
        scrappyLevelRequirements: scrappyLevelRequirements
      })
    }
  }

  // Handle form submission
  const handleSearch = (e) => {
    e.preventDefault()
    setShowDropdown(false)
    setIsSearching(true)
    performSearch(searchTerm)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown || filteredItems.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredItems.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredItems.length) {
          selectItem(filteredItems[highlightedIndex])
        } else {
          handleSearch(e)
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setHighlightedIndex(-1)
        break
    }
  }

  // Update dropdown visibility based on filtered items (only if not searching)
  useEffect(() => {
    if (!isSearching && searchTerm.trim().length > 0 && filteredItems.length > 0) {
      setShowDropdown(true)
    } else if (filteredItems.length === 0 || isSearching) {
      setShowDropdown(false)
    }
  }, [filteredItems, searchTerm, isSearching])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowDropdown(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const getCategoryInfo = (category, data) => {
    switch (category) {
      case 'safe_to_recycle':
        return { label: 'Safe to Recycle', color: '#10b981', icon: '♻️' }
      case 'keep_for_quests':
        return { label: 'Keep for Quests', color: '#3b82f6', icon: '📋' }
      case 'keep_for_projects':
        return { label: 'Keep for Projects', color: '#f59e0b', icon: '🔧' }
      default:
        return { label: category, color: '#6b7280', icon: '📦' }
    }
  }

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">Item Search</h1>
        <p className="subtitle">Search for items to see their status</p>
        
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-wrapper">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (!isSearching && filteredItems.length > 0) {
                  setShowDropdown(true)
                }
              }}
              placeholder="Enter item name (e.g., Accordion, Leaper Pulse Unit)"
              className="search-input"
            />
            {showDropdown && filteredItems.length > 0 && (
              <div ref={dropdownRef} className="dropdown">
                {filteredItems.map((item, index) => (
                  <div
                    key={item}
                    className={`dropdown-item ${
                      index === highlightedIndex ? 'highlighted' : ''
                    }`}
                    onClick={() => selectItem(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
          {!results && (
            <button type="submit" className="search-button">
              Search
            </button>
          )}
        </form>

        {results && (
          <div className="results">
            {results.data !== null ? (
              <>
                <h2 className="item-name">{results.name}</h2>
                {(() => {
                  const hasItemProperties = results.data && Object.keys(results.data).length > 0
                  const hasStationRequirements = results.stationRequirements && results.stationRequirements.length > 0
                  const hasScrappyRequirements = results.scrappyLevelRequirements && results.scrappyLevelRequirements.length > 0
                  const hasAnyInfo = hasItemProperties || hasStationRequirements || hasScrappyRequirements
                  
                  if (hasAnyInfo) {
                    return (
                      <div className="categories">
                        {results.data?.safe_to_recycle && (
                          <div className="category-card" style={{ borderColor: 'rgba(255, 140, 66, 0.5)' }}>
                            <div className="category-header">
                              <span className="category-icon">♻️</span>
                              <span className="category-label">Safe to Recycle</span>
                            </div>
                          </div>
                        )}
                        
                        {results.data?.keep_for_quests && (
                          <div className="category-card" style={{ borderColor: 'rgba(255, 69, 0, 0.6)' }}>
                            <div className="category-header">
                              <span className="category-icon">📋</span>
                              <span className="category-label">Keep for Quests</span>
                            </div>
                            <div className="category-amount">
                              Amount needed: <strong>{results.data.keep_for_quests.amount}</strong>
                            </div>
                          </div>
                        )}
                        
                        {results.data?.keep_for_projects && (
                          <div className="category-card" style={{ borderColor: 'rgba(255, 107, 53, 0.6)' }}>
                            <div className="category-header">
                              <span className="category-icon">🔧</span>
                              <span className="category-label">Keep for Projects</span>
                            </div>
                            <div className="category-amount">
                              Amount needed: <strong>{results.data.keep_for_projects.amount}</strong>
                            </div>
                          </div>
                        )}
                        
                        {/* Station Requirements */}
                        {hasStationRequirements ? (
                          <div className="category-card" style={{ borderColor: 'rgba(59, 130, 246, 0.6)' }}>
                            <div className="category-header">
                              <span className="category-icon">🏭</span>
                              <span className="category-label">Required for Station Upgrades</span>
                            </div>
                            <div className="station-requirements">
                              {results.stationRequirements.map((req, index) => (
                                <div key={index} className="station-requirement-item">
                                  <div className="station-name">{req.station}</div>
                                  <div className="station-level">Level {req.level}</div>
                                  <div className="station-amount">Amount: <strong>{req.amount}</strong></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="category-card" style={{ borderColor: 'rgba(107, 114, 128, 0.6)' }}>
                            <div className="category-header">
                              <span className="category-icon">🏭</span>
                              <span className="category-label">Station Requirements</span>
                            </div>
                            <div className="no-station-requirements">
                              Not required for any station upgrades.
                            </div>
                          </div>
                        )}
                        
                        {/* Scrappy Level Requirements */}
                        {hasScrappyRequirements ? (
                          <div className="category-card" style={{ borderColor: 'rgba(168, 85, 247, 0.6)' }}>
                            <div className="category-header">
                              <span className="category-icon">⭐</span>
                              <span className="category-label">Required for Scrappy Levels</span>
                            </div>
                            <div className="station-requirements">
                              {results.scrappyLevelRequirements.map((req, index) => (
                                <div key={index} className="station-requirement-item">
                                  <div className="station-name">{req.title}</div>
                                  <div className="station-level">Level {req.level}</div>
                                  <div className="station-amount">Amount: <strong>{req.amount}</strong></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="category-card" style={{ borderColor: 'rgba(107, 114, 128, 0.6)' }}>
                            <div className="category-header">
                              <span className="category-icon">⭐</span>
                              <span className="category-label">Scrappy Level Requirements</span>
                            </div>
                            <div className="no-station-requirements">
                              Not required for any scrappy level upgrades.
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  } else {
                    return (
                      <div className="no-category-info">
                        <p>✅ Item "<strong>{results.name}</strong>" found in database.</p>
                        <p className="info-text">No category information available for this item.</p>
                      </div>
                    )
                  }
                })()}
              </>
            ) : (
              <div className="no-results">
                <p>❌ Item "<strong>{results.name}</strong>" not found in database.</p>
                {/* Show station requirements even if item not in items.json */}
                {results.stationRequirements && results.stationRequirements.length > 0 && (
                  <div className="category-card" style={{ borderColor: 'rgba(59, 130, 246, 0.6)', marginTop: '16px' }}>
                    <div className="category-header">
                      <span className="category-icon">🏭</span>
                      <span className="category-label">Required for Station Upgrades</span>
                    </div>
                    <div className="station-requirements">
                      {results.stationRequirements.map((req, index) => (
                        <div key={index} className="station-requirement-item">
                          <div className="station-name">{req.station}</div>
                          <div className="station-level">Level {req.level}</div>
                          <div className="station-amount">Amount: <strong>{req.amount}</strong></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {results.stationRequirements && results.stationRequirements.length === 0 && (
                  <div className="category-card" style={{ borderColor: 'rgba(107, 114, 128, 0.6)', marginTop: '16px' }}>
                    <div className="category-header">
                      <span className="category-icon">🏭</span>
                      <span className="category-label">Station Requirements</span>
                    </div>
                    <div className="no-station-requirements">
                      Not required for any station upgrades.
                    </div>
                  </div>
                )}
                {/* Show scrappy level requirements even if item not in items.json */}
                {results.scrappyLevelRequirements && results.scrappyLevelRequirements.length > 0 && (
                  <div className="category-card" style={{ borderColor: 'rgba(168, 85, 247, 0.6)', marginTop: '16px' }}>
                    <div className="category-header">
                      <span className="category-icon">⭐</span>
                      <span className="category-label">Required for Scrappy Levels</span>
                    </div>
                    <div className="station-requirements">
                      {results.scrappyLevelRequirements.map((req, index) => (
                        <div key={index} className="station-requirement-item">
                          <div className="station-name">{req.title}</div>
                          <div className="station-level">Level {req.level}</div>
                          <div className="station-amount">Amount: <strong>{req.amount}</strong></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {results.scrappyLevelRequirements && results.scrappyLevelRequirements.length === 0 && (
                  <div className="category-card" style={{ borderColor: 'rgba(107, 114, 128, 0.6)', marginTop: '16px' }}>
                    <div className="category-header">
                      <span className="category-icon">⭐</span>
                      <span className="category-label">Scrappy Level Requirements</span>
                    </div>
                    <div className="no-station-requirements">
                      Not required for any scrappy level upgrades.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <footer className="footer">
        <p>© 2025 ItsCiccio. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App

