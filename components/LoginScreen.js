import React, { useState, useEffect } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { appStyles } from "../styles/Styles";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ADMIN_USERNAME = "Admin";
const ADMIN_PASSWORD = "galaxy@2026";

const LoginScreen = ({ onLocalAuth }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isWeb = Platform.OS === "web" && typeof window !== "undefined";

  const saveCredentials = async (u, p) => {
    if (isWeb && window.localStorage) {
      try {
        window.localStorage.setItem("username", u);
        window.localStorage.setItem("password", p);
      } catch (e) {
        // Storage error ignored
      }
    } else {
      try {
        await AsyncStorage.setItem("username", u);
        await AsyncStorage.setItem("password", p);
      } catch (e) {
        // Storage error ignored
      }
    }
  };

  const removeCredentials = async () => {
    if (isWeb && window.localStorage) {
      try {
        window.localStorage.removeItem("username");
        window.localStorage.removeItem("password");
      } catch (e) {
        // Storage error ignored
      }
    } else {
      try {
        await AsyncStorage.removeItem("username");
        await AsyncStorage.removeItem("password");
      } catch (e) {
        // Storage error ignored
      }
    }
  };

  const getStoredCredentials = async () => {
    if (isWeb && window.localStorage) {
      try {
        const savedUser = window.localStorage.getItem("username");
        const savedPass = window.localStorage.getItem("password");
        return { savedUser, savedPass };
      } catch (e) {
        return { savedUser: null, savedPass: null };
      }
    }
    try {
      const savedUser = await AsyncStorage.getItem("username");
      const savedPass = await AsyncStorage.getItem("password");
      return { savedUser, savedPass };
    } catch (e) {
      return { savedUser: null, savedPass: null };
    }
  };

  const handleLogin = async () => {
    setError("");

    if (!username.trim()) {
      setError("Please enter username");
      return;
    }

    if (!password.trim()) {
      setError("Please enter password");
      return;
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setLoading(true);
      setSuccess(true);
      await saveCredentials(username, password);
      setTimeout(() => {
        if (onLocalAuth) {
          onLocalAuth("admin@exposampleapp.com");
        }
        setLoading(false);
      }, 800);
    } else {
      setError("Invalid username or password");
      setPassword("");
      setSuccess(false);
      await removeCredentials();
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { savedUser, savedPass } = await getStoredCredentials();
      if (!mounted) return;
      if (savedUser) setUsername(savedUser);
      if (savedPass) setPassword(savedPass);
      if (savedUser === ADMIN_USERNAME && savedPass === ADMIN_PASSWORD) {
        setSuccess(true);
        setLoading(true);
        setTimeout(() => {
          if (onLocalAuth) onLocalAuth("admin@exposampleapp.com");
          setLoading(false);
        }, 600);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.appTitle}>Welcome Back</Text>
            <Text style={styles.appSubtitle}>Sign in to your account</Text>
          </View>

          <View style={styles.formContainer}>
            {error ? (
              <View style={styles.errorMessage}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={styles.successMessage}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successText}>Login successful! Redirecting...</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor="#aaa"
                  value={username}
                  onChangeText={setUsername}
                  editable={!loading}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { paddingRight: 50 }]}
                  placeholder="Enter your password"
                  placeholderTextColor="#aaa"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeText}>
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "Logging in..." : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Expo + Descope Sample App</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    padding: 20,
    paddingTop: Platform.OS === "web" ? 40 : 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 50,
    marginTop: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    ...Platform.select({
      web: {
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
      },
    }),
    marginBottom: 30,
  },
  errorMessage: {
    backgroundColor: "#ffebee",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#d32f2f",
  },
  errorIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  successMessage: {
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#388e3c",
  },
  successIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  successText: {
    color: "#2e7d32",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1a1a1a",
    backgroundColor: "#fafafa",
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
  eyeText: {
    fontSize: 20,
  },
  loginButton: {
    backgroundColor: "#841584",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: 30,
    ...Platform.select({
      web: {
        boxShadow: "0 4px 8px rgba(132, 21, 132, 0.3)",
      },
      default: {
        shadowColor: "#841584",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
      },
    }),
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  footerText: {
    fontSize: 14,
    color: "#999",
  },
});

export default LoginScreen;
