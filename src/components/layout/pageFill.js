/*
 * Root classes for a page that fills the whole content area — the worklists,
 * pickers and the Audit Log.
 *
 * MainLayout marks its scroll area `group/page` with `data-container`:
 *   on  — the white parent container is drawn (most roles). The page bleeds to
 *         the container's edges, cancelling its p-5, and fills it.
 *   off — no parent container (Contract Holder, Contract Engineer). The page
 *         draws its own single white card instead, filling the content area.
 *
 * Either way it is a flex column, so a page's header stays on top, its rows
 * scroll and its footer stays pinned at the bottom.
 */
export const PAGE_FILL = [
  'flex flex-col',
  'group-data-[container=on]/page:-m-5 group-data-[container=on]/page:h-[calc(100%+2.5rem)]',
  'group-data-[container=off]/page:h-full group-data-[container=off]/page:overflow-hidden',
  'group-data-[container=off]/page:rounded-2xl group-data-[container=off]/page:border',
  'group-data-[container=off]/page:border-[#cce6f8] group-data-[container=off]/page:bg-white',
  'group-data-[container=off]/page:shadow-[0_1px_4px_rgba(27,76,111,0.06),0_4px_16px_rgba(27,76,111,0.06)]',
  'dark:group-data-[container=off]/page:border-slate-800 dark:group-data-[container=off]/page:bg-slate-900',
].join(' ')
