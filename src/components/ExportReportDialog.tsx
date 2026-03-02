'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileSpreadsheet, FileText, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Order {
  id: string
  userId: string
  userName: string
  userPhone: string
  userAddress: string
  total: number
  status: string
  createdAt: string
  pointsEarned: number
  items: {
    product: {
      name: string
      price: number
    }
    quantity: number
    subtotal: number
  }[]
}

interface ExportReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orders: Order[]
}

export default function ExportReportDialog({ open, onOpenChange, orders }: ExportReportDialogProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('xlsx')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [isExporting, setIsExporting] = useState(false)

  // Filter orders based on criteria
  const getFilteredOrders = (): Order[] => {
    let filtered = [...orders]

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= fromDate
      })
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt)
        return orderDate <= toDate
      })
    }

    return filtered
  }

  // Get summary statistics
  const getSummary = () => {
    const filtered = getFilteredOrders()
    const totalSales = filtered.reduce((sum, order) => sum + order.total, 0)
    const completedOrders = filtered.filter(o => o.status === 'completed').length
    const pendingOrders = filtered.filter(o => o.status === 'pending').length

    return {
      totalOrders: filtered.length,
      totalSales,
      completedOrders,
      pendingOrders,
    }
  }

  // Export to CSV
  const exportToCSV = (filteredOrders: Order[]) => {
    const headers = [
      'ID Pesanan',
      'Tanggal',
      'Nama Pelanggan',
      'No HP',
      'Alamat',
      'Status',
      'Total',
      'Poin',
      'Item Pesanan'
    ]

    const rows = filteredOrders.map((order) => {
      const items = order.items.map((item) => `${item.product.name} (x${item.quantity})`).join('; ')
      return [
        `#${order.id.slice(-6).toUpperCase()}`,
        new Date(order.createdAt).toLocaleString('id-ID'),
        order.userName,
        order.userPhone,
        order.userAddress.replace(/,/g, ' '),
        order.status,
        order.total.toString(),
        order.pointsEarned.toString(),
        items.replace(/,/g, ';')
      ]
    })

    // Add summary row
    const summary = getSummary()
    rows.push([])
    rows.push(['RINGKASAN', '', '', '', '', '', '', '', ''])
    rows.push(['Total Pesanan', summary.totalOrders.toString(), '', '', '', '', '', '', ''])
    rows.push(['Total Penjualan', `Rp ${summary.totalSales.toLocaleString('id-ID')}`, '', '', '', '', '', '', ''])
    rows.push(['Pesanan Selesai', summary.completedOrders.toString(), '', '', '', '', '', '', ''])
    rows.push(['Pesanan Pending', summary.pendingOrders.toString(), '', '', '', '', '', '', ''])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n')

    // Add UTF-8 BOM for Excel compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `laporan-penjualan-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export to Excel (XLSX)
  const exportToExcel = async (filteredOrders: Order[]) => {
    try {
      // Dynamically import xlsx
      const XLSX = await import('xlsx')

      // Prepare data
      const data = filteredOrders.map((order) => {
        const items = order.items.map((item) => `${item.product.name} (x${item.quantity})`).join('; ')
        return {
          'ID Pesanan': `#${order.id.slice(-6).toUpperCase()}`,
          'Tanggal': new Date(order.createdAt).toLocaleString('id-ID'),
          'Nama Pelanggan': order.userName,
          'No HP': order.userPhone,
          'Alamat': order.userAddress,
          'Status': order.status,
          'Total': order.total,
          'Poin': order.pointsEarned,
          'Item Pesanan': items
        }
      })

      // Get summary
      const summary = getSummary()

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Create summary sheet
      const summaryData = [
        { '': 'RINGKASAN LAPORAN', '': '', '': '', '': '' },
        { '': `Total Pesanan`, 'Nilai': summary.totalOrders },
        { '': `Total Penjualan`, 'Nilai': `Rp ${summary.totalSales.toLocaleString('id-ID')}` },
        { '': `Pesanan Selesai`, 'Nilai': summary.completedOrders },
        { '': `Pesanan Pending`, 'Nilai': summary.pendingOrders },
        { '': '', '': '', '': '', '': '' },
      ]
      const summaryWs = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan')

      // Create orders sheet
      const ws = XLSX.utils.json_to_sheet(data)

      // Set column widths
      const wscols = [
        { wch: 15 }, // ID Pesanan
        { wch: 25 }, // Tanggal
        { wch: 25 }, // Nama Pelanggan
        { wch: 15 }, // No HP
        { wch: 40 }, // Alamat
        { wch: 15 }, // Status
        { wch: 15 }, // Total
        { wch: 10 }, // Poin
        { wch: 50 }, // Item Pesanan
      ]
      ws['!cols'] = wscols

      XLSX.utils.book_append_sheet(wb, ws, 'Pesanan')

      // Generate file name
      const fileName = `laporan-penjualan-${new Date().toISOString().split('T')[0]}.xlsx`

      // Download file
      XLSX.writeFile(wb, fileName)

      toast.success('Excel Berhasil Dibuat!', {
        description: `File ${fileName} berhasil diunduh`,
        position: 'top-center'
      })
    } catch (error) {
      console.error('Export Excel Error:', error)
      toast.error('Gagal Membuat Excel', {
        description: 'Terjadi kesalahan saat membuat file Excel',
        position: 'top-center'
      })
      throw error
    }
  }

  // Handle export
  const handleExport = async () => {
    const filteredOrders = getFilteredOrders()

    if (filteredOrders.length === 0) {
      toast.error('Tidak Ada Data', {
        description: 'Tidak ada pesanan sesuai filter yang dipilih',
        position: 'top-center'
      })
      return
    }

    setIsExporting(true)

    try {
      if (exportFormat === 'csv') {
        exportToCSV(filteredOrders)
        toast.success('CSV Berhasil Dibuat!', {
          description: `${filteredOrders.length} pesanan diekspor`,
          position: 'top-center'
        })
      } else {
        await exportToExcel(filteredOrders)
      }

      // Close dialog
      onOpenChange(false)

      // Reset filters
      setStatusFilter('all')
      setDateFrom('')
      setDateTo('')
    } catch (error) {
      console.error('Export Error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const summary = getSummary()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <FileSpreadsheet className="w-5 h-5" />
            Ekspor Laporan Penjualan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200 rounded-lg p-3">
              <p className="text-xs text-gray-600">Total Pesanan</p>
              <p className="text-2xl font-bold text-orange-600">{summary.totalOrders}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-lg p-3">
              <p className="text-xs text-gray-600">Total Penjualan</p>
              <p className="text-lg font-bold text-green-600">Rp {(summary.totalSales / 1000).toFixed(0)}K</p>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Pilih Format</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={exportFormat === 'xlsx' ? 'default' : 'outline'}
                onClick={() => setExportFormat('xlsx')}
                className={`h-auto py-4 flex flex-col items-center gap-2 ${
                  exportFormat === 'xlsx'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0'
                    : 'border-2 border-green-200 hover:bg-green-50'
                }`}
              >
                <FileSpreadsheet className="w-8 h-8" />
                <div className="text-left">
                  <p className="font-semibold">Excel (.xlsx)</p>
                  <p className="text-xs opacity-80">Format dengan formula</p>
                </div>
                {exportFormat === 'xlsx' && (
                  <CheckCircle2 className="w-5 h-5 absolute top-2 right-2 text-white" />
                )}
              </Button>

              <Button
                type="button"
                variant={exportFormat === 'csv' ? 'default' : 'outline'}
                onClick={() => setExportFormat('csv')}
                className={`h-auto py-4 flex flex-col items-center gap-2 ${
                  exportFormat === 'csv'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0'
                    : 'border-2 border-blue-200 hover:bg-blue-50'
                }`}
              >
                <FileText className="w-8 h-8" />
                <div className="text-left">
                  <p className="font-semibold">CSV (.csv)</p>
                  <p className="text-xs opacity-80">Universal format</p>
                </div>
                {exportFormat === 'csv' && (
                  <CheckCircle2 className="w-5 h-5 absolute top-2 right-2 text-white" />
                )}
              </Button>
            </div>
          </div>

          {/* Filter by Status */}
          <div className="space-y-2">
            <Label>Filter Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-orange-200 focus-visible:ring-orange-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="processing">Diproses</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="cancelled">Batal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter by Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dari Tanggal</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border-orange-200 focus-visible:ring-orange-500"
              />
            </div>
            <div className="space-y-2">
              <Label>Sampai Tanggal</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border-orange-200 focus-visible:ring-orange-500"
              />
            </div>
          </div>

          {/* Preview of filtered data */}
          {summary.totalOrders > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-700">
                <span className="font-semibold">{summary.totalOrders}</span> pesanan akan diekspor
                {dateFrom || dateTo ? ' (dengan filter tanggal)' : ''}
                {statusFilter !== 'all' ? ` (status: ${statusFilter})` : ''}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
            className="border-gray-300 hover:bg-gray-50"
          >
            Batal
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || summary.totalOrders === 0}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            {isExporting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Mengekspor...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Ekspor {exportFormat === 'xlsx' ? 'Excel' : 'CSV'}</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
