import apiClient from "./axiosClient";

// GET media items for a given listing, optionally filtered by media_type.
// Confirm actual path — guessing /media/.
export const getMedia = async ({ listingId, mediaType } = {}) => {
  const { data } = await apiClient.get("/media/", {
    params: { listing: listingId, media_type: mediaType },
  });
  return data;
};

// POST a new media file. Expects a FormData with "file", "listing", and
// "media_type" fields.
export const uploadMedia = async (formData) => {
  const { data } = await apiClient.post("/media/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

// DELETE a media item the seller no longer wants (e.g. a pending-review item).
export const deleteMedia = async (mediaId) => {
  await apiClient.delete(`/media/${mediaId}/`);
};

// PUT to replace a rejected media item's file and resubmit it for review.
export const replaceMedia = async (mediaId, formData) => {
  const { data } = await apiClient.put(`/media/${mediaId}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};