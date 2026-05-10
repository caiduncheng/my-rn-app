import { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Surface,
  HelperText,
  Snackbar,
} from "react-native-paper";
import { useRouter } from "expo-router";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "123";

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [snackVisible, setSnackVisible] = useState(false);

  const usernameError = username.length > 0 && username !== VALID_USERNAME;
  const passwordError = password.length > 0 && password !== VALID_PASSWORD;

  function handleLogin() {
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      router.push("/camera");
    } else {
      setError("账号或密码错误");
      setSnackVisible(true);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text variant="displaySmall" style={styles.appName}>
            Welcome
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            请登录以继续
          </Text>
        </View>

        <Surface style={styles.card} elevation={2}>
          <Text variant="titleLarge" style={styles.cardTitle}>
            账号登录
          </Text>

          <TextInput
            label="账号"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            left={<TextInput.Icon icon="account" />}
            autoCapitalize="none"
            error={usernameError}
            style={styles.input}
          />
          <HelperText type="error" visible={usernameError}>
            账号不存在
          </HelperText>

          <TextInput
            label="密码"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={passwordVisible ? "eye-off" : "eye"}
                onPress={() => setPasswordVisible((v) => !v)}
              />
            }
            secureTextEntry={!passwordVisible}
            error={passwordError}
            style={styles.input}
          />
          <HelperText type="error" visible={passwordError}>
            密码错误
          </HelperText>

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.loginBtn}
            contentStyle={styles.loginBtnContent}
            disabled={!username || !password}
          >
            登录
          </Button>
        </Surface>
      </View>

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={2500}
        action={{ label: "关闭", onPress: () => setSnackVisible(false) }}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3EFF5",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  appName: {
    fontWeight: "bold",
    color: "#6750A4",
  },
  subtitle: {
    color: "#625B71",
    marginTop: 4,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  cardTitle: {
    marginBottom: 20,
    fontWeight: "600",
    color: "#1C1B1F",
  },
  input: {
    marginBottom: 0,
  },
  loginBtn: {
    marginTop: 12,
    borderRadius: 8,
  },
  loginBtnContent: {
    paddingVertical: 6,
  },
});
