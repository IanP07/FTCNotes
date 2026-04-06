import React, { useCallback } from "react";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Button,
} from "react-native";
import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

function WelcomeOnboarding() {
  const router = useRouter();

  const switchPage = () => {
    router.push("./index");
  };

  return (
    <View
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 100,
        height: 100,
      }}
    >
      <Button
        title="Sign out"
        onPress={async () => {
          switchPage();
        }}
      />
    </View>
  );
}

export default WelcomeOnboarding;
