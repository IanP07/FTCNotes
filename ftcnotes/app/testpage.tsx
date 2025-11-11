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
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

function Test() {
  const { getToken, userId, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

  console.log("User email: ", user?.primaryEmailAddress?.emailAddress);
  console.log("User ID: ", userId);
  console.log("Is user signed in: ", isSignedIn);

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
          await signOut();
          switchPage();
        }}
      />
    </View>
  );
}

export default Test;
