import { useState } from "react";
import { View, StyleSheet, Vibration } from "react-native";
import { Text, Button, Surface, IconButton, Divider } from "react-native-paper";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter, useLocalSearchParams } from "expo-router";
import { scanStore } from "./scanStore";

export default function CameraScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const warehouseMode = from === "warehouse";
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<{ type: string; data: string } | null>(null);

  async function handleOpenCamera() {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setScanned(false);
    setScanning(true);
  }

  function handleBarcodeScanned({ type, data }: { type: string; data: string }) {
    if (scanned) return;
    setScanned(true);
    setScanning(false);
    Vibration.vibrate(100);
    if (warehouseMode) {
      scanStore.set(data);
      router.back();
      return;
    }
    setResult({ type, data });
  }

  function handleRescan() {
    setScanned(false);
    setResult(null);
    setScanning(true);
  }

  if (scanning) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        >
          <View style={styles.overlay}>
            <View style={styles.topMask} />
            <View style={styles.middleRow}>
              <View style={styles.sideMask} />
              <View style={styles.scanBox}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <View style={styles.sideMask} />
            </View>
            <View style={styles.bottomMask}>
              <Text style={styles.hint}>{warehouseMode ? "扫描快递条码自动入库" : "将二维码放入框内自动识别"}</Text>
              <IconButton
                icon="close"
                size={28}
                iconColor="#fff"
                onPress={() => setScanning(false)}
              />
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Surface style={styles.card} elevation={2}>
          <IconButton
            icon="qrcode-scan"
            size={64}
            iconColor="#6750A4"
            style={styles.topIcon}
          />
          <Text variant="headlineSmall" style={styles.title}>
            扫描二维码
          </Text>
          <Text variant="bodyMedium" style={styles.desc}>
            点击下方按钮调起摄像头，对准二维码自动识别
          </Text>

          <Button
            mode="contained"
            icon="qrcode-scan"
            onPress={handleOpenCamera}
            style={styles.btn}
            contentStyle={styles.btnContent}
          >
            {result ? "重新扫描" : "开始扫描"}
          </Button>

          {result && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.resultBox}>
                <View style={styles.resultHeader}>
                  <IconButton icon="check-circle" size={20} iconColor="#4CAF50" />
                  <Text variant="labelLarge" style={styles.resultLabel}>
                    识别结果
                  </Text>
                </View>
                <Text variant="bodySmall" style={styles.resultType}>
                  类型：{result.type}
                </Text>
                <Surface style={styles.resultContent} elevation={0}>
                  <Text variant="bodyMedium" style={styles.resultData} selectable>
                    {result.data}
                  </Text>
                </Surface>
                <Button
                  mode="outlined"
                  icon="refresh"
                  onPress={handleRescan}
                  style={styles.rescanBtn}
                >
                  再次扫描
                </Button>
              </View>
            </>
          )}

          <Button mode="text" icon="table" onPress={() => router.push("/warehouse")} style={styles.backBtn}>
            查看入库记录
          </Button>
          <Button mode="text" onPress={() => router.replace("/")} style={styles.backBtn}>
            退出登录
          </Button>
        </Surface>
      </View>
    </View>
  );
}

const SCAN_BOX = 240;
const CORNER = 24;
const BORDER = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3EFF5" },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  card: {
    borderRadius: 16,
    padding: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  topIcon: { marginBottom: 4 },
  title: { fontWeight: "bold", color: "#1C1B1F", marginBottom: 8 },
  desc: { color: "#625B71", marginBottom: 24, textAlign: "center" },
  btn: { borderRadius: 8, width: "100%" },
  btnContent: { paddingVertical: 6 },
  divider: { width: "100%", marginVertical: 20 },
  resultBox: { width: "100%", alignItems: "flex-start" },
  resultHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  resultLabel: { color: "#4CAF50", fontWeight: "600" },
  resultType: { color: "#888", marginBottom: 8, marginLeft: 4 },
  resultContent: {
    width: "100%",
    backgroundColor: "#F3EFF5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  resultData: { color: "#1C1B1F", lineHeight: 22 },
  rescanBtn: { width: "100%", borderRadius: 8 },
  backBtn: { marginTop: 12 },

  // Camera
  cameraContainer: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  overlay: { flex: 1 },
  topMask: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  middleRow: { flexDirection: "row", height: SCAN_BOX },
  sideMask: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  scanBox: { width: SCAN_BOX, height: SCAN_BOX },
  bottomMask: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    paddingTop: 16,
  },
  hint: { color: "#fff", fontSize: 14, opacity: 0.85 },

  // Corners
  corner: { position: "absolute", width: CORNER, height: CORNER },
  cornerTL: { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER, borderColor: "#6750A4" },
  cornerTR: { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER, borderColor: "#6750A4" },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER, borderColor: "#6750A4" },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER, borderColor: "#6750A4" },
});
