import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useEffect, useRef } from 'react';

interface Props {
  message: string;
  visible: boolean;
  type?: 'success' | 'error';
}

export default function Toast({
  message,
  visible,
  type = 'success',
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1800),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, message]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        type === 'error' && styles.error,
        { opacity },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: '#222',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    zIndex: 999,
  },
  error: { backgroundColor: '#F44336' },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
