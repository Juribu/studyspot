/**
 * Vercel Web Analytics initialization
 * 
 * This module initializes Vercel Web Analytics for the StudySpot application.
 * Analytics will automatically track page views and can be used to track custom events.
 * 
 * Note: Analytics only work in production mode when deployed to Vercel.
 * In development, events are logged to the console if debug mode is enabled.
 */

import { inject } from '@vercel/analytics';

// Initialize Vercel Web Analytics
// The 'auto' mode automatically detects the environment:
// - In production: sends events to Vercel's analytics server
// - In development: logs events to the console (with debug enabled)
inject({
    mode: 'auto',
    debug: true
});

console.log('Vercel Web Analytics initialized');
