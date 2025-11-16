import { useState, useEffect } from 'react'
import { MdClose, MdLiveTv } from 'react-icons/md'
import './TwitchSidebar.css'

const TWITCH_CHANNEL = 'maltafly'
const CHECK_INTERVAL = 60000 // Check every 60 seconds

function TwitchSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Check if stream is live
  const checkStreamStatus = async () => {
    try {
      setIsChecking(true)
      // Using a public API endpoint to check stream status
      // This doesn't require authentication
      const response = await fetch(
        `https://decapi.me/twitch/uptime/${TWITCH_CHANNEL}`
      )
      const uptime = await response.text()
      
      // If uptime is not "offline", the stream is live
      const live = uptime && !uptime.toLowerCase().includes('offline') && uptime.trim() !== ''
      setIsLive(live)
      
      // Auto-open if live, auto-close if offline
      if (live) {
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Error checking stream status:', error)
      // On error, assume offline
      setIsLive(false)
      setIsOpen(false)
    } finally {
      setIsChecking(false)
    }
  }

  // Check on mount and set up polling
  useEffect(() => {
    checkStreamStatus()
    const interval = setInterval(checkStreamStatus, CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  // Handle close - allow closing on mobile even when live
  const handleClose = () => {
    const isMobile = window.innerWidth <= 768
    // On mobile, allow closing even when live
    // On desktop, only allow closing when offline
    if (isMobile || !isLive) {
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Toggle Button - Always visible when closed */}
      {!isOpen && (
        <button
          className={`twitch-toggle-button ${isLive ? 'twitch-toggle-button-live' : ''}`}
          onClick={() => setIsOpen(true)}
          aria-label="Open Twitch stream"
          title={isLive ? "Watch Live Stream" : "View Channel"}
        >
          <MdLiveTv />
          <span className="twitch-toggle-text">{isLive ? 'LIVE' : 'OFFLINE'}</span>
        </button>
      )}

      {/* Sidebar */}
      {isOpen && (
        <div className="twitch-sidebar">
          <div className="twitch-sidebar-header">
            <div className="twitch-sidebar-title">
              <MdLiveTv className="twitch-icon" />
              <span>{isLive ? 'Live Stream' : `${TWITCH_CHANNEL.charAt(0).toUpperCase() + TWITCH_CHANNEL.slice(1)} is Offline`}</span>
              {isLive && <span className="twitch-live-indicator">● LIVE</span>}
            </div>
            <button
              className="twitch-close-button"
              onClick={handleClose}
              aria-label="Close stream"
            >
              <MdClose />
            </button>
          </div>
          <div className="twitch-embed-wrapper">
            {isLive ? (
              <iframe
                src={`https://player.twitch.tv/?channel=${TWITCH_CHANNEL}&parent=${window.location.hostname}&parent=localhost&parent=127.0.0.1&muted=false`}
                frameBorder="0"
                allowFullScreen={true}
                scrolling="no"
                className="twitch-embed"
                title="Twitch Stream"
              />
            ) : (
              <div className="twitch-offline-message">
                <MdLiveTv className="twitch-offline-icon" />
                <p className="twitch-offline-text">{TWITCH_CHANNEL.charAt(0).toUpperCase() + TWITCH_CHANNEL.slice(1)} is currently offline</p>
                <p className="twitch-offline-subtext">Check back later for live content!</p>
              </div>
            )}
          </div>
          <div className="twitch-sidebar-footer">
            <a
              href={`https://www.twitch.tv/${TWITCH_CHANNEL}`}
              target="_blank"
              rel="noopener noreferrer"
              className="twitch-link"
            >
              {isLive ? 'Watch on Twitch →' : 'Visit Channel →'}
            </a>
          </div>
        </div>
      )}
    </>
  )
}

export default TwitchSidebar

