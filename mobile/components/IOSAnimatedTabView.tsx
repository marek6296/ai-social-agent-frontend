import React, { useRef } from 'react';
import { StyleSheet, Dimensions, Animated } from 'react-native';
import { PanResponder } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;
const ANIMATION_DURATION = 280; // 250-300ms range

interface IOSAnimatedTabViewProps {
  children: React.ReactNode;
  routeName: string;
  tabRoutes: string[];
}

export function IOSAnimatedTabView({ children, routeName, tabRoutes }: IOSAnimatedTabViewProps) {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const translateX = useRef(new Animated.Value(0)).current;
  const currentIndex = tabRoutes.indexOf(routeName);
  const previousIndexRef = useRef(currentIndex);
  const isAnimatingRef = useRef(false);

  // Handle tab change animation (via tab bar tap)
  useFocusEffect(
    React.useCallback(() => {
      // Skip if we're already animating from a swipe
      if (isAnimatingRef.current) {
        isAnimatingRef.current = false;
        previousIndexRef.current = currentIndex;
        return;
      }

      const direction = currentIndex - previousIndexRef.current;
      
      // Only animate if we have a valid previous index and direction changed
      if (direction !== 0 && previousIndexRef.current >= 0 && previousIndexRef.current !== currentIndex) {
        // Determine slide direction
        // Positive direction = moving forward (right) = new screen comes from right
        // Negative direction = moving backward (left) = new screen comes from left
        
        const fromValue = direction > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH;
        
        // Start animation from opposite side
        translateX.setValue(fromValue);
        
        // Animate to center with spring effect
        Animated.spring(translateX, {
          toValue: 0,
          tension: 85, // Higher tension for more responsive feel
          friction: 10, // Subtle spring effect
          useNativeDriver: true,
          velocity: 0,
        }).start();
      } else {
        // Reset position on initial mount
        translateX.setValue(0);
      }
      
      previousIndexRef.current = currentIndex;
    }, [currentIndex, translateX])
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        translateX.setOffset(translateX._value);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Limit swipe based on current tab position
        const newDx = gestureState.dx;
        if (newDx > 0 && currentIndex === 0) return; // Can't swipe right from first tab
        if (newDx < 0 && currentIndex === tabRoutes.length - 1) return; // Can't swipe left from last tab
        
        // Clamp the translation to prevent over-swiping
        const clampedDx = Math.max(
          -SCREEN_WIDTH,
          Math.min(SCREEN_WIDTH, newDx)
        );
        translateX.setValue(clampedDx);
      },
      onPanResponderRelease: (_, gestureState) => {
        translateX.flattenOffset();
        const { dx, vx } = gestureState;

        // Swipe right (go to previous tab - lower index)
        if ((dx > SWIPE_THRESHOLD || vx > 0.5) && currentIndex > 0) {
          isAnimatingRef.current = true;
          const prevRoute = tabRoutes[currentIndex - 1];
          
          // Animate current screen to the right
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }).start(() => {
            translateX.setValue(0);
            navigation.navigate(prevRoute);
          });
        }
        // Swipe left (go to next tab - higher index)
        else if ((dx < -SWIPE_THRESHOLD || vx < -0.5) && currentIndex < tabRoutes.length - 1) {
          isAnimatingRef.current = true;
          const nextRoute = tabRoutes[currentIndex + 1];
          
          // Animate current screen to the left
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }).start(() => {
            translateX.setValue(0);
            navigation.navigate(nextRoute);
          });
        }
        // Return to original position with spring
        else {
          Animated.spring(translateX, {
            toValue: 0,
            tension: 85,
            friction: 10,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
