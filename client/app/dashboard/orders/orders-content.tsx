"use client";

import { useState, useEffect, useRef } from "react";
import { useOrders, OrderFilters } from "@/lib/hooks/use-orders";
import { OrdersDataTable } from "@/components/orders-data-table";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { SearchIcon } from "@hugeicons/core-free-icons";

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState<OrderFilters>({
    order_type: "ALL",
    shipment_status: "ALL",
    payment_mode: "ALL",
    shipment_type: "ALL",
    from: "",
    to: "",
    search: "",
  });

  useEffect(() => {
    const status = searchParams.get("shipment_status");
    if (status) {
      setFilters((prev) => ({ ...prev, shipment_status: status }));
      setPage(1);
    }

    const isSearch = searchParams.get("search");
    const query = searchParams.get("q");
    
    if (isSearch && query) {
      setFilters((prev) => ({ ...prev, search: query }));
      setSidebarSearch(query);
      setPage(1);
    } else if (isSearch) {
      setShowSearchDialog(true);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchParams]);

  const handleSearchSubmit = () => {
    setFilters((prev) => ({ ...prev, search: sidebarSearch }));
    setPage(1);
    setShowSearchDialog(false);
  };

  const { data, isLoading, isError } = useOrders(page, pageSize, filters);

  const handleFilterChange = (newFilters: OrderFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  if (isError) return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <p className="text-destructive">Error fetching orders</p>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-9">
          <OrdersDataTable
            data={data?.data ?? []}
            isLoading={isLoading}
            filters={filters}
            onFilterChange={handleFilterChange}
            pagination={{
              currentPage: page,
              pageSize,
              totalPages: data?.pagination?.totalPages ?? 1,
              total: data?.pagination?.total ?? 0,
            }}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search Orders</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="relative">
              <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search by order ID, shipment ID, tracking number..."
                className="pl-10"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchSubmit();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSearchDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSearchSubmit}>
                Search
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
