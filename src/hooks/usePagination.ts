import { useMemo, useState } from 'react';

export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const end = Math.min(start + pageSize, items.length);

  const pageItems = useMemo(
    () => items.slice(start, end),
    [items, start, end],
  );

  return {
    page: currentPage,
    pageCount,
    pageItems,
    start,
    end,
    canPrev: currentPage > 1,
    canNext: currentPage < pageCount,
    next: () => setPage((value) => Math.min(value + 1, pageCount)),
    prev: () => setPage((value) => Math.max(value - 1, 1)),
  };
}
