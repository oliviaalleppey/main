'use client';

import { useEffect, useState } from 'react';
import { getMemberships, updateMembershipStatus } from './actions';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import { Search, ChevronDown, ChevronUp, MapPin, Shield, AlertCircle } from 'lucide-react';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });

const statusStyles: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  contacted: 'bg-blue-50 text-blue-700 border-blue-200',
  approved:  'bg-teal-50 text-teal-700 border-teal-200',
  rejected:  'bg-red-50 text-red-700 border-red-200',
};

const statusDotColors: Record<string, string> = {
  pending:   'bg-amber-400',
  contacted: 'bg-blue-400',
  approved:  'bg-teal-500',
  rejected:  'bg-red-400',
};

export default function MembershipsAdminPage() {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadMemberships();
  }, []);

  const loadMemberships = async () => {
    setIsLoading(true);
    const data = await getMemberships();
    setMemberships(data);
    setIsLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: "pending" | "contacted" | "approved" | "rejected") => {
    const result = await updateMembershipStatus(id, newStatus);
    if (result.success) {
      toast.success('Status updated');
      setMemberships(memberships.map(m => m.id === id ? { ...m, status: newStatus } : m));
    } else {
      toast.error('Failed to update status');
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const stats = {
    total:     memberships.length,
    pending:   memberships.filter(m => (m.status || 'pending') === 'pending').length,
    contacted: memberships.filter(m => m.status === 'contacted').length,
    approved:  memberships.filter(m => m.status === 'approved').length,
    rejected:  memberships.filter(m => m.status === 'rejected').length,
  };

  const filtered = memberships.filter(m => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      m.fullName?.toLowerCase().includes(q) ||
      m.emailAddress?.toLowerCase().includes(q) ||
      m.mobileNumber?.includes(q) ||
      m.city?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || (m.status || 'pending') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={`${dmSans.className} bg-[#FAF6EF] min-h-screen p-8 flex items-center justify-center`}>
        <p className="text-[#0D4A4A] font-medium tracking-wide text-sm animate-pulse">
          Loading membership applications…
        </p>
      </div>
    );
  }

  return (
    <div className={`${dmSans.className} bg-[#FAF6EF] min-h-screen p-8 space-y-6`}>

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center bg-[#0D4A4A] p-6 rounded-xl shadow-md">
        <div>
          <h1 className={`${playfair.className} text-3xl font-bold text-white`}>
            Membership Applications
          </h1>
          <p className="text-teal-200 text-sm mt-1">Review and manage new membership requests</p>
        </div>
        <div className="bg-[#C9A84C] text-[#0D4A4A] px-4 py-2 rounded-lg font-semibold text-sm">
          Total: {memberships.length}
        </div>
      </div>

      {/* ── Stats bar ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending Review', value: stats.pending,   key: 'pending',   bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700' },
          { label: 'Contacted',      value: stats.contacted, key: 'contacted',  bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-700' },
          { label: 'Approved',       value: stats.approved,  key: 'approved',   bg: 'bg-teal-50',   border: 'border-teal-200',  text: 'text-teal-700' },
          { label: 'Rejected',       value: stats.rejected,  key: 'rejected',   bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700'  },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(statusFilter === s.key ? 'all' : s.key)}
            className={`${s.bg} border ${s.border} rounded-xl p-4 text-left transition-all hover:shadow-md ${statusFilter === s.key ? 'ring-2 ring-offset-1 ring-[#0D4A4A]/30 shadow-md' : ''}`}
          >
            <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
            <div className={`text-xs font-medium mt-1 ${s.text} opacity-80`}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* ── Search + filter ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search by name, email, phone or city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E0D5] rounded-lg text-sm text-[#1C1C1C] placeholder:text-[#6B7280]/60 focus:outline-none focus:border-[#C9A84C] transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-[#E8E0D5] rounded-lg text-sm text-[#1C1C1C] focus:outline-none focus:border-[#C9A84C] transition-colors"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border-t-4 border-[#C9A84C] shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0D4A4A]/5 border-b border-[#E8E0D5]">
              <tr>
                <th className="px-6 py-4 text-[#0D4A4A] font-semibold tracking-widest text-xs uppercase">Applicant</th>
                <th className="px-6 py-4 text-[#0D4A4A] font-semibold tracking-widest text-xs uppercase">Contact Details</th>
                <th className="px-6 py-4 text-[#0D4A4A] font-semibold tracking-widest text-xs uppercase">Applied On</th>
                <th className="px-6 py-4 text-[#0D4A4A] font-semibold tracking-widest text-xs uppercase">Photo ID</th>
                <th className="px-6 py-4 text-[#0D4A4A] font-semibold tracking-widest text-xs uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E0D5]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <p className="text-[#6B7280] text-sm">
                      {search || statusFilter !== 'all' ? 'No applications match your filters.' : 'No membership applications found.'}
                    </p>
                    <span className="block mt-3 mx-auto w-12 h-px bg-[#C9A84C]" />
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <>
                    {/* ── Main row ─────────────────────────────────────────── */}
                    <tr
                      key={app.id}
                      onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                      className="hover:bg-[#0D4A4A]/5 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDotColors[app.status || 'pending']}`} />
                          <div className="font-semibold text-[#1C1C1C]">{app.fullName}</div>
                        </div>
                        <div className="text-[#6B7280] text-xs mt-1 pl-4">
                          DOB: {format(new Date(app.dateOfBirth), 'dd MMM yyyy')} | {app.gender}
                        </div>
                        <div className="text-[#6B7280]/70 text-xs mt-0.5 pl-4">
                          {app.city}, {app.state}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[#1C1C1C] select-all">{app.mobileNumber}</div>
                        <div className="text-[#6B7280] text-xs mt-1 select-all">{app.emailAddress}</div>
                        <div className="text-[#6B7280]/70 text-xs mt-0.5">Prefers: {app.preferredModeOfCommunication || 'Any'}</div>
                      </td>
                      <td className="px-6 py-4 text-[#6B7280]">
                        {format(new Date(app.createdAt), 'dd MMM yyyy')}
                        <div className="text-xs mt-1 text-[#6B7280]/70">
                          {format(new Date(app.createdAt), 'HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {app.memberPhotographUrl ? (
                          <a
                            href={app.memberPhotographUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-[#C9A84C] hover:text-[#A8863A] font-medium text-xs underline underline-offset-2 transition-colors"
                          >
                            View Photo
                          </a>
                        ) : (
                          <span className="text-[#6B7280]/60 text-xs italic">Not provided</span>
                        )}
                        <div className="text-[#6B7280] text-xs mt-1">
                          {app.idType}: {app.idNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-between gap-2">
                          <Select
                            value={app.status || 'pending'}
                            onValueChange={(val: any) => handleStatusChange(app.id, val)}
                          >
                            <SelectTrigger
                              onClick={e => e.stopPropagation()}
                              className={`w-[130px] h-8 text-xs border rounded-lg ${statusStyles[app.status || 'pending'] ?? 'bg-white border-[#0D4A4A]/20'}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-[#6B7280]/40">
                            {expandedId === app.id
                              ? <ChevronUp className="w-4 h-4" />
                              : <ChevronDown className="w-4 h-4" />
                            }
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* ── Expanded details row ─────────────────────────────── */}
                    {expandedId === app.id && (
                      <tr key={`${app.id}-expanded`} className="bg-[#FAF6EF]">
                        <td colSpan={5} className="px-8 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* Address */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-[#0D4A4A] font-semibold text-xs uppercase tracking-widest mb-3">
                                <MapPin className="w-3.5 h-3.5" />
                                Address
                              </div>
                              <p className="text-[#1C1C1C] text-sm leading-relaxed">
                                {app.residentialAddress}
                              </p>
                              <p className="text-[#6B7280] text-xs">
                                {[app.city, app.state, app.pinCode, app.country].filter(Boolean).join(', ')}
                              </p>
                              {app.nationality && (
                                <p className="text-[#6B7280] text-xs mt-1">
                                  Nationality: <span className="text-[#1C1C1C]">{app.nationality}</span>
                                </p>
                              )}
                            </div>

                            {/* Emergency Contact */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-[#0D4A4A] font-semibold text-xs uppercase tracking-widest mb-3">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Emergency Contact
                              </div>
                              <p className="text-[#1C1C1C] text-sm font-medium">{app.emergencyName}</p>
                              <p className="text-[#6B7280] text-xs">{app.emergencyRelationship}</p>
                              <p className="text-[#6B7280] text-xs select-all">{app.emergencyContactNumber}</p>
                              {app.alternateContactNumber && (
                                <p className="text-[#6B7280] text-xs mt-2">
                                  Alt. number: <span className="select-all text-[#1C1C1C]">{app.alternateContactNumber}</span>
                                </p>
                              )}
                            </div>

                            {/* ID & Photo */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-[#0D4A4A] font-semibold text-xs uppercase tracking-widest mb-3">
                                <Shield className="w-3.5 h-3.5" />
                                Identification
                              </div>
                              <p className="text-[#1C1C1C] text-sm">
                                <span className="text-[#6B7280] text-xs">Type: </span>{app.idType}
                              </p>
                              <p className="text-[#1C1C1C] text-sm select-all">
                                <span className="text-[#6B7280] text-xs">Number: </span>{app.idNumber}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-[#E8E0D5] bg-[#FAF6EF] text-xs text-[#6B7280]">
            Showing <span className="font-semibold text-[#0D4A4A]">{filtered.length}</span> of <span className="font-semibold text-[#0D4A4A]">{memberships.length}</span> applications
            {(search || statusFilter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setStatusFilter('all'); }}
                className="ml-3 text-[#C9A84C] hover:text-[#A8863A] font-medium transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
