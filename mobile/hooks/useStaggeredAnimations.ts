import { useEffect, useRef, useMemo } from 'react';
import { Animated } from 'react-native';

interface StaggeredAnimationConfig {
  itemCount: number;
  delayBetween: number;
  duration?: number;
  startDelay?: number;
}

export function useStaggeredAnimations({
  itemCount,
  delayBetween = 50,
  duration = 400,
  startDelay = 0,
}: StaggeredAnimationConfig) {
  // Create animations array that matches itemCount - recreate when itemCount changes
  const animations = useMemo(
    () =>
      Array.from({ length: itemCount }, () => ({
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(30),
        scale: new Animated.Value(0.9),
      })),
    [itemCount]
  );

  useEffect(() => {
    // Only run animations if we have items
    if (itemCount === 0) return;

    animations.forEach((anim, index) => {
      // Reset values first
      anim.opacity.setValue(0);
      anim.translateY.setValue(30);
      anim.scale.setValue(0.9);

      // Start animation
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration,
          delay: startDelay + index * delayBetween,
          useNativeDriver: true,
        }),
        Animated.spring(anim.translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          delay: startDelay + index * delayBetween,
          useNativeDriver: true,
        }),
        Animated.spring(anim.scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          delay: startDelay + index * delayBetween,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [itemCount, delayBetween, duration, startDelay]);

  const getStyle = (index: number) => {
    if (index >= animations.length) {
      // Fallback if index is out of bounds
      return {
        opacity: 1,
        transform: [{ translateY: 0 }, { scale: 1 }],
      };
    }
    return {
      opacity: animations[index].opacity,
      transform: [
        { translateY: animations[index].translateY },
        { scale: animations[index].scale },
      ],
    };
  };

  return { getStyle };
}

