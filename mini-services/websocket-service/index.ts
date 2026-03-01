import { Server } from 'socket.io'
import { createServer } from 'http'

const PORT = 3003
const httpServer = createServer()

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// Store connected users
const connectedUsers = new Map<string, string>() // socketId -> userId
const connectedAdmins = new Set<string>() // socketId

// Handle HTTP requests for emitting events from backend
httpServer.on('request', async (req, res) => {
  if (req.method === 'POST' && req.url === '/emit') {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        const { event, data } = JSON.parse(body)
        
        // Emit the event through Socket.io
        io.emit(event, data)
        
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true, event }))
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid request' }))
      }
    })
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  // User joins
  socket.on('user:join', (userId: string) => {
    console.log(`User joined: ${userId}`)
    connectedUsers.set(socket.id, userId)
    socket.join(`user:${userId}`)
  })

  // Admin joins
  socket.on('admin:join', () => {
    console.log(`Admin joined: ${socket.id}`)
    connectedAdmins.add(socket.id)
    socket.join('admins')
  })

  // New order - notify all admins
  socket.on('order:created', (data) => {
    console.log('New order created:', data)
    io.to('admins').emit('order:new', data)
  })

  // Order status updated - notify user
  socket.on('order:status:updated', (data) => {
    console.log('Order status updated:', data)
    io.to(`user:${data.userId}`).emit('order:status:changed', data)
    io.to('admins').emit('order:status:updated', data)
  })

  // Points updated - notify user
  socket.on('points:updated', (data) => {
    console.log('Points updated:', data)
    io.to(`user:${data.userId}`).emit('points:changed', data)
  })

  // New product - notify all users
  socket.on('product:created', (data) => {
    console.log('New product created:', data)
    io.emit('product:new', data)
  })

  // Product updated - notify all users
  socket.on('product:updated', (data) => {
    console.log('Product updated:', data)
    io.emit('product:changed', data)
  })

  // Product deleted - notify all users
  socket.on('product:deleted', (data) => {
    console.log('Product deleted:', data)
    io.emit('product:removed', data)
  })

  // User created - notify admins
  socket.on('user:created', (data) => {
    console.log('New user created:', data)
    io.to('admins').emit('user:new', data)
  })

  // User updated - notify admins
  socket.on('user:updated', (data) => {
    console.log('User updated:', data)
    io.to('admins').emit('user:changed', data)
  })

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
    connectedUsers.delete(socket.id)
    connectedAdmins.delete(socket.id)
  })
})

io.listen(PORT, () => {
  console.log(`WebSocket service running on port ${PORT}`)
})
