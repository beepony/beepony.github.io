import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://beepony.github.io/",
    title: "Beepony",
    description: "Connecting the Dots.",
    author: "Beepony",
    profile: "https://github.com/beepony",
    ogImage: "default-og.jpg",
    lang: "zh-CN",
    timezone: "Asia/Shanghai",
    dir: "ltr",
  },
  posts: {
    perPage: 8,
    perIndex: 8,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: false,         // 暂不启用（生成 PNG 会拖慢构建）
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/beepony/beepony.github.io/edit/main/src/content/posts/",
    },
    search: "pagefind",
  },
  socials: [
    { name: "github",   url: "https://github.com/beepony" },
    { name: "x",        url: "https://x.com/ynopeeb" },
    { name: "instagram", url: "https://instagram.com/beepony" },
    { name: "rss",      url: "/rss.xml" },
    { name: "weibo",    url: "https://weibo.com/beepony" },
  ],
  shareLinks: [
    { name: "x",        url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "weibo",    url: "https://service.weibo.com/share/share.php?url=" },
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  ],
});