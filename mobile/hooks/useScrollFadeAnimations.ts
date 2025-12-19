import { useRef } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

export function useScrollFadeAnimations() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        
        // Fade out header as we scroll down
        const opacity = Math.max(0, 1 - offsetY / 100);
        headerOpacity.setValue(opacity);
        
        // Translate header up as we scroll
        const translateY = Math.max(-50, -offsetY / 2);
        headerTranslateY.setValue(translateY);
      },
    }
  );

  return {
    scrollY,
    headerOpacity,
    headerTranslateY,
    onScroll,
  };
}


