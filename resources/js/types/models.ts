export interface Partner {
    id: number;
    external_id: number;
    name: string;
    postal_code: string;
    city: string;
    detail_url: string;
    contact_person: string | null;
    street_address: string | null;
    phone: string | null;
    fax: string | null;
    mobile: string | null;
    email: string | null;
    website: string | null;
    image_url: string | null;
    discount_description: string | null;
    body_text: string | null;
    listing_hash: string | null;
    detail_hash: string | null;
    details_fetched: boolean;
    is_active: boolean;
    details_fetched_at: string | null;
    created_at: string;
    updated_at: string;
    categories?: Category[];
}

export interface PartnerListItem {
    id: number;
    external_id: number;
    name: string;
    postal_code: string;
    city: string;
    is_active: boolean;
    details_fetched: boolean;
    details_fetched_at: string | null;
    categories?: Category[];
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    partners_count?: number;
}

export interface ChangeLogEntry {
    id: number;
    partner_id: number;
    event: string;
    changes: Record<string, unknown> | null;
    detected_at: string;
    partner?: {
        id: number;
        name: string;
        external_id: number;
    };
}

export interface CommandRun {
    id: number;
    command: string;
    parameters: Record<string, unknown> | null;
    status: 'pending' | 'running' | 'completed' | 'failed';
    output: string | null;
    result: Record<string, unknown> | null;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}
