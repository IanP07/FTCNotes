import { Stack } from "expo-router";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { useColorScheme } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <ClerkProvider
      publishableKey="pk_test_ZmFtb3VzLXJvdWdoeS05NC5jbGVyay5hY2NvdW50cy5kZXYk"
      tokenCache={tokenCache}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? "#111827" : "#EFECD7",  
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="testpage" />
        <Stack.Screen name="groups" />
        <Stack.Screen name="creategroup" />
        <Stack.Screen name="EventsScreen" />
        <Stack.Screen name="joingroup" />
        <Stack.Screen name="admindashboard" />
        <Stack.Screen name="dashboardmembers" />
        <Stack.Screen name="dashboardpending" />
        <Stack.Screen name="TeamsScreen/[id]" />
        <Stack.Screen name="InfoScreen/[id]/[event_id]" />
      </Stack>
    </ClerkProvider>
  );
}
