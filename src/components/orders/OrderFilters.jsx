import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ORDER_STATUSES, ORDER_SOURCES, TEAM_DEPARTMENTS, PAYMENT_MODES } from "../../lib/statusConfig";

export default function OrderFilters({ filters, setFilters }) {
  const hasFilters = filters.status || filters.source || filters.agent || filters.department || filters.payment || filters.search;

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search name or number..."
          className="pl-9 h-9"
          value={filters.search || ""}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />
      </div>

      <Select value={filters.status || "all"} onValueChange={v => setFilters(f => ({ ...f, status: v === "all" ? "" : v }))}>
        <SelectTrigger className="w-full sm:w-[170px] h-9">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {ORDER_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.value}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.source || "all"} onValueChange={v => setFilters(f => ({ ...f, source: v === "all" ? "" : v }))}>
        <SelectTrigger className="w-full sm:w-[150px] h-9">
          <SelectValue placeholder="All Sources" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          {ORDER_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.department || "all"} onValueChange={v => setFilters(f => ({ ...f, department: v === "all" ? "" : v }))}>
        <SelectTrigger className="w-full sm:w-[150px] h-9">
          <SelectValue placeholder="All Depts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {TEAM_DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.payment || "all"} onValueChange={v => setFilters(f => ({ ...f, payment: v === "all" ? "" : v }))}>
        <SelectTrigger className="w-full sm:w-[140px] h-9">
          <SelectValue placeholder="All Payments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Payments</SelectItem>
          {PAYMENT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" className="h-9" onClick={() => setFilters({})}>
          <X className="h-4 w-4 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}
