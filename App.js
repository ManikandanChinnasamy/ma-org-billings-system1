import "core-js/stable/atob";

import * as React from "react";
import { Alert, View, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { appStyles } from "./styles/Styles";
import Dashboard from "./components/Dashboard";
import LoginScreen from "./components/LoginScreen";
import { jwtDecode } from "jwt-decode";

const descopeProjectId = process.env.EXPO_PUBLIC_DESCOPE_PROJECT_ID;

export default function App() {
  const [authTokens, setAuthTokens] = React.useState(null);
  const [userInfo, setUserInfo] = React.useState(null);

  // Handle local authentication (for demo purposes)
  const handleLocalAuth = (userEmail) => {
    // Create a mock JWT token with proper structure (header.payload.signature)
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({ 
      email: userEmail,
      sub: "admin-user",
      iat: Math.floor(Date.now() / 1000)
    }));
    const signature = "mock_signature";
    const mockToken = `${header}.${payload}.${signature}`;

    const mockTokens = {
      accessToken: mockToken,
      refreshToken: "mock_refresh_token_" + Date.now(),
    };
    setAuthTokens(mockTokens);
    setUserInfo({ email: userEmail });
  };

  React.useEffect(() => {
    if (authTokens && authTokens.accessToken) {
      try {
        const decodedToken = jwtDecode(authTokens.accessToken);
        setUserInfo(decodedToken);
      } catch (error) {
        // If token is not a valid JWT (e.g., mock token), userInfo is already set
        console.log("Token decode skipped (using mock token)");
      }
    }
  }, [authTokens]);

  const logout = async () => {
    // Clear credentials from local storage
    const isWeb = Platform.OS === "web" && typeof window !== "undefined";
    
    if (isWeb && window.localStorage) {
      try {
        window.localStorage.removeItem("username");
        window.localStorage.removeItem("password");
      } catch (e) {
        console.log("Error clearing web storage:", e);
      }
    } else {
      try {
        await AsyncStorage.removeItem("username");
        await AsyncStorage.removeItem("password");
      } catch (e) {
        console.log("Error clearing AsyncStorage:", e);
      }
    }

    // For local auth, just clear the tokens
    setAuthTokens(null);
    setUserInfo(null);
  };

  // console.log("authTokens: " + JSON.stringify(authTokens));
  return (
    <View style={appStyles.container}>
      {authTokens ? (
        <Dashboard userInfo={userInfo} onLogout={logout} />
      ) : (
        <LoginScreen 
          onLocalAuth={handleLocalAuth}
        />
      )}
    </View>
  );
}
