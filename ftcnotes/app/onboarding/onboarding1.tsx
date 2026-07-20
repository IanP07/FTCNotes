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
import * as Haptics from "expo-haptics";


const { width: SCREEN_WIDTH } = Dimensions.get('window');

function Onboarding1() {
  const colorScheme = useColorScheme();
  const theme =
    colorScheme === 'dark'
      ? { background: '#111827', textColor: '#EFECD7' }
      : { background: '#F3F3F3', textColor: '#000000' };

  return (
    <View style={styles.container}>

      {/* Header — logo pinned to top-left */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image 
            source={require("../../assets/images/FTCNotesIcon.png")} 
            style={styles.logoIconBox} 
          />
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
          <Text style={[styles.title, { color: theme.textColor }]}>1.) Find a Group</Text>
        </View>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Create or join a group to{'\n'}share your scouting stats with{'\n'}other team members
      </Text>

      {/* Placeholder card */}
      <Image 
        style={styles.card} 
        source={require("../../assets/images/myGroup.png")}
      />

      {/* Bottom buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.backButton, {
                backgroundColor:
                      colorScheme === "dark" ? "rgb(33,40,55)" : "",
                borderColor:
                    colorScheme === "dark"
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(56, 56, 56, 0.2)",}]} 
            
            activeOpacity={0.85}>
          <Text style={[styles.backText, {color: theme.textColor}]}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/onboarding/onboarding2');
          }} 
          style={styles.continueButton} activeOpacity={0.85}>
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

export default Onboarding1;

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
    width: 32,
    height: 32,
    marginRight: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Title
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

  // Subtitle
  subtitle: {
    color: '#8b8b8c',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 32,
    paddingHorizontal: 24,
  },

  // Placeholder card
  card: {
    flex: 1,
    width: SCREEN_WIDTH * 0.8,
    borderRadius: 10,
    marginBottom: 32,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    width: '82%',
    gap: 12,
  },
  backButton: {
    flex: 1,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#1E2A3A',
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