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
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useClerk } from "@clerk/clerk-expo";

const CreateGroupsScreen = () => {
  const { getToken, userId, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

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

  const backIcon =
    colorScheme === "dark"
      ? require("../assets/images/FTCNotesBackIconDark.png")
      : require("../assets/images/FTCNotesBackIconLight.png");

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.topbar}>
        <TouchableOpacity
          activeOpacity={0.3}
          onPress={() => router.push("/groups")}
        >
          <Image style={styles.backIcon} source={backIcon} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            await signOut();
            router.push("/");
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
              marginRight: 10,
            }}
          >
            <Image style={styles.image} source={{ uri: user?.imageUrl }} />
            <Text style={{ color: theme.textColor }}>Sign out</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <TextInput
          placeholder="Enter group name"
          style={[
            styles.textInput,
            {
              backgroundColor:
                colorScheme === "dark" ? "rgb(33,40,55)" : "#F2F2F2",
              borderColor:
                colorScheme === "dark"
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(0,0,0,0.2)",
            },
          ]}
        />
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.3}
          onPress={switchPage}
        >
          <Text style={[styles.buttonText, { color: "black" }]}>
            Create Group
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CreateGroupsScreen;

const styles = StyleSheet.create({
  topbar: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
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
    marginBottom: 100,
  },
  textInput: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: "85%",
    maxWidth: 500,
    borderRadius: 10,
    minHeight: 70,
    margin: 8,
    backgroundColor: "rgb(33,40,55)",
    borderColor: "rgba(255,255,255,0.2)",
    borderStyle: "solid",
    borderWidth: 1,
    fontSize: 20,
  },
  backIcon: {
    width: 60,
    height: 60,
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
