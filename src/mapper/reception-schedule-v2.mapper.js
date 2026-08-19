const normalizeSlotBoundary = (value) => `${value.trim()}:00`;

export function attachReceptionV2Relations({
  slotRows,
  scheduleId,
  shiftEntries,
  counters,
}) {
  const counterIds = new Map(
    counters.map((counter) => [counter.ma_quay, counter.id])
  );

  return slotRows.map((slot) => {
    const [startTime, endTime] = slot.khung_gio
      .split("-")
      .map(normalizeSlotBoundary);
    const shift = shiftEntries.find(
      (entry) =>
        entry.gio_bat_dau === startTime && entry.gio_ket_thuc === endTime
    );
    const counterId = counterIds.get(slot.ma_quay);

    if (!shift?.id) {
      throw new Error(`Không tìm thấy ca V2 cho khung giờ ${slot.khung_gio}`);
    }
    if (!counterId) {
      throw new Error(`Không tìm thấy quầy V2 cho mã ${slot.ma_quay}`);
    }

    return {
      ...slot,
      id_lich_tiep_dan: scheduleId,
      id_ca_tiep_dan: shift.id,
      id_quay: counterId,
    };
  });
}
