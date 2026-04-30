import prisma from "../../config/prisma.js";
import { throwError } from "../../utils/throwError.js";

const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : value;

export const getAllCategories = async () => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
    });

    return categories;
  } catch (error) {
    throwError("Failed to fetch category", 500);
  }
};

export const getAllCategoriesAdmin = async ({ page = 1, limit = 10 }) => {
  try {
    const skip = (page - 1) * limit;

    const [categories, count] = await Promise.all([
      prisma.category.findMany({
        where: {
          isDeleted: false,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.category.count({
        where: {
          isDeleted: false,
        },
      }),
    ]);

    return {
      data: {
        data: categories,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    };
  } catch (error) {
    throwError("Failed to fetch category", 500);
  }
};

export const getCategoryById = async (id) => {
  if (!id) throwError("Category ID is required", 400);

  try {
    const category = await prisma.category.findFirst({
      where: {
        id: Number(id),
        isDeleted: false,
      },
    });

    if (!category) throwError("Category not found", 404);

    return category;
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to fetch category", 500);
  }
};

export const getCategoryBySlug = async (slug) => {
  if (!slug) throwError("Category slug is required", 400);

  try {
    const category = await prisma.category.findFirst({
      where: {
        slug,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!category) throwError("Category not found", 404);

    return category;
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to fetch category", 500);
  }
};

export const createCategory = async (data) => {
  const name = normalizeString(data?.name);
  const slug = normalizeString(data?.slug);

  if (!name) throwError("Name is required", 400);
  if (!slug) throwError("Slug is required", 400);

  try {
    const existing = await prisma.category.findUnique({
      where: { slug },
    });

    if (existing && !existing.isDeleted) {
      throwError("Slug already exists", 409);
    }

    const category = await prisma.category.create({
      data: {
        ...data,
        name,
        slug,
      },
    });

    return category;
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to create category", 500);
  }
};

export const updateCategory = async (id, data) => {
  if (!id) throwError("Category ID is required", 400);

  try {
    const existing = await prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      throwError("Category not found", 404);
    }

    const updateData = { ...data };

    if (data.name !== undefined) {
      const name = normalizeString(data.name);
      if (!name) throwError("Name cannot be empty", 400);
      updateData.name = name;
    }

    if (data.slug !== undefined) {
      const slug = normalizeString(data.slug);
      if (!slug) throwError("Slug cannot be empty", 400);
      updateData.slug = slug;

      if (slug !== existing.slug) {
        const slugExists = await prisma.category.findFirst({
          where: {
            slug,
            NOT: { id: Number(id) },
            isDeleted: false,
          },
        });

        if (slugExists) {
          throwError("Slug already exists", 409);
        }
      }
    }

    updateData.updatedAt = new Date();

    const updated = await prisma.category.update({
      where: { id: Number(id) },
      data: updateData,
    });

    return updated;
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to update category", 500);
  }
};

export const softDeleteCategory = async (id) => {
  if (!id) throwError("Category ID is required", 400);

  try {
    const existing = await prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      throwError("Category not found", 404);
    }

    await prisma.category.update({
      where: { id: Number(id) },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to delete category", 500);
  }
};
