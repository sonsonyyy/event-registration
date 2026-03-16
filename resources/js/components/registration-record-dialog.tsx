import type { ReactNode } from 'react';
import {
    DataTableBadge,
    resolveDataTableTone,
} from '@/components/data-table-badge';
import EntityRecordDialog from '@/components/entity-record-dialog';
import { Button } from '@/components/ui/button';
import { formatSystemDateTime } from '@/lib/date-time';

type ReceiptRecord = {
    original_name: string | null;
    uploaded_at: string | null;
    url?: string | null;
};

type ReviewRecord = {
    id: number;
    decision: string;
    reason: string | null;
    notes: string | null;
    decided_at: string | null;
    reviewer: {
        id: number;
        name: string;
    } | null;
};

type ItemRecord = {
    id: number;
    category_name: string;
    quantity: number;
    unit_amount: string;
    subtotal_amount: string;
};

type RegistrationRecordDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    registrationStatus: string;
    paymentStatus?: string | null;
    totalQuantity: number;
    totalAmount: string;
    event: {
        name: string;
        venue?: string | null;
    };
    pastor: {
        church_name: string;
        pastor_name: string;
        section_name?: string | null;
        district_name?: string | null;
    };
    submittedAt?: string | null;
    submittedBy?: {
        name: string;
        email?: string | null;
    } | null;
    verifiedAt?: string | null;
    verifiedBy?: {
        name: string;
    } | null;
    paymentReference?: string | null;
    remarks?: string | null;
    receipt?: ReceiptRecord | null;
    items: ItemRecord[];
    reviews?: ReviewRecord[];
    children?: ReactNode;
    footer?: ReactNode;
};

const formatCurrency = (value: string): string =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'PHP',
    }).format(Number.parseFloat(value || '0'));

const formatDateTime = (
    value: string | null | undefined,
    fallback = 'Not available',
): string => {
    if (!value) {
        return fallback;
    }

    return formatSystemDateTime(value);
};

export default function RegistrationRecordDialog({
    open,
    onOpenChange,
    title,
    description,
    registrationStatus,
    paymentStatus = null,
    totalQuantity,
    totalAmount,
    event,
    pastor,
    submittedAt,
    submittedBy = null,
    verifiedAt,
    verifiedBy = null,
    paymentReference = null,
    remarks = null,
    receipt = null,
    items,
    reviews = [],
    children,
    footer,
}: RegistrationRecordDialogProps) {
    return (
        <EntityRecordDialog
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description}
            maxWidthClassName="sm:max-w-4xl"
            badges={
                <>
                    <DataTableBadge
                        tone={resolveDataTableTone(
                            registrationStatus,
                            {
                                'pending verification': 'amber',
                                'needs correction': 'amber',
                                verified: 'emerald',
                                completed: 'emerald',
                                rejected: 'rose',
                                cancelled: 'rose',
                            },
                            'slate',
                        )}
                    >
                        {registrationStatus}
                    </DataTableBadge>
                    {paymentStatus && (
                        <DataTableBadge
                            tone={resolveDataTableTone(paymentStatus, {
                                paid: 'emerald',
                                unpaid: 'rose',
                                partial: 'amber',
                            })}
                        >
                            {paymentStatus}
                        </DataTableBadge>
                    )}
                </>
            }
            sections={[
                {
                    title: 'Overview',
                    columns: 3,
                    fields: [
                        {
                            label: 'Event',
                            value: (
                                <>
                                    <div className="font-medium">{event.name}</div>
                                    {event.venue && (
                                        <div className="text-slate-500 dark:text-slate-400">
                                            {event.venue}
                                        </div>
                                    )}
                                </>
                            ),
                        },
                        {
                            label: 'Church',
                            value: (
                                <>
                                    <div className="font-medium">
                                        {pastor.church_name}
                                    </div>
                                    <div className="text-slate-500 dark:text-slate-400">
                                        {pastor.pastor_name}
                                    </div>
                                    {(pastor.section_name ||
                                        pastor.district_name) && (
                                        <div className="text-slate-500 dark:text-slate-400">
                                            {[pastor.section_name, pastor.district_name]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </div>
                                    )}
                                </>
                            ),
                        },
                        {
                            label: 'Totals',
                            value: (
                                <>
                                    <div className="font-medium">
                                        {formatCurrency(totalAmount)}
                                    </div>
                                    <div className="text-slate-500 dark:text-slate-400">
                                        {totalQuantity} delegates
                                    </div>
                                </>
                            ),
                        },
                    ],
                },
                {
                    title: 'Timeline',
                    fields: [
                        {
                            label: 'Submitted',
                            value: (
                                <>
                                    <div>{formatDateTime(submittedAt)}</div>
                                    {submittedBy && (
                                        <div className="text-slate-500 dark:text-slate-400">
                                            {submittedBy.name}
                                            {submittedBy.email && (
                                                <span className="block">
                                                    {submittedBy.email}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </>
                            ),
                        },
                        {
                            label: 'Verified',
                            value: (
                                <>
                                    <div>{formatDateTime(verifiedAt, 'Not verified')}</div>
                                    {verifiedBy && (
                                        <div className="text-slate-500 dark:text-slate-400">
                                            {verifiedBy.name}
                                        </div>
                                    )}
                                </>
                            ),
                        },
                    ],
                },
                {
                    title: 'Receipt',
                    fields: [
                        {
                            label: 'File',
                            value:
                                receipt?.original_name ?? 'No receipt uploaded',
                            breakWords: true,
                        },
                        {
                            label: 'Uploaded',
                            value: formatDateTime(
                                receipt?.uploaded_at,
                                'Not uploaded',
                            ),
                        },
                        ...(paymentReference
                            ? [
                                  {
                                      label: 'Reference',
                                      value: paymentReference,
                                  },
                              ]
                            : []),
                    ],
                    content: receipt?.url ? (
                        <div>
                            <Button asChild size="sm" variant="outline">
                                <a
                                    href={receipt.url}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    View receipt
                                </a>
                            </Button>
                        </div>
                    ) : null,
                },
                {
                    title: 'Line Items',
                    content: (
                        <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="grid gap-2 py-3 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_220px] md:items-center"
                                >
                                    <div>
                                        <div className="font-medium text-slate-900 dark:text-slate-100">
                                            {item.category_name}
                                        </div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                            {item.quantity} delegates
                                        </div>
                                    </div>
                                    <div className="text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-right">
                                        <div>{formatCurrency(item.unit_amount)} each</div>
                                        <div className="font-medium text-slate-900 dark:text-slate-100">
                                            {formatCurrency(item.subtotal_amount)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ),
                },
                ...(remarks
                    ? [
                          {
                              title: 'Remarks',
                              fields: [
                                  {
                                      label: 'Notes',
                                      value: (
                                          <div className="whitespace-pre-wrap">
                                              {remarks}
                                          </div>
                                      ),
                                      fullWidth: true,
                                  },
                              ],
                          },
                      ]
                    : []),
                ...(reviews.length > 0
                    ? [
                          {
                              title: 'Review History',
                              content: (
                                  <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                                      {reviews.map((review) => (
                                          <div
                                              key={review.id}
                                              className="space-y-2 py-4 first:pt-0 last:pb-0"
                                          >
                                              <DataTableBadge
                                                  tone={resolveDataTableTone(
                                                      review.decision,
                                                      {
                                                          'needs correction':
                                                              'amber',
                                                          verified: 'emerald',
                                                          rejected: 'rose',
                                                      },
                                                      'slate',
                                                  )}
                                              >
                                                  {review.decision}
                                              </DataTableBadge>
                                              {review.reason && (
                                                  <div className="text-sm leading-6 text-slate-900 dark:text-slate-100">
                                                      {review.reason}
                                                  </div>
                                              )}
                                              {review.notes && (
                                                  <div className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                                                      {review.notes}
                                                  </div>
                                              )}
                                              <div className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase dark:text-slate-500">
                                                  {review.reviewer?.name ??
                                                      'System'}{' '}
                                                  •{' '}
                                                  {formatDateTime(
                                                      review.decided_at,
                                                  )}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              ),
                          },
                      ]
                    : []),
                ...(children
                    ? [
                          {
                              title: 'Actions',
                              content: children,
                          },
                      ]
                    : []),
            ]}
            footer={footer}
        />
    );
}
