import { router } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  useColorScheme,
  Image,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function Onboarding2() {
  const colorScheme = useColorScheme();
  const theme =
    colorScheme === 'dark'
      ? { background: '#111827', textColor: '#EFECD7' }
      : { background: '#F3F3F3', textColor: '#000000' };

  const goBack = () => router.back();
  const goNext = () => router.push('/onboarding/onboarding3');

  return (
    <View style={styles.container}>

      {/* Header — logo pinned to top-left */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIconBox} />
          <Text style={[styles.logoText, { color: theme.textColor }]}>FTCNotes</Text>
        </View>
      </View>

      {/* Title with highlight */}
      <View style={styles.titleWrapper}>
        <View style={styles.highlightWrapper}>
          <Svg
            width="250"
            height="60"
            viewBox="0 0 200 15"
            preserveAspectRatio="none"
            style={styles.svg}
          >
            <Path
              d="M2 14 C80 15, 120 13, 196 13"
              stroke="#F5C518"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
          </Svg>
          <Text style={[styles.title, { color: theme.textColor }]}>2.) Create Events</Text>
        </View>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Create events your group will{'\n'}be attending to organize your notes
      </Text>

      {/* Placeholder card */}
      <View style={styles.card} />

      {/* Bottom buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={goBack}
          style={[styles.backButton, {
            backgroundColor: colorScheme === 'dark' ? 'rgb(33,40,55)' : '',
            borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(56,56,56,0.2)',
          }]}
          activeOpacity={0.85}>
          <Text style={[styles.backText, { color: theme.textColor }]}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goNext} style={styles.continueButton} activeOpacity={0.85}>
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

export default Onboarding2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 40,
  },

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
    marginRight: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  titleWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  highlightWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center',
  },
  title: {
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

  card: {
    flex: 1,
    width: SCREEN_WIDTH * 0.82,
    backgroundColor: '#1E2A3A',
    borderRadius: 20,
    marginBottom: 32,
  },

  buttonRow: {
    flexDirection: 'row',
    width: '82%',
    gap: 12,
  },
  backButton: {
    flex: 1,
    height: 60,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'solid',
  },
  backText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  continueButton: {
    flex: 1,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    color: '#141C2B',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});