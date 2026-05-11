import { useState, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import {
  Text,
  Surface,
  Searchbar,
  FAB,
  Modal,
  Portal,
  TextInput,
  Button,
  IconButton,
  Divider,
  Menu,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { scanStore } from "./scanStore";

type Status = "pending" | "picked" | "overdue";

interface StockRecord {
  id: string;
  orderNo: string;
  productName: string;
  courier: string;
  recipient: string;
  phone: string;
  shelf: string;
  entryDate: string;
  weight: string;
  remark: string;
  status: Status;
}

const COURIERS = ["顺丰速递", "京东快递", "圆通速递", "中通快递", "韵达快递", "中国邮政"];

const COURIER_ABBR: Record<string, string> = {
  顺丰速递: "SF",
  京东快递: "JD",
  圆通速递: "YT",
  中通快递: "ZT",
  韵达快递: "YD",
  中国邮政: "邮",
};

const COURIER_COLOR: Record<string, string> = {
  顺丰速递: "#C62828",
  京东快递: "#E53935",
  圆通速递: "#1565C0",
  中通快递: "#F9A825",
  韵达快递: "#2E7D32",
  中国邮政: "#00695C",
};

const STATUS_CFG: Record<Status, { label: string; color: string; bg: string }> = {
  pending: { label: "待取件", color: "#E65100", bg: "#FFF3E0" },
  picked:  { label: "已取件", color: "#2E7D32", bg: "#E8F5E9" },
  overdue: { label: "超期滞留", color: "#B71C1C", bg: "#FFEBEE" },
};

const FILTER_OPTS = [
  { value: "all",     label: "全部" },
  { value: "pending", label: "待取件" },
  { value: "picked",  label: "已取件" },
  { value: "overdue", label: "超期" },
];

const INITIAL_RECORDS: StockRecord[] = [
  {
    id: "1", orderNo: "SF1234567890", productName: "苹果手机 iPhone 16",
    courier: "顺丰速递", recipient: "张三", phone: "138****5678",
    shelf: "A-01", entryDate: "2026-05-07", weight: "0.5",
    remark: "易碎品，轻拿轻放", status: "overdue",
  },
  {
    id: "2", orderNo: "JD9876543210", productName: "小米笔记本电脑",
    courier: "京东快递", recipient: "李四", phone: "139****1234",
    shelf: "B-03", entryDate: "2026-05-10", weight: "2.1",
    remark: "", status: "pending",
  },
  {
    id: "3", orderNo: "YTO5566778899", productName: "耐克运动鞋",
    courier: "圆通速递", recipient: "王五", phone: "135****9012",
    shelf: "C-07", entryDate: "2026-05-10", weight: "1.2",
    remark: "", status: "picked",
  },
  {
    id: "4", orderNo: "ZTO1122334455", productName: "美的空气净化器",
    courier: "中通快递", recipient: "赵六", phone: "136****3456",
    shelf: "A-05", entryDate: "2026-05-11", weight: "5.8",
    remark: "大件，放一楼", status: "pending",
  },
  {
    id: "5", orderNo: "YD6677889900", productName: "飞利浦电动牙刷",
    courier: "韵达快递", recipient: "陈七", phone: "137****7890",
    shelf: "D-02", entryDate: "2026-05-11", weight: "0.8",
    remark: "", status: "pending",
  },
  {
    id: "6", orderNo: "EMS0011223344", productName: "书籍《百年孤独》",
    courier: "中国邮政", recipient: "周八", phone: "134****2345",
    shelf: "B-01", entryDate: "2026-05-09", weight: "0.3",
    remark: "", status: "picked",
  },
  {
    id: "7", orderNo: "SF9988776655", productName: "索尼耳机 WH-1000XM5",
    courier: "顺丰速递", recipient: "吴九", phone: "133****4567",
    shelf: "A-03", entryDate: "2026-05-08", weight: "0.6",
    remark: "超期未取", status: "overdue",
  },
  {
    id: "8", orderNo: "JD4433221100", productName: "海尔冰箱配件",
    courier: "京东快递", recipient: "郑十", phone: "132****8901",
    shelf: "E-10", entryDate: "2026-05-11", weight: "3.5",
    remark: "", status: "pending",
  },
];

const EMPTY_FORM = {
  orderNo: "", productName: "", courier: "顺丰速递",
  recipient: "", phone: "", shelf: "", weight: "", remark: "",
};

// ── Random field generation (used when scanning) ──────────────────────────────
const RANDOM_NAMES = ["张伟", "李芳", "王明", "赵丽", "钱强", "孙莉", "周鑫", "吴静", "郑磊", "冯敏", "陈阳", "刘青", "杨帆", "黄燕", "林峰"];
const SHELF_LIST   = ["A-01", "A-02", "A-03", "A-04", "B-01", "B-02", "B-03", "C-01", "C-02", "D-01", "D-02", "E-10"];
const COURIER_PREFIXES: Record<string, string> = {
  顺丰速递: "SF", 京东快递: "JD", 圆通速递: "YTO",
  中通快递: "ZTO", 韵达快递: "YD", 中国邮政: "EMS",
};

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFields() {
  const courier = COURIERS[rnd(0, COURIERS.length - 1)];
  return {
    courier,
    orderNo:   COURIER_PREFIXES[courier] + String(rnd(1000000000, 9999999999)),
    recipient: RANDOM_NAMES[rnd(0, RANDOM_NAMES.length - 1)],
    phone:     `1${rnd(30, 99)}****${String(rnd(1000, 9999))}`,
    shelf:     SHELF_LIST[rnd(0, SHELF_LIST.length - 1)],
    weight:    (rnd(1, 100) / 10).toFixed(1),
    remark:    "",
  };
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function fmtHeaderDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}年${m}月${day}日  ${days[d.getDay()]}`;
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon, color,
}: {
  label: string; value: number; icon: string; color: string;
}) {
  return (
    <Surface style={[styles.statCard, { borderTopColor: color }]} elevation={2}>
      <IconButton icon={icon} iconColor={color} size={22} style={styles.statIcon} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Surface>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function WarehouseScreen() {
  const router = useRouter();
  const today = getToday();

  const [records, setRecords] = useState<StockRecord[]>(INITIAL_RECORDS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [courierMenuVisible, setCourierMenuVisible] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // When returning from camera with a scanned value, auto-open the add modal
  useFocusEffect(
    useCallback(() => {
      const val = scanStore.take();
      if (val) {
        setForm({ ...EMPTY_FORM, productName: val, ...randomFields() });
        setModalVisible(true);
      }
    }, []),
  );

  const stats = useMemo(() => ({
    total:   records.length,
    today:   records.filter((r) => r.entryDate === today).length,
    pending: records.filter((r) => r.status === "pending").length,
    overdue: records.filter((r) => r.status === "overdue").length,
  }), [records, today]);

  const filtered = useMemo(() => {
    let list = records;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.orderNo.toLowerCase().includes(q) ||
          r.recipient.includes(q) ||
          r.productName.toLowerCase().includes(q),
      );
    }
    if (filter !== "all") list = list.filter((r) => r.status === filter);
    return list;
  }, [records, search, filter]);

  function handleAdd() {
    if (!form.orderNo.trim() || !form.productName.trim() || !form.recipient.trim()) {
      Alert.alert("提示", "订单号、商品名称和收件人为必填项");
      return;
    }
    const rec: StockRecord = {
      id: Date.now().toString(),
      orderNo:     form.orderNo.trim(),
      productName: form.productName.trim(),
      courier:     form.courier,
      recipient:   form.recipient.trim(),
      phone:       form.phone.trim(),
      shelf:       form.shelf.trim(),
      weight:      form.weight.trim(),
      remark:      form.remark.trim(),
      entryDate:   today,
      status:      "pending",
    };
    setRecords((prev) => [rec, ...prev]);
    setModalVisible(false);
    setForm({ ...EMPTY_FORM });
  }

  function handleDelete(id: string) {
    Alert.alert("确认删除", "确定要删除这条入库记录吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: () => setRecords((prev) => prev.filter((r) => r.id !== id)),
      },
    ]);
  }

  function cycleStatus(id: string) {
    const cycle: Record<Status, Status> = { pending: "picked", picked: "pending", overdue: "pending" };
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: cycle[r.status] } : r)),
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton icon="package-variant-closed" iconColor="#fff" size={28} style={styles.headerIcon} />
          <View>
            <Text style={styles.headerTitle}>快递驿站入库管理</Text>
            <Text style={styles.headerSub}>{fmtHeaderDate(today)}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <IconButton
            icon="qrcode-scan"
            iconColor="#fff"
            size={22}
            onPress={() => router.push("/camera")}
          />
          <IconButton
            icon="logout"
            iconColor="#fff"
            size={22}
            onPress={() => router.replace("/")}
          />
        </View>
      </View>

      {/* ── Stats ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsScroll}
        contentContainerStyle={styles.statsContent}
      >
        <StatCard label="总入库"   value={stats.total}   icon="package-variant"  color="#6750A4" />
        <StatCard label="今日入库" value={stats.today}   icon="calendar-today"   color="#0288D1" />
        <StatCard label="待取件"   value={stats.pending} icon="clock-outline"    color="#E65100" />
        <StatCard label="超期滞留" value={stats.overdue} icon="alert-circle"     color="#B71C1C" />
      </ScrollView>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <Searchbar
          placeholder="搜索订单号 / 收件人 / 商品名称"
          value={search}
          onChangeText={setSearch}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
        />
      </View>

      {/* ── Filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTER_OPTS.map((opt) => {
          const active = filter === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setFilter(opt.value)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Record count ── */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>共 {filtered.length} 条记录</Text>
        <Text style={styles.countHint}>点击状态标签可切换取件状态</Text>
      </View>

      {/* ── Table ── */}
      <ScrollView style={styles.tableOuter} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            {/* Header row */}
            <View style={styles.thead}>
              <Text style={[styles.th, C.no]}>#</Text>
              <Text style={[styles.th, C.order]}>订单号</Text>
              <Text style={[styles.th, C.product]}>商品名称</Text>
              <Text style={[styles.th, C.courier]}>快递</Text>
              <Text style={[styles.th, C.recipient]}>收件人</Text>
              <Text style={[styles.th, C.phone]}>电话</Text>
              <Text style={[styles.th, C.shelf]}>货架</Text>
              <Text style={[styles.th, C.date]}>入库日期</Text>
              <Text style={[styles.th, C.weight]}>重量</Text>
              <Text style={[styles.th, C.status]}>状态</Text>
              <Text style={[styles.th, C.action]}>操作</Text>
            </View>

            {/* Data rows */}
            {filtered.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>暂无匹配记录</Text>
              </View>
            ) : (
              filtered.map((r, idx) => (
                <View
                  key={r.id}
                  style={[styles.trow, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}
                >
                  <Text style={[styles.td, C.no]}>{idx + 1}</Text>

                  <View style={[styles.tdView, C.order]}>
                    <Text style={styles.orderText} numberOfLines={1}>{r.orderNo}</Text>
                    {r.remark ? (
                      <Text style={styles.remarkText} numberOfLines={1}>{r.remark}</Text>
                    ) : null}
                  </View>

                  <Text style={[styles.td, C.product]} numberOfLines={2}>{r.productName}</Text>

                  <View style={[styles.tdView, C.courier]}>
                    <View style={[styles.courierBadge, { backgroundColor: COURIER_COLOR[r.courier] || "#888" }]}>
                      <Text style={styles.courierBadgeText}>{COURIER_ABBR[r.courier] || r.courier.slice(0, 2)}</Text>
                    </View>
                  </View>

                  <Text style={[styles.td, C.recipient]}>{r.recipient}</Text>
                  <Text style={[styles.td, C.phone, styles.phoneText]}>{r.phone}</Text>

                  <View style={[styles.tdView, C.shelf]}>
                    <View style={styles.shelfBadge}>
                      <Text style={styles.shelfText}>{r.shelf || "—"}</Text>
                    </View>
                  </View>

                  <Text style={[styles.td, C.date]}>{r.entryDate.slice(5)}</Text>
                  <Text style={[styles.td, C.weight]}>{r.weight ? `${r.weight}kg` : "—"}</Text>

                  <View style={[styles.tdView, C.status]}>
                    <TouchableOpacity onPress={() => cycleStatus(r.id)}>
                      <View style={[styles.statusBadge, { backgroundColor: STATUS_CFG[r.status].bg }]}>
                        <Text style={[styles.statusText, { color: STATUS_CFG[r.status].color }]}>
                          {STATUS_CFG[r.status].label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.tdView, C.action]}>
                    <IconButton
                      icon="delete-outline"
                      size={18}
                      iconColor="#EF5350"
                      onPress={() => handleDelete(r.id)}
                      style={styles.delBtn}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </ScrollView>

      {/* ── FAB + Modal ── */}
      <Portal>
        <FAB
          icon="plus"
          label="新增入库"
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        />

        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={styles.modalTitle}>新增入库记录</Text>
              <IconButton icon="close" onPress={() => setModalVisible(false)} />
            </View>
            <Divider />
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Scan button */}
              <Button
                mode="contained-tonal"
                icon="qrcode-scan"
                onPress={() => {
                  setModalVisible(false);
                  router.push({ pathname: "/camera", params: { from: "warehouse" } } as any);
                }}
                style={styles.scanBtn}
                contentStyle={styles.scanBtnContent}
              >
                扫码录入商品信息
              </Button>
              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>或手动填写</Text>
                <View style={styles.orLine} />
              </View>

              <TextInput
                label="订单号 *"
                value={form.orderNo}
                onChangeText={(v) => setForm({ ...form, orderNo: v })}
                mode="outlined"
                left={<TextInput.Icon icon="barcode-scan" />}
                style={styles.formInput}
              />
              <TextInput
                label="商品名称 *"
                value={form.productName}
                onChangeText={(v) => setForm({ ...form, productName: v })}
                mode="outlined"
                left={<TextInput.Icon icon="package-variant" />}
                style={styles.formInput}
              />

              {/* Courier picker */}
              <Menu
                visible={courierMenuVisible}
                onDismiss={() => setCourierMenuVisible(false)}
                anchor={
                  <TouchableOpacity onPress={() => setCourierMenuVisible(true)}>
                    <TextInput
                      label="快递公司"
                      value={form.courier}
                      mode="outlined"
                      left={<TextInput.Icon icon="truck-delivery-outline" />}
                      right={<TextInput.Icon icon="chevron-down" />}
                      editable={false}
                      style={styles.formInput}
                      pointerEvents="none"
                    />
                  </TouchableOpacity>
                }
              >
                {COURIERS.map((c) => (
                  <Menu.Item
                    key={c}
                    title={c}
                    onPress={() => { setForm({ ...form, courier: c }); setCourierMenuVisible(false); }}
                  />
                ))}
              </Menu>

              <TextInput
                label="收件人 *"
                value={form.recipient}
                onChangeText={(v) => setForm({ ...form, recipient: v })}
                mode="outlined"
                left={<TextInput.Icon icon="account-outline" />}
                style={styles.formInput}
              />
              <TextInput
                label="联系电话"
                value={form.phone}
                onChangeText={(v) => setForm({ ...form, phone: v })}
                mode="outlined"
                left={<TextInput.Icon icon="phone-outline" />}
                keyboardType="phone-pad"
                style={styles.formInput}
              />
              <TextInput
                label="货架号（如 A-01）"
                value={form.shelf}
                onChangeText={(v) => setForm({ ...form, shelf: v })}
                mode="outlined"
                left={<TextInput.Icon icon="archive-outline" />}
                style={styles.formInput}
              />
              <TextInput
                label="重量（kg）"
                value={form.weight}
                onChangeText={(v) => setForm({ ...form, weight: v })}
                mode="outlined"
                left={<TextInput.Icon icon="weight" />}
                keyboardType="decimal-pad"
                style={styles.formInput}
              />
              <TextInput
                label="备注"
                value={form.remark}
                onChangeText={(v) => setForm({ ...form, remark: v })}
                mode="outlined"
                left={<TextInput.Icon icon="note-text-outline" />}
                multiline
                numberOfLines={3}
                style={styles.formInput}
              />
              <View style={styles.modalFooter}>
                <Button
                  mode="outlined"
                  onPress={() => setModalVisible(false)}
                  style={styles.footerBtn}
                >
                  取消
                </Button>
                <Button
                  mode="contained"
                  icon="check"
                  onPress={handleAdd}
                  style={styles.footerBtn}
                >
                  确认入库
                </Button>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

// Column widths
const C = StyleSheet.create({
  no:        { width: 40 },
  order:     { width: 138 },
  product:   { width: 148 },
  courier:   { width: 56 },
  recipient: { width: 68 },
  phone:     { width: 104 },
  shelf:     { width: 64 },
  date:      { width: 68 },
  weight:    { width: 60 },
  status:    { width: 96 },
  action:    { width: 48 },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#EEE8F4" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#6750A4",
    paddingHorizontal: 4,
    paddingBottom: 10,
    paddingTop: 4,
  },
  headerLeft:  { flexDirection: "row", alignItems: "center" },
  headerRight: { flexDirection: "row", alignItems: "center" },
  headerIcon:  { margin: 0 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerSub:   { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },

  // Stats
  statsScroll:  { flexGrow: 0, marginTop: 12 },
  statsContent: { paddingHorizontal: 12, gap: 10 },
  statCard: {
    width: 90,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: "#fff",
    borderTopWidth: 3,
  },
  statIcon:  { margin: 0, marginBottom: 2 },
  statValue: { fontSize: 22, fontWeight: "800", lineHeight: 26 },
  statLabel: { fontSize: 11, color: "#666", marginTop: 2 },

  // Search
  searchWrap: { paddingHorizontal: 12, paddingTop: 12 },
  searchbar:  { borderRadius: 10, backgroundColor: "#fff", elevation: 1 },
  searchInput: { fontSize: 14 },

  // Filter
  filterScroll:  { flexGrow: 0 },
  filterContent: { paddingHorizontal: 12, paddingVertical: 6, gap: 8, alignItems: "center" },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  filterChipActive: { backgroundColor: "#6750A4", borderColor: "#6750A4" },
  filterChipText:   { fontSize: 13, color: "#555" },
  filterChipTextActive: { color: "#fff", fontWeight: "600" },

  // Count
  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  countText: { fontSize: 13, color: "#444", fontWeight: "600" },
  countHint: { fontSize: 11, color: "#999" },

  // Table
  tableOuter: { flex: 1, backgroundColor: "#fff", marginHorizontal: 12, borderRadius: 12, marginBottom: 4 },
  thead: {
    flexDirection: "row",
    backgroundColor: "#6750A4",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  th: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  trow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EAF8",
  },
  rowEven: { backgroundColor: "#fff" },
  rowOdd:  { backgroundColor: "#FAF8FD" },
  td: {
    fontSize: 13,
    color: "#333",
    textAlign: "center",
    paddingHorizontal: 2,
  },
  tdView: {
    alignItems: "center",
    justifyContent: "center",
  },
  orderText:  { fontSize: 12, color: "#1A1A1A", fontWeight: "600" },
  remarkText: { fontSize: 10, color: "#999", marginTop: 2 },
  phoneText:  { fontSize: 11, color: "#666" },

  courierBadge: {
    width: 32, height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  courierBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  shelfBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#EDE7F6",
    borderRadius: 6,
  },
  shelfText: { fontSize: 12, color: "#6750A4", fontWeight: "600" },

  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: { fontSize: 11, fontWeight: "700" },

  delBtn: { margin: 0 },

  emptyRow: { height: 100, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#AAA", fontSize: 14 },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    backgroundColor: "#6750A4",
  },

  // Modal
  modal: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 20,
    maxHeight: "88%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 4,
  },
  modalTitle: { fontWeight: "700", color: "#1C1B1F" },
  modalBody:  { padding: 16 },
  formInput:  { marginBottom: 12, backgroundColor: "#fff" },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  footerBtn: { flex: 1, borderRadius: 8 },

  scanBtn:        { borderRadius: 10, marginBottom: 4 },
  scanBtnContent: { paddingVertical: 4 },
  orRow:  { flexDirection: "row", alignItems: "center", marginVertical: 14 },
  orLine: { flex: 1, height: 1, backgroundColor: "#E0E0E0" },
  orText: { marginHorizontal: 10, fontSize: 12, color: "#999" },
});
