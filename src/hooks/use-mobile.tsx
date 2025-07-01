import * as React from "react"

const MOBILE_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(newIsMobile)
      
      // 🔥 ENHANCED: Add touch device detection
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // 🔥 DEBUG: Log mobile detection for troubleshooting
      console.log('Mobile detection:', {
        windowWidth: window.innerWidth,
        breakpoint: MOBILE_BREAKPOINT,
        isMobile: newIsMobile,
        hasTouch,
        userAgent: navigator.userAgent.substring(0, 50)
      })
    }
    
    // 🔥 CRITICAL: Set initial state immediately
    onChange()
    
    // 🔥 ENHANCED: Listen to both resize and orientation change
    mql.addEventListener("change", onChange)
    window.addEventListener("resize", onChange)
    window.addEventListener("orientationchange", onChange)
    
    return () => {
      mql.removeEventListener("change", onChange)
      window.removeEventListener("resize", onChange)
      window.removeEventListener("orientationchange", onChange)
    }
  }, [])

  return !!isMobile
}