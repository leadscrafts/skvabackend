import {
  getPublishedBlogs,
  getBlogBySlug,
  getAllBlogsAdmin,
  getBlogById,
  createBlog,
  updateBlog,
  softDeleteBlog,
  togglePublishStatus,
} from "./blog.service.js";

import {
  uploadFileToSupabase,
  deleteFileFromSupabase,
} from "../../utils/supabaseStorage.js";
import prisma from "../../config/prisma.js";

export const getAllBlogPosts = async (req, res) => {
  try {
    const posts = await getPublishedBlogs();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBlogPostBySlug = async (req, res) => {
  try {
    const post = await getBlogBySlug(req.params.slug);

    if (!post) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllBlogPostsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const results = await getAllBlogsAdmin({
      page: parseInt(page),
      limit: parseInt(limit),
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBlogPostById = async (req, res) => {
  try {
    const post = await getBlogById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createBlogPost = async (req, res) => {
  let imageUrl = null;
  try {
    if (req.file) {
      imageUrl = await uploadFileToSupabase(req.file, "blogs");
    }

    const postData = {
      title: req.body.title,
      slug: req.body.slug,
      excerpt: req.body.excerpt || null,
      content: req.body.content || null,
      author: req.body.author,

      publishDate: req.body.publishDate
        ? new Date(req.body.publishDate)
        : new Date(),

      isPublished:
        req.body.isPublished === true || req.body.isPublished === "true",

      metaTitle: req.body.metaTitle || null,
      metaDescription: req.body.metaDescription || null,
      featuredImage: imageUrl,
    };

    const post = await createBlog(postData);

    res.status(201).json(post);
  } catch (error) {
    if (imageUrl) {
      try {
        await deleteFileFromSupabase(imageUrl);
      } catch (deleteError) {
        console.error("Failed to delete uploaded image:", deleteError);
      }
    }
    res.status(500).json({ message: error.message });
  }
};

export const updateBlogPost = async (req, res) => {
  const id = req.params.id;
  let imageUrl = null;
  let oldImageUrl = null;

  try {
    const {
      title,
      slug,
      excerpt,
      content,
      author,
      publishDate,
      isPublished,
      metaTitle,
      metaDescription,
    } = req.body;

    if (req.file) {
      const existingPost = await prisma.blogPost.findUnique({
        where: { id: Number(id) },
      });

      if (!existingPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      oldImageUrl = existingPost.featuredImage;

      imageUrl = await uploadFileToSupabase(req.file, "blogs");
    }

    const updateData = {
      ...(title !== undefined && { title: title.trim() }),
      ...(slug !== undefined && { slug: slug.trim() }),
      ...(excerpt !== undefined && { excerpt }),
      ...(content !== undefined && { content }),
      ...(author !== undefined && { author: author.trim() }),
      ...(publishDate !== undefined && {
        publishDate: publishDate ? new Date(publishDate) : null,
      }),
      ...(isPublished !== undefined && {
        isPublished: isPublished === true || isPublished === "true",
      }),
      ...(metaTitle !== undefined && { metaTitle }),
      ...(metaDescription !== undefined && { metaDescription }),
      ...(imageUrl && { featuredImage: imageUrl }),
    };

    const updatedPost = await updateBlog(id, updateData);

    if (oldImageUrl && imageUrl) {
      try {
        await deleteFileFromSupabase(oldImageUrl);
      } catch (deleteError) {
        console.error("Failed to delete old image:", deleteError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: updatedPost,
    });
  } catch (error) {
    if (imageUrl) {
      try {
        await deleteFileFromSupabase(imageUrl);
      } catch (deleteError) {
        console.error("Failed to delete uploaded image:", deleteError);
      }
    }
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to update blog",
    });
  }
};

export const deleteBlogPost = async (req, res) => {
  try {
    await softDeleteBlog(req.params.id);
    res.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePublish = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updatedPost = await togglePublishStatus(id);
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
