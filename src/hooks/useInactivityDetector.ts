import { useEffect } from 'react';
import { useAnimationStore } from '../stores/animationStore';

export function useInactivityDetector() {
  const {
    inactivityTimeout,
    lastActivityTime,
    updateActivity,
    isPerformanceMode,
    playbackState,
    setPlaybackState,
  } = useAnimationStore();

  useEffect(() => {
    // Track user activity
    const handleActivity = () => {
      updateActivity();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Check for inactivity every second
    const checkInterval = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActivityTime;
      const timeoutMs = inactivityTimeout * 60 * 1000; // Convert minutes to ms

      // If inactive for longer than timeout and animation is playing, pause it
      if (inactiveTime > timeoutMs && playbackState.isPlaying && !isPerformanceMode) {
        console.log('Auto-pausing due to inactivity');
        setPlaybackState({ isPlaying: false });
      }
    }, 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(checkInterval);
    };
  }, [inactivityTimeout, lastActivityTime, updateActivity, playbackState.isPlaying, setPlaybackState, isPerformanceMode]);
}
