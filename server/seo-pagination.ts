export const CATEGORY_PAGE_SIZE = 30;

export function getRequestedCategoryPage(url: string, siteUrl: string): number {
  const raw = new URL(url, siteUrl).searchParams.get("page");
  const page = Number(raw || "1");
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function categoryPagePath(
  tabSlug: string,
  subCategory: string | null,
  page: number,
): string {
  const query = [`tab=${tabSlug}`];
  if (subCategory) query.push(`subCategory=${encodeURIComponent(subCategory)}`);
  if (page > 1) query.push(`page=${page}`);
  return `/categories?${query.join("&")}`;
}

export function paginateCategoryProducts<T>(
  products: T[],
  requestedPage: number,
): { products: T[]; page: number; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(products.length / CATEGORY_PAGE_SIZE));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  return {
    products: products.slice(
      (page - 1) * CATEGORY_PAGE_SIZE,
      page * CATEGORY_PAGE_SIZE,
    ),
    page,
    totalPages,
  };
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildPaginationNavigation(
  page: number,
  totalPages: number,
  pathForPage: (page: number) => string,
): string {
  if (totalPages <= 1) return "";

  const links: string[] = [];
  if (page > 1) {
    links.push(
      `<a rel="prev" href="${escapeAttribute(pathForPage(page - 1))}">Previous page</a>`,
    );
  }
  if (page < totalPages) {
    links.push(
      `<a rel="next" href="${escapeAttribute(pathForPage(page + 1))}">Next page</a>`,
    );
  }

  return (
    `<nav aria-label="Listing pages">` +
    `<p>Page ${page} of ${totalPages}</p><p>${links.join(" &middot; ")}</p>` +
    `</nav>`
  );
}