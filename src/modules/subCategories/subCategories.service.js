import prisma from "../../config/prisma.js";
import { throwError } from "../../utils/throwError.js";

const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : value;

const validateCategory = async (categoryId) => {
  const category = await prisma.category.findUnique({
    where: { id: Number(categoryId) },
  });

  if (!category || category.isDeleted) {
    throwError("Category not found", 404);
  }
};

export const getAllSubCategories = async () => {
  try {
    return await prisma.subCategory.findMany({
      where: {
        isDeleted: false,
        isActive: true,
      },
      include: {
        Category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    throwError("Failed to fetch subCategories", 500);
  }
};

export const getAllSubCategoriesAdmin = async ({ page = 1, limit = 10 }) => {
  try {
    const skip = (page - 1) * limit;
    const [subCategories, count] = await Promise.all([
      prisma.subCategory.findMany({
        where: {
          isDeleted: false,
        },
        include: {
          Category: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.subCategory.count({
        where: {
          isDeleted: false,
        },
      }),
    ]);

    return {
      data: {
        data: subCategories,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      },
    };
  } catch (error) {
    throwError("Failed to fetch subCategories", 500);
  }
};

export const getSubCategoryById = async (id) => {
  if (!id) throwError("SubCategory ID is required", 400);

  try {
    const subCategory = await prisma.subCategory.findFirst({
      where: {
        id: Number(id),
        isDeleted: false,
      },
      include: {
        Category: true,
      },
    });

    if (!subCategory) throwError("SubCategory not found", 404);

    return subCategory;
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to fetch subCategory", 500);
  }
};

export const getSubCategoryBySlug = async (slug) => {
  if (!slug) throwError("SubCategory slug is required", 400);

  try {
    const subCategory = await prisma.subCategory.findFirst({
      where: {
        slug,
        isDeleted: false,
        isActive: true,
      },
      include: {
        Category: true,
      },
    });

    if (!subCategory) throwError("SubCategory not found", 404);

    return subCategory;
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to fetch subCategory", 500);
  }
};

export const createSubCategory = async (data) => {
  const name = normalizeString(data?.name);
  const slug = normalizeString(data?.slug);
  const categoryId = Number(data?.categoryId);

  if (!name) throwError("Name is required", 400);
  if (!slug) throwError("Slug is required", 400);
  if (!categoryId) throwError("Category ID is required", 400);

  try {
    const existing = await prisma.subCategory.findUnique({
      where: { slug },
    });

    if (existing && !existing.isDeleted) {
      throwError("Slug already exists", 409);
    }

    await validateCategory(categoryId);

    return await prisma.subCategory.create({
      data: {
        ...data,
        name,
        slug,
        categoryId,
      },
      include: {
        Category: true,
      },
    });
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to create subCategory", 500);
  }
};

export const updateSubCategory = async (id, data) => {
  if (!id) throwError("SubCategory ID is required", 400);

  try {
    const updateData = { ...data };

    const existing = await prisma.subCategory.findUnique({
      where: { id: Number(id) },
    });

    if (!existing && existing.isDeleted) {
      throwError("Subcategory is not found", 409);
    }

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
        const slugExists = await prisma.subCategory.findFirst({
          where: {
            slug,
            NOT: { id: Number(id) },
            isDeleted: false,
          },
        });

        if (slugExists) throwError("Slug already exists", 409);
      }
    }

    if (data.categoryId !== undefined) {
      const categoryId = Number(data.categoryId);
      if (!categoryId) throwError("Category ID is invalid", 400);
      await validateCategory(categoryId);
      updateData.categoryId = categoryId;
    }

    if (data.displayOrder !== undefined) {
      const displayOrder = Number(data.displayOrder);
      if (Number.isNaN(displayOrder)) {
        throwError("Display order must be a number", 400);
      }
      updateData.displayOrder = displayOrder;
    }

    updateData.updatedAt = new Date();

    return await prisma.subCategory.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        Category: true,
      },
    });
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to update subCategory", 500);
  }
};

export const softDeleteSubCategory = async (id) => {
  if (!id) throwError("SubCategory ID is required", 400);

  try {
    await prisma.subCategory.update({
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
    throwError("Failed to delete subCategory", 500);
  }
};

export const updateSubCategoryActive = async (id, isActive) => {
  if (!id) throwError("SubCategory ID is required", 400);

  try {
    const existing = await prisma.subCategory.findUnique({
      where: { id: Number(id) },
    });

    if (!existing || existing.isDeleted) {
      throwError("SubCategory not found", 404);
    }

    return await prisma.subCategory.update({
      where: { id: Number(id) },
      data: {
        isActive,
        updatedAt: new Date(),
      },
      include: {
        Category: true,
      },
    });
  } catch (error) {
    if (error.status) throw error;
    throwError("Failed to update subCategory active status", 500);
  }
};
