import "core-js/stable/atob";

import * as React from "react";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { Alert, View, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { appStyles } from "./styles/Styles";
import Dashboard from "./components/Dashboard";
import LoginScreen from "./components/LoginScreen";
import { jwtDecode } from "jwt-decode";

WebBrowser.maybeCompleteAuthSession();

const descopeProjectId = process.env.EXPO_PUBLIC_DESCOPE_PROJECT_ID;
const descopeUrl = `https://api.descope.com/${descopeProjectId}`;
const redirectUri = AuthSession.makeRedirectUri();

export default function App() {
  const [authTokens, setAuthTokens] = React.useState(null);
  const [userInfo, setUserInfo] = React.useState(null);
  const discovery = AuthSession.useAutoDiscovery(descopeUrl);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: descopeProjectId,
      responseType: AuthSession.ResponseType.Code,
      redirectUri,
      usePKCE: true,
      scopes: ["openid", "profile", "email"],
    },
    discovery
  );

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
    const exchangeFn = async (exchangeTokenReq) => {
      try {
        const exchangeTokenResponse = await AuthSession.exchangeCodeAsync(
          exchangeTokenReq,
          discovery
        );
        setAuthTokens(exchangeTokenResponse);
      } catch (error) {
        console.error(error);
      }
    };
    if (response) {
      if (response.error) {
        Alert.alert(
          "Authentication error",
          response.params.error_description || "something went wrong"
        );
        return;
      }
      if (response.type === "success") {
        exchangeFn({
          clientId: descopeProjectId,
          code: response.params.code,
          redirectUri,
          extraParams: {
            code_verifier: request.codeVerifier,
          },
        });
      }
    }
  }, [discovery, request, response]);

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
    
    // If using Descope, uncomment below:
    // const revokeResponse = await AuthSession.revokeAsync(
    //   {
    //     clientId: descopeProjectId,
    //     token: authTokens.refreshToken,
    //   },
    //   discovery
    // );
    // if (revokeResponse) {
    //   setAuthTokens(null);
    // }
  };

  // console.log("authTokens: " + JSON.stringify(authTokens));
  return (
    <View style={appStyles.container}>
      {authTokens ? (
        <Dashboard userInfo={userInfo} onLogout={logout} />
      ) : (
        <LoginScreen 
          onLogin={promptAsync} 
          request={request}
          onLocalAuth={handleLocalAuth}
        />
      )}
    </View>
  );
}
