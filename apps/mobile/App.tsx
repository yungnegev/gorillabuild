import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { defaultLocale, getMessages } from "@gorillabuild/i18n";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";

export default function App() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <AppContent />
    </ClerkProvider>
  );
}

function AppContent() {
  const { isSignedIn } = useAuth();
  const messages = getMessages(defaultLocale);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>
        {isSignedIn
          ? messages.mobile.auth.signedIn
          : messages.mobile.auth.notSignedIn}
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}
