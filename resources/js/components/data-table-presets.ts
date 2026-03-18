export const elevatedIndexTableStyles = {
    shell: 'overflow-hidden rounded-md border border-slate-200/80 bg-background shadow-[0_22px_60px_-34px_rgba(15,23,42,0.26)] dark:border-slate-800 dark:bg-slate-950',
    band: 'border-b border-slate-200/80 bg-[linear-gradient(180deg,#fcfdfb_0%,#f7f9f7_100%)] px-4 py-4 md:px-6 dark:border-slate-800 dark:bg-slate-950/70',
    toolbar:
        'gap-3 lg:flex-row lg:items-end lg:justify-between',
    searchWrapper: 'max-w-none',
    input: 'h-11 rounded-md border-slate-200 bg-white pl-12 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:border-[#184d47]/35 focus-visible:ring-[#184d47]/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500',
    action: 'w-full lg:w-auto',
    primaryButton: 'h-11 rounded-md',
    selectTrigger:
        'h-11 w-full min-w-52 rounded-md border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-none data-[placeholder]:text-slate-400 focus-visible:border-[#184d47]/35 focus-visible:ring-[#184d47]/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:data-[placeholder]:text-slate-500',
    selectContent:
        'rounded-md border-slate-200 bg-white p-1 text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100',
    selectItem:
        'rounded-md px-3 py-2.5 text-slate-900 focus:bg-slate-100 focus:text-slate-900 dark:text-slate-100 dark:focus:bg-slate-800 dark:focus:text-white',
    headerActions:
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end',
    table: 'min-w-full divide-y divide-slate-200/80 text-sm dark:divide-slate-800',
    thead: 'bg-slate-50/80 dark:bg-slate-900/50',
    headerRow:
        'text-left text-xs uppercase tracking-[0.18em] text-muted-foreground dark:text-slate-400',
    headerCell:
        'py-3 pr-4 font-medium text-slate-500 dark:text-slate-400',
    firstHeaderCell:
        'py-3 pr-4 pl-6 font-medium text-slate-500 dark:text-slate-400',
    lastHeaderCellRight:
        'py-3 pr-6 text-right font-medium text-slate-500 dark:text-slate-400',
    tbody: 'divide-y divide-slate-200/80 dark:divide-slate-800',
    row: 'bg-background transition-colors odd:bg-white even:bg-slate-50/70 hover:bg-[#f3f8f6] dark:bg-slate-950 dark:odd:bg-slate-950 dark:even:bg-slate-900/50 dark:hover:bg-slate-900',
    firstCell: 'px-6 py-4 align-middle',
    cell: 'py-4 pr-4 align-middle',
    lastCellRight: 'py-4 pr-6 align-middle',
    primaryText: 'font-medium text-slate-900 dark:text-slate-100',
    secondaryText: 'mt-1 text-sm text-slate-500 dark:text-slate-400',
    detailText:
        'mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400',
    metaText:
        'mt-3 text-xs font-semibold tracking-[0.18em] uppercase text-slate-500 dark:text-slate-400',
    subMetaText:
        'mt-1 text-xs font-semibold tracking-[0.18em] uppercase text-slate-500 dark:text-slate-400',
    strongText: 'font-medium text-slate-900 dark:text-slate-100',
    metricText: 'text-sm text-slate-500 dark:text-slate-400',
    inlineTag:
        'inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-200',
    subtleSurface:
        'rounded-md border border-slate-200/80 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950',
    actionGroup: 'flex justify-end gap-2',
    emptyCell: 'px-6 py-16 text-center',
    emptyTitle: 'text-base font-medium text-slate-900 dark:text-slate-100',
    emptyDescription: 'text-sm text-slate-500 dark:text-slate-400',
    paginationWrapper:
        'border-t border-slate-200/80 bg-slate-50/80 px-4 py-4 md:px-6 dark:border-slate-800 dark:bg-slate-950/70',
    pagination: 'gap-4 border-none pt-0',
    paginationTopRow: 'gap-3 sm:items-center',
    rowsTrigger:
        'h-11 w-[7.25rem] rounded-md border-slate-200 bg-white text-slate-700 shadow-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100',
    summary: 'text-sm font-medium text-slate-600 dark:text-slate-300',
    navigationWrapper: 'border-t border-slate-200 pt-4 dark:border-slate-800',
    previousButton:
        'h-9 rounded-md border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900',
    nextButton:
        'h-9 rounded-md border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900',
    activePageButton:
        'h-9 rounded-md border-[#184d47] bg-[#184d47] text-white hover:bg-[#143f3a]',
    inactivePageButton:
        'h-9 rounded-md border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900',
    ellipsis: 'h-9 rounded-md text-slate-400 dark:text-slate-500',
} as const;

export const reviewWorkspaceStyles = {
    summaryCard: 'rounded-md border px-5 py-5 shadow-sm transition-colors',
    summaryCardPending:
        'border-[#eadfca] bg-[linear-gradient(145deg,_rgba(255,248,238,0.96),_rgba(255,255,255,1))] shadow-[#c58b1e]/8 dark:border-amber-950/60 dark:bg-slate-950',
    summaryCardApproved:
        'border-[#d6e2de] bg-[linear-gradient(145deg,_rgba(24,77,71,0.10),_rgba(255,255,255,0.98))] shadow-[#184d47]/8 dark:border-emerald-950/60 dark:bg-slate-950',
    summaryCardRejected:
        'border-[#ecd7d8] bg-[linear-gradient(145deg,_rgba(253,245,245,0.96),_rgba(255,255,255,1))] shadow-[#be4b56]/8 dark:border-rose-950/60 dark:bg-slate-950',
    summaryEyebrow: 'text-slate-500 dark:text-slate-400',
    summaryValue: 'text-slate-900 dark:text-slate-100',
    summarySubtitle: 'text-slate-600 dark:text-slate-400',
    summaryIconWrapper:
        'flex size-11 items-center justify-center rounded-md',
    summaryIconPending:
        'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    summaryIconApproved:
        'bg-[#184d47] text-white shadow-sm shadow-[#184d47]/15 dark:bg-emerald-500/10 dark:text-emerald-300',
    summaryIconRejected:
        'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    flashSuccess:
        'rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-100',
    flashError:
        'rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/70 dark:text-rose-100',
    shell: 'overflow-hidden rounded-md border border-[#d6e2de] bg-[linear-gradient(145deg,_rgba(247,250,249,0.98),_rgba(255,255,255,1))] shadow-sm shadow-[#184d47]/8 dark:border-slate-800 dark:bg-slate-950',
    band: 'border-b border-[#dce4e1] bg-white/75 px-4 py-4 md:px-6 dark:border-slate-800 dark:bg-slate-950/70',
    toolbar: 'gap-3 lg:flex-row lg:items-end lg:justify-between',
    searchWrapper: 'max-w-none',
    input: 'h-11 rounded-md border-[#d6e2de] bg-white pl-12 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:border-[#184d47]/35 focus-visible:ring-[#184d47]/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500',
    action: 'w-full lg:w-auto',
    selectTrigger:
        'h-11 w-full min-w-52 rounded-md border-[#d6e2de] bg-white px-4 text-slate-700 shadow-none data-[placeholder]:text-slate-400 focus-visible:border-[#184d47]/35 focus-visible:ring-[#184d47]/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:data-[placeholder]:text-slate-500',
    selectContent:
        'rounded-md border-[#d6e2de] bg-white p-1 text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100',
    selectItem:
        'rounded-md px-3 py-2.5 text-slate-900 focus:bg-slate-100 focus:text-slate-900 dark:text-slate-100 dark:focus:bg-slate-800 dark:focus:text-white',
    referenceTag:
        'mt-2 inline-flex rounded-md bg-slate-100 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-200',
    surfaceButton:
        'rounded-md border-[#d6e2de] bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
    primaryButton:
        'rounded-md bg-[#184d47] text-white hover:bg-[#143f3a] disabled:bg-[#184d47]/35 disabled:text-white',
    dangerButton:
        'rounded-md border-rose-200 bg-white text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900 dark:bg-slate-950 dark:text-rose-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-200',
    paginationWrapper:
        'border-t border-[#dce4e1] bg-white/75 px-4 py-4 md:px-6 dark:border-slate-800 dark:bg-slate-950/70',
    pagination: 'gap-4 border-none pt-0',
    paginationTopRow: 'gap-3 sm:items-center',
    rowsTrigger:
        'h-11 w-[7.25rem] rounded-md border-[#d6e2de] bg-white text-slate-700 shadow-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100',
    summary: 'text-sm font-medium text-slate-600 dark:text-slate-300',
    navigationWrapper: 'border-t border-[#dce4e1] pt-4 dark:border-slate-800',
    previousButton:
        'h-9 rounded-md border-[#d6e2de] bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900',
    nextButton:
        'h-9 rounded-md border-[#d6e2de] bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900',
    activePageButton:
        'h-9 rounded-md border-[#184d47] bg-[#184d47] text-white hover:bg-[#143f3a]',
    inactivePageButton:
        'h-9 rounded-md border-[#d6e2de] bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900',
    ellipsis: 'h-9 rounded-md text-slate-400 dark:text-slate-500',
} as const;
