import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import ScreenContainer from "@/components/common/ScreenContainer";
import { useAuth } from "@/hooks/useAuth";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      // Navigation to the app screens is handled by the root layout's
      // auth-state redirect once `login()` updates the employee state.
      await login({ email: email.trim(), password });
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer style={styles.container}>
      <Text style={styles.title}>Make My Event</Text>
      <Text style={styles.subtitle}>Employee sign in</Text>

      <AppInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!isSubmitting}
      />
      <AppInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!isSubmitting}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppButton title="Log In" onPress={handleSubmit} loading={isSubmitting} style={styles.button} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#687076",
    textAlign: "center",
    marginBottom: 12,
  },
  error: {
    color: "#d32f2f",
    textAlign: "center",
  },
  button: {
    marginTop: 8,
  },
});
