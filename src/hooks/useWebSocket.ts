'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseWebSocketOptions {
  onOrderStatusChanged?: (data: any) => void
  onPointsChanged?: (data: any) => void
  onNewOrder?: (data: any) => void
  onProductChanged?: (data: any) => void
  onUserChanged?: (data: any) => void
}

export function useWebSocket(userId: string | null, role: string | null, options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Only connect to WebSocket in development or if explicitly enabled
    if (process.env.NODE_ENV === 'production') {
      return
    }

    // Create socket connection
    const socket = io('/?XTransformPort=3003', {
      path: '/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 5000
    })

    socketRef.current = socket

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected')
      setIsConnected(true)

      // Join appropriate room
      if (role === 'admin') {
        socket.emit('admin:join')
      } else if (userId) {
        socket.emit('user:join', userId)
      }
    })

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.log('WebSocket connection error:', error.message)
      setIsConnected(false)
    })

    // Order events
    socket.on('order:status:changed', (data) => {
      console.log('Order status changed:', data)
      options.onOrderStatusChanged?.(data)
    })

    socket.on('order:new', (data) => {
      console.log('New order received:', data)
      options.onNewOrder?.(data)
    })

    socket.on('order:status:updated', (data) => {
      console.log('Order status updated (admin):', data)
      options.onOrderStatusChanged?.(data)
    })

    // Points events
    socket.on('points:changed', (data) => {
      console.log('Points changed:', data)
      options.onPointsChanged?.(data)
    })

    // Product events
    socket.on('product:new', (data) => {
      console.log('New product:', data)
      options.onProductChanged?.(data)
    })

    socket.on('product:changed', (data) => {
      console.log('Product changed:', data)
      options.onProductChanged?.(data)
    })

    socket.on('product:removed', (data) => {
      console.log('Product removed:', data)
      options.onProductChanged?.(data)
    })

    // User events
    socket.on('user:new', (data) => {
      console.log('New user:', data)
      options.onUserChanged?.(data)
    })

    socket.on('user:changed', (data) => {
      console.log('User changed:', data)
      options.onUserChanged?.(data)
    })

    // Cleanup
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [userId, role])

  const emit = (event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    }
  }

  return {
    isConnected,
    emit
  }
}
