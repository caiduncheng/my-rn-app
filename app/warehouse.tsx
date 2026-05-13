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
  pickupCode: string;
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
    remark: "易碎品，轻拿轻放", status: "overdue", pickupCode: "3821",
  },
  {
    id: "2", orderNo: "JD9876543210", productName: "小米笔记本电脑",
    courier: "京东快递", recipient: "李四", phone: "139****1234",
    shelf: "B-03", entryDate: "2026-05-10", weight: "2.1",
    remark: "", status: "pending", pickupCode: "5647",
  },
  {
    id: "3", orderNo: "YTO5566778899", productName: "耐克运动鞋",
    courier: "圆通速递", recipient: "王五", phone: "135****9012",
    shelf: "C-07", entryDate: "2026-05-10", weight: "1.2",
    remark: "", status: "picked", pickupCode: "2934",
  },
  {
    id: "4", orderNo: "ZTO1122334455", productName: "美的空气净化器",
    courier: "中通快递", recipient: "赵六", phone: "136****3456",
    shelf: "A-05", entryDate: "2026-05-11", weight: "5.8",
    remark: "大件，放一楼", status: "pending", pickupCode: "7156",
  },
  {
    id: "5", orderNo: "YD6677889900", productName: "飞利浦电动牙刷",
    courier: "韵达快递", recipient: "陈七", phone: "137****7890",
    shelf: "D-02", entryDate: "2026-05-11", weight: "0.8",
    remark: "", status: "pending", pickupCode: "4829",
  },
  {
    id: "6", orderNo: "EMS0011223344", productName: "书籍《百年孤独》",
    courier: "中国邮政", recipient: "周八", phone: "134****2345",
    shelf: "B-01", entryDate: "2026-05-09", weight: "0.3",
    remark: "", status: "picked", pickupCode: "6371",
  },
  {
    id: "7", orderNo: "SF9988776655", productName: "索尼耳机 WH-1000XM5",
    courier: "顺丰速递", recipient: "吴九", phone: "133****4567",
    shelf: "A-03", entryDate: "2026-05-08", weight: "0.6",
    remark: "超期未取", status: "overdue", pickupCode: "9042",
  },
  {
    id: "8", orderNo: "JD4433221100", productName: "海尔冰箱配件",
    courier: "京东快递", recipient: "郑十", phone: "132****8901",
    shelf: "E-10", entryDate: "2026-05-11", weight: "3.5",
    remark: "", status: "pending", pickupCode: "1583",
  },
];

const EMPTY_FORM = {
  orderNo: "", productName: "", courier: "顺丰速递",
  recipient: "", phone: "", shelf: "", weight: "", remark: "",
};

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

function genPickupCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function daysSince(dateStr: string): number {
  const entry = new Date(dateStr + "T00:00:00");
  return Math.max(0, Math.floor((Date.now() - entry.getTime()) / 86400000));
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

function StatCard({ label, value, icon, color }: {
  label: string; value: number; icon: string; color: string;
}) {
  return (
    <Surface style={[s.statCard, { borderTopColor: color }]} elevation={3}>
      <View style={[s.statIconWrap, { backgroundColor: color + "18" }]}>
        <IconButton icon={icon} iconColor={color} size={20} style={s.statIconBtn} />
      </View>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </Surface>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={ds.row}>
      <Text style={ds.label}>{label}</Text>
      <Text style={ds.value}>{value}</Text>
    </View>
  );
}

export default function WarehouseScreen() {
  const router = useRouter();
  const today = getToday();

  const [records, setRecords] = useState<StockRecord[]>(INITIAL_RECORDS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [courierMenuVisible, setCourierMenuVisible] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<StockRecord | null>(null);

  useFocusEffect(
    useCallback(() => {
      const val = scanStore.take();
      if (val) {
        setForm({ ...EMPTY_FORM, productName: val, ...randomFields() });
        setEditingId(null);
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
          r.productName.toLowerCase().includes(q) ||
          r.pickupCode.includes(q),
      );
    }
    if (filter !== "all") list = list.filter((r) => r.status === filter);
    return list;
  }, [records, search, filter]);

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setModalVisible(true);
  }

  function openEdit(record: StockRecord) {
    setEditingId(record.id);
    setForm({
      orderNo:     record.orderNo,
      productName: record.productName,
      courier:     record.courier,
      recipient:   record.recipient,
      phone:       record.phone,
      shelf:       record.shelf,
      weight:      record.weight,
      remark:      record.remark,
    });
    setDetailRecord(null);
    setModalVisible(true);
  }

  function closeFormModal() {
    setModalVisible(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }

  function handleSubmit() {
    if (!form.orderNo.trim() || !form.productName.trim() || !form.recipient.trim()) {
      Alert.alert("提示", "订单号、商品名称和收件人为必填项");
      return;
    }
    if (editingId) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? {
                ...r,
                orderNo:     form.orderNo.trim(),
                productName: form.productName.trim(),
                courier:     form.courier,
                recipient:   form.recipient.trim(),
                phone:       form.phone.trim(),
                shelf:       form.shelf.trim(),
                weight:      form.weight.trim(),
                remark:      form.remark.trim(),
              }
            : r,
        ),
      );
    } else {
      const rec: StockRecord = {
        id:          Date.now().toString(),
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
        pickupCode:  genPickupCode(),
      };
      setRecords((prev) => [rec, ...prev]);
    }
    closeFormModal();
  }

  function handleDelete(id: string) {
    Alert.alert("确认删除", "确定要删除这条入库记录吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: () => {
          setRecords((prev) => prev.filter((r) => r.id !== id));
          setDetailRecord(null);
        },
      },
    ]);
  }

  function cycleStatus(id: string) {
    const cycle: Record<Status, Status> = { pending: "picked", picked: "pending", overdue: "pending" };
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: cycle[r.status] } : r)),
    );
    setDetailRecord((prev) =>
      prev && prev.id === id ? { ...prev, status: cycle[prev.status] } : prev,
    );
  }

  function markAsPicked(id: string) {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, status: "picked" } : r));
    setDetailRecord((prev) => prev && prev.id === id ? { ...prev, status: "picked" } : prev);
  }

  const isEditing = editingId !== null;

  return (
    <SafeAreaView style={s.safeArea}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={[s.headerBlob, s.headerBlob1]} />
        <View style={[s.headerBlob, s.headerBlob2]} />
        <View style={s.headerInner}>
          <View style={s.headerLeft}>
            <View style={s.headerIconWrap}>
              <IconButton icon="package-variant-closed" iconColor="#6750A4" size={24} style={s.headerIconBtn} />
            </View>
            <View>
              <Text style={s.headerTitle}>快递驿站入库管理</Text>
              <Text style={s.headerSub}>{fmtHeaderDate(today)}</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.headerAction} onPress={() => router.push("/camera")}>
              <IconButton icon="qrcode-scan" iconColor="#fff" size={20} style={s.headerActionIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={s.headerAction} onPress={() => router.replace("/")}>
              <IconButton icon="logout" iconColor="#fff" size={20} style={s.headerActionIcon} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Stats ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.statsScroll}
        contentContainerStyle={s.statsContent}
      >
        <StatCard label="总入库"   value={stats.total}   icon="package-variant"  color="#6750A4" />
        <StatCard label="今日入库" value={stats.today}   icon="calendar-today"   color="#0288D1" />
        <StatCard label="待取件"   value={stats.pending} icon="clock-outline"    color="#E65100" />
        <StatCard label="超期滞留" value={stats.overdue} icon="alert-circle"     color="#B71C1C" />
      </ScrollView>

      {/* ── Search ── */}
      <View style={s.searchWrap}>
        <Searchbar
          placeholder="搜索订单号 / 收件人 / 商品 / 取件码"
          value={search}
          onChangeText={setSearch}
          style={s.searchbar}
          inputStyle={s.searchInput}
          iconColor="#6750A4"
        />
      </View>

      {/* ── Filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterScroll}
        contentContainerStyle={s.filterContent}
      >
        {FILTER_OPTS.map((opt) => {
          const active = filter === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setFilter(opt.value)}
              style={[s.chip, active && s.chipActive]}
            >
              <Text style={[s.chipText, active && s.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Count row ── */}
      <View style={s.countRow}>
        <Text style={s.countText}>共 {filtered.length} 条记录</Text>
        <Text style={s.countHint}>点击行查看详情及取件码</Text>
      </View>

      {/* ── Table ── */}
      <ScrollView style={s.tableOuter} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            {/* Header row */}
            <View style={s.thead}>
              <Text style={[s.th, C.no]}>#</Text>
              <Text style={[s.th, C.order]}>订单号</Text>
              <Text style={[s.th, C.product]}>商品名称</Text>
              <Text style={[s.th, C.courier]}>快递</Text>
              <Text style={[s.th, C.recipient]}>收件人</Text>
              <Text style={[s.th, C.phone]}>电话</Text>
              <Text style={[s.th, C.shelf]}>货架</Text>
              <Text style={[s.th, C.date]}>入库日期</Text>
              <Text style={[s.th, C.weight]}>重量</Text>
              <Text style={[s.th, C.status]}>状态</Text>
              <Text style={[s.th, C.action]}>操作</Text>
            </View>

            {filtered.length === 0 ? (
              <View style={s.emptyRow}>
                <Text style={s.emptyText}>暂无匹配记录</Text>
              </View>
            ) : (
              filtered.map((r, idx) => (
                <TouchableOpacity key={r.id} onPress={() => setDetailRecord(r)} activeOpacity={0.75}>
                  <View style={[s.trow, idx % 2 === 0 ? s.rowEven : s.rowOdd]}>
                    <Text style={[s.td, C.no, s.tdNo]}>{idx + 1}</Text>

                    <View style={[s.tdView, C.order]}>
                      <Text style={s.orderText} numberOfLines={1}>{r.orderNo}</Text>
                      {r.remark ? <Text style={s.remarkText} numberOfLines={1}>{r.remark}</Text> : null}
                    </View>

                    <Text style={[s.td, C.product]} numberOfLines={2}>{r.productName}</Text>

                    <View style={[s.tdView, C.courier]}>
                      <View style={[s.courierBadge, { backgroundColor: COURIER_COLOR[r.courier] || "#888" }]}>
                        <Text style={s.courierBadgeText}>{COURIER_ABBR[r.courier] || r.courier.slice(0, 2)}</Text>
                      </View>
                    </View>

                    <Text style={[s.td, C.recipient]}>{r.recipient}</Text>
                    <Text style={[s.td, C.phone, s.phoneText]}>{r.phone}</Text>

                    <View style={[s.tdView, C.shelf]}>
                      <View style={s.shelfBadge}>
                        <Text style={s.shelfText}>{r.shelf || "—"}</Text>
                      </View>
                    </View>

                    <Text style={[s.td, C.date]}>{r.entryDate.slice(5)}</Text>
                    <Text style={[s.td, C.weight]}>{r.weight ? `${r.weight}kg` : "—"}</Text>

                    <View style={[s.tdView, C.status]}>
                      <TouchableOpacity onPress={() => cycleStatus(r.id)}>
                        <View style={[s.statusBadge, { backgroundColor: STATUS_CFG[r.status].bg }]}>
                          <Text style={[s.statusText, { color: STATUS_CFG[r.status].color }]}>
                            {STATUS_CFG[r.status].label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    <View style={[s.tdView, C.action]}>
                      <IconButton
                        icon="pencil-outline"
                        size={17}
                        iconColor="#6750A4"
                        onPress={() => openEdit(r)}
                        style={s.actionBtn}
                      />
                      <IconButton
                        icon="delete-outline"
                        size={17}
                        iconColor="#EF5350"
                        onPress={() => handleDelete(r.id)}
                        style={s.actionBtn}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </ScrollView>

      {/* ── FAB + Modals ── */}
      <Portal>
        <FAB
          icon="plus"
          label="新增入库"
          style={s.fab}
          color="#fff"
          onPress={openAdd}
        />

        {/* ── Detail Modal ── */}
        <Modal
          visible={detailRecord !== null}
          onDismiss={() => setDetailRecord(null)}
          contentContainerStyle={s.modal}
        >
          {detailRecord && (() => {
            const days = daysSince(detailRecord.entryDate);
            const cfg = STATUS_CFG[detailRecord.status];
            return (
              <View>
                <View style={s.modalHeader}>
                  <Text variant="titleLarge" style={s.modalTitle}>包裹详情</Text>
                  <IconButton icon="close" onPress={() => setDetailRecord(null)} />
                </View>
                <Divider />
                <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
                  {/* Pickup code */}
                  <View style={ds.codeCard}>
                    <Text style={ds.codeLabel}>取件码</Text>
                    <Text style={ds.codeValue}>{detailRecord.pickupCode}</Text>
                    <Text style={ds.codeHint}>告知客户此取件码，凭码取件</Text>
                  </View>

                  {/* Status */}
                  <View style={[ds.statusRow, { backgroundColor: cfg.bg }]}>
                    <Text style={[ds.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                    <Text style={ds.daysText}>
                      已存放 {days} 天{days >= 3 ? "  ⚠ 建议提醒客户" : ""}
                    </Text>
                  </View>

                  {/* Info */}
                  <View style={ds.infoCard}>
                    <DetailRow label="订单号"   value={detailRecord.orderNo} />
                    <Divider style={ds.divider} />
                    <DetailRow label="商品名称" value={detailRecord.productName} />
                    <Divider style={ds.divider} />
                    <DetailRow label="快递公司" value={detailRecord.courier} />
                    <Divider style={ds.divider} />
                    <DetailRow label="收件人"   value={detailRecord.recipient} />
                    <Divider style={ds.divider} />
                    <DetailRow label="联系电话" value={detailRecord.phone || "—"} />
                    <Divider style={ds.divider} />
                    <DetailRow label="货架号"   value={detailRecord.shelf || "—"} />
                    <Divider style={ds.divider} />
                    <DetailRow label="入库日期" value={detailRecord.entryDate} />
                    <Divider style={ds.divider} />
                    <DetailRow label="重量"     value={detailRecord.weight ? `${detailRecord.weight} kg` : "—"} />
                    {detailRecord.remark ? (
                      <>
                        <Divider style={ds.divider} />
                        <DetailRow label="备注" value={detailRecord.remark} />
                      </>
                    ) : null}
                  </View>

                  <View style={ds.actions}>
                    {detailRecord.status !== "picked" && (
                      <Button
                        mode="contained"
                        icon="check-circle-outline"
                        onPress={() => markAsPicked(detailRecord.id)}
                        style={[ds.actionBtn, { backgroundColor: "#2E7D32" }]}
                        contentStyle={ds.actionBtnContent}
                      >
                        标记已取件
                      </Button>
                    )}
                    <Button
                      mode="outlined"
                      icon="pencil-outline"
                      onPress={() => openEdit(detailRecord)}
                      style={ds.actionBtn}
                      contentStyle={ds.actionBtnContent}
                    >
                      编辑信息
                    </Button>
                    <Button
                      mode="outlined"
                      icon="delete-outline"
                      onPress={() => handleDelete(detailRecord.id)}
                      style={[ds.actionBtn, ds.deleteBtn]}
                      textColor="#EF5350"
                      contentStyle={ds.actionBtnContent}
                    >
                      删除记录
                    </Button>
                  </View>
                </ScrollView>
              </View>
            );
          })()}
        </Modal>

        {/* ── Add / Edit Modal ── */}
        <Modal
          visible={modalVisible}
          onDismiss={closeFormModal}
          contentContainerStyle={s.modal}
        >
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={s.modalHeader}>
              <Text variant="titleLarge" style={s.modalTitle}>
                {isEditing ? "编辑入库记录" : "新增入库记录"}
              </Text>
              <IconButton icon="close" onPress={closeFormModal} />
            </View>
            <Divider />
            <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
              {!isEditing && (
                <>
                  <Button
                    mode="contained-tonal"
                    icon="qrcode-scan"
                    onPress={() => {
                      setModalVisible(false);
                      router.push({ pathname: "/camera", params: { from: "warehouse" } } as any);
                    }}
                    style={s.scanBtn}
                    contentStyle={s.scanBtnContent}
                  >
                    扫码录入商品信息
                  </Button>
                  <View style={s.orRow}>
                    <View style={s.orLine} />
                    <Text style={s.orText}>或手动填写</Text>
                    <View style={s.orLine} />
                  </View>
                </>
              )}

              <TextInput
                label="订单号 *"
                value={form.orderNo}
                onChangeText={(v) => setForm({ ...form, orderNo: v })}
                mode="outlined"
                left={<TextInput.Icon icon="barcode-scan" />}
                style={s.formInput}
                outlineStyle={s.inputOutline}
              />
              <TextInput
                label="商品名称 *"
                value={form.productName}
                onChangeText={(v) => setForm({ ...form, productName: v })}
                mode="outlined"
                left={<TextInput.Icon icon="package-variant" />}
                style={s.formInput}
                outlineStyle={s.inputOutline}
              />

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
                      style={s.formInput}
                      outlineStyle={s.inputOutline}
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
                style={s.formInput}
                outlineStyle={s.inputOutline}
              />
              <TextInput
                label="联系电话"
                value={form.phone}
                onChangeText={(v) => setForm({ ...form, phone: v })}
                mode="outlined"
                left={<TextInput.Icon icon="phone-outline" />}
                keyboardType="phone-pad"
                style={s.formInput}
                outlineStyle={s.inputOutline}
              />
              <TextInput
                label="货架号（如 A-01）"
                value={form.shelf}
                onChangeText={(v) => setForm({ ...form, shelf: v })}
                mode="outlined"
                left={<TextInput.Icon icon="archive-outline" />}
                style={s.formInput}
                outlineStyle={s.inputOutline}
              />
              <TextInput
                label="重量（kg）"
                value={form.weight}
                onChangeText={(v) => setForm({ ...form, weight: v })}
                mode="outlined"
                left={<TextInput.Icon icon="weight" />}
                keyboardType="decimal-pad"
                style={s.formInput}
                outlineStyle={s.inputOutline}
              />
              <TextInput
                label="备注"
                value={form.remark}
                onChangeText={(v) => setForm({ ...form, remark: v })}
                mode="outlined"
                left={<TextInput.Icon icon="note-text-outline" />}
                multiline
                numberOfLines={3}
                style={s.formInput}
                outlineStyle={s.inputOutline}
              />
              <View style={s.modalFooter}>
                <Button mode="outlined" onPress={closeFormModal} style={s.footerBtn} contentStyle={s.footerBtnContent}>
                  取消
                </Button>
                <Button mode="contained" icon="check" onPress={handleSubmit} style={s.footerBtn} contentStyle={s.footerBtnContent} buttonColor="#6750A4">
                  {isEditing ? "保存修改" : "确认入库"}
                </Button>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

// ── Column widths ──────────────────────────────────────────────────────────────
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
  action:    { width: 80 },
});

// ── Detail modal styles ────────────────────────────────────────────────────────
const ds = StyleSheet.create({
  codeCard: {
    alignItems: "center",
    backgroundColor: "#5B3EC8",
    borderRadius: 20,
    paddingVertical: 24,
    marginBottom: 14,
    shadowColor: "#5B3EC8",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  codeLabel: { color: "rgba(255,255,255,0.7)", fontSize: 13, letterSpacing: 1, marginBottom: 8 },
  codeValue: { color: "#fff", fontSize: 56, fontWeight: "900", letterSpacing: 14 },
  codeHint:  { color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 10 },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
  },
  statusLabel: { fontSize: 14, fontWeight: "700" },
  daysText:    { fontSize: 12, color: "#666" },

  infoCard: {
    backgroundColor: "#F7F3FF",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 18,
  },
  row:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 11 },
  label:   { fontSize: 13, color: "#999", flex: 1 },
  value:   { fontSize: 13, color: "#1C1B1F", fontWeight: "600", flex: 2, textAlign: "right" },
  divider: { backgroundColor: "#EEE" },

  actions:       { gap: 10, paddingBottom: 8 },
  actionBtn:     { borderRadius: 12 },
  actionBtnContent: { paddingVertical: 4 },
  deleteBtn:     { borderColor: "#EF5350" },
});

// ── Main styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F0EBF9" },

  // Header
  header: {
    backgroundColor: "#5B3EC8",
    paddingBottom: 14,
    paddingTop: 4,
    overflow: "hidden",
  },
  headerBlob: { position: "absolute", borderRadius: 999 },
  headerBlob1: { width: 160, height: 160, top: -80, right: -30, backgroundColor: "rgba(255,255,255,0.06)" },
  headerBlob2: { width: 100, height: 100, bottom: -40, left: 40, backgroundColor: "rgba(255,255,255,0.04)" },
  headerInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8 },
  headerLeft:  { flexDirection: "row", alignItems: "center", gap: 4 },
  headerRight: { flexDirection: "row", alignItems: "center" },

  headerIconWrap: {
    width: 44, height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  headerIconBtn: { margin: 0 },

  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: 0.5 },
  headerSub:   { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 },

  headerAction: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  headerActionIcon: { margin: 0 },

  // Stats
  statsScroll:  { flexGrow: 0, marginTop: 14 },
  statsContent: { paddingHorizontal: 14, gap: 10 },
  statCard: {
    width: 96,
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    backgroundColor: "#fff",
    borderTopWidth: 3,
  },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  statIconBtn:  { margin: 0 },
  statValue:    { fontSize: 24, fontWeight: "900", lineHeight: 28 },
  statLabel:    { fontSize: 11, color: "#888", marginTop: 3, fontWeight: "500" },

  // Search
  searchWrap:  { paddingHorizontal: 14, paddingTop: 14 },
  searchbar:   { borderRadius: 14, backgroundColor: "#fff", elevation: 0, borderWidth: 1, borderColor: "#E8E0F4" },
  searchInput: { fontSize: 14 },

  // Filter
  filterScroll:  { flexGrow: 0 },
  filterContent: { paddingHorizontal: 14, paddingVertical: 8, gap: 8, alignItems: "center" },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E0D8F0",
  },
  chipActive:     { backgroundColor: "#5B3EC8", borderColor: "#5B3EC8" },
  chipText:       { fontSize: 13, color: "#666", fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "700" },

  // Count
  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  countText: { fontSize: 13, color: "#5B3EC8", fontWeight: "700" },
  countHint: { fontSize: 11, color: "#AAA" },

  // Table
  tableOuter: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 14,
    borderRadius: 16,
    marginBottom: 6,
    shadowColor: "#5B3EC8",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  thead: {
    flexDirection: "row",
    backgroundColor: "#5B3EC8",
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  th: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.9)", textAlign: "center" },

  trow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3EEF9",
  },
  rowEven: { backgroundColor: "#fff" },
  rowOdd:  { backgroundColor: "#FAFAFE" },

  td:     { fontSize: 13, color: "#333", textAlign: "center", paddingHorizontal: 2 },
  tdNo:   { color: "#AAA", fontSize: 12, fontWeight: "600" },
  tdView: { alignItems: "center", justifyContent: "center" },

  orderText:  { fontSize: 12, color: "#1A1A1A", fontWeight: "700" },
  remarkText: { fontSize: 10, color: "#BBB", marginTop: 2 },
  phoneText:  { fontSize: 11, color: "#888" },

  courierBadge: {
    width: 34, height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  courierBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  shelfBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: "#EDE7F6",
    borderRadius: 8,
  },
  shelfText: { fontSize: 12, color: "#5B3EC8", fontWeight: "700" },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText:  { fontSize: 11, fontWeight: "700" },

  actionBtn: { margin: 0, marginHorizontal: -2 },

  emptyRow:  { height: 100, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#CCC", fontSize: 14 },

  // FAB
  fab: { position: "absolute", bottom: 24, right: 20, backgroundColor: "#5B3EC8" },

  // Modal shared
  modal: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 24,
    maxHeight: "88%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 4,
  },
  modalTitle:  { fontWeight: "800", color: "#1C1B1F", fontSize: 18 },
  modalBody:   { padding: 16 },
  formInput:   { marginBottom: 12, backgroundColor: "#fff" },
  inputOutline: { borderRadius: 12 },
  modalFooter: { flexDirection: "row", gap: 12, paddingTop: 4, paddingBottom: 8 },
  footerBtn:      { flex: 1, borderRadius: 12 },
  footerBtnContent: { paddingVertical: 4 },

  scanBtn:        { borderRadius: 12, marginBottom: 4 },
  scanBtnContent: { paddingVertical: 4 },
  orRow:  { flexDirection: "row", alignItems: "center", marginVertical: 14 },
  orLine: { flex: 1, height: 1, backgroundColor: "#EEE" },
  orText: { marginHorizontal: 12, fontSize: 12, color: "#BBB" },
});
