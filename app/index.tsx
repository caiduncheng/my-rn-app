import { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Text, TextInput, Button, HelperText, Snackbar } from "react-native-paper";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "123456";

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [snackVisible, setSnackVisible] = useState(false);

  const usernameError = username.length > 0 && username !== VALID_USERNAME;
  const passwordError = password.length > 0 && password !== VALID_PASSWORD;

  function handleLogin() {
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      router.push("/warehouse");
    } else {
      setSnackVisible(true);
    }
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>

      {/* ── Hero ── */}
      <View style={s.hero}>
        <View style={[s.blob, s.blob1]} />
        <View style={[s.blob, s.blob2]} />
        <View style={[s.blob, s.blob3]} />

        <View style={s.logoWrap}>
          <View style={s.iconCircle}>
            <MaterialCommunityIcons name="package-variant-closed" size={38} color="#6750A4" />
          </View>
          <Text style={s.appName}>快递驿站</Text>
          <Text style={s.appTagline}>智能入库管理系统</Text>
        </View>

        <View style={s.badgeRow}>
          {["快速录入", "扫码入库", "状态追踪"].map((t) => (
            <View key={t} style={s.badge}>
              <Text style={s.badgeText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Form sheet ── */}
      <View style={s.sheet}>
        <View style={s.handle} />

        <Text style={s.sheetTitle}>欢迎回来</Text>
        <Text style={s.sheetSub}>请登录您的管理账号</Text>

        <TextInput
          label="账号"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          left={<TextInput.Icon icon="account-circle-outline" />}
          autoCapitalize="none"
          error={usernameError}
          style={s.input}
          outlineStyle={s.inputOutline}
        />
        <HelperText type="error" visible={usernameError} style={s.helperText}>
          账号不存在
        </HelperText>

        <TextInput
          label="密码"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          left={<TextInput.Icon icon="lock-outline" />}
          right={
            <TextInput.Icon
              icon={passwordVisible ? "eye-off-outline" : "eye-outline"}
              onPress={() => setPasswordVisible((v) => !v)}
            />
          }
          secureTextEntry={!passwordVisible}
          error={passwordError}
          style={s.input}
          outlineStyle={s.inputOutline}
        />
        <HelperText type="error" visible={passwordError} style={s.helperText}>
          密码错误
        </HelperText>

        <Button
          mode="contained"
          onPress={handleLogin}
          style={s.loginBtn}
          contentStyle={s.loginBtnContent}
          disabled={!username || !password}
          buttonColor="#6750A4"
          labelStyle={s.loginBtnLabel}
        >
          登 录
        </Button>

        <Text style={s.hint}>默认账号 admin · 密码 123456</Text>
      </View>

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={2500}
      >
        账号或密码错误，请重试
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1B0F42" },

  // ── Hero ──────────────────────────────────────────
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    paddingBottom: 24,
  },

  blob: { position: "absolute", borderRadius: 999 },
  blob1: { width: 260, height: 260, top: -80,  right: -70, backgroundColor: "rgba(139,92,246,0.13)" },
  blob2: { width: 200, height: 200, bottom: 10, left: -60, backgroundColor: "rgba(99,102,241,0.10)" },
  blob3: { width: 130, height: 130, top: 60,   left: 40,  backgroundColor: "rgba(168,85,247,0.07)" },

  logoWrap: { alignItems: "center", marginBottom: 28 },

  iconCircle: {
    width: 84, height: 84,
    borderRadius: 26,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },

  appName: {
    fontSize: 34,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 6,
    marginBottom: 6,
  },
  appTagline: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1.5,
  },

  badgeRow: { flexDirection: "row", gap: 10 },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  badgeText: { color: "rgba(255,255,255,0.65)", fontSize: 12 },

  // ── Form sheet ────────────────────────────────────
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 40,
  },

  handle: {
    width: 44, height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 28,
  },

  sheetTitle: { fontSize: 26, fontWeight: "800", color: "#1C1B1F", marginBottom: 4 },
  sheetSub:   { fontSize: 14, color: "#9CA3AF", marginBottom: 20 },

  input:        { backgroundColor: "#fff", marginBottom: 0 },
  inputOutline: { borderRadius: 12 },
  helperText:   { marginTop: -6, marginBottom: 2 },

  loginBtn:        { borderRadius: 14, marginTop: 10 },
  loginBtnContent: { paddingVertical: 8 },
  loginBtnLabel:   { fontSize: 16, fontWeight: "700", letterSpacing: 3 },

  hint: { textAlign: "center", marginTop: 22, fontSize: 12, color: "#C4B8D6" },
});
