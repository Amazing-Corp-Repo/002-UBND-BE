import test from "node:test";
import assert from "node:assert/strict";
import { attachReceptionV2Relations } from "../src/mapper/reception-schedule-v2.mapper.js";

const baseInput = {
  scheduleId: "schedule-id",
  slotRows: [
    { khung_gio: "07:30 - 08:30", ma_quay: "QUAY_1", suc_chua: 2 },
  ],
  shiftEntries: [
    { id: "shift-id", gio_bat_dau: "07:30:00", gio_ket_thuc: "08:30:00" },
  ],
  counters: [{ id: "counter-id", ma_quay: "QUAY_1" }],
};

test("maps every schedule slot to both canonical V2 foreign keys", () => {
  assert.deepEqual(attachReceptionV2Relations(baseInput), [
    {
      khung_gio: "07:30 - 08:30",
      ma_quay: "QUAY_1",
      suc_chua: 2,
      id_lich_tiep_dan: "schedule-id",
      id_ca_tiep_dan: "shift-id",
      id_quay: "counter-id",
    },
  ]);
});

test("fails atomically when a shift or counter cannot be resolved", () => {
  assert.throws(
    () => attachReceptionV2Relations({ ...baseInput, shiftEntries: [] }),
    /Không tìm thấy ca V2/
  );
  assert.throws(
    () => attachReceptionV2Relations({ ...baseInput, counters: [] }),
    /Không tìm thấy quầy V2/
  );
});
