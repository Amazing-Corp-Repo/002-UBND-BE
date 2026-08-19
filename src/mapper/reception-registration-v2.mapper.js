const COUNTER_CODE_PATTERN = /^QUAY_[1-8]$/;

export function resolveReceptionDepartment(registration) {
  const configuration = registration?.cau_hinh_quay;
  const counter = configuration?.quay_tiep_dan;

  return (
    counter?.ma_quay ||
    configuration?.ma_quay ||
    registration?.quay_tiep_dan?.ma_quay ||
    registration?.bo_phan ||
    null
  );
}

export function hasAssignedReceptionCounter(registration) {
  if (registration?.id_cau_hinh_quay || registration?.cau_hinh_quay?.id) {
    return true;
  }

  return COUNTER_CODE_PATTERN.test(
    resolveReceptionDepartment(registration) || ""
  );
}

export function buildReceptionDepartmentFilter(department) {
  if (!department) return null;

  return {
    OR: [
      {
        cau_hinh_quay: {
          is: {
            quay_tiep_dan: { is: { ma_quay: department } },
          },
        },
      },
      {
        id_cau_hinh_quay: null,
        bo_phan: department,
      },
    ],
  };
}

export const receptionCounterRelation = {
  select: {
    id: true,
    ma_quay: true,
    khung_gio: true,
    id_ca_tiep_dan: true,
    quay_tiep_dan: {
      select: {
        id: true,
        ma_quay: true,
        ten_quay: true,
      },
    },
  },
};
