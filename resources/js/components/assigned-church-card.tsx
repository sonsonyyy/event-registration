import { BadgeCheck, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type AssignedPastor = {
    pastor_name: string;
    church_name: string;
    section_name: string;
    district_name: string;
    status: string;
} | null;

type Props = {
    assignedPastor: AssignedPastor;
};

export default function AssignedChurchCard({ assignedPastor }: Props) {
    return (
        <div className="overflow-hidden rounded-[28px] border border-[#ccd8d4] bg-[linear-gradient(135deg,_rgba(24,77,71,0.12),_rgba(236,244,241,0.94)_46%,_rgba(255,255,255,0.98))] px-5 py-5 shadow-sm shadow-[#184d47]/10">
            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#184d47] text-white shadow-sm shadow-[#184d47]/20">
                            <Building2 className="size-5" />
                        </div>

                        <div className="space-y-2">
                            <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                                Assigned church
                            </div>
                            <div className="text-lg font-semibold text-slate-900">
                                {assignedPastor?.church_name ?? 'No church assigned'}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                                {assignedPastor ? (
                                    <>
                                        <span>{assignedPastor.pastor_name}</span>
                                        <span className="text-slate-400">•</span>
                                        <span>
                                            {assignedPastor.section_name},{' '}
                                            {assignedPastor.district_name}
                                        </span>
                                    </>
                                ) : (
                                    <span>
                                        Your account must be assigned to a church before you can register online.
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {assignedPastor?.status && (
                        <Badge
                            variant="secondary"
                            className="rounded-xl px-3 py-1 capitalize"
                        >
                            <BadgeCheck className="size-3.5" />
                            {assignedPastor.status}
                        </Badge>
                    )}
                </div>

                {assignedPastor && (
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm shadow-[#184d47]/5 backdrop-blur">
                            <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                Pastor
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                {assignedPastor.pastor_name}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm shadow-[#184d47]/5 backdrop-blur">
                            <div className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                Coverage
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                {assignedPastor.section_name},{' '}
                                {assignedPastor.district_name}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
