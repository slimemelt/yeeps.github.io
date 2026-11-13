import { $ } from "../dom.js";
import { SITES } from "../config.js";
import { getContent } from "../content.js";
import { state, siteName } from "../state.js";

const MARKUP = /(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

const posts = () =>
  (getContent(state.site).posts ?? [])
    .filter((post) => post.published)
    .sort((a, b) => b.date.localeCompare(a.date));

function formatDate(date) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

// Posts are plain text: **bold**, [text](https://link), and "## " for a heading. Nothing here is ever parsed as HTML.
function inline(text) {
  const fragment = document.createDocumentFragment();
  for (const part of text.split(MARKUP)) {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (bold) fragment.append(el("strong", null, bold[1]));
    else if (link) {
      const anchor = el("a", null, link[1]);
      anchor.href = link[2];
      anchor.target = "_blank";
      anchor.rel = "noopener";
      fragment.append(anchor);
    } else if (part) fragment.append(part);
  }
  return fragment;
}

function formatBody(body) {
  return body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const node = block.startsWith("## ") ? el("h2") : el("p");
      node.append(inline(block.replace(/^## /, "")));
      return node;
    });
}

function excerpt(post) {
  if (post.summary) return post.summary;
  const plain = post.body
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*|^## /gm, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > 240 ? `${plain.slice(0, 240).replace(/\s+\S*$/, "")}…` : plain;
}

function head(post) {
  const header = el("div", `post-head${post.img ? " has-image" : ""}`);
  const date = el("time", "post-date", formatDate(post.date));
  date.dateTime = post.date;
  header.append(el("h2", "post-title", post.title), date);
  if (post.img) {
    const image = el("img", "post-thumb");
    image.alt = "";
    image.src = post.img;
    header.append(image);
  }
  return header;
}

function renderList() {
  $("blog-intro").textContent = `Get news and more info on ${SITES[state.site].name}!`;
  const list = $("blog-list");
  const items = posts();
  if (!items.length) {
    list.replaceChildren(el("li", "blog-empty", "No posts yet. Check back soon!"));
    return;
  }
  list.replaceChildren(
    ...items.map((post) => {
      const card = el("a", "post-card");
      card.href = `#blog/${post.id}`;
      card.append(head(post), el("p", "post-excerpt", excerpt(post)), el("span", "post-go", "Read more"));
      const item = el("li");
      item.append(card);
      return item;
    }),
  );
}

function renderPost(id) {
  const body = $("post-body");
  const back = el("a", "post-back", "Blog");
  back.href = "#blog";
  const post = posts().find((candidate) => candidate.id === id);
  if (!post) {
    body.replaceChildren(back, el("p", "blog-empty", "We couldn’t find that post."));
    return;
  }
  const article = el("article", "post-card post-full");
  const text = el("div", "post-text");
  text.append(...formatBody(post.body));
  article.append(head(post), text);
  body.replaceChildren(back, article);
  const title = `${post.title} – ${siteName()}`;
  document.title = title;
  $("page-title").textContent = title;
}

export function renderBlog() {
  if (state.view === "blog") renderList();
  if (state.view === "post") renderPost(decodeURIComponent(location.hash.slice("#blog/".length)));
}
