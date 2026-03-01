import { toast } from 'sonner'

export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      position: 'center',
      duration: 3000,
      style: {
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '16px 24px',
        fontSize: '16px',
        fontWeight: '500',
        boxShadow: '0 10px 40px rgba(34, 197, 94, 0.3)'
      }
    })
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      position: 'center',
      duration: 4000,
      style: {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '16px 24px',
        fontSize: '16px',
        fontWeight: '500',
        boxShadow: '0 10px 40px rgba(239, 68, 68, 0.3)'
      }
    })
  },

  info: (message: string, description?: string) => {
    toast(message, {
      description,
      position: 'center',
      duration: 3000,
      style: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '16px 24px',
        fontSize: '16px',
        fontWeight: '500',
        boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)'
      }
    })
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      position: 'center',
      duration: 3000,
      style: {
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '16px 24px',
        fontSize: '16px',
        fontWeight: '500',
        boxShadow: '0 10px 40px rgba(245, 158, 11, 0.3)'
      }
    })
  },

  promise: (
    message: string,
    promise: Promise<any>,
    {
      success,
      error
    }: {
      success: string | ((data: any) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    toast.promise(promise, {
      loading: message,
      success: success,
      error: error
    }, {
      position: 'center',
      style: {
        borderRadius: '12px',
        padding: '16px 24px',
        fontSize: '16px',
        fontWeight: '500',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
      }
    })
  },

  orderCreated: (orderId: string) => {
    toast.success('Pesanan berhasil dibuat!', {
      description: `ID Pesanan: #${orderId.slice(-6).toUpperCase()}`,
      position: 'center',
      duration: 4000,
      style: {
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '16px 24px',
        fontSize: '16px',
        fontWeight: '500',
        boxShadow: '0 10px 40px rgba(249, 115, 22, 0.3)'
      },
      action: {
        label: 'OK',
        onClick: () => {}
      }
    })
  },

  cartUpdated: (action: 'added' | 'removed' | 'updated') => {
    const messages = {
      added: 'Produk ditambahkan ke keranjang',
      removed: 'Produk dihapus dari keranjang',
      updated: 'Jumlah produk diupdate'
    }
    
    toast.success(messages[action], {
      position: 'center',
      duration: 2000,
      style: {
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '14px 20px',
        fontSize: '15px',
        fontWeight: '500',
        boxShadow: '0 10px 30px rgba(249, 115, 22, 0.3)'
      }
    })
  },

  redeemSuccess: (code: string) => {
    toast.success('Kode redeem berhasil!', {
      description: `Kode Anda: ${code}`,
      position: 'center',
      duration: 5000,
      style: {
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '16px 24px',
        fontSize: '16px',
        fontWeight: '500',
        boxShadow: '0 10px 40px rgba(34, 197, 94, 0.3)'
      }
    })
  },

  pointsEarned: (points: number) => {
    toast.success(`+${points} Poin didapat!`, {
      description: 'Terima kasih telah berbelanja di Ayam Geprek Sambal Ijo',
      position: 'center',
      duration: 4000,
      style: {
        background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        padding: '16px 24px',
        fontSize: '16px',
        fontWeight: '500',
        boxShadow: '0 10px 40px rgba(234, 179, 8, 0.3)'
      }
    })
  }
}
