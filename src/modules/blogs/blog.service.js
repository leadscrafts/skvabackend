import prisma from "../../config/prisma.js";
import { throwError } from "../../utils/throwError.js";

export const getPublishedBlogs = async () => {
  try {
    const blogs = await prisma.blogPost.findMany({
      where: {
        isPublished: true,
        isDeleted: false,
      },
      orderBy: { publishDate: "desc" },
    });

    return blogs;
  } catch (error) {
    throwError("Failed to fetch published blogs", 500);
  }
};

export const getBlogBySlug = async (slug) => {
  if (!slug) throwError("Slug is required");

  try {
    const blog = await prisma.blogPost.findFirst({
      where: {
        slug,
        isPublished: true,
        isDeleted: false,
      },
    });

    if (!blog) throwError("Blog not found", 404);

    return blog;
  } catch (error) {
    if (error.status) throw error;
    throwError("Error fetching blog by slug", 500);
  }
};

export const getAllBlogsAdmin = async () => {
  try {
    return await prisma.blogPost.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    throwError("Failed to fetch blogs", 500);
  }
};

export const getBlogById = async (id) => {
  if (!id) throwError("Blog ID required");

  try {
    const blog = await prisma.blogPost.findFirst({
      where: { id: Number(id), isDeleted: false },
    });

    if (!blog) throwError("Blog not found", 404);

    return blog;
  } catch (error) {
    if (error.status) throw error;
    throwError("Error fetching blog", 500);
  }
};

export const createBlog = async (data) => {
  if (!data?.title) throwError("Title is required");
  if (!data?.slug) throwError("Slug is required");
  if (!data?.author) throwError("Author is required");

  try {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: data.slug },
    });

    if (existing) throwError("Slug already exists", 409);

    const blog = await prisma.blogPost.create({ data });

    return blog;
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to create blog", 500);
  }
};

export const updateBlog = async (id, data) => {
  if (!id) throwError("Blog ID is required", 400);

  try {
    const existing = await prisma.blogPost.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      throwError("Blog not found", 404);
    }

    if (data.title !== undefined && !data.title.trim()) {
      throwError("Title cannot be empty", 400);
    }
    if (data.slug !== undefined && !data.slug.trim()) {
      throwError("Slug cannot be empty", 400);
    }
    if (data.author !== undefined && !data.author.trim()) {
      throwError("Author cannot be empty", 400);
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.blogPost.findFirst({
        where: {
          slug: data.slug,
          NOT: { id: Number(id) },
          isDeleted: false,
        },
      });

      if (slugExists) {
        throwError("Slug already exists", 409);
      }
    }

    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    if (data.isPublished !== undefined) {
      if (data.isPublished && !existing.isPublished) {
        updateData.publishDate = new Date();
      } else if (!data.isPublished) {
        updateData.publishDate = null;
      }
    }

    const updated = await prisma.blogPost.update({
      where: { id: Number(id) },
      data: updateData,
    });

    return updated;
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to update blog", 500);
  }
};

export const softDeleteBlog = async (id) => {
  if (!id) throwError("Blog ID required");

  try {
    const existing = await prisma.blogPost.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) throwError("Blog not found", 404);

    await prisma.blogPost.update({
      where: { id: Number(id) },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to delete blog", 500);
  }
};

export const togglePublishStatus = async (id) => {
  if (!id) throwError("Blog ID required");

  try {
    const blog = await prisma.blogPost.findUnique({
      where: { id: Number(id) },
    });

    if (!blog || blog.isDeleted) throwError("Blog not found", 404);

    const updated = await prisma.blogPost.update({
      where: { id: Number(id) },
      data: {
        isPublished: !blog.isPublished,
        publishDate: blog.isPublished ? null : new Date(),
      },
    });

    return updated;
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to update publish status", 500);
  }
};
