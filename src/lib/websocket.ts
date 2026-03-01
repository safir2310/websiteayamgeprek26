// Helper function to emit WebSocket events
export async function emitWebSocketEvent(event: string, data: any) {
  try {
    await fetch('http://localhost:3003/emit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data })
    })
  } catch (error) {
    console.error('Failed to emit WebSocket event:', error)
  }
}
