import { blogService } from "@/features/techblog/constant";
import { registerBlogPosts } from "@/features/techblog/search";

registerBlogPosts(blogService.repo)
  .then(() => console.log("Registered Posts"))
  .catch((err) => {
    throw err;
  });
