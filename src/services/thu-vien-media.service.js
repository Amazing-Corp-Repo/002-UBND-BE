import ThuVienRepository from "../repositories/thu-vien.repository.js";
import { cleanOriginalFileName } from "../utils/string.util.js";

const decodeOriginalName = (name) => {
  return cleanOriginalFileName(name);
};

export const processTags = async (idTaiLieu, tagsStr) => {
  if (!tagsStr || tagsStr.trim() === "") return;
  let tags = [];
  try { tags = JSON.parse(tagsStr); } catch { tags = tagsStr.split(",").map((tag) => tag.trim()).filter(Boolean); }
  if (!Array.isArray(tags)) tags = [tags];
  for (const tagName of tags) {
    if (!tagName || tagName.trim() === "") continue;
    const trimmed = tagName.trim().toLowerCase();
    let tag = await ThuVienRepository.findTagByName(trimmed);
    if (!tag) tag = await ThuVienRepository.createTag(trimmed);
    await ThuVienRepository.createTagLink(idTaiLieu, tag.id);
  }
};

export const processMedia = async (idTaiLieu, files, currentUser) => {
  if (!files) return;
  for (const [items, type] of [[files.images, "IMAGE"], [files.videos, "VIDEO"]]) {
    for (const file of items || []) {
      await ThuVienRepository.createMedia({ id_tai_lieu: idTaiLieu, loai: type, ten_file_goc: decodeOriginalName(file.originalname), url: file.relativeUrl, kich_thuoc: file.size, mime_type: file.mimetype, nguoi_tao: currentUser });
    }
  }
};
