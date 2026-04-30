import express from "express";
import cors from "cors";
import helmet from "helmet";
import env from "./config/env.js";
import blogRoutes from "./modules/blogs/blog.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import categoryRoutes from "./modules/categories/category.routes.js";
import subCategoryRoutes from "./modules/subCategories/subCategories.routes.js";
import productRoutes from "./modules/products/products.routes.js";
import leadRoutes from "./modules/leads/leads.routes.js";
import bookingRoutes from "./modules/booking/booking.routes.js";
import homeBannerRoutes from "./modules/homeBanner/homeBanner.routes.js";
import homeVideoRoutes from "./modules/homeVideo/homeVideo.routes.js";
import mediaGalleryRoutes from "./modules/mediaGallery/mediaGallery.routes.js";

const app = express();
const PORT = env.port;

// app.use(
//   helmet({
//     crossOriginResourcePolicy: { policy: "cross-origin" },
//     contentSecurityPolicy: false,
//   }),
// );
// console.log(env.frontendUrl, "showing env");

const allowedOrigins = [
  "https://skva.co.in",
  "https://www.skva.co.in",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/banners", homeBannerRoutes);
app.use("/api/home-video", homeVideoRoutes);
app.use("/api/media-gallery", mediaGalleryRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/sub-categories", subCategoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: env.nodeEnv === "development" ? err.message : {},
  });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
