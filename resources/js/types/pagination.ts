export type PaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

export type PaginatedData<T> = {
    data: T[];
    meta: PaginationMeta;
};
