import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useColorScheme,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.72;
const CARD_GAP = 16;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP + 30;

function HighlightedTitle() {
    const colorScheme = useColorScheme();

    const theme =
        colorScheme === 'dark'
            ? { background: '#111827', textColor: '#EFECD7' }
            : { background: '#F3F3F3', textColor: '#000000' };

  return (
    <View style={titleStyles.wrapper}>
      <Text style={[styles.title, {color: theme.textColor}]}>Welcome to</Text>
      {/* "FTCNotes!" with SVG highlight slashed behind it */}
      <View style={titleStyles.highlightWrapper}>
        {/* SVG sits behind the text */}
        <Svg
          width="180"
          height="60"
          viewBox="10 0 220 15"
          preserveAspectRatio="none"
          style={titleStyles.svg}
        >
          <Path
            d="M2 15 C80 15, 120 13, 196 13"
            stroke="#F5C518"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
        </Svg>
        <Text style={[styles.title, {color: theme.textColor}]}>FTCNotes!</Text>
      </View>
    </View>
  );
}

const titleStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: 14,
  },
  highlightWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    alignSelf: 'center',
  },
});

function WelcomeScreen() {
  const colorScheme = useColorScheme();

  const theme =
    colorScheme === 'dark'
      ? { background: '#111827', textColor: '#EFECD7' }
      : { background: '#F3F3F3', textColor: '#000000' };

  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = [
    { key: 'slide1', color: '#1E2A3A' },
    { key: 'slide2', color: '#1A2E3A' },
    { key: 'slide3', color: '#1E2A30' },
  ];

  const switchPage = () => {
    router.push('/onboarding/onboarding1');
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / SNAP_INTERVAL);
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    if (clamped !== activeIndex) setActiveIndex(clamped);
  };

  return (
    <View style={styles.container}>

      {/* Header — logo pinned to top-left */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image
                style={{width: 32, height: 32, marginRight: 4}}
                source={require("../../assets/images/FTCNotesIcon.png")}
           />
          <Text style={[styles.logoText, { color: theme.textColor }]}>FTCNotes</Text>
        </View>
      </View>

      {/* Title with highlight */}
      <HighlightedTitle />

      <Text style={styles.subtitle}>
        The best app for{'\n'}scouting at FTC competitions{'\n'}and finding the perfect partners
      </Text>

      {/* Swipeable Cards */}
      <View style={styles.carouselContainer}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled={false}
          snapToInterval={SNAP_INTERVAL}
          snapToAlignment="center"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          style={{ backgroundColor: 'transparent' }}
        >
          {slides.map((slide) => (
            <View
              key={slide.key}
              style={[styles.card, { backgroundColor: slide.color }]}
            />
          ))}
        </ScrollView>

        {/* Dot Indicators */}
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
      </View>

      {/* Continue Button */}
      <TouchableOpacity onPress={switchPage} style={styles.continueButton} activeOpacity={0.85}>
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>

    </View>
  );
}

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 40,
  },

  // Header / Logo
  header: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconBox: {
    backgroundColor: '#F5C518',
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Title
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 38,
  },
  subtitle: {
    color: '#8b8b8c',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 32,
    paddingHorizontal: 24,
  },

  // Carousel
  carouselContainer: {
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
    alignItems: 'center',
    gap: CARD_GAP,
  },

  // Card
  card: {
    width: CARD_WIDTH,
    height: 420,
    borderRadius: 20,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    backgroundColor: '#3E4E66',
  },

  // Continue button
  continueButton: {
    backgroundColor: '#F5C518',
    borderRadius: 10,
    width: '82%',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginTop: 24,
  },
  continueText: {
    color: '#141C2B',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});