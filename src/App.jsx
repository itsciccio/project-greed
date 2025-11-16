import { useState, useEffect, useRef } from 'react'
import { MdSettings, MdClose } from 'react-icons/md'
import itemsData from '../items.json'
import stationsData from '../stations.json'
import scrappyLevelsData from '../scrappy.json'
import blueprintsData from '../blueprints.json'
import expeditionData from '../expedition.json'
import { trackPageView } from './utils/analytics'
import TwitchSidebar from './components/TwitchSidebar'
import './App.css'

// Expedition Stages Component
function ExpeditionStages({ onItemClick }) {
  return (
    <div className="expedition-stages">
      {expeditionData.stages.map((stage) => (
        <div key={stage.stage} className="expedition-stage-card">
          <div className="expedition-stage-header">
            <div className="expedition-stage-title">
              <span className="expedition-stage-number">{stage.title} ({stage.stage}/6)</span>
            </div>
          </div>
          <div className="expedition-stage-description">
            {stage.description}
          </div>
          {stage.requirements && stage.requirements.length > 0 && (
            <div className="expedition-requirements">
              {stage.requirements.map((req, index) => (
                <div
                  key={index}
                  className="expedition-requirement-item"
                  onClick={() => onItemClick(req.name)}
                >
                  <img 
                    src={itemsData[req.name]?.image || '/images/item-placeholder.svg'} 
                    alt={req.name}
                    className="expedition-requirement-image"
                    onError={(e) => {
                      e.target.src = '/images/item-placeholder.svg';
                    }}
                  />
                  <span className="expedition-requirement-amount">{req.amount}x</span>
                  <span className="expedition-requirement-name">{req.name}</span>
                </div>
              ))}
            </div>
          )}
          {stage.categoryRequirements && stage.categoryRequirements.length > 0 && (
            <div className="expedition-category-requirements">
              {stage.categoryRequirements.map((req, index) => (
                <div
                  key={index}
                  className="expedition-category-requirement-item"
                >
                  <span className="expedition-category-cred-value">
                    {req.credValue.toLocaleString()} Cred
                  </span>
                  <span className="expedition-category-name">
                    worth of {req.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isSearching, setIsSearching] = useState(false)
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false)
  const [showTotalSummary, setShowTotalSummary] = useState(() => {
    // Load from localStorage, default to false
    const saved = localStorage.getItem('showTotalSummary')
    return saved ? JSON.parse(saved) : false
  })
  const [showRecyclableModal, setShowRecyclableModal] = useState(false)
  const [recyclableSearchTerm, setRecyclableSearchTerm] = useState('')
  const [showExpeditionModal, setShowExpeditionModal] = useState(false)
  const searchInputRef = useRef(null)
  const dropdownRef = useRef(null)
  const settingsRef = useRef(null)

  // Track page view on component mount
  useEffect(() => {
    trackPageView()
  }, [])

  // Get all item names
  const allItems = Object.keys(itemsData)

  // Get all recyclable items
  const recyclableItems = Object.keys(itemsData).filter(itemName => 
    itemsData[itemName]?.safe_to_recycle === true
  ).sort()

  // Filter recyclable items based on search term
  const filteredRecyclableItems = recyclableSearchTerm.trim()
    ? recyclableItems.filter(item =>
        item.toLowerCase().includes(recyclableSearchTerm.toLowerCase())
      )
    : recyclableItems

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

  // Find blueprints that use an item in their recipe
  const findBlueprintRecipes = (itemName) => {
    const blueprints = []
    
    blueprintsData.blueprints.forEach(blueprint => {
      const itemInRecipe = blueprint.craftingRecipe.find(ingredient =>
        ingredient.name.toLowerCase() === itemName.toLowerCase()
      )
      
      if (itemInRecipe) {
        // Get all other ingredients (excluding the searched item)
        const otherIngredients = blueprint.craftingRecipe.filter(ingredient =>
          ingredient.name.toLowerCase() !== itemName.toLowerCase()
        )
        
        blueprints.push({
          name: blueprint.name,
          workshop: blueprint.workshop,
          level: blueprint.level,
          amount: itemInRecipe.amount,
          otherIngredients: otherIngredients
        })
      }
    })
    
    return blueprints
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
    
    // Find blueprint recipes
    const blueprintRecipes = findBlueprintRecipes(trimmedTerm)

    if (itemName) {
      setResults({
        name: itemName,
        data: itemsData[itemName],
        stationRequirements: stationRequirements,
        scrappyLevelRequirements: scrappyLevelRequirements,
        blueprintRecipes: blueprintRecipes
      })
    } else {
      setResults({ 
        name: trimmedTerm, 
        data: null,
        stationRequirements: stationRequirements,
        scrappyLevelRequirements: scrappyLevelRequirements,
        blueprintRecipes: blueprintRecipes
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

  // Calculate total amount required (excluding blueprints)
  const calculateTotalAmount = (results) => {
    if (!results) return 0
    
    let total = 0
    
    // Add projects amount
    if (results.data?.keep_for_projects?.amount) {
      total += results.data.keep_for_projects.amount
    }
    
    // Add station requirements
    if (results.stationRequirements) {
      total += results.stationRequirements.reduce((sum, req) => sum + req.amount, 0)
    }
    
    // Add scrappy level requirements
    if (results.scrappyLevelRequirements) {
      total += results.scrappyLevelRequirements.reduce((sum, req) => sum + req.amount, 0)
    }
    
    // Note: Blueprint recipes are excluded from the total
    
    return total
  }

  // Toggle show total summary setting
  const toggleShowTotalSummary = () => {
    const newValue = !showTotalSummary
    setShowTotalSummary(newValue)
    localStorage.setItem('showTotalSummary', JSON.stringify(newValue))
  }

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target)
      ) {
        setShowSettingsDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="app">
      <TwitchSidebar />
      <div className="container">
        <h1 className="title">Project Greed</h1>
        <p className="subtitle">Keep track of the items you need to keep in order to progress, and stop hoarding!</p>
        
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-wrapper">
            <div className="search-input-wrapper">
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
                      <img 
                        src={itemsData[item]?.image || '/images/item-placeholder.svg'} 
                        alt={item}
                        className="dropdown-item-image"
                        onError={(e) => {
                          e.target.src = '/images/item-placeholder.svg';
                        }}
                      />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="settings-wrapper" ref={settingsRef}>
              <button
                className="settings-button"
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                aria-label="Settings"
                type="button"
              >
                <MdSettings />
              </button>
              {showSettingsDropdown && (
                <div className="settings-dropdown">
                  <div className="settings-item">
                    <label className="settings-label">
                      <input
                        type="checkbox"
                        checked={showTotalSummary}
                        onChange={toggleShowTotalSummary}
                        className="settings-checkbox"
                      />
                      <span>Total Amount Summary</span>
                    </label>
                  </div>
                  <div className="settings-divider"></div>
                  <div className="settings-item">
                    <button
                      className="settings-menu-button"
                      onClick={() => {
                        setShowRecyclableModal(true)
                        setShowSettingsDropdown(false)
                      }}
                    >
                      <span>♻️ View Recyclable Items</span>
                    </button>
                  </div>
                  <div className="settings-divider"></div>
                  <div className="settings-item">
                    <button
                      className="settings-menu-button"
                      onClick={() => {
                        setShowExpeditionModal(true)
                        setShowSettingsDropdown(false)
                      }}
                    >
                      <span>🚀 Expedition-1 Requirements</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                <div className="item-header">
                  <img 
                    src={results.data?.image || '/images/item-placeholder.svg'} 
                    alt={results.name}
                    className="item-image"
                    onError={(e) => {
                      e.target.src = '/images/item-placeholder.svg';
                    }}
                  />
                  <h2 className="item-name">{results.name}</h2>
                </div>
                {showTotalSummary && (() => {
                  const totalAmount = calculateTotalAmount(results)
                  if (totalAmount > 0) {
                    return (
                      <div className="total-summary-card">
                        <div className="total-summary-header">
                          <span className="total-summary-icon">📊</span>
                          <span className="total-summary-label">Total Amount Required</span>
                        </div>
                        <div className="total-summary-amount">
                          <strong>{totalAmount}</strong>
                        </div>
                        <div className="total-summary-note">
                          Includes: Projects, Station Upgrades, and Scrappy Levels (Blueprints excluded)
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}
                {(() => {
                  const hasItemProperties = results.data && Object.keys(results.data).length > 0
                  const hasStationRequirements = results.stationRequirements && results.stationRequirements.length > 0
                  const hasScrappyRequirements = results.scrappyLevelRequirements && results.scrappyLevelRequirements.length > 0
                  const hasBlueprintRecipes = results.blueprintRecipes && results.blueprintRecipes.length > 0
                  const hasAnyInfo = hasItemProperties || hasStationRequirements || hasScrappyRequirements || hasBlueprintRecipes
                  
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
                              <span className="category-icon">🐔</span>
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
                              <span className="category-icon">🐔</span>
                              <span className="category-label">Scrappy Level Requirements</span>
                            </div>
                            <div className="no-station-requirements">
                              Not required for any scrappy level upgrades.
                            </div>
                          </div>
                        )}
                        
                        {/* Blueprint Recipes */}
                        {hasBlueprintRecipes ? (
                          <div className="category-card" style={{ borderColor: 'rgba(34, 197, 94, 0.6)' }}>
                            <div className="category-header">
                              <span className="category-icon">📜</span>
                              <span className="category-label">Used in Blueprint Recipes</span>
                            </div>
                            <div className="station-requirements">
                              {results.blueprintRecipes.map((blueprint, index) => (
                                <div key={index} className="station-requirement-item">
                                  <div className="station-name">{blueprint.name}</div>
                                  <div className="station-level">{blueprint.workshop} - Level {blueprint.level}</div>
                                  <div className="station-amount">Amount needed: <strong>{blueprint.amount}</strong></div>
                                  {blueprint.otherIngredients.length > 0 && (
                                    <div className="blueprint-ingredients">
                                      <div className="ingredients-label">Other ingredients:</div>
                                      <div className="ingredients-list">
                                        {blueprint.otherIngredients.map((ingredient, ingIndex) => (
                                          <span key={ingIndex} className="ingredient-item">
                                            {ingredient.name} ({ingredient.amount})
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="category-card" style={{ borderColor: 'rgba(107, 114, 128, 0.6)' }}>
                            <div className="category-header">
                              <span className="category-icon">📜</span>
                              <span className="category-label">Blueprint Recipes</span>
                            </div>
                            <div className="no-station-requirements">
                              Not used in any blueprint recipes.
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
                {showTotalSummary && (() => {
                  const totalAmount = calculateTotalAmount(results)
                  if (totalAmount > 0) {
                    return (
                      <div className="total-summary-card" style={{ marginTop: '16px' }}>
                        <div className="total-summary-header">
                          <span className="total-summary-icon">📊</span>
                          <span className="total-summary-label">Total Amount Required</span>
                        </div>
                        <div className="total-summary-amount">
                          <strong>{totalAmount}</strong>
                        </div>
                        <div className="total-summary-note">
                          Includes: Projects, Station Upgrades, and Scrappy Levels (Blueprints excluded)
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}
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
                      <span className="category-icon">🐔</span>
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
                      <span className="category-icon">🐔</span>
                      <span className="category-label">Scrappy Level Requirements</span>
                    </div>
                    <div className="no-station-requirements">
                      Not required for any scrappy level upgrades.
                    </div>
                  </div>
                )}
                {/* Show blueprint recipes even if item not in items.json */}
                {results.blueprintRecipes && results.blueprintRecipes.length > 0 && (
                  <div className="category-card" style={{ borderColor: 'rgba(34, 197, 94, 0.6)', marginTop: '16px' }}>
                    <div className="category-header">
                      <span className="category-icon">📜</span>
                      <span className="category-label">Used in Blueprint Recipes</span>
                    </div>
                    <div className="station-requirements">
                      {results.blueprintRecipes.map((blueprint, index) => (
                        <div key={index} className="station-requirement-item">
                          <div className="station-name">{blueprint.name}</div>
                          <div className="station-level">{blueprint.workshop} - Level {blueprint.level}</div>
                          <div className="station-amount">Amount needed: <strong>{blueprint.amount}</strong></div>
                          {blueprint.otherIngredients.length > 0 && (
                            <div className="blueprint-ingredients">
                              <div className="ingredients-label">Other ingredients:</div>
                              <div className="ingredients-list">
                                {blueprint.otherIngredients.map((ingredient, ingIndex) => (
                                  <span key={ingIndex} className="ingredient-item">
                                    {ingredient.name} ({ingredient.amount})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {results.blueprintRecipes && results.blueprintRecipes.length === 0 && (
                  <div className="category-card" style={{ borderColor: 'rgba(107, 114, 128, 0.6)', marginTop: '16px' }}>
                    <div className="category-header">
                      <span className="category-icon">📜</span>
                      <span className="category-label">Blueprint Recipes</span>
                    </div>
                    <div className="no-station-requirements">
                      Not used in any blueprint recipes.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recyclable Items Modal */}
        {showRecyclableModal && (
          <div className="modal-overlay" onClick={() => setShowRecyclableModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  <span className="modal-icon">♻️</span>
                  Recyclable Items
                  <span className="modal-count">({filteredRecyclableItems.length})</span>
                </h2>
                <button
                  className="modal-close-button"
                  onClick={() => setShowRecyclableModal(false)}
                  aria-label="Close"
                >
                  <MdClose />
                </button>
              </div>
              <div className="modal-search-wrapper">
                <input
                  type="text"
                  value={recyclableSearchTerm}
                  onChange={(e) => setRecyclableSearchTerm(e.target.value)}
                  placeholder="Search recyclable items..."
                  className="modal-search-input"
                  autoFocus
                />
              </div>
              <div className="modal-body">
                {filteredRecyclableItems.length > 0 ? (
                  <div className="recyclable-items-list">
                    {filteredRecyclableItems.map((itemName) => (
                      <div
                        key={itemName}
                        className="recyclable-item"
                        onClick={() => {
                          setSearchTerm(itemName)
                          setShowRecyclableModal(false)
                          setIsSearching(true)
                          performSearch(itemName)
                        }}
                      >
                        <img 
                          src={itemsData[itemName]?.image || '/images/item-placeholder.svg'} 
                          alt={itemName}
                          className="recyclable-item-image"
                          onError={(e) => {
                            e.target.src = '/images/item-placeholder.svg';
                          }}
                        />
                        <span>{itemName}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="modal-empty-state">
                    <p>No recyclable items found matching "{recyclableSearchTerm}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Expedition-1 Requirements Modal */}
        {showExpeditionModal && (
          <div className="modal-overlay" onClick={() => setShowExpeditionModal(false)}>
            <div className="modal-content expedition-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  <span className="modal-icon">🚀</span>
                  Expedition-1 Project Requirements
                </h2>
                <button
                  className="modal-close-button"
                  onClick={() => setShowExpeditionModal(false)}
                  aria-label="Close"
                >
                  <MdClose />
                </button>
              </div>
              <div className="modal-body expedition-modal-body">
                <ExpeditionStages 
                  onItemClick={(itemName) => {
                    setSearchTerm(itemName)
                    setShowExpeditionModal(false)
                    setIsSearching(true)
                    performSearch(itemName)
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <footer className="footer">
        <div className="footer-content">
          <p>© 2025 ItsCiccio. All rights reserved.</p>
          <p className="privacy-notice">Privacy: This site uses anonymous analytics to track page views. No personal data is collected.</p>
          <div className="support-section">
            <p className="support-text">If this tool helped you, consider supporting it!</p>
            <a 
              href="https://buymeacoffee.com/itsciccio" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bmc-button"
            >
              <span className="bmc-icon">☕</span>
              <span className="bmc-text">Buy me a coffee</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

