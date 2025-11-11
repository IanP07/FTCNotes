import React, { useCallback } from "react";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useClerk } from "@clerk/clerk-expo";

const GroupsScreen = () => {
  const { getToken, userId, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

  console.log("User email: ", user?.primaryEmailAddress?.emailAddress);
  console.log("User ID: ", userId);
  console.log("Is user signed in: ", isSignedIn);

  const router = useRouter();

  const switchPage = () => {
    router.push("/EventsScreen");
  };

  const colorScheme = useColorScheme();

  const lightTheme = {
    background: "#F3F3F3",
    textColor: "#000000",
  };

  const darkTheme = {
    background: "#111827",
    textColor: "#EFECD7",
  };

  const googleIcon = require("../assets/images/googleIcon.svg.png");

  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.topbar}>
        <TouchableOpacity
          onPress={async () => {
            await signOut();
            router.push("/");
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <Image style={styles.image} source={{ uri: user?.imageUrl }} />
            <Text style={{ color: theme.textColor }}>Sign out</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={{ width: "90%", marginBottom: 25 }}>
          <Text style={[styles.text, { color: theme.textColor }]}>
            You're currently not in any groups
          </Text>
        </View>
        <TouchableOpacity // button class with more functionality
          style={styles.button}
          activeOpacity={0.3}
          onPress={() => router.push("/creategroup")}
        >
          <Text style={[styles.buttonText, { color: "black" }]}>
            Create Group
          </Text>
        </TouchableOpacity>
        <TouchableOpacity // button class with more functionality
          style={styles.button}
          activeOpacity={0.3}
          onPress={switchPage}
        >
          <Text style={[styles.buttonText, { color: "black" }]}>
            Join Group
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GroupsScreen;

const styles = StyleSheet.create({
  topbar: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 70,
  },
  container: {
    flex: 1,
    height: 100,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  image: {
    width: 30,
    height: 30,
    borderRadius: 100,
    borderColor: "#dea300",
    borderWidth: 2,
    borderStyle: "solid",
  },
  text: {
    color: "black",
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
  },

  buttonText: {
    color: "black",
    fontSize: 19,
    fontWeight: "500",
    textAlign: "center",
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgb(250,200,0)",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 10,
    width: "85%",
    height: 75,
    borderRadius: 10,
    margin: 8,
    borderColor: "#dea300",
    borderStyle: "solid",
  },
});
