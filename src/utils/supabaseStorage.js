import supabase from "../config/supabase.js";

export const uploadImageToSupabase = async (file, folder = "general") => {
  try {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    const { error } = await supabase.storage
      .from("uploads")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) throw error;

    const { data } = supabase.storage.from("uploads").getPublicUrl(fileName);

    return data.publicUrl;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const deleteImageFromSupabase = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    const path = imageUrl.split("/uploads/")[1];

    if (!path) return;

    const { error } = await supabase.storage.from("uploads").remove([path]);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting image:", error.message);
  }
};
