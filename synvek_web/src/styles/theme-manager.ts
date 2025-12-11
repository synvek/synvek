/**
 * Global Theme Manager
 * Centralized theme switching and synchronization
 */

import { theme } from 'antd'
import { getEnhancedTheme } from './enhanced-theme'

export type ThemeMode = 'light' | 'dark'

class ThemeManager {
  private currentTheme: ThemeMode = 'dark'
  private listeners: Array<(theme: ThemeMode) => void> = []

  constructor() {
    this.initializeTheme()
  }

  private initializeTheme() {
    // Get theme from localStorage
    const stored = localStorage.getItem('synvek.theme') as ThemeMode
    this.currentTheme = stored || 'dark'
    
    // Set initial DOM attribute
    document.documentElement.setAttribute('data-theme', this.currentTheme)
  }

  public getCurrentTheme(): ThemeMode {
    return this.currentTheme
  }

  public switchTheme(): ThemeMode {
    const newTheme: ThemeMode = this.currentTheme === 'dark' ? 'light' : 'dark'
    this.setTheme(newTheme)
    return newTheme
  }

  public setTheme(theme: ThemeMode) {
    if (this.currentTheme === theme) return

    this.currentTheme = theme
    
    // Update localStorage
    localStorage.setItem('synvek.theme', theme)
    
    // Update DOM attribute
    document.documentElement.setAttribute('data-theme', theme)
    
    // Force CSS recalculation
    this.forceCSSRecalculation()
    
    // Notify listeners
    this.notifyListeners(theme)
    
    // Dispatch global event
    const event = new CustomEvent('themeChange', { 
      detail: { theme } 
    })
    window.dispatchEvent(event)
  }

  private forceCSSRecalculation() {
    // Force browser to recalculate all CSS variables
    const root = document.documentElement
    
    // Temporarily add a class to trigger recalculation
    root.classList.add('theme-updating')
    
    // Use requestAnimationFrame to ensure the DOM update is processed
    requestAnimationFrame(() => {
      root.classList.remove('theme-updating')
      
      // Force style recalculation on all elements
      const allElements = document.querySelectorAll('*')
      allElements.forEach(el => {
        if (el instanceof HTMLElement) {
          // Access computed style to force recalculation
          window.getComputedStyle(el).getPropertyValue('color')
        }
      })
    })
  }

  public getAntdThemeConfig() {
    const enhancedTheme = getEnhancedTheme()
    return {
      ...enhancedTheme,
      algorithm: [this.currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm]
    }
  }

  public addListener(callback: (theme: ThemeMode) => void) {
    this.listeners.push(callback)
  }

  public removeListener(callback: (theme: ThemeMode) => void) {
    const index = this.listeners.indexOf(callback)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  private notifyListeners(theme: ThemeMode) {
    this.listeners.forEach(callback => {
      try {
        callback(theme)
      } catch (error) {
        console.error('Error in theme listener:', error)
      }
    })
  }
}

// Create singleton instance
export const themeManager = new ThemeManager()

// Export convenience functions
export const getCurrentTheme = () => themeManager.getCurrentTheme()
export const switchTheme = () => themeManager.switchTheme()
export const setTheme = (theme: ThemeMode) => themeManager.setTheme(theme)
export const getAntdThemeConfig = () => themeManager.getAntdThemeConfig()
export const addThemeListener = (callback: (theme: ThemeMode) => void) => themeManager.addListener(callback)
export const removeThemeListener = (callback: (theme: ThemeMode) => void) => themeManager.removeListener(callback)