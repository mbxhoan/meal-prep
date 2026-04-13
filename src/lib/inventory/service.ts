import { cache } from "react";
import { getAdminContext } from "@/lib/admin/service";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { createId } from "@/lib/id";
import type {
  InventoryCorePageData,
  InventoryCorePermissions,
  InventoryFefoSuggestionInput,
  InventoryFefoSuggestionRecord,
  InventoryIssueSavePayload,
  InventoryReceiptSavePayload,
} from "@/lib/inventory/types";
import {
  normalizeInventoryFefoCandidateRecord,
  normalizeInventoryFefoSuggestionRecord,
  normalizeInventoryIssueRecord,
  normalizeInventoryLookupRecord,
  normalizeInventoryMovementRecord,
  normalizeInventoryReceiptRecord,
  normalizeInventoryStockByItemRecord,
  normalizeInventoryStockByLotRecord,
} from "@/lib/inventory/validation";

function buildInventoryCorePermissions(
  permissions: string[],
): InventoryCorePermissions {
  const canReadStock = permissions.some((permission) =>
    [
      "inventory.stock.read",
      "inventory.receipt.read",
      "inventory.issue.read",
    ].includes(permission),
  );

  return {
    canReadStock,
    canCreateReceipt: permissions.includes("inventory.receipt.create"),
    canPostReceipt: permissions.includes("inventory.receipt.post"),
    canCreateIssue: permissions.includes("inventory.issue.create"),
    canPostIssue: permissions.includes("inventory.issue.post"),
    canOverrideFefo: permissions.includes("inventory.fefo.override"),
  };
}

function createEmptyPageData(
  shopId: string,
  shopName: string,
  permissions: InventoryCorePermissions,
): InventoryCorePageData {
  return {
    shopId,
    shopName,
    permissions,
    stockByItem: [],
    stockByLot: [],
    fefoCandidates: [],
    receipts: [],
    issues: [],
    movements: [],
    warehouses: [],
    suppliers: [],
  };
}

async function readSelectRows<T>(
  query: PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>,
  normalize: (row: Record<string, unknown>) => T,
): Promise<T[]> {
  const { data, error } = await query;

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map((row) => normalize(row as Record<string, unknown>));
}

export const getInventoryCorePageData = cache(async (): Promise<InventoryCorePageData | null> => {
  const context = await getAdminContext();
  const permissions = buildInventoryCorePermissions(context.permissions);

  if (!context.shop || !permissions.canReadStock) {
    return null;
  }

  if (!isSupabaseConfigured()) {
    return createEmptyPageData(context.shop.id, context.shop.name, permissions);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return createEmptyPageData(context.shop.id, context.shop.name, permissions);
  }

  const shopId = context.shop.id;

  const [
    stockByItem,
    stockByLot,
    fefoCandidates,
    receipts,
    issues,
    movements,
    warehouses,
    suppliers,
  ] = await Promise.all([
    readSelectRows(
      supabase
        .from("v_inventory_stock_by_item")
        .select("*")
        .eq("shop_id", shopId)
        .order("item_name", { ascending: true }),
      normalizeInventoryStockByItemRecord,
    ),
    readSelectRows(
      supabase
        .from("v_inventory_stock_by_lot")
        .select("*")
        .eq("shop_id", shopId)
        .order("expired_at", { ascending: true, nullsFirst: false })
        .order("received_at", { ascending: true }),
      normalizeInventoryStockByLotRecord,
    ),
    readSelectRows(
      supabase
        .from("v_fefo_candidates")
        .select("*")
        .eq("shop_id", shopId)
        .order("fefo_rank", { ascending: true }),
      normalizeInventoryFefoCandidateRecord,
    ),
    readSelectRows(
      supabase
        .from("inventory_receipts")
        .select(
          "id, shop_id, receipt_no, received_at, warehouse_id, status, note, supplier_id, posted_at, created_at, warehouses(code, name), suppliers(code, name), inventory_receipt_items(id, shop_id, inventory_receipt_id, item_id, lot_id, lot_no_snapshot, lot_barcode_snapshot, qty_received, unit_cost, line_total, manufactured_at, expired_at, note, created_at)",
        )
        .eq("shop_id", shopId)
        .order("received_at", { ascending: false })
        .limit(20),
      normalizeInventoryReceiptRecord,
    ),
    readSelectRows(
      supabase
        .from("inventory_issues")
        .select(
          "id, shop_id, issue_no, issued_at, warehouse_id, status, reason_code, source_type, source_id, note, posted_at, created_at, warehouses(code, name), inventory_issue_items(id, shop_id, inventory_issue_id, item_id, lot_id, suggested_lot_id, lot_no_snapshot, lot_barcode_snapshot, qty_issued, fefo_overridden, fefo_override_reason, note, created_at)",
        )
        .eq("shop_id", shopId)
        .order("issued_at", { ascending: false })
        .limit(20),
      normalizeInventoryIssueRecord,
    ),
    readSelectRows(
      supabase
        .from("inventory_movements")
        .select(
          "id, shop_id, item_id, inventory_item_id, warehouse_id, lot_id, serial_id, movement_type, quantity_delta, unit_cost, reference_type, reference_id, reference_line_id, notes, created_by, movement_at, created_at",
        )
        .eq("shop_id", shopId)
        .order("movement_at", { ascending: false })
        .limit(20),
      normalizeInventoryMovementRecord,
    ),
    readSelectRows(
      supabase
        .from("warehouses")
        .select("id, code, name, is_active, is_default")
        .eq("shop_id", shopId)
        .is("deleted_at", null)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true }),
      normalizeInventoryLookupRecord,
    ),
    readSelectRows(
      supabase
        .from("suppliers")
        .select("id, code, name, is_active")
        .eq("shop_id", shopId)
        .is("deleted_at", null)
        .order("name", { ascending: true }),
      normalizeInventoryLookupRecord,
    ),
  ]);

  return {
    shopId,
    shopName: context.shop.name,
    permissions,
    stockByItem,
    stockByLot,
    fefoCandidates,
    receipts,
    issues,
    movements,
    warehouses,
    suppliers,
  };
});

export async function suggestFefoLots(
  input: InventoryFefoSuggestionInput,
): Promise<InventoryFefoSuggestionRecord[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.rpc("suggest_fefo_lots", {
    p_item_id: input.itemId,
    p_quantity: input.quantity ?? null,
    p_warehouse_id: input.warehouseId ?? null,
    p_shop_id: input.shopId ?? null,
    p_allow_expired: input.allowExpired ?? false,
  });

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map((row) =>
    normalizeInventoryFefoSuggestionRecord(row as Record<string, unknown>),
  );
}

export async function saveInventoryReceiptDraft(
  payload: InventoryReceiptSavePayload,
) {
  const context = await getAdminContext();
  const shop = context.shop;

  if (!shop) {
    throw new Error("Missing active shop context.");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client is not available.");
  }

  const receiptId = payload.receiptId ?? createId("receipt");
  const receiptNo = payload.receiptNo.trim();
  const items = payload.items ?? [];

  if (items.length === 0) {
    throw new Error("Receipt must contain at least one item.");
  }

  const { error: headerError } = await supabase.from("inventory_receipts").insert({
    id: receiptId,
    shop_id: shop.id,
    receipt_no: receiptNo,
    received_at: payload.receivedAt ?? new Date().toISOString(),
    warehouse_id: payload.warehouseId,
    supplier_id: payload.supplierId ?? null,
    status: "draft",
    note: payload.note ?? null,
  });

  if (headerError) {
    throw new Error(headerError.message);
  }

  const { error: itemsError } = await supabase.from("inventory_receipt_items").insert(
    items.map((item) => ({
      shop_id: shop.id,
      inventory_receipt_id: receiptId,
      item_id: item.itemId,
      lot_id: item.lotId ?? null,
      lot_no_snapshot: item.lotNoSnapshot ?? null,
      lot_barcode_snapshot: item.lotBarcodeSnapshot ?? null,
      qty_received: item.qtyReceived,
      unit_cost: item.unitCost,
      manufactured_at: item.manufacturedAt ?? null,
      expired_at: item.expiredAt ?? null,
      note: item.note ?? null,
    })),
  );

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  if (payload.postImmediately) {
    await postInventoryReceipt(receiptId);
  }

  return { receiptId };
}

export async function postInventoryReceipt(receiptId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client is not available.");
  }

  const { error } = await supabase.rpc("post_inventory_receipt", {
    p_receipt_id: receiptId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function saveInventoryIssueDraft(
  payload: InventoryIssueSavePayload,
) {
  const context = await getAdminContext();
  const shop = context.shop;

  if (!shop) {
    throw new Error("Missing active shop context.");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client is not available.");
  }

  const issueId = payload.issueId ?? createId("issue");
  const issueNo = payload.issueNo.trim();
  const items = payload.items ?? [];

  if (items.length === 0) {
    throw new Error("Issue must contain at least one item.");
  }

  const normalizedItems = await Promise.all(
    items.map(async (item) => {
      let suggestedLotId = item.suggestedLotId ?? null;

      if (!suggestedLotId) {
        const fefoSuggestions = await suggestFefoLots({
          itemId: item.itemId,
          quantity: item.qtyIssued,
          warehouseId: payload.warehouseId,
          shopId: shop.id,
          allowExpired: false,
        });

        suggestedLotId = fefoSuggestions[0]?.lotId ?? null;
      }

      return {
        ...item,
        suggestedLotId,
      };
    }),
  );

  const { error: headerError } = await supabase.from("inventory_issues").insert({
    id: issueId,
    shop_id: shop.id,
    issue_no: issueNo,
    issued_at: payload.issuedAt ?? new Date().toISOString(),
    warehouse_id: payload.warehouseId,
    status: "draft",
    reason_code: payload.reasonCode ?? null,
    source_type: payload.sourceType ?? null,
    source_id: payload.sourceId ?? null,
    note: payload.note ?? null,
  });

  if (headerError) {
    throw new Error(headerError.message);
  }

  const { error: itemsError } = await supabase.from("inventory_issue_items").insert(
    normalizedItems.map((item) => ({
      shop_id: shop.id,
      inventory_issue_id: issueId,
      item_id: item.itemId,
      lot_id: item.lotId ?? null,
      suggested_lot_id: item.suggestedLotId ?? null,
      qty_issued: item.qtyIssued,
      fefo_override_reason: item.fefoOverrideReason ?? null,
      note: item.note ?? null,
    })),
  );

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  if (payload.postImmediately) {
    await postInventoryIssue(issueId);
  }

  return { issueId };
}

export async function postInventoryIssue(issueId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase client is not available.");
  }

  const { error } = await supabase.rpc("post_inventory_issue", {
    p_issue_id: issueId,
  });

  if (error) {
    throw new Error(error.message);
  }
}
